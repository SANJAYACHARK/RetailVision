from django.utils import timezone

from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):

    customer_type_display = serializers.CharField(
        source="get_customer_type_display",
        read_only=True,
    )

    gender_display = serializers.CharField(
        source="get_gender_display",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )


    class Meta:
        model = Customer

        fields = [
            "id",
            "customer_code",
            "name",
            "phone",
            "email",
            "gender",
            "gender_display",
            "customer_type",
            "customer_type_display",
            "date_of_birth",
            "address",
            "city",
            "state",
            "pincode",
            "loyalty_points",
            "notes",
            "is_active",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "loyalty_points",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]


    def validate_customer_code(
        self,
        value,
    ):

        return value.strip().upper()


    def validate_phone(
        self,
        value,
    ):

        value = value.strip()

        if len(value) < 10:
            raise serializers.ValidationError(
                "Enter a valid phone number."
            )

        return value


    def validate_date_of_birth(
        self,
        value,
    ):

        if (
            value
            and
            value > timezone.localdate()
        ):
            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )

        return value