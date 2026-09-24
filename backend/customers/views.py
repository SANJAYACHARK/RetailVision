from django_filters.rest_framework import (
    DjangoFilterBackend,
)

from rest_framework import (
    filters,
    viewsets,
)

from rest_framework.permissions import (
    IsAuthenticated,
)

from accounts.permissions import (
    IsAdminOrManager,
)

from .models import Customer

from .serializers import (
    CustomerSerializer,
)


class CustomerViewSet(
    viewsets.ModelViewSet
):

    queryset = (
        Customer.objects
        .select_related(
            "created_by"
        )
        .all()
    )

    serializer_class = (
        CustomerSerializer
    )

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "customer_type",
        "gender",
        "is_active",
        "city",
        "state",
    ]

    search_fields = [
        "customer_code",
        "name",
        "phone",
        "email",
        "city",
        "state",
    ]

    ordering_fields = [
        "name",
        "customer_code",
        "loyalty_points",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]


    def get_permissions(self):

        if self.action in [
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


    def perform_create(
        self,
        serializer,
    ):

        serializer.save(
            created_by=self.request.user
        )


    def perform_destroy(
        self,
        instance,
    ):

        instance.is_active = False

        instance.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )