from django.urls import path
from notifications.views import SendTestNotificationView, CronSendRemindersView, RecalculateEntriesView

urlpatterns = [
    path('send-test/', SendTestNotificationView.as_view(), name='send-test'),
    path('cron/', CronSendRemindersView.as_view(), name='cron-reminders'),
    path('recalculate/', RecalculateEntriesView.as_view(), name='recalculate'),
]