from django.contrib import admin

from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):

    list_display = (
        "supplier_code",
        "company_name",
        "contact_person",
        "phone",
        "city",
        "status",
    )

    search_fields = (
        "supplier_code",
        "company_name",
        "contact_person",
        "phone",
        "email",
        "gst_number",
    )

    list_filter = (
        "status",
        "state",
    )