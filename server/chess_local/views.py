from rest_framework import viewsets

from chess_local.models import TrainingGrounds
from chess_local.serializers import TrainingGroundsSerializer


class TrainingGroundsViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingGroundsSerializer

    def get_queryset(self):
        # Users only see their own training grounds.
        return TrainingGrounds.objects.filter(user=self.request.user)
