from decimal import Decimal

from django.db.models import (
    F,
    Sum,
)
from django.db.models.functions import Coalesce

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from customers.models import Customer
from products.models import Product
from sales.models import Order, OrderItem
from suppliers.models import Supplier

from .export_utils import (
    generate_excel_response,
    generate_pdf_response,
    timestamp_string,
)


# ============================================================
# HELPERS
# ============================================================

def money(value):
    if value is None:
        return "0.00"

    return f"{Decimal(str(value)):.2f}"


def apply_date_filter(
    queryset,
    request,
    field_name,
):

    start_date = (
        request.query_params.get(
            "start_date"
        )
    )

    end_date = (
        request.query_params.get(
            "end_date"
        )
    )

    if start_date:
        queryset = queryset.filter(
            **{
                f"{field_name}__date__gte":
                    start_date
            }
        )

    if end_date:
        queryset = queryset.filter(
            **{
                f"{field_name}__date__lte":
                    end_date
            }
        )

    return queryset


# ============================================================
# SALES DATA
# ============================================================

def get_sales_data(request):

    orders = (
        Order.objects
        .select_related(
            "customer",
            "created_by",
        )
        .all()
    )

    orders = apply_date_filter(
        orders,
        request,
        "order_date",
    )

    status = (
        request.query_params.get(
            "status"
        )
    )

    payment_status = (
        request.query_params.get(
            "payment_status"
        )
    )

    if status:
        orders = orders.filter(
            status=status
        )

    if payment_status:
        orders = orders.filter(
            payment_status=payment_status
        )

    headers = [
        "Invoice",
        "Customer",
        "Status",
        "Payment",
        "Subtotal",
        "Discount",
        "Tax",
        "Grand Total",
        "Profit",
        "Order Date",
    ]

    rows = []

    for order in orders.order_by(
        "-order_date"
    ):

        rows.append(
            [
                order.invoice_number,
                (
                    order.customer.name
                    if order.customer
                    else "Walk-in Customer"
                ),
                order.status,
                order.payment_status,
                money(
                    order.subtotal
                ),
                money(
                    order.discount_amount
                ),
                money(
                    order.tax_amount
                ),
                money(
                    order.grand_total
                ),
                money(
                    order.total_profit
                ),
                order.order_date.strftime(
                    "%d-%m-%Y %I:%M %p"
                ),
            ]
        )

    return (
        "Sales Report",
        headers,
        rows,
    )


# ============================================================
# PROFIT DATA
# ============================================================

def get_profit_data(request):

    items = (
        OrderItem.objects
        .filter(
            order__status=
                Order.Status.COMPLETED
        )
    )

    items = apply_date_filter(
        items,
        request,
        "order__order_date",
    )

    rows_query = (
        items
        .values(
            "product_id",
            "product_name",
            "product_sku",
            "product__category__name",
        )
        .annotate(
            quantity_sold=Coalesce(
                Sum("quantity"),
                0,
            ),
            revenue=Coalesce(
                Sum("subtotal"),
                Decimal("0.00"),
            ),
            profit=Coalesce(
                Sum("profit"),
                Decimal("0.00"),
            ),
        )
        .order_by(
            "-profit"
        )
    )

    headers = [
        "Product",
        "SKU",
        "Category",
        "Quantity Sold",
        "Revenue",
        "Profit",
        "Margin %",
    ]

    rows = []

    for row in rows_query:

        revenue = Decimal(
            str(
                row["revenue"] or 0
            )
        )

        profit = Decimal(
            str(
                row["profit"] or 0
            )
        )

        margin = (
            (
                profit
                / revenue
            )
            * Decimal("100")
            if revenue > 0
            else Decimal("0")
        )

        rows.append(
            [
                row["product_name"],
                row["product_sku"],
                (
                    row[
                        "product__category__name"
                    ]
                    or "Uncategorized"
                ),
                row["quantity_sold"],
                money(revenue),
                money(profit),
                money(margin),
            ]
        )

    return (
        "Profit Report",
        headers,
        rows,
    )


# ============================================================
# INVENTORY DATA
# ============================================================

def get_inventory_data(request):

    products = (
        Product.objects
        .filter(
            status=
                Product.Status.ACTIVE
        )
        .select_related(
            "category",
            "supplier",
        )
    )

    stock_status = (
        request.query_params.get(
            "stock_status"
        )
    )

    if stock_status == "LOW_STOCK":

        products = products.filter(
            stock_quantity__gt=0,
            stock_quantity__lte=F(
                "reorder_level"
            ),
        )

    elif (
        stock_status
        == "OUT_OF_STOCK"
    ):

        products = products.filter(
            stock_quantity__lte=0
        )

    elif stock_status == "HEALTHY":

        products = products.filter(
            stock_quantity__gt=F(
                "reorder_level"
            )
        )

    headers = [
        "Product",
        "SKU",
        "Category",
        "Supplier",
        "Stock",
        "Reorder Level",
        "Cost Price",
        "Selling Price",
        "Cost Value",
        "Retail Value",
        "Stock Status",
    ]

    rows = []

    for product in products.order_by(
        "name"
    ):

        stock = (
            product.stock_quantity
            or 0
        )

        cost_value = (
            Decimal(stock)
            * Decimal(
                str(
                    product.cost_price
                    or 0
                )
            )
        )

        retail_value = (
            Decimal(stock)
            * Decimal(
                str(
                    product.selling_price
                    or 0
                )
            )
        )

        if stock <= 0:
            current_status = (
                "OUT_OF_STOCK"
            )

        elif (
            stock
            <= product.reorder_level
        ):
            current_status = (
                "LOW_STOCK"
            )

        else:
            current_status = "HEALTHY"

        rows.append(
            [
                product.name,
                product.sku,
                (
                    product.category.name
                    if product.category
                    else "Uncategorized"
                ),
                (
                    product.supplier.company_name
                    if product.supplier
                    else "—"
                ),
                stock,
                product.reorder_level,
                money(
                    product.cost_price
                ),
                money(
                    product.selling_price
                ),
                money(
                    cost_value
                ),
                money(
                    retail_value
                ),
                current_status,
            ]
        )

    return (
        "Inventory Report",
        headers,
        rows,
    )


# ============================================================
# CUSTOMER DATA
# ============================================================

def get_customer_data(request):

    customers = (
        Customer.objects
        .filter(
            is_active=True
        )
    )

    customer_type = (
        request.query_params.get(
            "customer_type"
        )
    )

    if customer_type:
        customers = customers.filter(
            type=customer_type
        )

    headers = [
        "Customer Code",
        "Customer",
        "Phone",
        "Email",
        "Type",
        "Orders",
        "Total Spent",
        "Average Order",
        "Loyalty Points",
    ]

    rows = []

    for customer in customers.order_by(
        "name"
    ):

        orders = (
            Order.objects
            .filter(
                customer=customer,
                status=
                    Order.Status.COMPLETED,
            )
        )

        orders = apply_date_filter(
            orders,
            request,
            "order_date",
        )

        order_count = (
            orders.count()
        )

        total_spent = (
            orders.aggregate(
                total=Coalesce(
                    Sum(
                        "grand_total"
                    ),
                    Decimal(
                        "0.00"
                    ),
                )
            )["total"]
        )

        total_spent = Decimal(
            str(
                total_spent or 0
            )
        )

        average_order = (
            total_spent
            / Decimal(
                order_count
            )
            if order_count > 0
            else Decimal("0")
        )

        rows.append(
            [
                customer.customer_code,
                customer.name,
                customer.phone,
                customer.email or "",
                customer.type,
                order_count,
                money(
                    total_spent
                ),
                money(
                    average_order
                ),
                customer.loyalty_points,
            ]
        )

    return (
        "Customer Report",
        headers,
        rows,
    )


# ============================================================
# SUPPLIER DATA
# ============================================================

def get_supplier_data(request):

    suppliers = (
        Supplier.objects
        .all()
    )

    status = (
        request.query_params.get(
            "status"
        )
    )

    if status:
        suppliers = suppliers.filter(
            status=status
        )

    headers = [
        "Supplier Code",
        "Company",
        "Contact Person",
        "Phone",
        "Email",
        "City",
        "State",
        "Status",
        "Products",
        "Inventory Cost",
    ]

    rows = []

    for supplier in suppliers.order_by(
        "company_name"
    ):

        products = (
            Product.objects
            .filter(
                supplier=supplier
            )
        )

        inventory_cost = Decimal(
            "0.00"
        )

        for product in products:

            inventory_cost += (
                Decimal(
                    product.stock_quantity
                    or 0
                )
                * Decimal(
                    str(
                        product.cost_price
                        or 0
                    )
                )
            )

        rows.append(
            [
                supplier.supplier_code,
                supplier.company_name,
                (
                    supplier.contact_person
                    or ""
                ),
                supplier.phone or "",
                supplier.email or "",
                supplier.city or "",
                supplier.state or "",
                supplier.status,
                products.count(),
                money(
                    inventory_cost
                ),
            ]
        )

    return (
        "Supplier Report",
        headers,
        rows,
    )


# ============================================================
# REPORT RESOLVER
# ============================================================

def get_report_data(
    report_type,
    request,
):

    if report_type == "sales":
        return get_sales_data(
            request
        )

    if report_type == "profit":
        return get_profit_data(
            request
        )

    if report_type == "inventory":
        return get_inventory_data(
            request
        )

    if report_type == "customers":
        return get_customer_data(
            request
        )

    if report_type == "suppliers":
        return get_supplier_data(
            request
        )

    return None


# ============================================================
# EXCEL VIEW
# ============================================================

class ReportExcelExportView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        report_type,
    ):

        report = get_report_data(
            report_type,
            request,
        )

        if not report:

            from rest_framework.response import Response

            return Response(
                {
                    "detail":
                        "Invalid report type."
                },
                status=400,
            )

        title, headers, rows = (
            report
        )

        filename = (
            f"retailvision_"
            f"{report_type}_"
            f"{timestamp_string()}"
            f".xlsx"
        )

        return generate_excel_response(
            title=title,
            headers=headers,
            rows=rows,
            filename=filename,
        )


# ============================================================
# PDF VIEW
# ============================================================

class ReportPDFExportView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        report_type,
    ):

        report = get_report_data(
            report_type,
            request,
        )

        if not report:

            from rest_framework.response import Response

            return Response(
                {
                    "detail":
                        "Invalid report type."
                },
                status=400,
            )

        title, headers, rows = (
            report
        )

        filename = (
            f"retailvision_"
            f"{report_type}_"
            f"{timestamp_string()}"
            f".pdf"
        )

        return generate_pdf_response(
            title=title,
            headers=headers,
            rows=rows,
            filename=filename,
        )