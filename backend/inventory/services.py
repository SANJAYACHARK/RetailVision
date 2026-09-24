from django.db import transaction

from products.models import Product

from .models import (
    InventoryTransaction,
    StockAdjustment,
)


# ============================================================
# GET LOCKED PRODUCT
# ============================================================

def _get_locked_product(product):

    if isinstance(product, Product):

        product_id = product.pk

    else:

        product_id = product


    return (
        Product.objects
        .select_for_update()
        .get(
            pk=product_id
        )
    )


# ============================================================
# GENERIC STOCK IN
# ============================================================

@transaction.atomic
def stock_in(
    *,
    product,
    quantity,
    user=None,
    reference_type=InventoryTransaction.ReferenceType.MANUAL,
    reference_id=None,
    reference_number="",
    remarks="",
    unit_cost=None,
):

    quantity = int(quantity)


    if quantity <= 0:

        raise ValueError(
            "Stock-in quantity must be greater than zero."
        )


    product = _get_locked_product(
        product
    )


    quantity_before = (
        product.stock_quantity
    )


    quantity_after = (
        quantity_before
        + quantity
    )


    product.stock_quantity = (
        quantity_after
    )


    product.save(
        update_fields=[
            "stock_quantity",
            "updated_at",
        ]
    )


    inventory_transaction = (
        InventoryTransaction.objects.create(

            product=product,

            transaction_type=(
                InventoryTransaction
                .TransactionType
                .STOCK_IN
            ),

            reference_type=(
                reference_type
            ),

            reference_id=(
                reference_id
            ),

            reference_number=(
                reference_number
                or ""
            ),

            quantity=quantity,

            quantity_before=(
                quantity_before
            ),

            quantity_after=(
                quantity_after
            ),

            unit_cost=(
                unit_cost
                if unit_cost is not None
                else product.cost_price
            ),

            remarks=(
                remarks
                or ""
            ),

            created_by=user,
        )
    )


    return inventory_transaction


# ============================================================
# GENERIC STOCK OUT
# ============================================================

@transaction.atomic
def stock_out(
    *,
    product,
    quantity,
    transaction_type,
    user=None,
    reference_type=InventoryTransaction.ReferenceType.MANUAL,
    reference_id=None,
    reference_number="",
    remarks="",
):

    quantity = int(quantity)


    if quantity <= 0:

        raise ValueError(
            "Stock-out quantity must be greater than zero."
        )


    product = _get_locked_product(
        product
    )


    quantity_before = (
        product.stock_quantity
    )


    if quantity_before < quantity:

        raise ValueError(
            (
                f"Insufficient stock for "
                f"{product.name}. "
                f"Available: {quantity_before}, "
                f"requested: {quantity}."
            )
        )


    quantity_after = (
        quantity_before
        - quantity
    )


    product.stock_quantity = (
        quantity_after
    )


    product.save(
        update_fields=[
            "stock_quantity",
            "updated_at",
        ]
    )


    inventory_transaction = (
        InventoryTransaction.objects.create(

            product=product,

            transaction_type=(
                transaction_type
            ),

            reference_type=(
                reference_type
            ),

            reference_id=(
                reference_id
            ),

            reference_number=(
                reference_number
                or ""
            ),

            quantity=quantity,

            quantity_before=(
                quantity_before
            ),

            quantity_after=(
                quantity_after
            ),

            unit_cost=(
                product.cost_price
            ),

            remarks=(
                remarks
                or ""
            ),

            created_by=user,
        )
    )


    return inventory_transaction


# ============================================================
# SALE STOCK DEDUCTION
# ============================================================

@transaction.atomic
def record_sale_stock(
    *,
    product,
    quantity,
    order,
    user=None,
):

    return stock_out(

        product=product,

        quantity=quantity,

        transaction_type=(
            InventoryTransaction
            .TransactionType
            .SALE
        ),

        user=user,

        reference_type=(
            InventoryTransaction
            .ReferenceType
            .ORDER
        ),

        reference_id=(
            order.id
        ),

        reference_number=(
            order.invoice_number
        ),

        remarks=(
            f"Stock deducted for invoice "
            f"{order.invoice_number}"
        ),
    )


# ============================================================
# CANCELLED SALE STOCK RESTORE
# ============================================================

@transaction.atomic
def restore_cancelled_sale_stock(
    *,
    product,
    quantity,
    order,
    user=None,
):

    quantity = int(quantity)


    if quantity <= 0:

        raise ValueError(
            "Quantity must be greater than zero."
        )


    product = _get_locked_product(
        product
    )


    quantity_before = (
        product.stock_quantity
    )


    quantity_after = (
        quantity_before
        + quantity
    )


    product.stock_quantity = (
        quantity_after
    )


    product.save(
        update_fields=[
            "stock_quantity",
            "updated_at",
        ]
    )


    inventory_transaction = (
        InventoryTransaction.objects.create(

            product=product,

            transaction_type=(
                InventoryTransaction
                .TransactionType
                .CANCELLED_SALE
            ),

            reference_type=(
                InventoryTransaction
                .ReferenceType
                .ORDER
            ),

            reference_id=(
                order.id
            ),

            reference_number=(
                order.invoice_number
            ),

            quantity=quantity,

            quantity_before=(
                quantity_before
            ),

            quantity_after=(
                quantity_after
            ),

            unit_cost=(
                product.cost_price
            ),

            remarks=(
                f"Stock restored after cancelling "
                f"invoice {order.invoice_number}"
            ),

            created_by=user,
        )
    )


    return inventory_transaction


# ============================================================
# SALES RETURN STOCK RESTORE
# ============================================================

@transaction.atomic
def restore_sales_return_stock(
    *,
    product,
    quantity,
    sales_return,
    user=None,
):

    quantity = int(quantity)


    if quantity <= 0:

        raise ValueError(
            "Return quantity must be greater than zero."
        )


    product = _get_locked_product(
        product
    )


    quantity_before = (
        product.stock_quantity
    )


    quantity_after = (
        quantity_before
        + quantity
    )


    product.stock_quantity = (
        quantity_after
    )


    product.save(
        update_fields=[
            "stock_quantity",
            "updated_at",
        ]
    )


    inventory_transaction = (
        InventoryTransaction.objects.create(

            product=product,

            transaction_type=(
                InventoryTransaction
                .TransactionType
                .SALES_RETURN
            ),

            reference_type=(
                InventoryTransaction
                .ReferenceType
                .SALES_RETURN
            ),

            reference_id=(
                sales_return.id
            ),

            reference_number=(
                sales_return.return_number
            ),

            quantity=quantity,

            quantity_before=(
                quantity_before
            ),

            quantity_after=(
                quantity_after
            ),

            unit_cost=(
                product.cost_price
            ),

            remarks=(
                f"Stock restored from sales return "
                f"{sales_return.return_number}"
            ),

            created_by=user,
        )
    )


    return inventory_transaction


# ============================================================
# MANUAL STOCK ADJUSTMENT
# ============================================================

@transaction.atomic
def perform_stock_adjustment(
    *,
    product,
    adjustment_type,
    quantity,
    reason,
    user=None,
):

    quantity = int(quantity)


    if quantity <= 0:

        raise ValueError(
            "Adjustment quantity must be greater than zero."
        )


    reason = (
        reason
        or ""
    ).strip()


    if not reason:

        raise ValueError(
            "Adjustment reason is required."
        )


    product = _get_locked_product(
        product
    )


    quantity_before = (
        product.stock_quantity
    )


    # ========================================================
    # INCREASE
    # ========================================================

    if (
        adjustment_type
        == StockAdjustment
        .AdjustmentType
        .INCREASE
    ):

        transaction_type = (
            InventoryTransaction
            .TransactionType
            .ADJUSTMENT_IN
        )

        quantity_after = (
            quantity_before
            + quantity
        )


    # ========================================================
    # DECREASE
    # ========================================================

    elif (
        adjustment_type
        == StockAdjustment
        .AdjustmentType
        .DECREASE
    ):

        transaction_type = (
            InventoryTransaction
            .TransactionType
            .ADJUSTMENT_OUT
        )


        if quantity_before < quantity:

            raise ValueError(
                (
                    "Insufficient stock. "
                    f"Available stock is "
                    f"{quantity_before}."
                )
            )


        quantity_after = (
            quantity_before
            - quantity
        )


    # ========================================================
    # DAMAGED
    # ========================================================

    elif (
        adjustment_type
        == StockAdjustment
        .AdjustmentType
        .DAMAGED
    ):

        transaction_type = (
            InventoryTransaction
            .TransactionType
            .DAMAGED
        )


        if quantity_before < quantity:

            raise ValueError(
                (
                    "Insufficient stock. "
                    f"Available stock is "
                    f"{quantity_before}."
                )
            )


        quantity_after = (
            quantity_before
            - quantity
        )


    # ========================================================
    # EXPIRED
    # ========================================================

    elif (
        adjustment_type
        == StockAdjustment
        .AdjustmentType
        .EXPIRED
    ):

        transaction_type = (
            InventoryTransaction
            .TransactionType
            .EXPIRED
        )


        if quantity_before < quantity:

            raise ValueError(
                (
                    "Insufficient stock. "
                    f"Available stock is "
                    f"{quantity_before}."
                )
            )


        quantity_after = (
            quantity_before
            - quantity
        )


    else:

        raise ValueError(
            "Invalid stock adjustment type."
        )


    # ========================================================
    # UPDATE PRODUCT
    # ========================================================

    product.stock_quantity = (
        quantity_after
    )


    product.save(
        update_fields=[
            "stock_quantity",
            "updated_at",
        ]
    )


    # ========================================================
    # CREATE ADJUSTMENT
    # ========================================================

    adjustment = (
        StockAdjustment.objects.create(

            product=product,

            adjustment_type=(
                adjustment_type
            ),

            quantity=quantity,

            reason=reason,

            quantity_before=(
                quantity_before
            ),

            quantity_after=(
                quantity_after
            ),

            created_by=user,
        )
    )


    # ========================================================
    # CREATE INVENTORY AUDIT TRANSACTION
    # ========================================================

    InventoryTransaction.objects.create(

        product=product,

        transaction_type=(
            transaction_type
        ),

        reference_type=(
            InventoryTransaction
            .ReferenceType
            .MANUAL
        ),

        reference_id=(
            adjustment.id
        ),

        reference_number=(
            f"ADJ-{adjustment.id}"
        ),

        quantity=quantity,

        quantity_before=(
            quantity_before
        ),

        quantity_after=(
            quantity_after
        ),

        unit_cost=(
            product.cost_price
        ),

        remarks=reason,

        created_by=user,
    )


    return adjustment