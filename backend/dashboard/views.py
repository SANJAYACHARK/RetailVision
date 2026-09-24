from datetime import timedelta
from decimal import Decimal

from django.db.models import (
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    Sum,
)
from django.db.models.functions import (
    Coalesce,
    TruncMonth,
)

from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from products.models import Product
from sales.models import (
    Order,
    OrderItem,
)


class DashboardSummaryView(APIView):
    """
    Main RetailVision dashboard analytics endpoint.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        # =====================================================
        # COMPLETED SALES ONLY
        # =====================================================

        completed_orders = (
            Order.objects
            .filter(
                status=Order.Status.COMPLETED
            )
        )


        # =====================================================
        # KPI - TOTAL REVENUE
        # =====================================================

        revenue_result = (
            completed_orders
            .aggregate(
                total=Coalesce(
                    Sum(
                        "grand_total"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                )
            )
        )

        total_revenue = (
            revenue_result["total"]
            or Decimal("0.00")
        )


        # =====================================================
        # KPI - TOTAL PROFIT
        # =====================================================

        profit_result = (
            completed_orders
            .aggregate(
                total=Coalesce(
                    Sum(
                        "total_profit"
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                )
            )
        )

        total_profit = (
            profit_result["total"]
            or Decimal("0.00")
        )


        # =====================================================
        # KPI - TOTAL ORDERS
        # =====================================================

        total_orders = (
            completed_orders.count()
        )


        # =====================================================
        # KPI - TOTAL CUSTOMERS
        # =====================================================

        total_customers = (
            Customer.objects
            .filter(
                is_active=True
            )
            .count()
        )


        # =====================================================
        # KPI - TOTAL PRODUCTS
        # =====================================================

        total_products = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE
            )
            .count()
        )


        # =====================================================
        # KPI - AVERAGE ORDER VALUE
        # =====================================================

        if total_orders > 0:

            average_order_value = (
                total_revenue
                / Decimal(total_orders)
            )

        else:

            average_order_value = (
                Decimal("0.00")
            )


        # =====================================================
        # INVENTORY VALUE
        # =====================================================

        inventory_expression = (
            ExpressionWrapper(
                F("stock_quantity")
                * F("cost_price"),
                output_field=DecimalField(
                    max_digits=18,
                    decimal_places=2,
                ),
            )
        )


        inventory_result = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE
            )
            .aggregate(
                total=Coalesce(
                    Sum(
                        inventory_expression
                    ),
                    Decimal("0.00"),
                    output_field=DecimalField(
                        max_digits=18,
                        decimal_places=2,
                    ),
                )
            )
        )


        inventory_value = (
            inventory_result["total"]
            or Decimal("0.00")
        )


        # =====================================================
        # LOW STOCK
        # =====================================================

        low_stock_count = (
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


        # =====================================================
        # OUT OF STOCK
        # =====================================================

        out_of_stock_count = (
            Product.objects
            .filter(
                status=Product.Status.ACTIVE,
                stock_quantity__lte=0,
            )
            .count()
        )


        # =====================================================
        # MONTHLY SALES TREND
        # LAST 12 MONTHS
        # =====================================================

        today = timezone.now()

        start_date = (
            today
            - timedelta(
                days=365
            )
        )


        monthly_sales_queryset = (
            completed_orders
            .filter(
                order_date__gte=start_date
            )
            .annotate(
                month=TruncMonth(
                    "order_date"
                )
            )
            .values(
                "month"
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
                "month"
            )
        )


        monthly_sales = []

        for row in monthly_sales_queryset:

            month_value = (
                row["month"]
            )

            monthly_sales.append(
                {
                    "month":
                        (
                            month_value.strftime(
                                "%b %Y"
                            )
                            if month_value
                            else ""
                        ),

                    "revenue":
                        float(
                            row["revenue"]
                            or 0
                        ),

                    "profit":
                        float(
                            row["profit"]
                            or 0
                        ),

                    "orders":
                        row["orders"],
                }
            )


        # =====================================================
        # SALES BY CATEGORY
        # =====================================================

        category_queryset = (
            OrderItem.objects
            .filter(
                order__status=(
                    Order.Status.COMPLETED
                )
            )
            .values(
                "product__category__name"
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
                quantity=Coalesce(
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


        sales_by_category = []

        for row in category_queryset:

            sales_by_category.append(
                {
                    "category":
                        (
                            row[
                                "product__category__name"
                            ]
                            or "Uncategorized"
                        ),

                    "revenue":
                        float(
                            row["revenue"]
                            or 0
                        ),

                    "quantity":
                        row["quantity"]
                        or 0,
                }
            )


        # =====================================================
        # TOP SELLING PRODUCTS
        # =====================================================

        top_products_queryset = (
            OrderItem.objects
            .filter(
                order__status=(
                    Order.Status.COMPLETED
                )
            )
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
            )[:5]
        )


        top_products = []

        for row in top_products_queryset:

            top_products.append(
                {
                    "product_id":
                        row["product_id"],

                    "name":
                        row["product_name"],

                    "sku":
                        row["product_sku"],

                    "quantity_sold":
                        row["quantity_sold"]
                        or 0,

                    "revenue":
                        float(
                            row["revenue"]
                            or 0
                        ),

                    "profit":
                        float(
                            row["profit"]
                            or 0
                        ),
                }
            )


        # =====================================================
        # TOP CUSTOMERS
        # =====================================================

        top_customers_queryset = (
            completed_orders
            .exclude(
                customer__isnull=True
            )
            .values(
                "customer_id",
                "customer__name",
                "customer__phone",
            )
            .annotate(
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
                orders=Count(
                    "id"
                ),
            )
            .order_by(
                "-total_spent"
            )[:5]
        )


        top_customers = []

        for row in top_customers_queryset:

            top_customers.append(
                {
                    "customer_id":
                        row["customer_id"],

                    "name":
                        row["customer__name"],

                    "phone":
                        row["customer__phone"],

                    "orders":
                        row["orders"],

                    "total_spent":
                        float(
                            row["total_spent"]
                            or 0
                        ),
                }
            )


        # =====================================================
        # RECENT SALES
        # =====================================================

        recent_orders = (
            Order.objects
            .select_related(
                "customer",
                "created_by",
            )
            .order_by(
                "-order_date"
            )[:7]
        )


        recent_sales = []

        for order in recent_orders:

            if order.customer:

                customer_name = (
                    order.customer.name
                )

            else:

                customer_name = (
                    "Walk-in Customer"
                )


            if order.created_by:

                created_by_name = (
                    order.created_by.get_full_name()
                    or order.created_by.username
                )

            else:

                created_by_name = "System"


            recent_sales.append(
                {
                    "id":
                        order.id,

                    "invoice_number":
                        order.invoice_number,

                    "customer":
                        customer_name,

                    "status":
                        order.status,

                    "payment_status":
                        order.payment_status,

                    "grand_total":
                        float(
                            order.grand_total
                            or 0
                        ),

                    "order_date":
                        order.order_date,

                    "created_by":
                        created_by_name,
                }
            )


        # =====================================================
        # RESPONSE
        # =====================================================

        return Response(
            {
                "kpis": {
                    "total_revenue":
                        float(
                            total_revenue
                        ),

                    "total_profit":
                        float(
                            total_profit
                        ),

                    "total_orders":
                        total_orders,

                    "total_customers":
                        total_customers,

                    "total_products":
                        total_products,

                    "average_order_value":
                        float(
                            average_order_value
                        ),

                    "inventory_value":
                        float(
                            inventory_value
                        ),

                    "low_stock_count":
                        low_stock_count,

                    "out_of_stock_count":
                        out_of_stock_count,
                },

                "monthly_sales":
                    monthly_sales,

                "sales_by_category":
                    sales_by_category,

                "top_products":
                    top_products,

                "top_customers":
                    top_customers,

                "recent_sales":
                    recent_sales,
            }
        )