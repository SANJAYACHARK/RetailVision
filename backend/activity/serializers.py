from rest_framework import serializers

from .models import (
    AuditLog,
    Notification,
)


# ============================================================
# AUDIT LOG SERIALIZER
# ============================================================

class AuditLogSerializer(
    serializers.ModelSerializer
):

    user_name = (
        serializers.SerializerMethodField()
    )

    role = (
        serializers.SerializerMethodField()
    )


    class Meta:
        model = AuditLog

        fields = [
            "id",
            "user",
            "user_name",
            "role",
            "username",
            "action",
            "module",
            "description",
            "request_method",
            "path",
            "ip_address",
            "status_code",
            "success",
            "created_at",
        ]


    def get_user_name(
        self,
        obj,
    ):
        if not obj.user:
            return (
                obj.username
                or "System"
            )

        return (
            obj.user.get_full_name()
            or obj.user.username
        )


    def get_role(
        self,
        obj,
    ):
        if not obj.user:
            return ""

        return getattr(
            obj.user,
            "role",
            "",
        )


# ============================================================
# NOTIFICATION SERIALIZER
# ============================================================

class NotificationSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Notification

        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "link",
            "reference_key",
            "is_read",
            "created_at",
            "read_at",
        ]