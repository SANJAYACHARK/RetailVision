from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        STORE_MANAGER = "STORE_MANAGER", "Store Manager"
        SALES_EXECUTIVE = "SALES_EXECUTIVE", "Sales Executive"

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.SALES_EXECUTIVE,
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
    )

    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"