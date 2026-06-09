from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from users.models import UserProfile
import json
from pywebpush import webpush, WebPushException


class SendTestNotificationView(APIView):
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

            webpush(
                subscription_info=subscription,
                data=json.dumps({
                    'title': 'Sleep Diary Reminder',
                    'body': 'Time to log your sleep!',
                    'url': '/',
                }),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={'sub': settings.VAPID_CLAIMS_EMAIL},
            )

            return Response({'message': 'Notification sent.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)