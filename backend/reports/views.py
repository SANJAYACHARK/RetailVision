from decimal import Decimal

from django.db.models import (
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    Sum,
)
from django.db.models.functions import Coalesce

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from products.models import Product
from sales.models import Order, OrderItem
from suppliers.models import Supplier


def money_float(value):
    if value is None:
        return 0.0

    return float(
        Decimal(str(value)).quantize(
            Decimal("0.01")
        )
    )


def apply_date_filter(queryset, request, field_name):
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    filters = {}

    if start_date:
        filters[f"{field_name}__date__gte"] = start_date

    if end_date:
        filters[f"{field_name}__date__lte"] = end_date

    if filters:
        queryset = queryset.filter(**filters)

    return queryset


# ============================================================
# SALES REPORT
# ============================================================

class SalesReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

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

        status = request.query_params.get("status")
        payment_status = request.query_params.get("payment_status")
        customer = request.query_params.get("customer")

        if status:
            orders = orders.filter(
                status=status
            )

        if payment_status:
            orders = orders.filter(
                payment_status=payment_status
            )

        if customer:
            orders = orders.filter(
                customer_id=customer
            )

        total_sales = (
            orders.aggregate(
                value=Coalesce(
                    Sum("grand_total"),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                )
            )["value"]
            or Decimal("0.00")
        )

        total_profit = (
            orders.aggregate(
                value=Coalesce(
                    Sum("total_profit"),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                )
            )["value"]
            or Decimal("0.00")
        )

        total_orders = orders.count()

        average_order_value = (
            total_sales / Decimal(total_orders)
            if total_orders > 0
            else Decimal("0.00")
        )

        results = []

        for order in orders.order_by("-order_date"):

            customer_name = (
                order.customer.name
                if order.customer
                else "Walk-in Customer"
            )

            created_by = "System"

            if order.created_by:
                created_by = (
                    order.created_by.get_full_name()
                    or order.created_by.username
                )

            results.append(
                {
                    "id": order.id,
                    "invoice_number": order.invoice_number,
                    "customer": customer_name,
                    "status": order.status,
                    "payment_status": order.payment_status,
                    "subtotal": money_float(order.subtotal),
                    "discount_amount": money_float(
                        order.discount_amount
                    ),
                    "tax_amount": money_float(
                        order.tax_amount
                    ),
                    "grand_total": money_float(
                        order.grand_total
                    ),
                    "profit": money_float(
                        order.total_profit
                    ),
                    "created_by": created_by,
                    "order_date": order.order_date,
                }
            )

        return Response(
            {
                "summary": {
                    "total_sales": money_float(
                        total_sales
                    ),
                    "total_profit": money_float(
                        total_profit
                    ),
                    "total_orders": total_orders,
                    "average_order_value": money_float(
                        average_order_value
                    ),
                },
                "results": results,
            }
        )


# ============================================================
# PROFIT REPORT
# ============================================================

class ProfitReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        items = (
            OrderItem.objects
            .filter(
                order__status=Order.Status.COMPLETED
            )
            .select_related(
                "product",
                "product__category",
                "order",
            )
        )

        items = apply_date_filter(
            items,
            request,
            "order__order_date",
        )

        product = request.query_params.get("product")
        category = request.query_params.get("category")

        if product:
            items = items.filter(
                product_id=product
            )

        if category:
            items = items.filter(
                product__category_id=category
            )

        rows = (
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
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),
                profit=Coalesce(
                    Sum("profit"),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),
            )
            .order_by("-profit")
        )

        results = []

        total_revenue = Decimal("0.00")
        total_profit = Decimal("0.00")

        for row in rows:

            revenue = (
                row["revenue"]
                or Decimal("0.00")
            )

            profit = (
                row["profit"]
                or Decimal("0.00")
            )

            total_revenue += revenue
            total_profit += profit

            margin = (
                profit / revenue * Decimal("100")
                if revenue > 0
                else Decimal("0.00")
            )

            results.append(
                {
                    "product_id": row["product_id"],
                    "name": row["product_name"],
                    "sku": row["product_sku"],
                    "category": (
                        row["product__category__name"]
                        or "Uncategorized"
                    ),
                    "quantity_sold": row["quantity_sold"],
                    "revenue": money_float(revenue),
                    "profit": money_float(profit),
                    "margin_percent": money_float(
                        margin
                    ),
                }
            )

        total_margin = (
            total_profit
            / total_revenue
            * Decimal("100")
            if total_revenue > 0
            else Decimal("0.00")
        )

        return Response(
            {
                "summary": {
                    "total_revenue": money_float(
                        total_revenue
                    ),
                    "total_profit": money_float(
                        total_profit
                    ),
                    "overall_margin_percent": money_float(
                        total_margin
                    ),
                },
                "results": results,
            }
        )


# ============================================================
# INVENTORY REPORT
# ============================================================

class InventoryReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        products = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE
            )
            .select_related(
                "category",
                "supplier",
            )
        )

        category = request.query_params.get("category")
        supplier = request.query_params.get("supplier")
        stock_status = request.query_params.get("stock_status")

        if category:
            products = products.filter(
                category_id=category
            )

        if supplier:
            products = products.filter(
                supplier_id=supplier
            )

        if stock_status == "LOW_STOCK":
            products = products.filter(
                stock_quantity__gt=0,
                stock_quantity__lte=F(
                    "reorder_level"
                ),
            )

        elif stock_status == "OUT_OF_STOCK":
            products = products.filter(
                stock_quantity__lte=0
            )

        elif stock_status == "HEALTHY":
            products = products.filter(
                stock_quantity__gt=F(
                    "reorder_level"
                )
            )

        results = []

        total_cost_value = Decimal("0.00")
        total_retail_value = Decimal("0.00")

        low_stock_count = 0
        out_of_stock_count = 0

        for product in products.order_by("name"):

            stock_quantity = product.stock_quantity or 0

            cost_value = (
                Decimal(stock_quantity)
                * Decimal(
                    str(
                        product.cost_price or 0
                    )
                )
            )

            retail_value = (
                Decimal(stock_quantity)
                * Decimal(
                    str(
                        product.selling_price or 0
                    )
                )
            )

            total_cost_value += cost_value
            total_retail_value += retail_value

            if stock_quantity <= 0:
                current_stock_status = "OUT_OF_STOCK"
                out_of_stock_count += 1

            elif stock_quantity <= product.reorder_level:
                current_stock_status = "LOW_STOCK"
                low_stock_count += 1

            else:
                current_stock_status = "HEALTHY"

            results.append(
                {
                    "product_id": product.id,
                    "name": product.name,
                    "sku": product.sku,
                    "category": (
                        product.category.name
                        if product.category
                        else "Uncategorized"
                    ),
                    "supplier": (
                        product.supplier.company_name
                        if product.supplier
                        else "—"
                    ),
                    "stock_quantity": stock_quantity,
                    "reorder_level": product.reorder_level,
                    "cost_price": money_float(
                        product.cost_price
                    ),
                    "selling_price": money_float(
                        product.selling_price
                    ),
                    "cost_value": money_float(
                        cost_value
                    ),
                    "retail_value": money_float(
                        retail_value
                    ),
                    "stock_status": current_stock_status,
                }
            )

        return Response(
            {
                "summary": {
                    "total_products": len(results),
                    "total_cost_value": money_float(
                        total_cost_value
                    ),
                    "total_retail_value": money_float(
                        total_retail_value
                    ),
                    "low_stock_count": low_stock_count,
                    "out_of_stock_count": out_of_stock_count,
                },
                "results": results,
            }
        )


# ============================================================
# CUSTOMER REPORT
# ============================================================

class CustomerReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        customers = Customer.objects.filter(
            is_active=True
        )

        customer_type = request.query_params.get(
            "customer_type"
        )

        if customer_type:

            # Your Customer model may use
            # customer_type OR type.
            field_names = {
                field.name
                for field in Customer._meta.fields
            }

            if "customer_type" in field_names:
                customers = customers.filter(
                    customer_type=customer_type
                )

            elif "type" in field_names:
                customers = customers.filter(
                    type=customer_type
                )

        results = []

        total_spent_all = Decimal("0.00")
        repeat_customers = 0

        for customer in customers.order_by("name"):

            orders = (
                Order.objects
                .filter(
                    customer=customer,
                    status=Order.Status.COMPLETED,
                )
            )

            orders = apply_date_filter(
                orders,
                request,
                "order_date",
            )

            order_count = orders.count()

            total_spent = (
                orders.aggregate(
                    value=Coalesce(
                        Sum("grand_total"),
                        Decimal("0.00"),
                        output_field=DecimalField(
                            max_digits=18,
                            decimal_places=2,
                        ),
                    )
                )["value"]
                or Decimal("0.00")
            )

            total_spent_all += total_spent

            if order_count > 1:
                repeat_customers += 1

            average_order = (
                total_spent / Decimal(order_count)
                if order_count > 0
                else Decimal("0.00")
            )

            customer_type_value = getattr(
                customer,
                "customer_type",
                getattr(
                    customer,
                    "type",
                    "",
                ),
            )

            results.append(
                {
                    "customer_id": customer.id,
                    "customer_code": customer.customer_code,
                    "name": customer.name,
                    "phone": customer.phone,
                    "email": customer.email,
                    "customer_type": customer_type_value,
                    "loyalty_points": customer.loyalty_points,
                    "orders": order_count,
                    "total_spent": money_float(
                        total_spent
                    ),
                    "average_order_value": money_float(
                        average_order
                    ),
                    "repeat_customer": order_count > 1,
                }
            )

        return Response(
            {
                "summary": {
                    "total_customers": len(results),
                    "repeat_customers": repeat_customers,
                    "total_customer_spending": money_float(
                        total_spent_all
                    ),
                },
                "results": results,
            }
        )


# ============================================================
# SUPPLIER REPORT
# ============================================================

class SupplierReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        suppliers = Supplier.objects.all()

        status = request.query_params.get("status")

        if status:
            suppliers = suppliers.filter(
                status=status
            )

        results = []

        total_products = 0
        total_inventory_cost = Decimal("0.00")

        for supplier in suppliers.order_by(
            "company_name"
        ):

            products = Product.objects.filter(
                supplier=supplier
            )

            product_count = products.count()
            total_products += product_count

            inventory_cost = Decimal("0.00")

            for product in products:

                inventory_cost += (
                    Decimal(
                        product.stock_quantity or 0
                    )
                    * Decimal(
                        str(
                            product.cost_price or 0
                        )
                    )
                )

            total_inventory_cost += inventory_cost

            results.append(
                {
                    "supplier_id": supplier.id,
                    "supplier_code": supplier.supplier_code,
                    "company_name": supplier.company_name,
                    "contact_person": supplier.contact_person,
                    "phone": supplier.phone,
                    "email": supplier.email,
                    "city": supplier.city,
                    "state": supplier.state,
                    "status": supplier.status,
                    "products": product_count,
                    "inventory_cost_value": money_float(
                        inventory_cost
                    ),
                    "google_maps_url": (
                        supplier.google_maps_url
                    ),
                }
            )

        return Response(
            {
                "summary": {
                    "total_suppliers": len(results),
                    "total_products": total_products,
                    "inventory_cost_value": money_float(
                        total_inventory_cost
                    ),
                },
                "results": results,
            }
        )