from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminOrManager
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):

    queryset = Category.objects.all()

    serializer_class = CategorySerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    def get_permissions(self):

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:
            return [
                IsAuthenticated(),
                IsAdminOrManager(),
            ]

        return [
            IsAuthenticated(),
        ]


class ProductViewSet(viewsets.ModelViewSet):

    queryset = (
        Product.objects
        .select_related(
            "category",
            "supplier",
            "created_by",
        )
        .all()
    )

    serializer_class = ProductSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "category",
        "supplier",
        "status",
        "unit",
    ]
    search_fields = [
        "sku",
        "barcode",
        "name",
        "brand",
        "category__name",
        "supplier__company_name",
    ]

    ordering_fields = [
        "name",
        "sku",
        "cost_price",
        "selling_price",
        "stock_quantity",
        "created_at",
    ]

    def get_permissions(self):

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:
            return [
                IsAuthenticated(),
                IsAdminOrManager(),
            ]

        return [
            IsAuthenticated(),
        ]

    def perform_create(self, serializer):

        serializer.save(
            created_by=self.request.user
        )