// utils/sleepMath.js
// -----------------------------------------------------------------------
// Client-side mirror of the Django math engine.
// Used to show live calculations in the entry form BEFORE saving to the API.
// The authoritative calculations are always done server-side on save().
// -----------------------------------------------------------------------

/**
 * Convert a time string "HH:MM" to total minutes since midnight.
 * Example: "23:30" → 1410, "02:00" → 120
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert total minutes to a "HH:MM" string.
 * Example: 1410 → "23:30"
 */
export function minutesToTime(minutes) {
  if (minutes === null || minutes === undefined) return null;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format minutes as "Xh Ym" for display.
 * Example: 437 → "7h 17m"
 */
export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Total Sleep Time (TST) in minutes.
 * Formula: (FinalAwakening - SleepAttempt) - SleepLatency - WASO
 * Handles midnight crossover by adding 1440 minutes.
 *
 * @param {string} q2  - Sleep attempt time "HH:MM"
 * @param {string} q6a - Final awakening time "HH:MM"
 * @param {number} q3  - Sleep latency in minutes
 * @param {number} q5  - WASO in minutes
 * @returns {number|null}
 */
export function computeTST(q2, q6a, q3, q5) {
  if (!q2 || !q6a) return null;

  const q2Min = timeToMinutes(q2);
  const q6aMin = timeToMinutes(q6a);
  const latency = q3 || 0;
  const waso = q5 || 0;

  let tst;
  if (q6aMin > q2Min) {
    // Normal case — woke up same calendar day
    tst = (q6aMin - q2Min) - latency - waso;
  } else {
    // Midnight crossover — woke up next calendar day
    tst = (q6aMin + 1440 - q2Min) - latency - waso;
  }

  return Math.max(tst, 0);
}

/**
 * Time in Bed (TIB) in Minutes.
 * Formula: (FinalAwakening - SleepAttempt) + PostAwakeningBedTime
 * Handles midnight crossover.
 */
export function computeTIB(q2, q6a, q6b = 0) {
  if (!q2 || !q6a) return null;

  const q2Min = timeToMinutes(q2);
  const q6aMin = timeToMinutes(q6a);

  let tib;
  if (q6aMin > q2Min) {
    tib = q6aMin - q2Min;
  } else {
    tib = q6aMin + 1440 - q2Min;
  }

  tib += (parseInt(q6b) || 0);
  return Math.max(tib, 0);
}

/**
 * Sleep Efficiency (SE) as a percentage.
 * Formula: (TST / TIB) * 100
 * Clinical threshold: >= 85% is healthy.
 *
 * @param {number} tstMin - Total Sleep Time in minutes
 * @param {number} tibMin - Time in Bed in minutes
 * @returns {number|null}
 */
export function computeSleepEfficiency(tstMin, tibMin) {
  if (!tstMin || !tibMin || tibMin === 0) return null;
  return Math.round((tstMin / tibMin) * 100 * 100) / 100;
}

/**
 * Get the color for a sleep efficiency value.
 * Green >= 85%, Yellow >= 70%, Red < 70%
 */
export function getSEColor(se) {
  if (se === null || se === undefined) return '#6B7280';
  if (se >= 85) return '#10B981';
  if (se >= 70) return '#F59E0B';
  return '#EF4444';
}

/**
 * Get the health status label for a sleep efficiency value.
 */
export function getSEStatus(se) {
  if (se === null || se === undefined) return 'No data';
  if (se >= 85) return 'Healthy';
  if (se >= 70) return 'Fair';
  return 'Poor';
}

/**
 * Compute BMI from height and weight.
 * Formula: weight(kg) / height(m)^2
 */
export function computeBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM ** 2)) * 10) / 10;
}

/**
 * Get BMI category label.
 */
export function getBMICategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Format a time string from "HH:MM" to "12-hour AM/PM".
 * Example: "23:30" → "11:30 PM"
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * All formula descriptions for the (i) tooltip icons.
 * Matches what the Django backend serves from FORMULA_DESCRIPTIONS.
 */
export const FORMULA_DESCRIPTIONS = {
  tst: 'Total Sleep Time (TST) = (Final Awakening Time − Sleep Attempt Time) − Sleep Latency (Q3) − Wake After Sleep Onset (Q5). If final awakening crosses midnight, 1440 minutes is added before subtracting.',
  tib: 'Time in Bed (TIB) = Out of Bed Time (Q7) − Sleep Attempt Time (Q2). If out of bed time crosses midnight, 1440 minutes is added.',
  sleep_efficiency: 'Sleep Efficiency (SE) = (Total Sleep Time ÷ Time in Bed) × 100. A score of 85% or above is considered clinically healthy.',
  sleep_latency: 'Sleep Latency = Q3 directly as entered. This is the number of minutes it took you to fall asleep after attempting sleep.',
  waso: 'Wake After Sleep Onset (WASO) = Q5 directly as entered. Total minutes spent awake during the night, not counting the final awakening.',
  bmi: 'BMI = Weight (kg) ÷ Height (m)². Underweight < 18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese ≥ 30.',
};