from django.contrib import admin

from .models import (
    InventoryTransaction,
    StockAdjustment,
)


@admin.register(
    InventoryTransaction
)
class InventoryTransactionAdmin(
    admin.ModelAdmin
):

    list_display = [
        "id",
        "product",
        "transaction_type",
        "quantity",
        "quantity_before",
        "quantity_after",
        "reference_number",
        "created_by",
        "created_at",
    ]

    list_filter = [
        "transaction_type",
        "reference_type",
        "created_at",
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "reference_number",
        "remarks",
    ]

    readonly_fields = [
        "product",
        "transaction_type",
        "reference_type",
        "reference_id",
        "reference_number",
        "quantity",
        "quantity_before",
        "quantity_after",
        "unit_cost",
        "remarks",
        "created_by",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    date_hierarchy = (
        "created_at"
    )



@admin.register(
    StockAdjustment
)
class StockAdjustmentAdmin(
    admin.ModelAdmin
):

    list_display = [
        "id",
        "product",
        "adjustment_type",
        "quantity",
        "quantity_before",
        "quantity_after",
        "created_by",
        "created_at",
    ]

    list_filter = [
        "adjustment_type",
        "created_at",
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "reason",
    ]

    readonly_fields = [
        "product",
        "adjustment_type",
        "quantity",
        "reason",
        "quantity_before",
        "quantity_after",
        "created_by",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    date_hierarchy = (
        "created_at"
    )