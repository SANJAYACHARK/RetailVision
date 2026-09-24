from django.conf import settings
from django.db import models


class Customer(models.Model):

    class CustomerType(models.TextChoices):
        REGULAR = "REGULAR", "Regular"
        WHOLESALE = "WHOLESALE", "Wholesale"
        VIP = "VIP", "VIP"

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    customer_code = models.CharField(
        max_length=30,
        unique=True,
    )

    name = models.CharField(
        max_length=150,
    )

    phone = models.CharField(
        max_length=20,
        unique=True,
    )

    email = models.EmailField(
        blank=True,
    )

    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        blank=True,
    )

    customer_type = models.CharField(
        max_length=20,
        choices=CustomerType.choices,
        default=CustomerType.REGULAR,
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    address = models.TextField(
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    state = models.CharField(
        max_length=100,
        blank=True,
    )

    pincode = models.CharField(
        max_length=10,
        blank=True,
    )

    loyalty_points = models.PositiveIntegerField(
        default=0,
    )

    notes = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_customers",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )


    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["name"],
            ),
            models.Index(
                fields=["phone"],
            ),
            models.Index(
                fields=["customer_type"],
            ),
            models.Index(
                fields=["city"],
            ),
        ]


    def __str__(self):
        return f"{self.name} ({self.customer_code})"