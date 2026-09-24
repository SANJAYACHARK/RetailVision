from django.db.models import (
    Count,
    F,
    Q,
    Sum,
)
from django.utils import timezone

from rest_framework import (
    filters,
    generics,
    status,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend

from products.models import Product

from .models import (
    InventoryTransaction,
    StockAdjustment,
)

from .serializers import (
    InventoryTransactionSerializer,
    StockAdjustmentCreateSerializer,
    StockAdjustmentSerializer,
    StockInSerializer,
)


# ============================================================
# INVENTORY TRANSACTION LIST
# ============================================================

class InventoryTransactionListView(
    generics.ListAPIView
):

    permission_classes = [
        IsAuthenticated,
    ]

    serializer_class = (
        InventoryTransactionSerializer
    )

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "product",
        "transaction_type",
        "reference_type",
        "created_by",
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "reference_number",
        "remarks",
    ]

    ordering_fields = [
        "created_at",
        "quantity",
        "quantity_before",
        "quantity_after",
        "unit_cost",
    ]

    ordering = [
        "-created_at",
    ]


    def get_queryset(self):

        queryset = (
            InventoryTransaction.objects
            .select_related(
                "product",
                "created_by",
            )
            .all()
        )


        start_date = (
            self.request.query_params.get(
                "start_date"
            )
        )

        end_date = (
            self.request.query_params.get(
                "end_date"
            )
        )


        if start_date:

            queryset = queryset.filter(
                created_at__date__gte=(
                    start_date
                )
            )


        if end_date:

            queryset = queryset.filter(
                created_at__date__lte=(
                    end_date
                )
            )


        return queryset


# ============================================================
# STOCK ADJUSTMENT LIST
# ============================================================

class StockAdjustmentListView(
    generics.ListAPIView
):

    permission_classes = [
        IsAuthenticated,
    ]

    serializer_class = (
        StockAdjustmentSerializer
    )

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "product",
        "adjustment_type",
        "created_by",
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "reason",
    ]

    ordering_fields = [
        "created_at",
        "quantity",
    ]

    ordering = [
        "-created_at",
    ]


    def get_queryset(self):

        return (
            StockAdjustment.objects
            .select_related(
                "product",
                "created_by",
            )
            .all()
        )


# ============================================================
# CREATE STOCK ADJUSTMENT
# ============================================================

class StockAdjustmentCreateView(
    generics.CreateAPIView
):

    permission_classes = [
        IsAuthenticated,
    ]

    serializer_class = (
        StockAdjustmentCreateSerializer
    )


    def create(
        self,
        request,
        *args,
        **kwargs,
    ):

        serializer = (
            self.get_serializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        adjustment = (
            serializer.save()
        )


        response_serializer = (
            StockAdjustmentSerializer(
                adjustment,
                context={
                    "request":
                    request
                },
            )
        )


        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# STOCK IN
# ============================================================

class StockInCreateView(
    generics.CreateAPIView
):

    permission_classes = [
        IsAuthenticated,
    ]

    serializer_class = (
        StockInSerializer
    )


    def create(
        self,
        request,
        *args,
        **kwargs,
    ):

        serializer = (
            self.get_serializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        inventory_transaction = (
            serializer.save()
        )


        response_serializer = (
            InventoryTransactionSerializer(
                inventory_transaction,
                context={
                    "request":
                    request
                },
            )
        )


        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# INVENTORY SUMMARY
# ============================================================

class InventorySummaryView(
    APIView
):

    permission_classes = [
        IsAuthenticated,
    ]


    def get(
        self,
        request,
    ):

        products = (
            Product.objects
            .filter(
                status="ACTIVE"
            )
        )


        total_products = (
            products.count()
        )


        total_stock = (
            products.aggregate(
                total=Sum(
                    "stock_quantity"
                )
            )["total"]
            or 0
        )


        low_stock_products = (
            products.filter(
                stock_quantity__lte=F(
                    "reorder_level"
                )
            )
        )


        low_stock_count = (
            low_stock_products.count()
        )


        out_of_stock_count = (
            products.filter(
                stock_quantity=0
            )
            .count()
        )


        inventory_value = (
            products
            .annotate(
                stock_value=(
                    F("stock_quantity")
                    *
                    F("cost_price")
                )
            )
            .aggregate(
                total=Sum(
                    "stock_value"
                )
            )["total"]
            or 0
        )


        today = (
            timezone.localdate()
        )


        today_transactions = (
            InventoryTransaction.objects
            .filter(
                created_at__date=today
            )
            .count()
        )


        stock_in_today = (
            InventoryTransaction.objects
            .filter(
                created_at__date=today,
                transaction_type=(
                    InventoryTransaction
                    .TransactionType
                    .STOCK_IN
                ),
            )
            .aggregate(
                total=Sum(
                    "quantity"
                )
            )["total"]
            or 0
        )


        stock_out_today = (
            InventoryTransaction.objects
            .filter(
                created_at__date=today,
                transaction_type__in=[
                    InventoryTransaction
                    .TransactionType
                    .SALE,

                    InventoryTransaction
                    .TransactionType
                    .ADJUSTMENT_OUT,

                    InventoryTransaction
                    .TransactionType
                    .DAMAGED,

                    InventoryTransaction
                    .TransactionType
                    .EXPIRED,
                ],
            )
            .aggregate(
                total=Sum(
                    "quantity"
                )
            )["total"]
            or 0
        )


        return Response(
            {
                "total_products":
                    total_products,

                "total_stock":
                    total_stock,

                "low_stock_count":
                    low_stock_count,

                "out_of_stock_count":
                    out_of_stock_count,

                "inventory_value":
                    inventory_value,

                "today_transactions":
                    today_transactions,

                "stock_in_today":
                    stock_in_today,

                "stock_out_today":
                    stock_out_today,
            }
        )


# ============================================================
# LOW STOCK PRODUCTS
# ============================================================

class LowStockListView(
    generics.ListAPIView
):

    permission_classes = [
        IsAuthenticated,
    ]


    def get(
        self,
        request,
        *args,
        **kwargs,
    ):

        products = (
            Product.objects
            .filter(
                status="ACTIVE",
                stock_quantity__lte=F(
                    "reorder_level"
                ),
            )
            .select_related(
                "category",
                "supplier",
            )
            .order_by(
                "stock_quantity"
            )
        )


        search = (
            request.query_params.get(
                "search",
                ""
            )
            .strip()
        )


        if search:

            products = (
                products.filter(

                    Q(
                        name__icontains=search
                    )

                    |

                    Q(
                        sku__icontains=search
                    )

                    |

                    Q(
                        category__name__icontains=search
                    )
                )
            )


        data = []


        for product in products:

            data.append(
                {
                    "id":
                        product.id,

                    "sku":
                        product.sku,

                    "name":
                        product.name,

                    "category_name":
                        (
                            product.category.name
                            if product.category
                            else None
                        ),

                    "supplier_name":
                        (
                            product.supplier.company_name
                            if product.supplier
                            else None
                        ),

                    "stock_quantity":
                        product.stock_quantity,

                    "reorder_level":
                        product.reorder_level,

                    "minimum_stock":
                        product.minimum_stock,

                    "maximum_stock":
                        product.maximum_stock,

                    "cost_price":
                        product.cost_price,

                    "selling_price":
                        product.selling_price,

                    "is_out_of_stock":
                        product.stock_quantity
                        == 0,
                }
            )


        return Response(
            data
        )


# ============================================================
# EXPIRED PRODUCTS
# ============================================================

class ExpiredProductListView(
    generics.ListAPIView
):

    permission_classes = [
        IsAuthenticated,
    ]


    def get(
        self,
        request,
        *args,
        **kwargs,
    ):

        today = (
            timezone.localdate()
        )


        products = (
            Product.objects
            .filter(
                status="ACTIVE",
                expiry_date__isnull=False,
                expiry_date__lt=today,
                stock_quantity__gt=0,
            )
            .select_related(
                "category",
                "supplier",
            )
            .order_by(
                "expiry_date"
            )
        )


        data = []


        for product in products:

            data.append(
                {
                    "id":
                        product.id,

                    "sku":
                        product.sku,

                    "name":
                        product.name,

                    "category_name":
                        (
                            product.category.name
                            if product.category
                            else None
                        ),

                    "supplier_name":
                        (
                            product.supplier.company_name
                            if product.supplier
                            else None
                        ),

                    "stock_quantity":
                        product.stock_quantity,

                    "expiry_date":
                        product.expiry_date,

                    "cost_price":
                        product.cost_price,

                    "selling_price":
                        product.selling_price,
                }
            )


        return Response(
            data
        )