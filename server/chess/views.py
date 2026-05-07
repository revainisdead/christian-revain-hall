from django.shortcuts import render


from chess.models import TrainingGrounds
from chess.serializers import TrainingGroundsSerializer

from rest_framework import viewsets


class TrainingGroundsViewSet(viewsets.ModelViewSet):
    queryset = TrainingGrounds.objects.all()
    serializer_class = TrainingGroundsSerializer
