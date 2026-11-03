from rest_framework import serializers

from chess_local.models import Game, Move


class MoveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Move
        fields = ["ply", "uci", "san", "fen_after"]


class MoveCreateSerializer(serializers.Serializer):
    uci = serializers.CharField(min_length=4, max_length=5)
    ply = serializers.IntegerField(min_value=1)


class GameListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ["id", "title", "user_color", "status", "result_reason", "created_at", "updated_at"]
        read_only_fields = ["status", "result_reason"]


class GameDetailSerializer(GameListSerializer):
    moves = MoveSerializer(many=True, read_only=True)

    class Meta(GameListSerializer.Meta):
        fields = GameListSerializer.Meta.fields + ["start_fen", "moves"]
        read_only_fields = GameListSerializer.Meta.read_only_fields + ["start_fen"]

    def update(self, instance, validated_data):
        # Your color is fixed once the game exists.
        validated_data.pop("user_color", None)
        return super().update(instance, validated_data)
