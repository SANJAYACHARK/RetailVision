from django_filters.rest_framework import (
    DjangoFilterBackend,
)

from rest_framework import (
    filters,
    permissions,
    viewsets,
)

from .models import (
    Order,
    Payment,
    SalesReturn,
)

from .serializers import (
    OrderSerializer,
    PaymentSerializer,
    SalesReturnSerializer,
)


class OrderViewSet(
    viewsets.ModelViewSet
):

    serializer_class = OrderSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "payment_status",
        "customer",
        "created_by",
    ]

    search_fields = [
        "invoice_number",
        "customer__name",
        "customer__phone",
        "customer__customer_code",
    ]

    ordering_fields = [
        "order_date",
        "grand_total",
        "total_profit",
        "created_at",
    ]

    ordering = [
        "-order_date",
    ]

    def get_queryset(self):

        return (
            Order.objects
            .select_related(
                "customer",
                "created_by",
            )
            .prefetch_related(
                "items__product",
                "payments",
            )
            .all()
        )


class PaymentViewSet(
    viewsets.ModelViewSet
):

    serializer_class = PaymentSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "order",
        "method",
        "status",
    ]

    search_fields = [
        "order__invoice_number",
        "reference_number",
    ]

    ordering_fields = [
        "paid_at",
        "amount",
        "created_at",
    ]

    ordering = [
        "-paid_at",
    ]

    def get_queryset(self):

        return (
            Payment.objects
            .select_related(
                "order",
                "created_by",
            )
            .all()
        )


class SalesReturnViewSet(
    viewsets.ModelViewSet
):

    serializer_class = (
        SalesReturnSerializer
    )

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "order",
        "status",
    ]

    search_fields = [
        "return_number",
        "order__invoice_number",
        "order__customer__name",
    ]

    ordering_fields = [
        "returned_at",
        "refund_amount",
        "created_at",
    ]

    ordering = [
        "-returned_at",
    ]

    def get_queryset(self):

        return (
            SalesReturn.objects
            .select_related(
                "order",
                "created_by",
            )
            .prefetch_related(
                "items__product",
                "items__order_item",
            )
            .all()
        )