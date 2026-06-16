from django.urls import path
from notifications.views import SendTestNotificationView, CronSendRemindersView

urlpatterns = [
    path('send-test/', SendTestNotificationView.as_view(), name='send-test'),
    path('cron/', CronSendRemindersView.as_view(), name='cron-reminders'),
]