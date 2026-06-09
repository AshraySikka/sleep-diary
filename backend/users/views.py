# users/views.py
# -----------------------------------------------------------------------
# API views for authentication and user profile management.
# Handles: register, OTP verify, login, logout, profile CRUD.
# -----------------------------------------------------------------------

import random
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from users.models import User, UserProfile, OTPToken
from users.serializers import (
    RegisterSerializer,
    OTPVerifySerializer,
    LoginSerializer,
    ResendOTPSerializer,
    UserSerializer,
    UserProfileSerializer,
)


def generate_otp():
    """Generate a random 6-digit OTP string."""
    return str(random.randint(100000, 999999))


def send_otp_email(email, otp):
    """
    Send the OTP to the user's email address.
    Uses Django's built-in email backend configured in settings.py
    with Gmail SMTP credentials from the .env file.
    """
    send_mail(
        subject='Your Sleep Diary verification code',
        message=(
            f'Your verification code is: {otp}\n\n'
            f'This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n'
            f'If you did not request this, please ignore this email.'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Creates a new unverified user account and sends an OTP to their email.
    User cannot log in until they verify via /api/auth/verify-otp/.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create the user — password hashed, profile created inside serializer
        user = serializer.save()

        # Generate OTP and save to DB
        otp = generate_otp()
        OTPToken.objects.create(user=user, token=otp)

        # Send OTP email — in development this prints to console
        # if EMAIL_BACKEND is set to console backend
        try:
            send_otp_email(user.email, otp)
        except Exception as e:
            # Don't block registration if email fails — log and continue
            print(f'OTP email failed: {e}')

        return Response(
            {
                'message': 'Account created. Please check your email for your verification code.',
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    Verifies the 6-digit OTP sent to the user's email.
    On success, marks the user as verified and returns JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()
        otp = serializer.validated_data['otp']

        # Find the user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Find the most recent unused OTP for this user
        token = (
            OTPToken.objects
            .filter(user=user, token=otp, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not token:
            return Response(
                {'error': 'Invalid verification code. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token.is_expired:
            return Response(
                {'error': 'This code has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark OTP as used, mark user as verified
        token.is_used = True
        token.save()
        user.is_verified = True
        user.save()

        # Issue JWT tokens so the user is logged in immediately after verification
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'message': 'Email verified successfully.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ResendOTPView(APIView):
    """
    POST /api/auth/resend-otp/
    Invalidates old OTPs and sends a fresh one to the user's email.
    Used when the user didn't receive or the code expired.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_verified:
            return Response(
                {'error': 'This account is already verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Invalidate all previous unused OTPs for this user
        OTPToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate and send a fresh OTP
        otp = generate_otp()
        OTPToken.objects.create(user=user, token=otp)

        try:
            send_otp_email(user.email, otp)
        except Exception as e:
            print(f'OTP email failed: {e}')

        return Response(
            {'message': 'A new verification code has been sent to your email.'},
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates with email + password.
    Returns JWT access and refresh tokens on success.
    Blocks login if email is not verified yet.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check password
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Block unverified users
        if not user.is_verified:
            return Response(
                {
                    'error': 'Please verify your email before logging in.',
                    'requires_verification': True,
                    'email': user.email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token so it can no longer be used.
    The access token will expire naturally after 60 minutes.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'error': 'Invalid or already expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_200_OK,
        )


class ProfileView(APIView):
    """
    GET  /api/auth/profile/  — Returns the logged-in user's full profile.
    PATCH /api/auth/profile/ — Updates profile fields (height, weight, etc.)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return full user + nested profile data
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Get or create profile in case it doesn't exist yet
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(
            profile,
            data=request.data,
            partial=True,  # Allow partial updates — not all fields required
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        # Return the full updated user object
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class PushSubscriptionView(APIView):
    """
    POST /api/auth/push-subscription/
    Saves the browser push notification subscription object to the user's profile.
    Called by the frontend after the user grants notification permission.
    The subscription JSON is what the Web Push API needs to send notifications.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subscription = request.data.get('subscription')

        if not subscription:
            return Response(
                {'error': 'Subscription data is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.push_subscription = subscription
        profile.save()

        return Response(
            {'message': 'Push subscription saved.'},
            status=status.HTTP_200_OK,
        )
    
class VAPIDPublicKeyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.conf import settings
        return Response({'public_key': settings.VAPID_PUBLIC_KEY})