from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsAdminOrManager

from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):

    queryset = Supplier.objects.all().order_by("company_name")

    serializer_class = SupplierSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "supplier_code",
        "company_name",
        "contact_person",
        "phone",
        "email",
        "city",
        "state",
        "gst_number",
    ]

    ordering_fields = [
        "company_name",
        "supplier_code",
        "created_at",
    ]
    
    filterset_fields = [
        "status",
        "city",
        "state",
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