from rest_framework import serializers

from suppliers.serializers import SupplierSerializer

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category

        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ProductSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    supplier_name = serializers.CharField(
        source="supplier.company_name",
        read_only=True,
    )

    profit_per_unit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    is_low_stock = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "sku",
            "barcode",
            "name",
            "category",
            "category_name",
            "supplier",
            "supplier_name",
            "brand",
            "description",
            "cost_price",
            "selling_price",
            "mrp",
            "tax_percent",
            "stock_quantity",
            "reorder_level",
            "minimum_stock",
            "maximum_stock",
            "manufacturing_date",
            "expiry_date",
            "unit",
            "status",
            "profit_per_unit",
            "is_low_stock",
            "created_by",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "profit_per_unit",
            "is_low_stock",
        ]

    def validate(self, attrs):

        cost_price = attrs.get(
            "cost_price",
            getattr(self.instance, "cost_price", None),
        )

        selling_price = attrs.get(
            "selling_price",
            getattr(self.instance, "selling_price", None),
        )

        mrp = attrs.get(
            "mrp",
            getattr(self.instance, "mrp", None),
        )

        minimum_stock = attrs.get(
            "minimum_stock",
            getattr(self.instance, "minimum_stock", 0),
        )

        maximum_stock = attrs.get(
            "maximum_stock",
            getattr(self.instance, "maximum_stock", 0),
        )

        manufacturing_date = attrs.get(
            "manufacturing_date",
            getattr(self.instance, "manufacturing_date", None),
        )

        expiry_date = attrs.get(
            "expiry_date",
            getattr(self.instance, "expiry_date", None),
        )

        if selling_price is not None and cost_price is not None:
            if selling_price < cost_price:
                raise serializers.ValidationError(
                    {
                        "selling_price":
                            "Selling price cannot be lower than cost price."
                    }
                )

        if mrp is not None and selling_price is not None:
            if selling_price > mrp:
                raise serializers.ValidationError(
                    {
                        "selling_price":
                            "Selling price cannot be greater than MRP."
                    }
                )

        if maximum_stock < minimum_stock:
            raise serializers.ValidationError(
                {
                    "maximum_stock":
                        "Maximum stock must be greater than or equal to minimum stock."
                }
            )

        if (
            manufacturing_date
            and expiry_date
            and expiry_date <= manufacturing_date
        ):
            raise serializers.ValidationError(
                {
                    "expiry_date":
                        "Expiry date must be after manufacturing date."
                }
            )

        return attrs