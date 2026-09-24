from decimal import Decimal

from django.db import models, transaction

from inventory.models import InventoryTransaction
from inventory.services import (
    record_sale_stock,
    restore_cancelled_sale_stock,
    restore_sales_return_stock,
)

from products.models import Product

from .models import (
    Order,
    Payment,
)


# ============================================================
# INVENTORY TRANSACTION HELPER
# ============================================================

def inventory_transaction_exists(
    *,
    product,
    transaction_type,
    reference_type,
    reference_id,
):
    """
    Check whether an inventory movement has already
    been recorded for the same product and reference.

    This provides an additional safeguard against
    duplicate stock movements.
    """

    return (
        InventoryTransaction.objects
        .filter(
            product=product,
            transaction_type=transaction_type,
            reference_type=reference_type,
            reference_id=reference_id,
        )
        .exists()
    )


# ============================================================
# DEDUCT ORDER STOCK
# ============================================================

@transaction.atomic
def deduct_order_stock(
    order,
    user=None,
):
    """
    Deduct stock when an order becomes COMPLETED.

    Stock movement is delegated to inventory.services
    so every stock change also creates an
    InventoryTransaction.

    Duplicate deduction is prevented by:
    1. order.stock_deducted
    2. InventoryTransaction lookup
    """

    order = (
        Order.objects
        .select_for_update()
        .get(
            pk=order.pk
        )
    )


    if order.stock_deducted:
        return order


    if (
        order.status !=
        Order.Status.COMPLETED
    ):
        raise ValueError(
            "Stock can only be deducted for a completed order."
        )


    order_items = list(
        order.items
        .select_related(
            "product"
        )
        .all()
    )


    if not order_items:
        raise ValueError(
            "Cannot complete an order without items."
        )


    # --------------------------------------------------------
    # Lock and validate all products first.
    # Nothing should be deducted until every item passes.
    # --------------------------------------------------------

    locked_products = {}


    for item in order_items:

        product = (
            Product.objects
            .select_for_update()
            .get(
                pk=item.product_id
            )
        )


        locked_products[
            item.product_id
        ] = product


        if (
            product.status !=
            Product.Status.ACTIVE
        ):
            raise ValueError(
                (
                    f"{product.name} is inactive "
                    "and cannot be sold."
                )
            )


        if (
            product.stock_quantity <
            item.quantity
        ):
            raise ValueError(
                (
                    f"Insufficient stock for "
                    f"{product.name}. "
                    f"Available stock: "
                    f"{product.stock_quantity}, "
                    f"required: "
                    f"{item.quantity}."
                )
            )


    # --------------------------------------------------------
    # Create SALE inventory movements.
    # inventory.services handles the actual quantity change.
    # --------------------------------------------------------

    for item in order_items:

        product = locked_products[
            item.product_id
        ]


        already_recorded = (
            inventory_transaction_exists(
                product=product,
                transaction_type=(
                    InventoryTransaction
                    .TransactionType
                    .SALE
                ),
                reference_type=(
                    InventoryTransaction
                    .ReferenceType
                    .ORDER
                ),
                reference_id=order.id,
            )
        )


        if already_recorded:
            continue


        record_sale_stock(
            product=product,
            quantity=item.quantity,
            order=order,
            user=user,
        )


    # --------------------------------------------------------
    # Mark order stock as deducted only after every
    # inventory movement succeeds.
    # --------------------------------------------------------

    order.stock_deducted = True

    order.save(
        update_fields=[
            "stock_deducted",
        ]
    )


    return order


# ============================================================
# RESTORE CANCELLED ORDER STOCK
# ============================================================

@transaction.atomic
def restore_order_stock(
    order,
    user=None,
):
    """
    Restore the entire stock of a completed sale when
    that sale is cancelled.

    This is for FULL ORDER CANCELLATION only.

    Product returns are handled separately through
    restore_return_item_stock().
    """

    order = (
        Order.objects
        .select_for_update()
        .get(
            pk=order.pk
        )
    )


    if not order.stock_deducted:
        return order


    order_items = list(
        order.items
        .select_related(
            "product"
        )
        .all()
    )


    if not order_items:
        raise ValueError(
            "Cannot restore stock because the order has no items."
        )


    for item in order_items:

        product = (
            Product.objects
            .select_for_update()
            .get(
                pk=item.product_id
            )
        )


        already_recorded = (
            inventory_transaction_exists(
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
                reference_id=order.id,
            )
        )


        if already_recorded:
            continue


        restore_cancelled_sale_stock(
            product=product,
            quantity=item.quantity,
            order=order,
            user=user,
        )


    order.stock_deducted = False

    order.save(
        update_fields=[
            "stock_deducted",
        ]
    )


    return order


# ============================================================
# RESTORE SALES RETURN ITEM
# ============================================================

@transaction.atomic
def restore_return_item_stock(
    *,
    sales_return,
    sales_return_item,
    user=None,
):
    """
    Restore stock for one SalesReturnItem.

    Used for partial or full product returns.

    This DOES NOT restore the complete order.
    Only the returned quantity is added back.
    """

    if not sales_return_item:
        raise ValueError(
            "Sales return item is required."
        )


    if (
        sales_return_item.quantity <= 0
    ):
        raise ValueError(
            "Return quantity must be greater than zero."
        )


    product = (
        Product.objects
        .select_for_update()
        .get(
            pk=sales_return_item.product_id
        )
    )


    already_recorded = (
        inventory_transaction_exists(
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
            reference_id=sales_return.id,
        )
    )


    if already_recorded:
        return product


    restore_sales_return_stock(
        product=product,
        quantity=sales_return_item.quantity,
        sales_return=sales_return,
        user=user,
    )


    return product


# ============================================================
# COMPLETE ORDER
# ============================================================

@transaction.atomic
def complete_order(
    order,
    user=None,
):
    """
    Safely move a PENDING order to COMPLETED
    and deduct its inventory.

    A COMPLETED order whose stock was not deducted
    can also be repaired by this function.
    """

    order = (
        Order.objects
        .select_for_update()
        .get(
            pk=order.pk
        )
    )


    if (
        order.status ==
        Order.Status.CANCELLED
    ):
        raise ValueError(
            "A cancelled order cannot be completed."
        )


    if (
        order.status ==
        Order.Status.RETURNED
    ):
        raise ValueError(
            "A returned order cannot be completed."
        )


    if (
        order.status ==
        Order.Status.PENDING
    ):

        order.status = (
            Order.Status.COMPLETED
        )

        order.save(
            update_fields=[
                "status",
            ]
        )


    if (
        order.status ==
        Order.Status.COMPLETED
        and not order.stock_deducted
    ):

        deduct_order_stock(
            order,
            user=user,
        )


    order.refresh_from_db()

    return order


# ============================================================
# CANCEL ORDER
# ============================================================

@transaction.atomic
def cancel_order(
    order,
    user=None,
):
    """
    Cancel an order safely.

    PENDING:
        No stock has moved.
        Simply change status to CANCELLED.

    COMPLETED:
        Restore stock first, then mark CANCELLED.

    RETURNED:
        Cannot be cancelled.
    """

    order = (
        Order.objects
        .select_for_update()
        .get(
            pk=order.pk
        )
    )


    if (
        order.status ==
        Order.Status.RETURNED
    ):
        raise ValueError(
            "A returned order cannot be cancelled."
        )


    if (
        order.status ==
        Order.Status.CANCELLED
    ):
        return order


    # --------------------------------------------------------
    # Completed sale: restore stock first.
    # --------------------------------------------------------

    if (
        order.status ==
        Order.Status.COMPLETED
    ):

        if order.stock_deducted:

            restore_order_stock(
                order,
                user=user,
            )


    # --------------------------------------------------------
    # Pending sale has no stock movement.
    # --------------------------------------------------------

    order.status = (
        Order.Status.CANCELLED
    )

    order.save(
        update_fields=[
            "status",
        ]
    )


    order.refresh_from_db()

    return order


# ============================================================
# SUCCESSFUL PAYMENT TOTAL
# ============================================================

def get_successful_payment_total(
    order,
):
    """
    Return the total successful payment amount
    recorded against an order.
    """

    result = (
        order.payments
        .filter(
            status=(
                Payment.Status.SUCCESS
            )
        )
        .aggregate(
            total=models.Sum(
                "amount"
            )
        )
    )


    return (
        result["total"]
        or Decimal("0.00")
    )


# ============================================================
# REFUNDED PAYMENT TOTAL
# ============================================================

def get_refunded_payment_total(
    order,
):
    """
    Return the total amount of payment records
    marked as REFUNDED.
    """

    result = (
        order.payments
        .filter(
            status=(
                Payment.Status.REFUNDED
            )
        )
        .aggregate(
            total=models.Sum(
                "amount"
            )
        )
    )


    return (
        result["total"]
        or Decimal("0.00")
    )


# ============================================================
# UPDATE PAYMENT STATUS
# ============================================================

def update_payment_status(
    order,
):
    """
    Automatically update order.payment_status.

    UNPAID:
        No successful payment.

    PARTIAL:
        Some payment exists but total paid is below
        the invoice grand total.

    PAID:
        Successful payments equal or exceed the
        invoice grand total.

    REFUNDED:
        Complete order has been returned.
    """

    if (
        order.status ==
        Order.Status.RETURNED
    ):

        if (
            order.payment_status !=
            Order.PaymentStatus.REFUNDED
        ):

            order.payment_status = (
                Order.PaymentStatus.REFUNDED
            )

            order.save(
                update_fields=[
                    "payment_status",
                ]
            )


        return (
            Order.PaymentStatus.REFUNDED
        )


    amount_paid = (
        get_successful_payment_total(
            order
        )
    )


    if (
        amount_paid <=
        Decimal("0.00")
    ):

        new_status = (
            Order.PaymentStatus.UNPAID
        )


    elif (
        amount_paid <
        order.grand_total
    ):

        new_status = (
            Order.PaymentStatus.PARTIAL
        )


    else:

        new_status = (
            Order.PaymentStatus.PAID
        )


    if (
        order.payment_status !=
        new_status
    ):

        order.payment_status = (
            new_status
        )

        order.save(
            update_fields=[
                "payment_status",
            ]
        )


    return new_status


# ============================================================
# CALCULATE ORDER BALANCE
# ============================================================

def calculate_order_balance(
    order,
):
    """
    Return the remaining unpaid amount.
    """

    amount_paid = (
        get_successful_payment_total(
            order
        )
    )


    balance = (
        order.grand_total -
        amount_paid
    )


    if (
        balance <
        Decimal("0.00")
    ):
        return Decimal(
            "0.00"
        )


    return balance


# ============================================================
# VALIDATE PAYMENT AMOUNT
# ============================================================

def validate_payment_amount(
    order,
    amount,
):
    """
    Validate a new payment.

    Prevents:
    - Zero or negative payments
    - Payments to cancelled sales
    - Payments to returned sales
    - Payments after full payment
    - Overpayment
    """

    amount = Decimal(
        str(amount)
    )


    if (
        amount <=
        Decimal("0.00")
    ):

        raise ValueError(
            "Payment amount must be greater than zero."
        )


    if (
        order.status ==
        Order.Status.CANCELLED
    ):

        raise ValueError(
            "Payment cannot be added to a cancelled order."
        )


    if (
        order.status ==
        Order.Status.RETURNED
    ):

        raise ValueError(
            "Payment cannot be added to a returned order."
        )


    balance = (
        calculate_order_balance(
            order
        )
    )


    if (
        balance <=
        Decimal("0.00")
    ):

        raise ValueError(
            "This order is already fully paid."
        )


    if amount > balance:

        raise ValueError(
            (
                "Payment amount cannot exceed "
                "the remaining balance of "
                f"₹{balance:.2f}."
            )
        )


    return amount