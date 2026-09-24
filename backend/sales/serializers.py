from decimal import (
    Decimal,
    ROUND_HALF_UP,
)

from django.db import transaction
from django.db.models import Sum

from rest_framework import serializers

from products.models import Product

from .models import (
    Order,
    OrderItem,
    Payment,
    SalesReturn,
    SalesReturnItem,
)

from .services import (
    cancel_order,
    complete_order,
    deduct_order_stock,
    restore_return_item_stock,
    update_payment_status,
    validate_payment_amount,
)


# ============================================================
# MONEY HELPERS
# ============================================================

MONEY_PLACES = Decimal("0.01")


def money(value):
    """
    Convert value into a Decimal rounded to 2 decimal places.
    """

    if value is None:
        value = Decimal("0.00")

    if not isinstance(value, Decimal):
        value = Decimal(str(value))

    return value.quantize(
        MONEY_PLACES,
        rounding=ROUND_HALF_UP,
    )


# ============================================================
# PAYMENT INPUT SERIALIZER
# Used inside order creation
# ============================================================

class PaymentInputSerializer(
    serializers.Serializer
):

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    method = serializers.ChoiceField(
        choices=Payment._meta.get_field("method").choices,
    )

    reference_number = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )


# ============================================================
# ORDER ITEM INPUT SERIALIZER
# ============================================================

class OrderItemInputSerializer(
    serializers.Serializer
):

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
    )

    quantity = serializers.IntegerField(
        min_value=1,
    )

    discount_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        default=Decimal("0.00"),
        min_value=Decimal("0.00"),
    )


# ============================================================
# ORDER ITEM OUTPUT SERIALIZER
# ============================================================

class OrderItemSerializer(
    serializers.ModelSerializer
):

    product_id = serializers.IntegerField(
        source="product.id",
        read_only=True,
    )

    current_product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    class Meta:

        model = OrderItem

        fields = [
            "id",
            "product",
            "product_id",
            "current_product_name",
            "product_name",
            "product_sku",
            "unit_price",
            "cost_price",
            "quantity",
            "discount_amount",
            "tax_percent",
            "tax_amount",
            "subtotal",
            "profit",
        ]

        read_only_fields = fields


# ============================================================
# PAYMENT SERIALIZER
# ============================================================

class PaymentSerializer(
    serializers.ModelSerializer
):

    method_display = serializers.CharField(
        source="get_method_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    created_by_name = serializers.SerializerMethodField()

    class Meta:

        model = Payment

        fields = [
            "id",
            "order",
            "amount",
            "method",
            "method_display",
            "status",
            "status_display",
            "reference_number",
            "notes",
            "paid_at",
            "created_by",
            "created_by_name",
        ]

        read_only_fields = [
            "id",
            "paid_at",
            "created_by",
            "created_by_name",
            "method_display",
            "status_display",
        ]


    def get_created_by_name(
        self,
        obj,
    ):

        if not obj.created_by:
            return "System"

        full_name = (
            obj.created_by.get_full_name()
            or ""
        ).strip()

        return (
            full_name
            or obj.created_by.username
        )


    def validate(
        self,
        attrs,
    ):

        order = attrs.get(
            "order"
        )

        amount = attrs.get(
            "amount"
        )

        status = attrs.get(
            "status",
            Payment.Status.SUCCESS,
        )


        if not order:
            return attrs


        if order.status in [
            Order.Status.CANCELLED,
            Order.Status.RETURNED,
        ]:

            raise serializers.ValidationError(
                {
                    "order":
                        "Payments cannot be added to a cancelled or returned order."
                }
            )


        if (
            amount is not None
            and status
            == Payment.Status.SUCCESS
        ):

            try:

                validate_payment_amount(
                    order,
                    amount,
                )

            except ValueError as exc:

                raise serializers.ValidationError(
                    {
                        "amount":
                            str(exc)
                    }
                ) from exc


        return attrs


    @transaction.atomic
    def create(
        self,
        validated_data,
    ):

        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request
            and request.user.is_authenticated
            else None
        )


        payment = Payment.objects.create(
            created_by=user,
            **validated_data,
        )


        update_payment_status(
            payment.order
        )


        return payment


    def update(
        self,
        instance,
        validated_data,
    ):

        raise serializers.ValidationError(
            "Payments cannot be edited after creation."
        )


# ============================================================
# SALES RETURN ITEM OUTPUT
# ============================================================

class SalesReturnItemSerializer(
    serializers.ModelSerializer
):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    product_sku = serializers.CharField(
        source="product.sku",
        read_only=True,
    )

    class Meta:

        model = SalesReturnItem

        fields = [
            "id",
            "order_item",
            "product",
            "product_name",
            "product_sku",
            "quantity",
            "refund_amount",
        ]

        read_only_fields = fields


# ============================================================
# SALES RETURN INPUT ITEM
# ============================================================

class SalesReturnItemInputSerializer(
    serializers.Serializer
):

    order_item = serializers.PrimaryKeyRelatedField(
        queryset=OrderItem.objects.select_related(
            "order",
            "product",
        ),
    )

    quantity = serializers.IntegerField(
        min_value=1,
    )


# ============================================================
# SALES RETURN SERIALIZER
# ============================================================

class SalesReturnSerializer(
    serializers.ModelSerializer
):

    items = SalesReturnItemSerializer(
        many=True,
        read_only=True,
    )

    return_items = SalesReturnItemInputSerializer(
        many=True,
        write_only=True,
        required=False,
    )

    created_by_name = serializers.SerializerMethodField()

    class Meta:

        model = SalesReturn

        fields = [
            "id",
            "return_number",
            "order",
            "refund_amount",
            "reason",
            "status",
            "stock_restored",
            "created_by",
            "created_by_name",
            "returned_at",
            "items",
            "return_items",
        ]

        read_only_fields = [
            "id",
            "return_number",
            "refund_amount",
            "status",
            "stock_restored",
            "created_by",
            "created_by_name",
            "returned_at",
            "items",
        ]


    def get_created_by_name(
        self,
        obj,
    ):

        if not obj.created_by:
            return "System"

        return (
            obj.created_by.get_full_name()
            or obj.created_by.username
        )


    def to_internal_value(
        self,
        data,
    ):
        """
        Support frontend payload using `items`
        while keeping `items` read-only for output.
        """

        mutable_data = data.copy()

        if (
            "items" in mutable_data
            and "return_items"
            not in mutable_data
        ):

            mutable_data["return_items"] = (
                mutable_data["items"]
            )

        return super().to_internal_value(
            mutable_data
        )


    def validate(
        self,
        attrs,
    ):

        order = attrs.get(
            "order"
        )

        return_items = attrs.get(
            "return_items",
            [],
        )


        if not order:

            raise serializers.ValidationError(
                {
                    "order":
                        "Order is required."
                }
            )


        if (
            order.status
            != Order.Status.COMPLETED
        ):

            raise serializers.ValidationError(
                {
                    "order":
                        "Returns can only be processed for completed orders."
                }
            )


        if not return_items:

            raise serializers.ValidationError(
                {
                    "items":
                        "At least one return item is required."
                }
            )


        seen_order_items = set()


        for item_data in return_items:

            order_item = item_data[
                "order_item"
            ]

            quantity = item_data[
                "quantity"
            ]


            if (
                order_item.id
                in seen_order_items
            ):

                raise serializers.ValidationError(
                    {
                        "items":
                            f"Duplicate return item for {order_item.product_name}."
                    }
                )


            seen_order_items.add(
                order_item.id
            )


            if (
                order_item.order_id
                != order.id
            ):

                raise serializers.ValidationError(
                    {
                        "items":
                            "One or more return items do not belong to this order."
                    }
                )


            already_returned = (
                SalesReturnItem.objects
                .filter(
                    order_item=order_item
                )
                .aggregate(
                    total=Sum(
                        "quantity"
                    )
                )
                .get(
                    "total"
                )
                or 0
            )


            remaining_quantity = (
                order_item.quantity
                - already_returned
            )


            if (
                quantity
                > remaining_quantity
            ):

                raise serializers.ValidationError(
                    {
                        "items":
                            (
                                f"Only {remaining_quantity} unit(s) of "
                                f"{order_item.product_name} can still be returned."
                            )
                    }
                )


        return attrs


    @transaction.atomic
    def create(
        self,
        validated_data,
    ):

        return_items = validated_data.pop(
            "return_items"
        )

        order = (
            Order.objects
            .select_for_update()
            .get(
                pk=validated_data[
                    "order"
                ].pk
            )
        )


        if (
            order.status
            != Order.Status.COMPLETED
        ):

            raise serializers.ValidationError(
                {
                    "order":
                        "This order can no longer be returned."
                }
            )


        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request
            and request.user.is_authenticated
            else None
        )


        order_items = list(
            order.items.all()
        )


        pre_order_discount_total = sum(
            (
                money(item.subtotal)
                + money(item.tax_amount)
                for item in order_items
            ),
            Decimal("0.00"),
        )


        total_refund = Decimal(
            "0.00"
        )

        calculated_items = []


        for item_data in return_items:

            order_item = (
                OrderItem.objects
                .select_for_update()
                .select_related(
                    "product"
                )
                .get(
                    pk=item_data[
                        "order_item"
                    ].pk
                )
            )

            quantity = int(
                item_data[
                    "quantity"
                ]
            )


            already_returned = (
                SalesReturnItem.objects
                .filter(
                    order_item=order_item
                )
                .aggregate(
                    total=Sum(
                        "quantity"
                    )
                )
                .get(
                    "total"
                )
                or 0
            )


            remaining_quantity = (
                order_item.quantity
                - already_returned
            )


            if (
                quantity
                > remaining_quantity
            ):

                raise serializers.ValidationError(
                    {
                        "items":
                            (
                                f"Only {remaining_quantity} unit(s) of "
                                f"{order_item.product_name} can still be returned."
                            )
                    }
                )


            item_subtotal = money(
                order_item.subtotal
            )

            item_tax = money(
                order_item.tax_amount
            )

            item_total_before_order_discount = money(
                item_subtotal
                + item_tax
            )


            # ------------------------------------------------
            # Allocate order-level discount proportionally.
            #
            # The order grand total includes tax, so the return
            # calculation must also include the item's tax amount.
            # ------------------------------------------------

            if (
                pre_order_discount_total
                > 0
                and money(
                    order.discount_amount
                )
                > 0
            ):

                discount_share = money(
                    money(
                        order.discount_amount
                    )
                    * item_total_before_order_discount
                    / pre_order_discount_total
                )

            else:

                discount_share = Decimal(
                    "0.00"
                )


            refundable_line_total = money(
                item_total_before_order_discount
                - discount_share
            )


            if (
                order_item.quantity
                <= 0
            ):

                raise serializers.ValidationError(
                    "Invalid sold quantity."
                )


            existing_item_refund = (
                SalesReturnItem.objects
                .filter(
                    order_item=order_item
                )
                .aggregate(
                    total=Sum(
                        "refund_amount"
                    )
                )
                .get(
                    "total"
                )
                or Decimal("0.00")
            )

            existing_item_refund = money(
                existing_item_refund
            )


            refundable_per_unit = (
                refundable_line_total
                / Decimal(
                    order_item.quantity
                )
            )


            if (
                quantity
                == remaining_quantity
            ):

                refund_amount = money(
                    refundable_line_total
                    - existing_item_refund
                )

            else:

                refund_amount = money(
                    refundable_per_unit
                    * Decimal(quantity)
                )


            total_refund += (
                refund_amount
            )


            calculated_items.append(
                {
                    "order_item":
                        order_item,

                    "product":
                        order_item.product,

                    "quantity":
                        quantity,

                    "refund_amount":
                        refund_amount,
                }
            )


        total_refund = money(
            total_refund
        )


        existing_refunds = (
            SalesReturn.objects
            .filter(
                order=order
            )
            .aggregate(
                total=Sum(
                    "refund_amount"
                )
            )
            .get(
                "total"
            )
            or Decimal("0.00")
        )


        existing_refunds = money(
            existing_refunds
        )


        maximum_refund = money(
            order.grand_total
        )


        if (
            existing_refunds
            + total_refund
            > maximum_refund
        ):

            raise serializers.ValidationError(
                {
                    "items":
                        "The return amount would exceed the order total."
                }
            )


        sales_return = (
            SalesReturn.objects.create(
                order=order,
                refund_amount=total_refund,
                reason=validated_data.get(
                    "reason",
                    "",
                ),
                created_by=user,
            )
        )


        created_return_items = []


        for item_data in calculated_items:

            return_item = (
                SalesReturnItem.objects.create(
                    sales_return=sales_return,
                    order_item=item_data[
                        "order_item"
                    ],
                    product=item_data[
                        "product"
                    ],
                    quantity=item_data[
                        "quantity"
                    ],
                    refund_amount=item_data[
                        "refund_amount"
                    ],
                )
            )


            created_return_items.append(
                return_item
            )


        # ----------------------------------------------------
        # Restore only returned quantities
        # ----------------------------------------------------

        try:

            for return_item in created_return_items:

                restore_return_item_stock(
                    sales_return=sales_return,
                    sales_return_item=return_item,
                    user=user,
                )

        except ValueError as exc:

            raise serializers.ValidationError(
                {
                    "items":
                        str(exc)
                }
            ) from exc


        sales_return.stock_restored = True

        sales_return.save(
            update_fields=[
                "stock_restored",
            ]
        )


        # ----------------------------------------------------
        # Check whether every sold unit has now been returned
        # ----------------------------------------------------

        fully_returned = True


        for order_item in order_items:

            returned_quantity = (
                SalesReturnItem.objects
                .filter(
                    order_item=order_item
                )
                .aggregate(
                    total=Sum(
                        "quantity"
                    )
                )
                .get(
                    "total"
                )
                or 0
            )


            if (
                returned_quantity
                < order_item.quantity
            ):

                fully_returned = False
                break


        if fully_returned:

            order.status = (
                Order.Status.RETURNED
            )

            order.payment_status = (
                Order.PaymentStatus.REFUNDED
            )

            order.save(
                update_fields=[
                    "status",
                    "payment_status",
                    "updated_at",
                ]
            )


        return sales_return


# ============================================================
# ORDER SERIALIZER
# ============================================================

class OrderSerializer(
    serializers.ModelSerializer
):

    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    order_items = OrderItemInputSerializer(
        many=True,
        write_only=True,
        required=False,
    )

    payment = PaymentInputSerializer(
        write_only=True,
        required=False,
        allow_null=True,
    )

    payments = PaymentSerializer(
        many=True,
        read_only=True,
    )

    returns = SalesReturnSerializer(
        many=True,
        read_only=True,
    )

    customer_name = serializers.SerializerMethodField()

    created_by_name = serializers.SerializerMethodField()

    amount_paid = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    balance_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )


    class Meta:

        model = Order

        fields = [
            "id",
            "invoice_number",
            "customer",
            "customer_name",
            "status",
            "payment_status",
            "subtotal",
            "discount_amount",
            "tax_amount",
            "grand_total",
            "total_profit",
            "amount_paid",
            "balance_amount",
            "notes",
            "stock_deducted",
            "created_by",
            "created_by_name",
            "order_date",
            "created_at",
            "updated_at",
            "items",
            "order_items",
            "payment",
            "payments",
            "returns",
        ]

        read_only_fields = [
            "id",
            "invoice_number",
            "payment_status",
            "subtotal",
            "tax_amount",
            "grand_total",
            "total_profit",
            "stock_deducted",
            "created_by",
            "created_by_name",
            "order_date",
            "created_at",
            "updated_at",
            "items",
            "payments",
            "returns",
        ]


    # ========================================================
    # FRONTEND COMPATIBILITY
    # ========================================================

    def to_internal_value(
        self,
        data,
    ):
        """
        Frontend currently sends:

        {
            "items": [...]
        }

        Output also needs `items`.

        Internally we map write-side items to `order_items`.
        """

        mutable_data = data.copy()


        if (
            "items" in mutable_data
            and "order_items"
            not in mutable_data
        ):

            mutable_data[
                "order_items"
            ] = mutable_data[
                "items"
            ]


        return super().to_internal_value(
            mutable_data
        )


    # ========================================================
    # DISPLAY HELPERS
    # ========================================================

    def get_customer_name(
        self,
        obj,
    ):

        if not obj.customer:
            return "Walk-in Customer"

        return (
            getattr(
                obj.customer,
                "name",
                None,
            )
            or str(
                obj.customer
            )
        )


    def get_created_by_name(
        self,
        obj,
    ):

        if not obj.created_by:
            return "System"

        return (
            obj.created_by.get_full_name()
            or obj.created_by.username
        )


    # ========================================================
    # VALIDATION
    # ========================================================

    def validate(
        self,
        attrs,
    ):

        order_items = attrs.get(
            "order_items"
        )

        payment = attrs.get(
            "payment"
        )

        status = attrs.get(
            "status"
        )


        # ----------------------------------------------------
        # CREATE
        # ----------------------------------------------------

        if self.instance is None:

            if not order_items:

                raise serializers.ValidationError(
                    {
                        "items":
                            "At least one product is required."
                    }
                )


            seen_products = set()


            for item in order_items:

                product = item[
                    "product"
                ]

                quantity = item[
                    "quantity"
                ]

                item_discount = money(
                    item.get(
                        "discount_amount",
                        Decimal("0.00"),
                    )
                )


                if (
                    product.id
                    in seen_products
                ):

                    raise serializers.ValidationError(
                        {
                            "items":
                                f"{product.name} has been added more than once."
                        }
                    )


                seen_products.add(
                    product.id
                )


                if (
                    getattr(
                        product,
                        "status",
                        "ACTIVE",
                    )
                    != "ACTIVE"
                ):

                    raise serializers.ValidationError(
                        {
                            "items":
                                f"{product.name} is inactive."
                        }
                    )


                gross = money(
                    product.selling_price
                    * quantity
                )


                if (
                    item_discount
                    > gross
                ):

                    raise serializers.ValidationError(
                        {
                            "items":
                                (
                                    f"Discount for {product.name} "
                                    f"cannot exceed its line value."
                                )
                        }
                    )


                if (
                    status
                    == Order.Status.COMPLETED
                    and product.stock_quantity
                    < quantity
                ):

                    raise serializers.ValidationError(
                        {
                            "items":
                                (
                                    f"Insufficient stock for {product.name}. "
                                    f"Available: {product.stock_quantity}."
                                )
                        }
                    )


        # ----------------------------------------------------
        # UPDATE
        # ----------------------------------------------------

        else:

            if order_items is not None:

                raise serializers.ValidationError(
                    {
                        "items":
                            "Order items cannot be changed after the order has been created."
                    }
                )


            current_status = (
                self.instance.status
            )

            next_status = (
                status
                or current_status
            )


            if (
                current_status
                == Order.Status.CANCELLED
            ):

                raise serializers.ValidationError(
                    {
                        "status":
                            "Cancelled orders are final and cannot be changed."
                    }
                )


            if (
                current_status
                == Order.Status.RETURNED
            ):

                raise serializers.ValidationError(
                    {
                        "status":
                            "Returned orders are final and cannot be changed."
                    }
                )


            if (
                next_status
                == Order.Status.RETURNED
            ):

                raise serializers.ValidationError(
                    {
                        "status":
                            "An order cannot be marked as returned directly. Use the sales return endpoint."
                    }
                )


            if (
                current_status
                == Order.Status.COMPLETED
                and next_status
                == Order.Status.PENDING
            ):

                raise serializers.ValidationError(
                    {
                        "status":
                            "A completed order cannot be moved back to pending."
                    }
                )


            financial_fields = {
                "customer",
                "discount_amount",
            }


            if (
                current_status
                == Order.Status.COMPLETED
                and any(
                    field in attrs
                    for field
                    in financial_fields
                )
            ):

                raise serializers.ValidationError(
                    "Financial details cannot be changed after completion."
                )


        if payment:

            if (
                status
                in [
                    Order.Status.CANCELLED,
                    Order.Status.RETURNED,
                ]
            ):

                raise serializers.ValidationError(
                    {
                        "payment":
                            "Payment cannot be added to a cancelled or returned sale."
                    }
                )


        return attrs


    # ========================================================
    # CALCULATE ORDER
    # ========================================================

    def calculate_items(
        self,
        order_items,
        order_discount,
    ):

        subtotal = Decimal(
            "0.00"
        )

        tax_total = Decimal(
            "0.00"
        )

        total_profit = Decimal(
            "0.00"
        )

        prepared_items = []


        for item in order_items:

            product = item[
                "product"
            ]

            quantity = int(
                item[
                    "quantity"
                ]
            )

            item_discount = money(
                item.get(
                    "discount_amount",
                    Decimal("0.00"),
                )
            )


            gross = money(
                product.selling_price
                * quantity
            )


            taxable = money(
                gross
                - item_discount
            )


            tax_percent = money(
                product.tax_percent
                or Decimal("0.00")
            )


            tax_amount = money(
                taxable
                * tax_percent
                / Decimal("100")
            )


            line_profit = money(
                taxable
                - (
                    product.cost_price
                    * quantity
                )
            )


            subtotal += taxable
            tax_total += tax_amount
            total_profit += (
                line_profit
            )


            prepared_items.append(
                {
                    "product":
                        product,

                    "product_name":
                        product.name,

                    "product_sku":
                        product.sku,

                    "unit_price":
                        money(
                            product.selling_price
                        ),

                    "cost_price":
                        money(
                            product.cost_price
                        ),

                    "quantity":
                        quantity,

                    "discount_amount":
                        item_discount,

                    "tax_percent":
                        tax_percent,

                    "tax_amount":
                        tax_amount,

                    "subtotal":
                        taxable,

                    "profit":
                        line_profit,
                }
            )


        subtotal = money(
            subtotal
        )

        tax_total = money(
            tax_total
        )

        order_discount = money(
            order_discount
        )


        if (
            order_discount
            > subtotal
        ):

            raise serializers.ValidationError(
                {
                    "discount_amount":
                        "Order discount cannot exceed the subtotal."
                }
            )


        grand_total = money(
            subtotal
            + tax_total
            - order_discount
        )


        total_profit = money(
            total_profit
            - order_discount
        )


        return {
            "subtotal":
                subtotal,

            "tax_amount":
                tax_total,

            "grand_total":
                grand_total,

            "total_profit":
                total_profit,

            "items":
                prepared_items,
        }


    # ========================================================
    # CREATE ORDER
    # ========================================================

    @transaction.atomic
    def create(
        self,
        validated_data,
    ):

        order_items = validated_data.pop(
            "order_items"
        )

        payment_data = validated_data.pop(
            "payment",
            None,
        )


        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request
            and request.user.is_authenticated
            else None
        )


        order_discount = money(
            validated_data.get(
                "discount_amount",
                Decimal("0.00"),
            )
        )


        calculations = (
            self.calculate_items(
                order_items,
                order_discount,
            )
        )


        requested_status = (
            validated_data.get(
                "status",
                Order.Status.PENDING,
            )
        )


        order = Order.objects.create(

            created_by=user,

            subtotal=calculations[
                "subtotal"
            ],

            tax_amount=calculations[
                "tax_amount"
            ],

            grand_total=calculations[
                "grand_total"
            ],

            total_profit=calculations[
                "total_profit"
            ],

            **validated_data,
        )


        for item_data in calculations[
            "items"
        ]:

            OrderItem.objects.create(
                order=order,
                **item_data,
            )


        # ----------------------------------------------------
        # COMPLETED SALE → DEDUCT INVENTORY
        # ----------------------------------------------------

        if (
            requested_status
            == Order.Status.COMPLETED
        ):

            try:

                deduct_order_stock(
                    order,
                    user=user,
                )

            except ValueError as exc:

                raise serializers.ValidationError(
                    {
                        "items":
                            str(exc)
                    }
                ) from exc


        # ----------------------------------------------------
        # OPTIONAL PAYMENT
        # ----------------------------------------------------

        if payment_data:

            try:

                validate_payment_amount(
                    order,
                    payment_data[
                        "amount"
                    ],
                )

            except ValueError as exc:

                raise serializers.ValidationError(
                    {
                        "payment":
                            str(exc)
                    }
                ) from exc


            Payment.objects.create(

                order=order,

                amount=payment_data[
                    "amount"
                ],

                method=payment_data[
                    "method"
                ],

                status=(
                    Payment.Status.SUCCESS
                ),

                reference_number=(
                    payment_data.get(
                        "reference_number",
                        "",
                    )
                ),

                notes=(
                    payment_data.get(
                        "notes",
                        "",
                    )
                ),

                created_by=user,
            )


            update_payment_status(
                order
            )


        order.refresh_from_db()


        return order


    # ========================================================
    # UPDATE ORDER
    # ========================================================

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):

        validated_data.pop(
            "order_items",
            None,
        )

        validated_data.pop(
            "payment",
            None,
        )


        order = (
            Order.objects
            .select_for_update()
            .get(
                pk=instance.pk
            )
        )


        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request
            and request.user.is_authenticated
            else None
        )


        old_status = (
            order.status
        )

        new_status = (
            validated_data.get(
                "status",
                old_status,
            )
        )


        # ----------------------------------------------------
        # NORMAL NON-STATUS FIELDS
        # ----------------------------------------------------

        for field, value in (
            validated_data.items()
        ):

            if field == "status":
                continue

            setattr(
                order,
                field,
                value,
            )


        order.save()


        # ----------------------------------------------------
        # PENDING → COMPLETED
        # ----------------------------------------------------

        if (
            old_status
            == Order.Status.PENDING
            and new_status
            == Order.Status.COMPLETED
        ):

            try:

                complete_order(
                    order,
                    user=user,
                )

            except ValueError as exc:

                raise serializers.ValidationError(
                    {
                        "status":
                            str(exc)
                    }
                ) from exc


        # ----------------------------------------------------
        # PENDING / COMPLETED → CANCELLED
        # ----------------------------------------------------

        elif (
            new_status
            == Order.Status.CANCELLED
            and old_status
            != Order.Status.CANCELLED
        ):

            try:

                cancel_order(
                    order,
                    user=user,
                )

            except ValueError as exc:

                raise serializers.ValidationError(
                    {
                        "status":
                            str(exc)
                    }
                ) from exc


        # ----------------------------------------------------
        # STATUS UNCHANGED
        # ----------------------------------------------------

        elif (
            new_status
            == old_status
        ):

            # Repair completed sale if stock flag somehow
            # remained False.
            if (
                new_status
                == Order.Status.COMPLETED
                and not order.stock_deducted
            ):

                try:

                    deduct_order_stock(
                        order,
                        user=user,
                    )

                except ValueError as exc:

                    raise serializers.ValidationError(
                        {
                            "status":
                                str(exc)
                        }
                    ) from exc


        else:

            order.status = (
                new_status
            )

            order.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )


        order.refresh_from_db()


        return order