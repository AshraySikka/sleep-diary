# diary/utils.py
# -----------------------------------------------------------------------
# Math computation engine for the Sleep Diary app.
# All sleep metrics are calculated here using the CSD-M clinical formulas.
# No AI, no estimation — pure math from the user's raw inputs.
# -----------------------------------------------------------------------


def time_to_minutes(t):
    """
    Convert a Python time object to total minutes since midnight.
    Example: 11:30 PM → 1410 minutes, 02:00 AM → 120 minutes.
    Used as a helper by all time-based calculations below.
    """
    if t is None:
        return None
    return t.hour * 60 + t.minute


def compute_tst(q2, q6a, q3, q5):
    """
    Total Sleep Time (TST) in Minutes.

    Clinical formula:
        TST = (FinalAwakeningTime - SleepAttemptTime) - SleepLatency - WASO

    Midnight crossover handling:
        If the final awakening time is earlier in the day than the sleep
        attempt time (e.g. tried to sleep at 11 PM, woke at 6 AM),
        we add 1440 minutes (24 hours) to account for the day boundary.

    Arguments:
        q2   — Sleep attempt time (time object from Q2)
        q6a  — Final awakening time (time object from Q6a)
        q3   — Sleep latency in minutes (integer from Q3)
        q5   — Wake After Sleep Onset in minutes (integer from Q5)

    Returns:
        TST in minutes as an integer, or None if any required input is missing.
    """
    # Can't calculate if any core input is missing
    if any(v is None for v in [q2, q6a, q3, q5]):
        return None

    # Convert time objects to minutes since midnight
    q2_min = time_to_minutes(q2)
    q6a_min = time_to_minutes(q6a)

    if q6a_min > q2_min:
        # Normal case: woke up same calendar day as sleep attempt
        tst = (q6a_min - q2_min) - q3 - q5
    else:
        # Midnight crossover: woke up the next calendar day
        tst = (q6a_min + 1440 - q2_min) - q3 - q5

    # TST can never be negative — clamp to 0 as a safeguard
    return max(tst, 0)


def compute_tib(q2, q7):
    """
    Time in Bed (TIB) in Minutes.

    Clinical formula:
        TIB = OutOfBedTime - SleepAttemptTime

    Midnight crossover handling:
        Same logic as TST — if out of bed time is earlier in the day
        than sleep attempt time, add 1440 minutes.

    Arguments:
        q2  — Sleep attempt time (time object from Q2)
        q7  — Out of bed time (time object from Q7)

    Returns:
        TIB in minutes as an integer, or None if any required input is missing.
    """
    if any(v is None for v in [q2, q7]):
        return None

    q2_min = time_to_minutes(q2)
    q7_min = time_to_minutes(q7)

    if q7_min > q2_min:
        # Normal case: got out of bed same calendar day
        tib = q7_min - q2_min
    else:
        # Midnight crossover: got out of bed the next calendar day
        tib = q7_min + 1440 - q2_min

    return max(tib, 0)


def compute_sleep_efficiency(tst_min, tib_min):
    """
    Sleep Efficiency (SE) as a percentage.

    Clinical formula:
        SE = (TST / TIB) * 100

    Clinical threshold:
        >= 85% is considered healthy sleep efficiency.
        < 85% may indicate insomnia or fragmented sleep.

    Arguments:
        tst_min  — Total Sleep Time in minutes
        tib_min  — Time in Bed in minutes

    Returns:
        SE as a float percentage (e.g. 85.5), or None if inputs are missing.
        Guards against division by zero if TIB is somehow 0.
    """
    if tst_min is None or tib_min is None or tib_min == 0:
        return None
    return round((tst_min / tib_min) * 100, 2)


def compute_sleep_metrics(entry):
    """
    Master computation function — called automatically on every SleepEntry.save().

    Takes a full SleepEntry model instance, pulls the raw input fields off it,
    runs all the CSD-M formulas, and returns the results as a dictionary.

    The save() method in SleepEntry calls this and stores the results back
    onto the same row so the dashboard can read them without recalculating.

    Arguments:
        entry  — A SleepEntry model instance (self inside save())

    Returns:
        Dictionary with keys: tst_min, tst_hours, tib_min, sleep_efficiency
    """
    # Run TST formula — pass raw field values from the entry
    # q3 and q5 default to 0 if not entered (no awakenings = 0 minutes lost)
    tst_min = compute_tst(
        entry.q2_sleep_attempt_time,        # when they tried to sleep
        entry.q6a_final_awakening_time,     # when they finally woke up
        entry.q3_sleep_latency_min or 0,    # how long to fall asleep
        entry.q5_waso_min or 0,             # total time awake during night
    )

    # Run TIB formula — from sleep attempt to getting out of bed
    tib_min = compute_tib(
        entry.q2_sleep_attempt_time,
        entry.q7_out_of_bed_time,
    )

    # Sleep efficiency from the two computed values above
    sleep_efficiency = compute_sleep_efficiency(tst_min, tib_min)

    # TST in hours — simple division, rounded to 2 decimal places
    tst_hours = round(tst_min / 60, 2) if tst_min is not None else None

    return {
        'tst_min': tst_min,
        'tst_hours': tst_hours,
        'tib_min': tib_min,
        'sleep_efficiency': sleep_efficiency,
    }


def compute_dashboard_stats(entries):
    """
    Aggregate statistics across multiple SleepEntry rows for the dashboard.

    Used by the dashboard API endpoint to compute the metric cards:
        - Average TST
        - Average Sleep Efficiency
        - Average Sleep Latency
        - Average WASO
        - Average Awakening Count

    Arguments:
        entries  — A list or queryset of SleepEntry instances

    Returns:
        Dictionary of rounded averages, all None if no valid entries exist.
    """
    # Only include entries that have a computed TST (means core fields were filled)
    valid_entries = [e for e in entries if e.tst_min is not None]

    if not valid_entries:
        return {
            'avg_tst_min': None,
            'avg_tst_hours': None,
            'avg_sleep_efficiency': None,
            'avg_sleep_latency': None,
            'avg_waso': None,
            'avg_awakening_count': None,
            'total_entries': 0,
        }

    # Average TST across all valid entries
    avg_tst_min = sum(e.tst_min for e in valid_entries) / len(valid_entries)

    # Average SE — only from entries where SE was calculable
    se_entries = [e for e in valid_entries if e.sleep_efficiency is not None]
    avg_se = (
        sum(float(e.sleep_efficiency) for e in se_entries) / len(se_entries)
        if se_entries else None
    )

    # Average sleep latency (Q3) — only from entries where Q3 was filled
    latency_entries = [e for e in entries if e.q3_sleep_latency_min is not None]
    avg_latency = (
        sum(e.q3_sleep_latency_min for e in latency_entries) / len(latency_entries)
        if latency_entries else None
    )

    # Average WASO (Q5) — only from entries where Q5 was filled
    waso_entries = [e for e in entries if e.q5_waso_min is not None]
    avg_waso = (
        sum(e.q5_waso_min for e in waso_entries) / len(waso_entries)
        if waso_entries else None
    )

    # Average awakening count (Q4)
    awakening_entries = [e for e in entries if e.q4_awakening_count is not None]
    avg_awakenings = (
        sum(e.q4_awakening_count for e in awakening_entries) / len(awakening_entries)
        if awakening_entries else None
    )

    return {
        'avg_tst_min': round(avg_tst_min, 1),
        'avg_tst_hours': round(avg_tst_min / 60, 2),
        'avg_sleep_efficiency': round(avg_se, 2) if avg_se else None,
        'avg_sleep_latency': round(avg_latency, 1) if avg_latency else None,
        'avg_waso': round(avg_waso, 1) if avg_waso else None,
        'avg_awakening_count': round(avg_awakenings, 1) if avg_awakenings else None,
        'total_entries': len(entries),
    }


# -----------------------------------------------------------------------
# Formula descriptions for the (i) tooltip icons on the dashboard.
# These are served by the API and rendered next to each metric card
# so users understand exactly how each number was calculated.
# -----------------------------------------------------------------------
FORMULA_DESCRIPTIONS = {
    'tst': (
        'Total Sleep Time (TST) = (Final Awakening Time − Sleep Attempt Time) '
        '− Sleep Latency (Q3) − Wake After Sleep Onset (Q5). '
        'If final awakening crosses midnight, 1440 minutes is added before subtracting.'
    ),
    'tib': (
        'Time in Bed (TIB) = Out of Bed Time (Q7) − Sleep Attempt Time (Q2). '
        'If out of bed time crosses midnight, 1440 minutes is added.'
    ),
    'sleep_efficiency': (
        'Sleep Efficiency (SE) = (Total Sleep Time ÷ Time in Bed) × 100. '
        'A score of 85% or above is considered clinically healthy.'
    ),
    'sleep_latency': (
        'Sleep Latency = Q3 directly as entered. '
        'This is the number of minutes it took you to fall asleep after attempting sleep.'
    ),
    'waso': (
        'Wake After Sleep Onset (WASO) = Q5 directly as entered. '
        'Total minutes spent awake during the night, not counting the final awakening.'
    ),
    'tst_hours': (
        'TST in Hours = Total Sleep Time in Minutes ÷ 60. '
        'Displayed alongside minutes for readability.'
    ),
}