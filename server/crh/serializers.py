from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.conf import settings
from rest_framework import serializers

from bank.serializers import BankAccountSerializer


User = get_user_model()


class UserLinkSerializer(serializers.HyperlinkedModelSerializer):
    bank_accounts = BankAccountSerializer(many=True)

    class Meta:
        model = User
        fields = ["bank_accounts", "url", "username", "email", "groups"]


class GroupLinkSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ["url", "name"]


class UserSerializer(serializers.ModelSerializer):
    bank_accounts = BankAccountSerializer(many=True)

    class Meta:
        model = User
        fields = ["bank_accounts", "username", "email", "groups"]


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["name"]

