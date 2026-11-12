from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import HasAcceptedFairPlay
from chess_local import services
from chess_local.models import Game
from chess_local.serializers import (
    GameDetailSerializer,
    GameListSerializer,
    MoveCreateSerializer,
    MoveSerializer,
)


class GameViewSet(viewsets.ModelViewSet):
    """Your local games. Other users' games are invisible (404)."""

    permission_classes = [permissions.IsAuthenticated, HasAcceptedFairPlay]

    def get_queryset(self):
        qs = Game.objects.filter(owner=self.request.user)
        if self.action != "list":
            qs = qs.prefetch_related("moves")
        return qs

    def get_serializer_class(self):
        return GameListSerializer if self.action == "list" else GameDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"], url_path="moves")
    def add_move(self, request, pk=None):
        """POST {uci, ply}: 201 move | 400 illegal | 409 wrong ply."""
        game = self.get_object()
        data = MoveCreateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            move = services.append_move(game, **data.validated_data)
        except services.IllegalMove as exc:
            raise serializers.ValidationError({"uci": [str(exc)]})
        except services.PlyConflict as exc:
            return Response({"ply": [str(exc)]}, status=status.HTTP_409_CONFLICT)
        return Response(MoveSerializer(move).data, status=status.HTTP_201_CREATED)

    @add_move.mapping.delete
    def truncate_moves(self, request, pk=None):
        """DELETE ?after=<ply>: remove every move after that ply (0 = all)."""
        game = self.get_object()
        after = serializers.IntegerField(min_value=0).run_validation(request.query_params.get("after"))
        services.truncate_after(game, after)
        return Response(status=status.HTTP_204_NO_CONTENT)
