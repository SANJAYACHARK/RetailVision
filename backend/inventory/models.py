from django.conf import settings
from django.db import models

from products.models import Product


class InventoryTransaction(models.Model):

    class TransactionType(models.TextChoices):

        STOCK_IN = (
            "STOCK_IN",
            "Stock In",
        )

        SALE = (
            "SALE",
            "Sale",
        )

        SALES_RETURN = (
            "SALES_RETURN",
            "Sales Return",
        )

        ADJUSTMENT_IN = (
            "ADJUSTMENT_IN",
            "Adjustment In",
        )

        ADJUSTMENT_OUT = (
            "ADJUSTMENT_OUT",
            "Adjustment Out",
        )

        DAMAGED = (
            "DAMAGED",
            "Damaged Stock",
        )

        EXPIRED = (
            "EXPIRED",
            "Expired Stock",
        )

        CANCELLED_SALE = (
            "CANCELLED_SALE",
            "Cancelled Sale",
        )


    class ReferenceType(models.TextChoices):

        MANUAL = (
            "MANUAL",
            "Manual",
        )

        ORDER = (
            "ORDER",
            "Order",
        )

        SALES_RETURN = (
            "SALES_RETURN",
            "Sales Return",
        )

        PURCHASE = (
            "PURCHASE",
            "Purchase",
        )

        SYSTEM = (
            "SYSTEM",
            "System",
        )


    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="inventory_transactions",
    )


    transaction_type = models.CharField(
        max_length=30,
        choices=TransactionType.choices,
    )


    reference_type = models.CharField(
        max_length=30,
        choices=ReferenceType.choices,
        default=ReferenceType.MANUAL,
    )


    reference_id = models.PositiveIntegerField(
        null=True,
        blank=True,
    )


    reference_number = models.CharField(
        max_length=100,
        blank=True,
    )


    quantity = models.PositiveIntegerField()


    quantity_before = models.PositiveIntegerField()


    quantity_after = models.PositiveIntegerField()


    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )


    remarks = models.TextField(
        blank=True,
    )


    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_transactions_created",
    )


    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    class Meta:

        ordering = [
            "-created_at",
            "-id",
        ]

        indexes = [

            models.Index(
                fields=[
                    "product",
                    "created_at",
                ]
            ),

            models.Index(
                fields=[
                    "transaction_type",
                    "created_at",
                ]
            ),

            models.Index(
                fields=[
                    "reference_type",
                    "reference_id",
                ]
            ),
        ]


    def __str__(self):

        return (
            f"{self.product.name} - "
            f"{self.get_transaction_type_display()} - "
            f"{self.quantity}"
        )



class StockAdjustment(models.Model):

    class AdjustmentType(models.TextChoices):

        INCREASE = (
            "INCREASE",
            "Increase Stock",
        )

        DECREASE = (
            "DECREASE",
            "Decrease Stock",
        )

        DAMAGED = (
            "DAMAGED",
            "Damaged",
        )

        EXPIRED = (
            "EXPIRED",
            "Expired",
        )


    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_adjustments",
    )


    adjustment_type = models.CharField(
        max_length=20,
        choices=AdjustmentType.choices,
    )


    quantity = models.PositiveIntegerField()


    reason = models.TextField()


    quantity_before = models.PositiveIntegerField(
        default=0,
    )


    quantity_after = models.PositiveIntegerField(
        default=0,
    )


    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_adjustments_created",
    )


    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    class Meta:

        ordering = [
            "-created_at",
        ]


    def __str__(self):

        return (
            f"{self.product.name} - "
            f"{self.get_adjustment_type_display()} - "
            f"{self.quantity}"
        )