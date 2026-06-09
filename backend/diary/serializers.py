# diary/serializers.py
# -----------------------------------------------------------------------
# Serializers for the SleepEntry model.
# Handles conversion of all 15+ CSD-M fields between JSON and Python,
# and includes the computed metrics and formula descriptions in responses.
# -----------------------------------------------------------------------

from rest_framework import serializers
from diary.models import SleepEntry
from diary.utils import FORMULA_DESCRIPTIONS


class SleepEntrySerializer(serializers.ModelSerializer):
    """
    Full serializer for reading a SleepEntry.
    Used for GET requests — returns all fields including computed metrics
    and formula descriptions for the (i) tooltip icons on the dashboard.
    """
    # Human-readable labels for choice fields
    q9_sleep_quality_display = serializers.CharField(
        source='get_q9_sleep_quality_display',
        read_only=True
    )
    q10_restfulness_display = serializers.CharField(
        source='get_q10_restfulness_display',
        read_only=True
    )

    # Formula descriptions served alongside computed metrics
    # Frontend uses these to populate the (i) tooltip icons
    formula_descriptions = serializers.SerializerMethodField()

    class Meta:
        model = SleepEntry
        fields = [
            # Identity
            'id',
            'date',
            'is_complete',

            # Part A — Night & Awakening
            'q1_bed_time',
            'q2_sleep_attempt_time',
            'q3_sleep_latency_min',
            'q4_awakening_count',
            'q5_waso_min',
            'q6a_final_awakening_time',
            'q6b_post_awakening_bed_min',
            'q6c_early_awakening',
            'q6d_early_awakening_min',
            'q7_out_of_bed_time',
            'q9_sleep_quality',
            'q9_sleep_quality_display',
            'q10_restfulness',
            'q10_restfulness_display',

            # Part B — Daytime Behaviours
            'q11a_nap_count',
            'q11b_nap_duration_min',
            'q12a_alcohol_count',
            'q12b_alcohol_last_time',
            'q13a_caffeine_count',
            'q13b_caffeine_last_time',
            'q14a_medication_taken',
            'q14b_medication_details',
            'q15_comments',

            # Computed metrics (calculated on save, cached in DB)
            'tst_min',
            'tst_hours',
            'tib_min',
            'sleep_efficiency',

            # Formula tooltips
            'formula_descriptions',

            # Metadata
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'tst_min',
            'tst_hours',
            'tib_min',
            'sleep_efficiency',
            'created_at',
            'updated_at',
        ]

    def get_formula_descriptions(self, obj):
        # Return all formula descriptions so the frontend
        # can show the correct (i) tooltip for each metric card
        return FORMULA_DESCRIPTIONS


class SleepEntryWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer for creating and updating a SleepEntry.
    Used for POST and PATCH requests.
    Strips out computed fields since those are auto-calculated on save().

    Includes conditional validation:
    - Q6d only required if Q6c is True
    - Q11b only required if Q11a > 0
    - Q12b only required if Q12a > 0
    - Q13b only required if Q13a > 0
    - Q14b only required if Q14a is True
    """

    class Meta:
        model = SleepEntry
        fields = [
            'date',
            'q1_bed_time',
            'q2_sleep_attempt_time',
            'q3_sleep_latency_min',
            'q4_awakening_count',
            'q5_waso_min',
            'q6a_final_awakening_time',
            'q6b_post_awakening_bed_min',
            'q6c_early_awakening',
            'q6d_early_awakening_min',
            'q7_out_of_bed_time',
            'q9_sleep_quality',
            'q10_restfulness',
            'q11a_nap_count',
            'q11b_nap_duration_min',
            'q12a_alcohol_count',
            'q12b_alcohol_last_time',
            'q13a_caffeine_count',
            'q13b_caffeine_last_time',
            'q14a_medication_taken',
            'q14b_medication_details',
            'q15_comments',
            'is_complete',
        ]

    def validate(self, data):
        # Q6d: early awakening duration only makes sense if Q6c is True
        if data.get('q6c_early_awakening') is False:
            data['q6d_early_awakening_min'] = None

        # Q11b: nap duration only makes sense if nap count > 0
        if data.get('q11a_nap_count') == 0:
            data['q11b_nap_duration_min'] = None

        # Q12b: last alcohol time only makes sense if alcohol count > 0
        if data.get('q12a_alcohol_count') == 0:
            data['q12b_alcohol_last_time'] = None

        # Q13b: last caffeine time only makes sense if caffeine count > 0
        if data.get('q13a_caffeine_count') == 0:
            data['q13b_caffeine_last_time'] = None

        # Q14b: medication details only make sense if medication was taken
        if data.get('q14a_medication_taken') is False:
            data['q14b_medication_details'] = ''

        return data

    def create(self, validated_data):
        # Attach the logged-in user from the request context
        # The view passes request.user through serializer context
        user = self.context['request'].user
        return SleepEntry.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        # Update each field that was sent in the request
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # save() auto-recalculates TST, TIB, SE via compute_sleep_metrics
        instance.save()
        return instance


class CalendarEntrySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the calendar view.
    Only returns the fields needed to render calendar day indicators —
    no need to send all 30+ fields just to show a dot on a calendar tile.
    """

    class Meta:
        model = SleepEntry
        fields = [
            'id',
            'date',
            'is_complete',
            'sleep_efficiency',
            'tst_hours',
            'q9_sleep_quality',
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for the dashboard aggregate stats endpoint.
    Not tied to a model — just validates and structures the
    dictionary returned by compute_dashboard_stats().
    """
    avg_tst_min = serializers.FloatField(allow_null=True)
    avg_tst_hours = serializers.FloatField(allow_null=True)
    avg_sleep_efficiency = serializers.FloatField(allow_null=True)
    avg_sleep_latency = serializers.FloatField(allow_null=True)
    avg_waso = serializers.FloatField(allow_null=True)
    avg_awakening_count = serializers.FloatField(allow_null=True)
    total_entries = serializers.IntegerField()