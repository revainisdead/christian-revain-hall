from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"email": {"required": True}}

    def validate(self, attrs):
        # Run Django's AUTH_PASSWORD_VALIDATORS against the would-be user.
        user = User(username=attrs["username"], email=attrs["email"])
        validate_password(attrs["password"], user=user)
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)
