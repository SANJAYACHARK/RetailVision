from django.urls import (
    include,
    path,
)

from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    OrderViewSet,
    PaymentViewSet,
    SalesReturnViewSet,
)


router = DefaultRouter()

router.register(
    "orders",
    OrderViewSet,
    basename="order",
)

router.register(
    "payments",
    PaymentViewSet,
    basename="payment",
)

router.register(
    "returns",
    SalesReturnViewSet,
    basename="sales-return",
)


urlpatterns = [

    path(
        "",
        include(
            router.urls
        ),
    ),

]