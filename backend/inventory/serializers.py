from rest_framework import serializers

from products.models import Product

from .models import (
    InventoryTransaction,
    StockAdjustment,
)

from .services import (
    perform_stock_adjustment,
    stock_in,
)


# ============================================================
# INVENTORY TRANSACTION
# ============================================================

class InventoryTransactionSerializer(
    serializers.ModelSerializer
):

    product_name = (
        serializers.CharField(
            source="product.name",
            read_only=True,
        )
    )

    product_sku = (
        serializers.CharField(
            source="product.sku",
            read_only=True,
        )
    )

    transaction_type_display = (
        serializers.CharField(
            source="get_transaction_type_display",
            read_only=True,
        )
    )

    reference_type_display = (
        serializers.CharField(
            source="get_reference_type_display",
            read_only=True,
        )
    )

    created_by_name = (
        serializers.SerializerMethodField()
    )


    class Meta:

        model = (
            InventoryTransaction
        )

        fields = [

            "id",

            "product",
            "product_name",
            "product_sku",

            "transaction_type",
            "transaction_type_display",

            "reference_type",
            "reference_type_display",

            "reference_id",
            "reference_number",

            "quantity",

            "quantity_before",
            "quantity_after",

            "unit_cost",

            "remarks",

            "created_by",
            "created_by_name",

            "created_at",
        ]

        read_only_fields = fields


    def get_created_by_name(
        self,
        obj,
    ):

        user = obj.created_by

        if not user:

            return None


        full_name = (
            user.get_full_name()
            if hasattr(
                user,
                "get_full_name",
            )
            else ""
        )


        return (
            full_name
            or user.username
        )


# ============================================================
# STOCK ADJUSTMENT READ
# ============================================================

class StockAdjustmentSerializer(
    serializers.ModelSerializer
):

    product_name = (
        serializers.CharField(
            source="product.name",
            read_only=True,
        )
    )

    product_sku = (
        serializers.CharField(
            source="product.sku",
            read_only=True,
        )
    )

    adjustment_type_display = (
        serializers.CharField(
            source="get_adjustment_type_display",
            read_only=True,
        )
    )

    created_by_name = (
        serializers.SerializerMethodField()
    )


    class Meta:

        model = (
            StockAdjustment
        )

        fields = [

            "id",

            "product",
            "product_name",
            "product_sku",

            "adjustment_type",
            "adjustment_type_display",

            "quantity",

            "reason",

            "quantity_before",
            "quantity_after",

            "created_by",
            "created_by_name",

            "created_at",
        ]

        read_only_fields = [
            "id",

            "product_name",
            "product_sku",

            "adjustment_type_display",

            "quantity_before",
            "quantity_after",

            "created_by",
            "created_by_name",

            "created_at",
        ]


    def get_created_by_name(
        self,
        obj,
    ):

        if not obj.created_by:

            return None


        full_name = (
            obj.created_by
            .get_full_name()
        )


        return (
            full_name
            or obj.created_by.username
        )


# ============================================================
# CREATE STOCK ADJUSTMENT
# ============================================================

class StockAdjustmentCreateSerializer(
    serializers.Serializer
):

    product = (
        serializers.PrimaryKeyRelatedField(
            queryset=(
                Product.objects.all()
            )
        )
    )

    adjustment_type = (
        serializers.ChoiceField(
            choices=(
                StockAdjustment
                .AdjustmentType
                .choices
            )
        )
    )

    quantity = (
        serializers.IntegerField(
            min_value=1,
        )
    )

    reason = (
        serializers.CharField(
            required=True,
            allow_blank=False,
        )
    )


    def validate_product(
        self,
        product,
    ):

        if (
            getattr(
                product,
                "status",
                "ACTIVE",
            )
            != "ACTIVE"
        ):

            raise serializers.ValidationError(
                "Inactive products cannot be adjusted."
            )


        return product


    def validate_reason(
        self,
        value,
    ):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Adjustment reason is required."
            )


        return value


    def create(
        self,
        validated_data,
    ):

        request = (
            self.context.get(
                "request"
            )
        )


        try:

            adjustment = (
                perform_stock_adjustment(

                    product=(
                        validated_data[
                            "product"
                        ]
                    ),

                    adjustment_type=(
                        validated_data[
                            "adjustment_type"
                        ]
                    ),

                    quantity=(
                        validated_data[
                            "quantity"
                        ]
                    ),

                    reason=(
                        validated_data[
                            "reason"
                        ]
                    ),

                    user=(
                        request.user
                        if request
                        else None
                    ),
                )
            )

        except ValueError as exc:

            raise serializers.ValidationError(
                {
                    "detail":
                    str(exc)
                }
            )


        return adjustment


# ============================================================
# STOCK IN
# ============================================================

class StockInSerializer(
    serializers.Serializer
):

    product = (
        serializers.PrimaryKeyRelatedField(
            queryset=(
                Product.objects.all()
            )
        )
    )

    quantity = (
        serializers.IntegerField(
            min_value=1,
        )
    )

    unit_cost = (
        serializers.DecimalField(
            max_digits=12,
            decimal_places=2,
            required=False,
            allow_null=True,
            min_value=0,
        )
    )

    reference_number = (
        serializers.CharField(
            required=False,
            allow_blank=True,
            max_length=100,
        )
    )

    remarks = (
        serializers.CharField(
            required=False,
            allow_blank=True,
        )
    )


    def validate_product(
        self,
        product,
    ):

        if (
            getattr(
                product,
                "status",
                "ACTIVE",
            )
            != "ACTIVE"
        ):

            raise serializers.ValidationError(
                "Stock cannot be added to an inactive product."
            )


        return product


    def create(
        self,
        validated_data,
    ):

        request = (
            self.context.get(
                "request"
            )
        )


        try:

            inventory_transaction = (
                stock_in(

                    product=(
                        validated_data[
                            "product"
                        ]
                    ),

                    quantity=(
                        validated_data[
                            "quantity"
                        ]
                    ),

                    user=(
                        request.user
                        if request
                        else None
                    ),

                    reference_type=(
                        InventoryTransaction
                        .ReferenceType
                        .MANUAL
                    ),

                    reference_number=(
                        validated_data.get(
                            "reference_number",
                            "",
                        )
                    ),

                    remarks=(
                        validated_data.get(
                            "remarks",
                            "",
                        )
                    ),

                    unit_cost=(
                        validated_data.get(
                            "unit_cost"
                        )
                    ),
                )
            )

        except ValueError as exc:

            raise serializers.ValidationError(
                {
                    "detail":
                    str(exc)
                }
            )


        return inventory_transaction