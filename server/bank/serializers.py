# user.bank_accounts.transactions
from rest_framework import serializers

from bank.models import BankAccount, Transaction


#class UserSerializer(serializers.ModelSerializer):
#    bank_accounts = BankAccountSerializer(many=True)
#    class Meta:
#        model = Transaction
#        fields = ["bank_accounts"]



class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["date", "description", "amount", "balance"]


class BankAccountSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True)
    class Meta:
        model = BankAccount
        fields = ["transactions"]

