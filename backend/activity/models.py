from django.conf import settings
from django.db import models


# ============================================================
# AUDIT LOG
# ============================================================

class AuditLog(models.Model):

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        VIEW = "VIEW", "View"
        EXPORT = "EXPORT", "Export"
        OTHER = "OTHER", "Other"


    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    username = models.CharField(
        max_length=150,
        blank=True,
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        default=Action.OTHER,
    )

    module = models.CharField(
        max_length=100,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    request_method = models.CharField(
        max_length=10,
        blank=True,
    )

    path = models.CharField(
        max_length=500,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    status_code = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    success = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "-created_at",
                ]
            ),

            models.Index(
                fields=[
                    "action",
                ]
            ),

            models.Index(
                fields=[
                    "module",
                ]
            ),

            models.Index(
                fields=[
                    "user",
                ]
            ),
        ]


    def __str__(self):
        return (
            f"{self.username or 'System'} "
            f"- {self.action} "
            f"- {self.module}"
        )


# ============================================================
# NOTIFICATION
# ============================================================

class Notification(models.Model):

    class NotificationType(
        models.TextChoices
    ):
        INFO = "INFO", "Info"
        SUCCESS = "SUCCESS", "Success"
        WARNING = "WARNING", "Warning"
        ERROR = "ERROR", "Error"
        STOCK = "STOCK", "Stock"
        SALES = "SALES", "Sales"
        SYSTEM = "SYSTEM", "System"


    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="retail_notifications",
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.INFO,
    )

    link = models.CharField(
        max_length=500,
        blank=True,
    )

    reference_key = models.CharField(
        max_length=255,
        blank=True,
    )

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )


    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "is_read",
                ]
            ),

            models.Index(
                fields=[
                    "-created_at",
                ]
            ),
        ]


    def __str__(self):
        return (
            f"{self.user} - {self.title}"
        )