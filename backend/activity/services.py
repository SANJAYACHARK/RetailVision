from django.utils import timezone

from .models import Notification


# ============================================================
# CREATE NOTIFICATION
# ============================================================

def create_notification(
    user,
    title,
    message,
    notification_type="INFO",
    link="",
    reference_key="",
):
    if not user:
        return None


    if reference_key:
        existing = (
            Notification.objects
            .filter(
                user=user,
                reference_key=reference_key,
                is_read=False,
            )
            .first()
        )


        if existing:
            existing.title = title
            existing.message = message
            existing.notification_type = (
                notification_type
            )
            existing.link = link

            existing.save(
                update_fields=[
                    "title",
                    "message",
                    "notification_type",
                    "link",
                ]
            )

            return existing


    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
        reference_key=reference_key,
    )


# ============================================================
# MARK READ
# ============================================================

def mark_notification_read(
    notification,
):
    if notification.is_read:
        return notification


    notification.is_read = True
    notification.read_at = timezone.now()

    notification.save(
        update_fields=[
            "is_read",
            "read_at",
        ]
    )

    return notification