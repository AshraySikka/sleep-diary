"""
seed_jane_doe.py
----------------
Run from the backend directory with the venv active:

    cd backend
    python seed_jane_doe.py

Populates 6 months of realistic CSD-M sleep diary entries for Jane Doe,
covering all SE alert tiers (healthy, fair, poor) and varied behavioural
patterns across the range.
"""

import os
import sys
import django
import random
from datetime import date, timedelta, time

# ── Django setup ──────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model #noqa
from diary.models import SleepEntry #noqa

User = get_user_model()

# ── Config ────────────────────────────────────────────────────────────────────
JANE_EMAIL = 'sleepdiarydemo@yopmail.com'
MONTHS_BACK = 6

# ── Helpers ───────────────────────────────────────────────────────────────────

def rand_time(hour_min, hour_max, minute_choices=(0, 15, 30, 45)):
    hour = random.randint(hour_min, hour_max)
    minute = random.choice(minute_choices)
    return time(hour, minute)


def add_minutes_to_time(t, minutes):
    total = t.hour * 60 + t.minute + minutes
    total = total % (24 * 60)
    return time(total // 60, total % 60)


def build_entry(user, entry_date, profile):
    """
    Build a SleepEntry for a given profile.
    Profiles: 'healthy', 'fair', 'poor', 'variable'
    """

    if profile == 'healthy':
        bed_hour = random.randint(21, 23)
        latency = random.randint(5, 20)
        awakenings = random.randint(0, 1)
        waso = random.randint(0, 15)
        sleep_hours = random.uniform(7.0, 8.5)
        quality = random.randint(4, 5)
        restfulness = random.randint(4, 5)
        nap_count = random.choice([0, 0, 0, 1])
        alcohol = random.choice([0, 0, 1])
        caffeine = random.randint(1, 2)

    elif profile == 'fair':
        bed_hour = random.randint(22, 23)
        latency = random.randint(20, 40)
        awakenings = random.randint(1, 3)
        waso = random.randint(15, 35)
        sleep_hours = random.uniform(5.5, 7.0)
        quality = random.randint(2, 3)
        restfulness = random.randint(2, 3)
        nap_count = random.choice([0, 1, 1])
        alcohol = random.choice([0, 1, 2])
        caffeine = random.randint(2, 4)

    elif profile == 'poor':
        bed_hour = random.randint(0, 2)
        latency = random.randint(45, 90)
        awakenings = random.randint(3, 6)
        waso = random.randint(40, 90)
        sleep_hours = random.uniform(3.0, 5.5)
        quality = random.randint(1, 2)
        restfulness = random.randint(1, 2)
        nap_count = random.choice([1, 2])
        alcohol = random.choice([2, 3, 4])
        caffeine = random.randint(3, 6)

    else:  # variable
        bed_hour = random.randint(21, 23)
        latency = random.randint(5, 75)
        awakenings = random.randint(0, 5)
        waso = random.randint(0, 60)
        sleep_hours = random.uniform(4.0, 8.5)
        quality = random.randint(1, 5)
        restfulness = random.randint(1, 5)
        nap_count = random.randint(0, 2)
        alcohol = random.randint(0, 3)
        caffeine = random.randint(0, 5)

    # ── Build times ───────────────────────────────────────────────────────────
    bed_hour = bed_hour % 24
    q1_bed_time = time(bed_hour, random.choice([0, 15, 30, 45]))
    q2_sleep_attempt_time = add_minutes_to_time(q1_bed_time, random.randint(5, 20))

    total_in_bed_min = int(sleep_hours * 60) + latency + waso
    q6a_final_awakening_time = add_minutes_to_time(q2_sleep_attempt_time, total_in_bed_min)

    q6b_post_awakening_bed_min = random.choice([0, 5, 10, 15, 20, 30])
    q7_out_of_bed_time = add_minutes_to_time(
        q6a_final_awakening_time, q6b_post_awakening_bed_min + random.randint(0, 15)
    )

    q6c_early_awakening = random.random() < 0.3
    q6d_early_awakening_min = random.choice([15, 30, 45, 60]) if q6c_early_awakening else None

    # ── Nap ───────────────────────────────────────────────────────────────────
    q11b_nap_duration_min = None
    if nap_count > 0:
        q11b_nap_duration_min = random.choice([20, 30, 45, 60, 90]) * nap_count

    # ── Alcohol ───────────────────────────────────────────────────────────────
    q12b_alcohol_last_time = None
    if alcohol > 0:
        q12b_alcohol_last_time = time(random.randint(18, 22), random.choice([0, 30]))

    # ── Caffeine ──────────────────────────────────────────────────────────────
    q13b_caffeine_last_time = None
    if caffeine > 0:
        q13b_caffeine_last_time = time(random.randint(7, 17), random.choice([0, 30]))

    # ── Medication ────────────────────────────────────────────────────────────
    q14a_medication_taken = random.random() < 0.15
    q14b_medication_details = ''
    if q14a_medication_taken:
        q14b_medication_details = random.choice([
            'Melatonin 5mg', 'Zopiclone 3.75mg', 'Magnesium glycinate 400mg',
            'Diphenhydramine 25mg', 'Trazodone 50mg',
        ])

    # ── Comments ──────────────────────────────────────────────────────────────
    q15_comments = random.choice([
        '', '', '', '',
        'Stressful day at work.',
        'Neighbour was noisy late.',
        'Felt anxious before bed.',
        'Room was too warm.',
        'Slept really well tonight.',
        'Had a headache.',
        'Exercised in the evening.',
        'Watched TV until late.',
    ])

    return dict(
        user=user,
        date=entry_date,
        q1_bed_time=q1_bed_time,
        q2_sleep_attempt_time=q2_sleep_attempt_time,
        q3_sleep_latency_min=latency,
        q4_awakening_count=awakenings,
        q5_waso_min=waso,
        q6a_final_awakening_time=q6a_final_awakening_time,
        q6b_post_awakening_bed_min=q6b_post_awakening_bed_min,
        q6c_early_awakening=q6c_early_awakening,
        q6d_early_awakening_min=q6d_early_awakening_min,
        q7_out_of_bed_time=q7_out_of_bed_time,
        q9_sleep_quality=quality,
        q10_restfulness=restfulness,
        q11a_nap_count=nap_count,
        q11b_nap_duration_min=q11b_nap_duration_min,
        q12a_alcohol_count=alcohol,
        q12b_alcohol_last_time=q12b_alcohol_last_time,
        q13a_caffeine_count=caffeine,
        q13b_caffeine_last_time=q13b_caffeine_last_time,
        q14a_medication_taken=q14a_medication_taken,
        q14b_medication_details=q14b_medication_details,
        q15_comments=q15_comments,
        is_complete=True,
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    try:
        jane = User.objects.get(email=JANE_EMAIL)
    except User.DoesNotExist:
        print(f"ERROR: No user found with email '{JANE_EMAIL}'.")
        sys.exit(1)

    print(f"Found user: {jane.email} (id={jane.id})")

    deleted, _ = SleepEntry.objects.filter(user=jane).delete()
    if deleted:
        print(f"Cleared {deleted} existing entries for Jane.")

    today = date.today()
    start_date = today - timedelta(days=MONTHS_BACK * 30)

    entries_created = 0
    skipped = 0

    current = start_date
    week_num = 0

    while current <= today:
        week_num = (current - start_date).days // 7

        # ~15% of days skipped — realistic missed logging
        if random.random() < 0.15:
            current += timedelta(days=1)
            skipped += 1
            continue

        if week_num < 4:
            profile = random.choices(
                ['poor', 'fair', 'variable'],
                weights=[60, 25, 15]
            )[0]
        elif week_num < 12:
            profile = random.choices(
                ['poor', 'fair', 'variable', 'healthy'],
                weights=[30, 35, 25, 10]
            )[0]
        elif week_num < 18:
            profile = random.choices(
                ['poor', 'fair', 'variable', 'healthy'],
                weights=[15, 40, 25, 20]
            )[0]
        else:
            profile = random.choices(
                ['poor', 'fair', 'variable', 'healthy'],
                weights=[10, 20, 20, 50]
            )[0]

        entry_data = build_entry(jane, current, profile)
        entry = SleepEntry(**entry_data)
        entry.save()  # triggers compute_sleep_metrics automatically

        entries_created += 1
        current += timedelta(days=1)

    print(f"\nDone.")
    print(f"  Entries created : {entries_created}")
    print(f"  Days skipped    : {skipped}")
    print(f"  Date range      : {start_date} → {today}")
    print(f"\nJane's dashboard and calendar should now show 6 months of data.")


if __name__ == '__main__':
    main()