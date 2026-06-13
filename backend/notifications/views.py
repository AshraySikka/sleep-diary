from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from users.models import UserProfile
import json


class SendTestNotificationView(APIView):
    """POST /api/notifications/send-test/ — sends a test push to the logged-in user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.profile
            subscription = profile.push_subscription

            if not subscription:
                return Response(
                    {'error': 'No push subscription found. Enable notifications in Settings.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            from pywebpush import webpush
            webpush(
                subscription_info=subscription,
                data=json.dumps({
                    'title': 'Sleep Diary Test 🌙',
                    'body': 'Notifications are working!',
                    'url': '/',
                }),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={'sub': settings.VAPID_CLAIMS_EMAIL},
            )

            return Response({'message': 'Test notification sent.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CronSendRemindersView(APIView):
    """
    GET /api/notifications/cron/
    Called every hour by cron-job.org.
    Sends push notifications to users whose reminder time matches current UTC hour.
    Protected by a secret token to prevent abuse.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Verify the cron secret token
        token = request.query_params.get('token')
        if token != settings.CRON_SECRET:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        current_hour = now.hour
        current_minute = now.minute

        profiles = UserProfile.objects.filter(
            notification_enabled=True,
            push_subscription__isnull=False,
        ).select_related('user')

        sent = 0
        failed = 0

        for profile in profiles:
            if not profile.notification_time:
                continue

            # Convert user's local notification time to UTC
            # by subtracting their timezone offset
            notif_hour = profile.notification_time.hour
            notif_minute = profile.notification_time.minute
            tz_offset = getattr(profile, 'notification_tz_offset', 0)

            # Convert local time to UTC minutes
            local_total = notif_hour * 60 + notif_minute
            utc_total = (local_total - tz_offset) % (24 * 60)  # wrap around midnight

            # Current UTC time in minutes
            total_now = current_hour * 60 + current_minute

            # Allow 35-minute window to account for cron job timing variance
            diff = abs(total_now - utc_total)
            # Handle day boundary wraparound
            if diff > 12 * 60:
                diff = 24 * 60 - diff

            if diff > 35:
                continue

            try:
                from pywebpush import webpush
                webpush(
                    subscription_info=profile.push_subscription,
                    data=json.dumps({
                        'title': 'Good morning! 🌙',
                        'body': 'Time to log your sleep from last night.',
                        'url': '/',
                    }),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={'sub': settings.VAPID_CLAIMS_EMAIL},
                )
                sent += 1
            except Exception as e:
                failed += 1

        return Response({
            'sent': sent,
            'failed': failed,
            'checked_at': now.strftime('%H:%M UTC'),
        })