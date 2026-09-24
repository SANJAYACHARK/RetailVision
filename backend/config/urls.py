from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),
    path("api/products/", include("products.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/suppliers/", include("suppliers.urls")),
    path("api/sales/", include("sales.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/activity/",  include("activity.urls")),
]

