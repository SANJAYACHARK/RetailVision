from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(
    admin.ModelAdmin
):

    list_display = (
        "customer_code",
        "name",
        "phone",
        "customer_type",
        "loyalty_points",
        "is_active",
        "created_at",
    )

    search_fields = (
        "customer_code",
        "name",
        "phone",
        "email",
    )

    list_filter = (
        "customer_type",
        "gender",
        "is_active",
        "city",
        "state",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )