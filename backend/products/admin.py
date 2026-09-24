from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
    )

    list_filter = (
        "is_active",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "sku",
        "name",
        "category",
        "supplier",
        "selling_price",
        "stock_quantity",
        "status",
    )

    search_fields = (
        "sku",
        "barcode",
        "name",
        "brand",
    )

    list_filter = (
        "category",
        "status",
        "unit",
    )

    autocomplete_fields = (
        "category",
        "supplier",
    )