# diary/views.py
# -----------------------------------------------------------------------
# API views for sleep diary entries and dashboard stats.
# All endpoints are protected — user must be authenticated via JWT.
# -----------------------------------------------------------------------

from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from diary.models import SleepEntry
from diary.serializers import (
    SleepEntrySerializer,
    SleepEntryWriteSerializer,
    CalendarEntrySerializer,
    DashboardStatsSerializer,
)
from diary.utils import compute_dashboard_stats, FORMULA_DESCRIPTIONS


class SleepEntryListCreateView(APIView):
    """
    GET  /api/diary/entries/         — List all entries for the logged-in user.
    POST /api/diary/entries/         — Create a new sleep entry.

    GET supports optional query params:
        ?start=YYYY-MM-DD  — filter entries from this date
        ?end=YYYY-MM-DD    — filter entries up to this date
        ?days=7            — shortcut for last N days
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = SleepEntry.objects.filter(user=request.user)

        # Filter by explicit date range if provided
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        days = request.query_params.get('days')

        if days:
            # Shortcut — last N days from today
            try:
                cutoff = timezone.now().date() - timedelta(days=int(days))
                entries = entries.filter(date__gte=cutoff)
            except ValueError:
                pass

        if start:
            try:
                entries = entries.filter(
                    date__gte=datetime.strptime(start, '%Y-%m-%d').date()
                )
            except ValueError:
                pass

        if end:
            try:
                entries = entries.filter(
                    date__lte=datetime.strptime(end, '%Y-%m-%d').date()
                )
            except ValueError:
                pass

        serializer = SleepEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SleepEntryWriteSerializer(
            data=request.data,
            context={'request': request},
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate entry on the same date
        date = serializer.validated_data.get('date')
        if SleepEntry.objects.filter(user=request.user, date=date).exists():
            return Response(
                {'error': f'An entry for {date} already exists. Use PATCH to update it.'},
                status=status.HTTP_409_CONFLICT,
            )

        entry = serializer.save()

        # Return the full entry with computed metrics
        return Response(
            SleepEntrySerializer(entry).data,
            status=status.HTTP_201_CREATED,
        )


class SleepEntryDetailView(APIView):
    """
    GET    /api/diary/entries/<date>/  — Get a single entry by date (YYYY-MM-DD).
    PATCH  /api/diary/entries/<date>/  — Update an existing entry.
    DELETE /api/diary/entries/<date>/  — Delete an entry.

    Using date as the URL param instead of ID makes the calendar
    integration much cleaner — click a date, fetch that date directly.
    """
    permission_classes = [IsAuthenticated]

    def get_entry(self, user, date_str):
        """Helper to fetch an entry by date string, returns None if not found."""
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            return SleepEntry.objects.get(user=user, date=date)
        except (SleepEntry.DoesNotExist, ValueError):
            return None

    def get(self, request, date):
        entry = self.get_entry(request.user, date)

        if not entry:
            return Response(
                {'error': f'No entry found for {date}.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SleepEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, date):
        entry = self.get_entry(request.user, date)

        if not entry:
            return Response(
                {'error': f'No entry found for {date}.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SleepEntryWriteSerializer(
            entry,
            data=request.data,
            partial=True,
            context={'request': request},
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # save() inside update() auto-recalculates TST, TIB, SE
        entry = serializer.save()

        return Response(
            SleepEntrySerializer(entry).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, date):
        entry = self.get_entry(request.user, date)

        if not entry:
            return Response(
                {'error': f'No entry found for {date}.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        entry.delete()
        return Response(
            {'message': f'Entry for {date} deleted successfully.'},
            status=status.HTTP_200_OK,
        )


class CalendarView(APIView):
    """
    GET /api/diary/calendar/?month=YYYY-MM
    Returns lightweight entry data for a full calendar month.
    Only sends the fields needed to render calendar day indicators
    (date, is_complete, sleep_efficiency, tst_hours, quality).
    Keeps the calendar fast — no need to send all 30+ fields per day.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        month_str = request.query_params.get('month')

        if not month_str:
            # Default to current month if no param provided
            today = timezone.now().date()
            month_str = today.strftime('%Y-%m')

        try:
            month_start = datetime.strptime(month_str, '%Y-%m').date()
        except ValueError:
            return Response(
                {'error': 'Invalid month format. Use YYYY-MM.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate last day of the month
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1)

        entries = SleepEntry.objects.filter(
            user=request.user,
            date__gte=month_start,
            date__lt=month_end,
        )

        serializer = CalendarEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardView(APIView):
    """
    GET /api/diary/dashboard/?days=7  (or 14, 30)
    Returns aggregate stats for the dashboard metric cards and charts.
    Includes per-entry data for trend charts alongside the averages.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))

        # Clamp to sensible range
        if days not in [7, 14, 30]:
            days = 7

        cutoff = timezone.now().date() - timedelta(days=days - 1)
        entries = list(
            SleepEntry.objects.filter(
                user=request.user,
                date__gte=cutoff,
            ).order_by('date')
        )

        # Aggregate stats for the metric cards
        stats = compute_dashboard_stats(entries)

        # Per-entry data for trend charts
        # Each point has date + the values needed for the dual-axis chart
        trend_data = [
            {
                'date': str(e.date),
                'sleep_efficiency': float(e.sleep_efficiency) if e.sleep_efficiency else None,
                'tst_hours': float(e.tst_hours) if e.tst_hours else None,
                'tib_min': e.tib_min,
                'tst_min': e.tst_min,
                'caffeine_count': e.q13a_caffeine_count,
                'alcohol_count': e.q12a_alcohol_count,
                'sleep_quality': e.q9_sleep_quality,
                'sleep_latency': e.q3_sleep_latency_min,
                'waso': e.q5_waso_min,
            }
            for e in entries
        ]

        return Response(
            {
                'stats': stats,
                'trend_data': trend_data,
                'formula_descriptions': FORMULA_DESCRIPTIONS,
                'days': days,
            },
            status=status.HTTP_200_OK,
        )


class FormulaDescriptionsView(APIView):
    """
    GET /api/diary/formulas/
    Returns all formula descriptions for the (i) tooltip icons.
    Standalone endpoint so the frontend can fetch once and cache.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(FORMULA_DESCRIPTIONS, status=status.HTTP_200_OK)