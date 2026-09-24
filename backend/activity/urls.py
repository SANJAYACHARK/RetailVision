from django.urls import path

from .views import (
    AuditLogListView,
    AuditLogSummaryView,
    InventoryNotificationSyncView,
    NotificationDeleteView,
    NotificationListView,
    NotificationReadAllView,
    NotificationReadView,
    NotificationUnreadCountView,
)


urlpatterns = [

    # ========================================================
    # AUDIT LOGS
    # ========================================================

    path(
        "audit-logs/",
        AuditLogListView.as_view(),
        name="audit-log-list",
    ),

    path(
        "audit-logs/summary/",
        AuditLogSummaryView.as_view(),
        name="audit-log-summary",
    ),


    # ========================================================
    # NOTIFICATIONS
    # ========================================================

    path(
        "notifications/",
        NotificationListView.as_view(),
        name="notification-list",
    ),

    path(
        "notifications/unread-count/",
        NotificationUnreadCountView.as_view(),
        name="notification-unread-count",
    ),

    path(
        "notifications/read-all/",
        NotificationReadAllView.as_view(),
        name="notification-read-all",
    ),

    path(
        "notifications/<int:notification_id>/read/",
        NotificationReadView.as_view(),
        name="notification-read",
    ),

    path(
        "notifications/<int:notification_id>/",
        NotificationDeleteView.as_view(),
        name="notification-delete",
    ),

    path(
        "notifications/sync-inventory/",
        InventoryNotificationSyncView.as_view(),
        name="notification-sync-inventory",
    ),
]