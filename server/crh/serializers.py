from django.contrib.auth.models import Group, User
from rest_framework import serializers

from bank.serializers import BankAccountSerializer


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

