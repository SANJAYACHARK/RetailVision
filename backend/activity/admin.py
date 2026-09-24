from django.contrib import admin

from .models import (
    AuditLog,
    Notification,
)


@admin.register(
    AuditLog
)
class AuditLogAdmin(
    admin.ModelAdmin
):

    list_display = [
        "id",
        "username",
        "action",
        "module",
        "request_method",
        "status_code",
        "success",
        "created_at",
    ]

    list_filter = [
        "action",
        "module",
        "success",
        "created_at",
    ]

    search_fields = [
        "username",
        "description",
        "path",
    ]

    readonly_fields = [
        "created_at",
    ]


@admin.register(
    Notification
)
class NotificationAdmin(
    admin.ModelAdmin
):

    list_display = [
        "id",
        "user",
        "title",
        "notification_type",
        "is_read",
        "created_at",
    ]

    list_filter = [
        "notification_type",
        "is_read",
        "created_at",
    ]

    search_fields = [
        "user__username",
        "title",
        "message",
    ]