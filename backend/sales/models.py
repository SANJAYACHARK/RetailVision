from decimal import Decimal
import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone

from customers.models import Customer
from products.models import Product


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        RETURNED = "RETURNED", "Returned"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PARTIAL = "PARTIAL", "Partial"
        PAID = "PAID", "Paid"
        REFUNDED = "REFUNDED", "Refunded"

    invoice_number = models.CharField(
        max_length=40,
        unique=True,
        editable=False,
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    discount_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tax_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    grand_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    total_profit = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    notes = models.TextField(
        blank=True,
    )

    stock_deducted = models.BooleanField(
        default=False,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_orders",
    )

    order_date = models.DateTimeField(
        default=timezone.now,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-order_date"]

        indexes = [
            models.Index(
                fields=["invoice_number"]
            ),
            models.Index(
                fields=["status"]
            ),
            models.Index(
                fields=["payment_status"]
            ),
            models.Index(
                fields=["order_date"]
            ),
        ]

    def __str__(self):
        return self.invoice_number

    def save(self, *args, **kwargs):

        if not self.invoice_number:

            while True:

                date_part = (
                    timezone.now()
                    .strftime("%Y%m%d")
                )

                random_part = (
                    secrets.token_hex(3)
                    .upper()
                )

                invoice_number = (
                    f"RV-{date_part}-"
                    f"{random_part}"
                )

                exists = (
                    Order.objects.filter(
                        invoice_number=(
                            invoice_number
                        )
                    ).exists()
                )

                if not exists:
                    self.invoice_number = (
                        invoice_number
                    )
                    break

        super().save(
            *args,
            **kwargs
        )

    @property
    def amount_paid(self):

        total = (
            self.payments.filter(
                status=Payment.Status.SUCCESS
            ).aggregate(
                total=models.Sum("amount")
            )["total"]
        )

        return (
            total
            or Decimal("0.00")
        )

    @property
    def balance_amount(self):

        balance = (
            self.grand_total
            - self.amount_paid
        )

        if balance < 0:
            return Decimal("0.00")

        return balance


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
    )

    product_name = models.CharField(
        max_length=150,
    )

    product_sku = models.CharField(
        max_length=50,
    )

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    cost_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    quantity = models.PositiveIntegerField()

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tax_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    profit = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):

        return (
            f"{self.product_name} "
            f"x {self.quantity}"
        )


class Payment(models.Model):

    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        UPI = "UPI", "UPI"
        CARD = "CARD", "Card"
        NET_BANKING = (
            "NET_BANKING",
            "Net Banking",
        )

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        PENDING = "PENDING", "Pending"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    method = models.CharField(
        max_length=20,
        choices=Method.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUCCESS,
    )

    reference_number = models.CharField(
        max_length=100,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    paid_at = models.DateTimeField(
        default=timezone.now,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_payments",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-paid_at"]

        indexes = [
            models.Index(
                fields=["status"]
            ),
            models.Index(
                fields=["method"]
            ),
            models.Index(
                fields=["paid_at"]
            ),
        ]

    def __str__(self):

        return (
            f"{self.order.invoice_number} "
            f"- ₹{self.amount}"
        )


class SalesReturn(models.Model):

    class Status(models.TextChoices):
        COMPLETED = (
            "COMPLETED",
            "Completed",
        )

    return_number = models.CharField(
        max_length=40,
        unique=True,
        editable=False,
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="returns",
    )

    refund_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    reason = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
    )

    stock_restored = models.BooleanField(
        default=False,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_sales_returns",
    )

    returned_at = models.DateTimeField(
        default=timezone.now,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-returned_at"]

        indexes = [
            models.Index(
                fields=["return_number"]
            ),
            models.Index(
                fields=["returned_at"]
            ),
        ]

    def __str__(self):
        return self.return_number

    def save(self, *args, **kwargs):

        if not self.return_number:

            while True:

                date_part = (
                    timezone.now()
                    .strftime("%Y%m%d")
                )

                random_part = (
                    secrets.token_hex(3)
                    .upper()
                )

                return_number = (
                    f"RET-{date_part}-"
                    f"{random_part}"
                )

                exists = (
                    SalesReturn.objects.filter(
                        return_number=(
                            return_number
                        )
                    ).exists()
                )

                if not exists:
                    self.return_number = (
                        return_number
                    )
                    break

        super().save(
            *args,
            **kwargs
        )


class SalesReturnItem(models.Model):

    sales_return = models.ForeignKey(
        SalesReturn,
        on_delete=models.CASCADE,
        related_name="items",
    )

    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.PROTECT,
        related_name="return_items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="sales_return_items",
    )

    quantity = models.PositiveIntegerField()

    refund_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):

        return (
            f"{self.product.name} "
            f"- {self.quantity}"
        )