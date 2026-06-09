from django.urls import path
from notifications.views import SendTestNotificationView

urlpatterns = [
    path('send-test/', SendTestNotificationView.as_view(), name='send-test'),
]