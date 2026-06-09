from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from diary.utils import compute_sleep_metrics


class SleepEntry(models.Model):
    SLEEP_QUALITY_CHOICES = [
        (1, 'Very Poor'),
        (2, 'Poor'),
        (3, 'Fair'),
        (4, 'Good'),
        (5, 'Very Good'),        
    ]

    RESTFULNESS_CHOICES = [
        (1, 'Not at all rested'),
        (2, 'Slightly rested'),
        (3, 'Somewhat rested'),
        (4, 'Well-rested'),
        (5, 'Very well-rested'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sleep_entries')

    # The date this entry is for (not when it was filled in)
    date = models.DateField()


    # --- PART A: Night & Awakening Metrics ---

    # Q1: What time did you get into bed?
    q1_bed_time = models.TimeField(null=True, blank=True)

    # Q2: What time did you try to go to sleep?
    q2_sleep_attempt_time = models.TimeField(null=True, blank=True)

    # Q3: How long did it take you to fall asleep? (minutes)
    q3_sleep_latency_min = models.PositiveIntegerField(null=True, blank=True)

    # Q4: How many times did you wake up, not counting your final awakening?
    q4_awakening_count = models.PositiveIntegerField(null=True, blank=True)

    # Q5: In total, how long did these awakenings last? (minutes)
    q5_waso_min = models.PositiveIntegerField(null=True, blank=True)

    # Q6a: What time was your final awakening?
    q6a_final_awakening_time = models.TimeField(null=True, blank=True)

    # Q6b: After your final awakening, how long did you spend in bed trying to sleep? (minutes)
    q6b_post_awakening_bed_min = models.PositiveIntegerField(null=True, blank=True)

    # Q6c: Did you wake up earlier than you planned?
    q6c_early_awakening = models.BooleanField(null=True, blank=True)

    # Q6d: If yes, how much earlier? (minutes)
    q6d_early_awakening_min = models.PositiveIntegerField(null=True, blank=True)

    # Q7: What time did you get out of bed for the day?
    q7_out_of_bed_time = models.TimeField(null=True, blank=True)

    # Q9: How would you rate the quality of your sleep?
    q9_sleep_quality = models.PositiveSmallIntegerField(
        null=True, blank=True,
        choices=SLEEP_QUALITY_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    # Q10: How rested or refreshed did you feel when you woke up?
    q10_restfulness = models.PositiveSmallIntegerField(
        null=True, blank=True,
        choices=RESTFULNESS_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    # --- PART B: Daytime Behaviours ---

    # Q11a: How many times did you nap or doze?
    q11a_nap_count = models.PositiveIntegerField(null=True, blank=True)

    # Q11b: In total, how long did you nap or doze? (minutes)
    q11b_nap_duration_min = models.PositiveIntegerField(null=True, blank=True)

    # Q12a: How many drinks containing alcohol did you have?
    q12a_alcohol_count = models.PositiveIntegerField(null=True, blank=True)

    # Q12b: What time was your last alcoholic drink?
    q12b_alcohol_last_time = models.TimeField(null=True, blank=True)

    # Q13a: How many caffeinated drinks did you have?
    q13a_caffeine_count = models.PositiveIntegerField(null=True, blank=True)

    # Q13b: What time was your last caffeinated drink?
    q13b_caffeine_last_time = models.TimeField(null=True, blank=True)

    # Q14a: Did you take any medication to help you sleep?
    q14a_medication_taken = models.BooleanField(null=True, blank=True)

    # Q14b: If so, list medication(s), dose, and time taken
    q14b_medication_details = models.TextField(blank=True, default='')

    # Q15: Comments
    q15_comments = models.TextField(blank=True, default='')

    # --- Computed Fields (stored for performance) ---
    # These are calculated by the math engine and cached here
    tst_min = models.IntegerField(null=True, blank=True) # Total Sleep Time in minutes
    tst_hours = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    tib_min = models.IntegerField(null=True, blank=True)       # Time in Bed in minutes
    sleep_efficiency = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_complete = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f'{self.user.email} - {self.date}'
    
    def save(self, *args, **kwargs):
        # Auto-calculate computed fields on every save
        metrics = compute_sleep_metrics(self)
        self.tst_min = metrics.get('tst_min')
        self.tst_hours = metrics.get('tst_hours')
        self.tib_min = metrics.get('tib_min')
        self.sleep_efficiency = metrics.get('sleep_efficiency')
        super().save(*args, **kwargs)