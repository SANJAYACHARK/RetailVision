from django.db.models import Q
from django.utils import timezone

from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import (
    IsAdmin,
)

from .models import (
    AuditLog,
    Notification,
)

from .serializers import (
    AuditLogSerializer,
    NotificationSerializer,
)

from .services import (
    create_notification,
    mark_notification_read,
)


# ============================================================
# AUDIT LOG LIST
# ============================================================

class AuditLogListView(
    APIView
):

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]


    def get(
        self,
        request,
    ):
        queryset = (
            AuditLog.objects
            .select_related(
                "user"
            )
            .all()
        )


        search = (
            request.query_params
            .get(
                "search",
                ""
            )
            .strip()
        )


        action = (
            request.query_params
            .get(
                "action",
                ""
            )
            .strip()
        )


        module = (
            request.query_params
            .get(
                "module",
                ""
            )
            .strip()
        )


        success = (
            request.query_params
            .get(
                "success"
            )
        )


        if search:
            queryset = (
                queryset.filter(
                    Q(
                        username__icontains=
                            search
                    )
                    |
                    Q(
                        description__icontains=
                            search
                    )
                    |
                    Q(
                        module__icontains=
                            search
                    )
                    |
                    Q(
                        path__icontains=
                            search
                    )
                )
            )


        if action:
            queryset = (
                queryset.filter(
                    action=
                        action.upper()
                )
            )


        if module:
            queryset = (
                queryset.filter(
                    module__iexact=
                        module
                )
            )


        if success in [
            "true",
            "false",
        ]:
            queryset = (
                queryset.filter(
                    success=(
                        success == "true"
                    )
                )
            )


        try:
            limit = int(
                request.query_params.get(
                    "limit",
                    200,
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            limit = 200


        limit = max(
            1,
            min(
                limit,
                1000,
            ),
        )


        queryset = (
            queryset[
                :limit
            ]
        )


        serializer = (
            AuditLogSerializer(
                queryset,
                many=True,
            )
        )


        return Response(
            {
                "count":
                    len(
                        serializer.data
                    ),

                "results":
                    serializer.data,
            }
        )


# ============================================================
# AUDIT SUMMARY
# ============================================================

class AuditLogSummaryView(
    APIView
):

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]


    def get(
        self,
        request,
    ):
        queryset = (
            AuditLog.objects.all()
        )


        today = timezone.localdate()


        today_logs = (
            queryset.filter(
                created_at__date=
                    today
            )
        )


        return Response(
            {
                "total_logs":
                    queryset.count(),

                "today_logs":
                    today_logs.count(),

                "successful":
                    queryset.filter(
                        success=True
                    ).count(),

                "failed":
                    queryset.filter(
                        success=False
                    ).count(),

                "create_actions":
                    queryset.filter(
                        action="CREATE"
                    ).count(),

                "update_actions":
                    queryset.filter(
                        action="UPDATE"
                    ).count(),

                "delete_actions":
                    queryset.filter(
                        action="DELETE"
                    ).count(),
            }
        )


# ============================================================
# NOTIFICATION LIST
# ============================================================

class NotificationListView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        queryset = (
            Notification.objects
            .filter(
                user=request.user
            )
        )


        unread_only = (
            request.query_params.get(
                "unread",
                ""
            )
        )


        if unread_only == "true":
            queryset = (
                queryset.filter(
                    is_read=False
                )
            )


        try:
            limit = int(
                request.query_params.get(
                    "limit",
                    20,
                )
            )

        except (
            ValueError,
            TypeError,
        ):
            limit = 20


        limit = max(
            1,
            min(
                limit,
                100,
            ),
        )


        queryset = queryset[
            :limit
        ]


        serializer = (
            NotificationSerializer(
                queryset,
                many=True,
            )
        )


        unread_count = (
            Notification.objects
            .filter(
                user=request.user,
                is_read=False,
            )
            .count()
        )


        return Response(
            {
                "unread_count":
                    unread_count,

                "results":
                    serializer.data,
            }
        )


# ============================================================
# UNREAD COUNT
# ============================================================

class NotificationUnreadCountView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        count = (
            Notification.objects
            .filter(
                user=request.user,
                is_read=False,
            )
            .count()
        )


        return Response(
            {
                "unread_count":
                    count
            }
        )


# ============================================================
# MARK ONE READ
# ============================================================

class NotificationReadView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def patch(
        self,
        request,
        notification_id,
    ):
        try:
            notification = (
                Notification.objects.get(
                    id=notification_id,
                    user=request.user,
                )
            )

        except Notification.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Notification not found."
                },
                status=404,
            )


        mark_notification_read(
            notification
        )


        return Response(
            {
                "message":
                    "Notification marked as read."
            }
        )


# ============================================================
# MARK ALL READ
# ============================================================

class NotificationReadAllView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def patch(
        self,
        request,
    ):
        now = timezone.now()


        updated = (
            Notification.objects
            .filter(
                user=request.user,
                is_read=False,
            )
            .update(
                is_read=True,
                read_at=now,
            )
        )


        return Response(
            {
                "message":
                    "All notifications marked as read.",

                "updated":
                    updated,
            }
        )


# ============================================================
# DELETE NOTIFICATION
# ============================================================

class NotificationDeleteView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def delete(
        self,
        request,
        notification_id,
    ):
        try:
            notification = (
                Notification.objects.get(
                    id=notification_id,
                    user=request.user,
                )
            )

        except Notification.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Notification not found."
                },
                status=404,
            )


        notification.delete()


        return Response(
            status=204
        )


# ============================================================
# INVENTORY NOTIFICATION SYNC
# ============================================================

class InventoryNotificationSyncView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def post(
        self,
        request,
    ):
        try:
            from products.models import (
                Product,
            )

        except ImportError:
            return Response(
                {
                    "detail":
                        "Product model is unavailable."
                },
                status=500,
            )


        products = (
            Product.objects
            .filter(
                stock_quantity__lte=
                    10
            )
        )


        created_or_updated = 0


        for product in products:
            stock = (
                getattr(
                    product,
                    "stock_quantity",
                    0,
                )
                or 0
            )


            reorder_level = (
                getattr(
                    product,
                    "reorder_level",
                    0,
                )
                or 0
            )


            if stock <= 0:
                title = (
                    "Product Out of Stock"
                )

                message = (
                    f"{product.name} "
                    f"is currently out of stock."
                )

                notification_type = (
                    "ERROR"
                )

            elif (
                reorder_level > 0
                and stock <= reorder_level
            ):
                title = (
                    "Low Stock Alert"
                )

                message = (
                    f"{product.name} has only "
                    f"{stock} units remaining."
                )

                notification_type = (
                    "STOCK"
                )

            else:
                continue


            create_notification(
                user=request.user,

                title=title,

                message=message,

                notification_type=
                    notification_type,

                link="/inventory",

                reference_key=(
                    f"inventory-product-"
                    f"{product.id}"
                ),
            )


            created_or_updated += 1


        return Response(
            {
                "message":
                    "Inventory alerts synchronized.",

                "alerts":
                    created_or_updated,
            }
        )