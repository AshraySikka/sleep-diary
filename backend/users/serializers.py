# users/serializers.py
# -----------------------------------------------------------------------
# Serializers convert Django model instances to/from JSON.
# Think of them as the translation layer between Python objects and
# what the React frontend sends and receives over the API.
# -----------------------------------------------------------------------

from rest_framework import serializers
from django.utils import timezone
from users.models import User, UserProfile, OTPToken


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the UserProfile model.
    Includes computed properties (bmi, bmi_category, age) as read-only fields
    since they are calculated on the fly and not stored in the database.
    """
    # Read-only computed fields from @property methods on the model
    bmi = serializers.ReadOnlyField()
    bmi_category = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = [
            'date_of_birth',
            'biological_sex',
            'height_cm',
            'weight_kg',
            'clinician_email',
            'notification_enabled',
            'notification_time',
            'push_subscription',
            'bmi',
            'bmi_category',
            'age',
            'updated_at',
        ]
        # These fields are calculated — frontend can read but never write them
        read_only_fields = ['bmi', 'bmi_category', 'age', 'updated_at', 'notification_tz_offset']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    Used for returning user data after login/signup and for profile views.
    Nests the UserProfile so the frontend gets everything in one response.
    """
    # Nest the profile serializer — returns profile data inside the user object
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'is_verified',
            'terms_accepted',
            'terms_accepted_at',
            'created_at',
            'profile',
        ]
        read_only_fields = [
            'id',
            'is_verified',
            'terms_accepted_at',
            'created_at',
            'full_name',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Handles the signup form data — creates the User and UserProfile together.
    Password is write-only so it never appears in any API response.
    """
    # Write-only — accepted on input, never returned in responses
    password = serializers.CharField(write_only=True, min_length=8)
    terms_accepted = serializers.BooleanField()

    # Profile fields collected at signup — passed through to UserProfile
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    biological_sex = serializers.ChoiceField(
        choices=UserProfile.BIOLOGICAL_SEX_CHOICES,
        required=False,
        allow_blank=True
    )
    height_cm = serializers.DecimalField(
        max_digits=5, decimal_places=2,
        required=False, allow_null=True
    )
    weight_kg = serializers.DecimalField(
        max_digits=5, decimal_places=2,
        required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'first_name',
            'last_name',
            'terms_accepted',
            'date_of_birth',
            'biological_sex',
            'height_cm',
            'weight_kg',
        ]

    def validate_terms_accepted(self, value):
        # User must accept T&C to create an account — hard block if not
        if not value:
            raise serializers.ValidationError(
                'You must accept the Terms and Conditions to create an account.'
            )
        return value

    def validate_email(self, value):
        # Normalize to lowercase and check uniqueness
        email = value.lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                'An account with this email already exists.'
            )
        return email

    def create(self, validated_data):
        # Pull out profile fields before creating the User
        profile_fields = {
            'date_of_birth': validated_data.pop('date_of_birth', None),
            'biological_sex': validated_data.pop('biological_sex', ''),
            'height_cm': validated_data.pop('height_cm', None),
            'weight_kg': validated_data.pop('weight_kg', None),
        }

        # Create the User — password gets hashed inside create_user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            terms_accepted=validated_data['terms_accepted'],
            terms_accepted_at=timezone.now(),
        )

        # Create the linked UserProfile with the collected profile fields
        UserProfile.objects.create(user=user, **profile_fields)

        return user


class OTPVerifySerializer(serializers.Serializer):
    """
    Serializer for OTP verification.
    Just needs the email and the 6-digit code the user received.
    """
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)


class LoginSerializer(serializers.Serializer):
    """
    Serializer for login.
    Email + password — returns JWT tokens on success.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ResendOTPSerializer(serializers.Serializer):
    """
    Serializer for resending an OTP.
    Just needs the email address.
    """
    email = serializers.EmailField()