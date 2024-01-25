from django.shortcuts import render
from rest_framework import permissions, viewsets

from bank.models import (
    BankAccount,
    Transaction,
)

from bank.serializers import (
    BankAccountSerializer,
    TransactionSerializer,
)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by("-date")
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]


class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
