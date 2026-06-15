# users/urls.py
# Maps URL paths to the auth views above.

from django.urls import path
from users.views import (
    RegisterView,
    VerifyOTPView,
    ResendOTPView,
    LoginView,
    LogoutView,
    ProfileView,
    PushSubscriptionView,
)
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (
    RegisterView, VerifyOTPView, ResendOTPView, LoginView,
    LogoutView, ProfileView, PushSubscriptionView, VAPIDPublicKeyView,
    ForgotPasswordView, ResetPasswordView,
)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('push-subscription/', PushSubscriptionView.as_view(), name='push-subscription'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('vapid-public-key/', VAPIDPublicKeyView.as_view(), name='vapid-public-key'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]