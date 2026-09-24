from datetime import timedelta
from decimal import Decimal

from django.db.models import (
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    Q,
    Sum,
)
from django.db.models.functions import (
    Coalesce,
    TruncDay,
    TruncMonth,
    TruncYear,
)
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from products.models import Product
from sales.models import Order, OrderItem


# ============================================================
# HELPERS
# ============================================================

def money_float(value):
    if value is None:
        return 0.0

    return float(
        Decimal(str(value))
        .quantize(
            Decimal("0.01")
        )
    )


def completed_orders():
    return Order.objects.filter(
        status=Order.Status.COMPLETED
    )


def completed_order_items():
    return OrderItem.objects.filter(
        order__status=Order.Status.COMPLETED
    )


# ============================================================
# ANALYTICS OVERVIEW
# ============================================================

class AnalyticsOverviewView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        orders = completed_orders()

        revenue = (
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

        profit = (
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

        order_count = orders.count()

        average_order_value = (
            revenue / Decimal(order_count)
            if order_count > 0
            else Decimal("0.00")
        )

        customer_count = (
            Customer.objects
            .filter(
                is_active=True
            )
            .count()
        )

        repeat_customers = (
            orders
            .exclude(
                customer__isnull=True
            )
            .values(
                "customer_id"
            )
            .annotate(
                order_count=Count(
                    "id"
                )
            )
            .filter(
                order_count__gt=1
            )
            .count()
        )

        product_count = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE
            )
            .count()
        )

        low_stock = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE,
                stock_quantity__gt=0,
                stock_quantity__lte=F(
                    "reorder_level"
                ),
            )
            .count()
        )

        out_of_stock = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE,
                stock_quantity__lte=0,
            )
            .count()
        )

        inventory_value_expression = (
            ExpressionWrapper(
                F("stock_quantity")
                * F("cost_price"),
                output_field=DecimalField(
                    max_digits=18,
                    decimal_places=2,
                ),
            )
        )

        inventory_value = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE
            )
            .aggregate(
                value=Coalesce(
                    Sum(
                        inventory_value_expression
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                )
            )["value"]
            or Decimal("0.00")
        )

        best_selling = (
            completed_order_items()
            .values(
                "product_id",
                "product_name",
                "product_sku",
            )
            .annotate(
                quantity=Sum(
                    "quantity"
                )
            )
            .order_by(
                "-quantity"
            )
            .first()
        )

        worst_selling = (
            completed_order_items()
            .values(
                "product_id",
                "product_name",
                "product_sku",
            )
            .annotate(
                quantity=Sum(
                    "quantity"
                )
            )
            .order_by(
                "quantity"
            )
            .first()
        )

        return Response(
            {
                "sales": {
                    "revenue":
                        money_float(
                            revenue
                        ),

                    "profit":
                        money_float(
                            profit
                        ),

                    "orders":
                        order_count,

                    "average_order_value":
                        money_float(
                            average_order_value
                        ),
                },

                "customers": {
                    "total":
                        customer_count,

                    "repeat_customers":
                        repeat_customers,
                },

                "products": {
                    "total":
                        product_count,

                    "best_selling":
                        best_selling,

                    "worst_selling":
                        worst_selling,
                },

                "inventory": {
                    "low_stock":
                        low_stock,

                    "out_of_stock":
                        out_of_stock,

                    "inventory_value":
                        money_float(
                            inventory_value
                        ),
                },
            }
        )


# ============================================================
# SALES TREND
# ============================================================

class SalesTrendView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        period = request.query_params.get(
            "period",
            "monthly",
        )

        orders = completed_orders()

        if period == "daily":

            start_date = (
                timezone.now()
                - timedelta(
                    days=30
                )
            )

            trunc_function = (
                TruncDay(
                    "order_date"
                )
            )

            date_format = "%d %b"

        elif period == "yearly":

            start_date = (
                timezone.now()
                - timedelta(
                    days=365 * 5
                )
            )

            trunc_function = (
                TruncYear(
                    "order_date"
                )
            )

            date_format = "%Y"

        else:

            period = "monthly"

            start_date = (
                timezone.now()
                - timedelta(
                    days=365
                )
            )

            trunc_function = (
                TruncMonth(
                    "order_date"
                )
            )

            date_format = "%b %Y"

        rows = (
            orders
            .filter(
                order_date__gte=start_date
            )
            .annotate(
                period_value=trunc_function
            )
            .values(
                "period_value"
            )
            .annotate(
                revenue=Coalesce(
                    Sum(
                        "grand_total"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),

                profit=Coalesce(
                    Sum(
                        "total_profit"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),

                orders=Count(
                    "id"
                ),
            )
            .order_by(
                "period_value"
            )
        )

        data = []

        previous_revenue = None

        for row in rows:

            revenue = (
                row["revenue"]
                or Decimal("0.00")
            )

            growth = None

            if (
                previous_revenue is not None
                and previous_revenue != 0
            ):
                growth = (
                    (
                        revenue
                        - previous_revenue
                    )
                    / previous_revenue
                    * Decimal("100")
                )

            period_value = (
                row["period_value"]
            )

            data.append(
                {
                    "period":
                        (
                            period_value.strftime(
                                date_format
                            )
                            if period_value
                            else ""
                        ),

                    "revenue":
                        money_float(
                            revenue
                        ),

                    "profit":
                        money_float(
                            row["profit"]
                        ),

                    "orders":
                        row["orders"],

                    "growth_percent":
                        (
                            money_float(
                                growth
                            )
                            if growth is not None
                            else None
                        ),
                }
            )

            previous_revenue = revenue

        return Response(
            {
                "period":
                    period,

                "results":
                    data,
            }
        )


# ============================================================
# PRODUCT PERFORMANCE
# ============================================================

class ProductPerformanceView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        rows = (
            completed_order_items()
            .values(
                "product_id",
                "product_name",
                "product_sku",
            )
            .annotate(
                quantity_sold=Coalesce(
                    Sum(
                        "quantity"
                    ),
                    0,
                ),

                revenue=Coalesce(
                    Sum(
                        "subtotal"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),

                profit=Coalesce(
                    Sum(
                        "profit"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),
            )
            .order_by(
                "-quantity_sold"
            )
        )

        data = []

        for row in rows:

            revenue = (
                row["revenue"]
                or Decimal("0.00")
            )

            profit = (
                row["profit"]
                or Decimal("0.00")
            )

            margin = (
                (
                    profit
                    / revenue
                )
                * Decimal("100")
                if revenue > 0
                else Decimal("0.00")
            )

            data.append(
                {
                    "product_id":
                        row["product_id"],

                    "name":
                        row["product_name"],

                    "sku":
                        row["product_sku"],

                    "quantity_sold":
                        row["quantity_sold"],

                    "revenue":
                        money_float(
                            revenue
                        ),

                    "profit":
                        money_float(
                            profit
                        ),

                    "margin_percent":
                        money_float(
                            margin
                        ),
                }
            )

        return Response(
            {
                "results":
                    data,
            }
        )


# ============================================================
# CATEGORY ANALYTICS
# ============================================================

class CategoryAnalyticsView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        rows = (
            completed_order_items()
            .values(
                "product__category_id",
                "product__category__name",
            )
            .annotate(
                quantity_sold=Coalesce(
                    Sum(
                        "quantity"
                    ),
                    0,
                ),

                revenue=Coalesce(
                    Sum(
                        "subtotal"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),

                profit=Coalesce(
                    Sum(
                        "profit"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),
            )
            .order_by(
                "-revenue"
            )
        )

        data = []

        for row in rows:

            revenue = (
                row["revenue"]
                or Decimal("0.00")
            )

            profit = (
                row["profit"]
                or Decimal("0.00")
            )

            margin = (
                (
                    profit
                    / revenue
                )
                * Decimal("100")
                if revenue > 0
                else Decimal("0.00")
            )

            data.append(
                {
                    "category_id":
                        row[
                            "product__category_id"
                        ],

                    "category":
                        (
                            row[
                                "product__category__name"
                            ]
                            or "Uncategorized"
                        ),

                    "quantity_sold":
                        row["quantity_sold"],

                    "revenue":
                        money_float(
                            revenue
                        ),

                    "profit":
                        money_float(
                            profit
                        ),

                    "margin_percent":
                        money_float(
                            margin
                        ),
                }
            )

        return Response(
            {
                "results":
                    data,
            }
        )


# ============================================================
# CUSTOMER ANALYTICS
# ============================================================

class CustomerAnalyticsView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        rows = (
            completed_orders()
            .exclude(
                customer__isnull=True
            )
            .values(
                "customer_id",
                "customer__name",
                "customer__phone",
                "customer__customer_type",
            )
            .annotate(
                orders=Count(
                    "id"
                ),

                total_spent=Coalesce(
                    Sum(
                        "grand_total"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),
            )
            .order_by(
                "-total_spent"
            )
        )

        data = []

        for row in rows:

            orders = (
                row["orders"]
                or 0
            )

            total_spent = (
                row["total_spent"]
                or Decimal("0.00")
            )

            average_order = (
                total_spent
                / Decimal(orders)
                if orders > 0
                else Decimal("0.00")
            )

            data.append(
                {
                    "customer_id":
                        row["customer_id"],

                    "name":
                        row["customer__name"],

                    "phone":
                        row["customer__phone"],

                    "customer_type":
                        row[
                            "customer__customer_type"
                        ],

                    "orders":
                        orders,

                    "total_spent":
                        money_float(
                            total_spent
                        ),

                    "average_order_value":
                        money_float(
                            average_order
                        ),

                    "repeat_customer":
                        orders > 1,
                }
            )

        return Response(
            {
                "results":
                    data,
            }
        )


# ============================================================
# ABC INVENTORY ANALYSIS
# ============================================================

class ABCInventoryAnalyticsView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        rows = list(
            completed_order_items()
            .values(
                "product_id",
                "product_name",
                "product_sku",
            )
            .annotate(
                revenue=Coalesce(
                    Sum(
                        "subtotal"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),

                quantity_sold=Coalesce(
                    Sum(
                        "quantity"
                    ),
                    0,
                ),
            )
            .order_by(
                "-revenue"
            )
        )

        total_revenue = sum(
            (
                row["revenue"]
                or Decimal("0.00")
                for row in rows
            ),
            Decimal("0.00"),
        )

        cumulative_revenue = Decimal(
            "0.00"
        )

        results = []

        for row in rows:

            revenue = (
                row["revenue"]
                or Decimal("0.00")
            )

            cumulative_revenue += revenue

            cumulative_percent = (
                (
                    cumulative_revenue
                    / total_revenue
                )
                * Decimal("100")
                if total_revenue > 0
                else Decimal("0.00")
            )

            if cumulative_percent <= 80:
                classification = "A"

            elif cumulative_percent <= 95:
                classification = "B"

            else:
                classification = "C"

            results.append(
                {
                    "product_id":
                        row["product_id"],

                    "name":
                        row["product_name"],

                    "sku":
                        row["product_sku"],

                    "quantity_sold":
                        row["quantity_sold"],

                    "revenue":
                        money_float(
                            revenue
                        ),

                    "cumulative_percent":
                        money_float(
                            cumulative_percent
                        ),

                    "classification":
                        classification,
                }
            )

        return Response(
            {
                "total_revenue":
                    money_float(
                        total_revenue
                    ),

                "results":
                    results,
            }
        )


# ============================================================
# MARGIN ANALYSIS
# ============================================================

class MarginAnalyticsView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        rows = (
            completed_order_items()
            .values(
                "product_id",
                "product_name",
                "product_sku",
            )
            .annotate(
                revenue=Coalesce(
                    Sum(
                        "subtotal"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),

                profit=Coalesce(
                    Sum(
                        "profit"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                ),
            )
            .order_by(
                "-profit"
            )
        )

        results = []

        for row in rows:

            revenue = (
                row["revenue"]
                or Decimal("0.00")
            )

            profit = (
                row["profit"]
                or Decimal("0.00")
            )

            margin = (
                (
                    profit
                    / revenue
                )
                * Decimal("100")
                if revenue > 0
                else Decimal("0.00")
            )

            results.append(
                {
                    "product_id":
                        row["product_id"],

                    "name":
                        row["product_name"],

                    "sku":
                        row["product_sku"],

                    "revenue":
                        money_float(
                            revenue
                        ),

                    "profit":
                        money_float(
                            profit
                        ),

                    "margin_percent":
                        money_float(
                            margin
                        ),
                }
            )

        return Response(
            {
                "results":
                    results,
            }
        )


# ============================================================
# INVENTORY ANALYTICS
# ============================================================

class InventoryAnalyticsView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

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

        results = []

        for product in products:

            cost_value = (
                Decimal(
                    product.stock_quantity
                )
                * Decimal(
                    str(
                        product.cost_price
                        or 0
                    )
                )
            )

            retail_value = (
                Decimal(
                    product.stock_quantity
                )
                * Decimal(
                    str(
                        product.selling_price
                        or 0
                    )
                )
            )

            if (
                product.stock_quantity
                <= 0
            ):
                stock_status = (
                    "OUT_OF_STOCK"
                )

            elif (
                product.stock_quantity
                <= product.reorder_level
            ):
                stock_status = (
                    "LOW_STOCK"
                )

            else:
                stock_status = (
                    "HEALTHY"
                )

            results.append(
                {
                    "product_id":
                        product.id,

                    "name":
                        product.name,

                    "sku":
                        product.sku,

                    "category":
                        (
                            product.category.name
                            if product.category
                            else "Uncategorized"
                        ),

                    "stock_quantity":
                        product.stock_quantity,

                    "reorder_level":
                        product.reorder_level,

                    "cost_value":
                        money_float(
                            cost_value
                        ),

                    "retail_value":
                        money_float(
                            retail_value
                        ),

                    "stock_status":
                        stock_status,
                }
            )

        return Response(
            {
                "results":
                    results,
            }
        )