from collections import Counter, defaultdict
from datetime import timedelta
from itertools import combinations

from django.db.models import (
    Count,
    Max,
    Min,
    Sum,
)
from django.utils import timezone

from customers.models import Customer
from sales.models import (
    Order,
    OrderItem,
)


# ============================================================
# COMMON
# ============================================================

ELIGIBLE_ORDER_STATUSES = [
    "COMPLETED",
    "RETURNED",
]


def round_number(
    value,
    digits=2,
):
    return round(
        float(value or 0),
        digits,
    )


# ============================================================
# PRODUCT RECOMMENDATIONS
# ============================================================

def generate_product_recommendations(
    customer_id=None,
    limit=10,
):
    """
    Hybrid product recommendation.

    If customer_id is supplied:
        Uses products purchased by the customer
        and searches for products frequently
        purchased in related orders.

    Without customer_id:
        Uses globally popular products.
    """

    limit = max(
        min(
            int(limit),
            50,
        ),
        1,
    )


    # ========================================================
    # GLOBAL FALLBACK
    # ========================================================

    if not customer_id:
        rows = (
            OrderItem.objects
            .filter(
                order__status__in=
                    ELIGIBLE_ORDER_STATUSES,

                product__isnull=False,
            )
            .values(
                "product_id",
                "product__name",
                "product__sku",
                "product__category__name",
                "product__selling_price",
                "product__stock_quantity",
            )
            .annotate(
                quantity_sold=Sum(
                    "quantity"
                ),

                order_count=Count(
                    "order_id",
                    distinct=True,
                ),

                revenue=Sum(
                    "subtotal"
                ),
            )
            .order_by(
                "-quantity_sold",
                "-revenue",
            )[:limit]
        )


        recommendations = []


        for index, row in enumerate(
            rows,
            start=1,
        ):
            recommendations.append(
                {
                    "rank":
                        index,

                    "product_id":
                        row[
                            "product_id"
                        ],

                    "name":
                        row[
                            "product__name"
                        ],

                    "sku":
                        row[
                            "product__sku"
                        ],

                    "category":
                        (
                            row[
                                "product__category__name"
                            ]
                            or "Uncategorized"
                        ),

                    "selling_price":
                        round_number(
                            row[
                                "product__selling_price"
                            ]
                        ),

                    "stock_quantity":
                        row[
                            "product__stock_quantity"
                        ]
                        or 0,

                    "score":
                        row[
                            "quantity_sold"
                        ]
                        or 0,

                    "order_count":
                        row[
                            "order_count"
                        ]
                        or 0,

                    "reason":
                        "Popular with RetailVision customers",
                }
            )


        return {
            "status":
                "SUCCESS",

            "mode":
                "POPULARITY",

            "customer":
                None,

            "summary": {
                "recommendations":
                    len(
                        recommendations
                    ),
            },

            "results":
                recommendations,
        }


    # ========================================================
    # CUSTOMER CHECK
    # ========================================================

    try:
        customer = (
            Customer.objects.get(
                id=customer_id
            )
        )

    except Customer.DoesNotExist:
        return {
            "status":
                "NOT_FOUND",

            "message":
                "Customer not found.",

            "results": [],
        }


    # ========================================================
    # CUSTOMER PURCHASE HISTORY
    # ========================================================

    customer_items = (
        OrderItem.objects
        .filter(
            order__customer=
                customer,

            order__status__in=
                ELIGIBLE_ORDER_STATUSES,

            product__isnull=False,
        )
    )


    purchased_product_ids = set(
        customer_items
        .values_list(
            "product_id",
            flat=True,
        )
    )


    # ========================================================
    # NEW CUSTOMER FALLBACK
    # ========================================================

    if not purchased_product_ids:
        fallback = (
            generate_product_recommendations(
                customer_id=None,
                limit=limit,
            )
        )

        fallback[
            "mode"
        ] = "POPULARITY_FALLBACK"

        fallback[
            "customer"
        ] = {
            "id":
                customer.id,

            "name":
                customer.name,
        }

        return fallback


    # ========================================================
    # FIND ORDERS CONTAINING PRODUCTS CUSTOMER LIKES
    # ========================================================

    related_order_ids = (
        OrderItem.objects
        .filter(
            order__status__in=
                ELIGIBLE_ORDER_STATUSES,

            product_id__in=
                purchased_product_ids,
        )
        .values_list(
            "order_id",
            flat=True,
        )
        .distinct()
    )


    # ========================================================
    # CANDIDATE PRODUCTS
    # ========================================================

    candidates = (
        OrderItem.objects
        .filter(
            order_id__in=
                related_order_ids,

            order__status__in=
                ELIGIBLE_ORDER_STATUSES,

            product__isnull=False,
        )
        .exclude(
            product_id__in=
                purchased_product_ids
        )
        .values(
            "product_id",
            "product__name",
            "product__sku",
            "product__category__name",
            "product__selling_price",
            "product__stock_quantity",
        )
        .annotate(
            co_orders=Count(
                "order_id",
                distinct=True,
            ),

            quantity_sold=Sum(
                "quantity"
            ),

            revenue=Sum(
                "subtotal"
            ),
        )
        .order_by(
            "-co_orders",
            "-quantity_sold",
            "-revenue",
        )[:limit]
    )


    recommendations = []


    for index, row in enumerate(
        candidates,
        start=1,
    ):
        score = (
            (
                row[
                    "co_orders"
                ]
                or 0
            )
            * 10
        ) + (
            row[
                "quantity_sold"
            ]
            or 0
        )


        recommendations.append(
            {
                "rank":
                    index,

                "product_id":
                    row[
                        "product_id"
                    ],

                "name":
                    row[
                        "product__name"
                    ],

                "sku":
                    row[
                        "product__sku"
                    ],

                "category":
                    (
                        row[
                            "product__category__name"
                        ]
                        or "Uncategorized"
                    ),

                "selling_price":
                    round_number(
                        row[
                            "product__selling_price"
                        ]
                    ),

                "stock_quantity":
                    row[
                        "product__stock_quantity"
                    ]
                    or 0,

                "score":
                    score,

                "co_purchase_orders":
                    row[
                        "co_orders"
                    ]
                    or 0,

                "reason":
                    (
                        "Frequently purchased with "
                        "products this customer buys"
                    ),
            }
        )


    # ========================================================
    # IF NO ASSOCIATION FOUND
    # ========================================================

    if not recommendations:
        fallback = (
            generate_product_recommendations(
                customer_id=None,
                limit=limit,
            )
        )

        fallback[
            "mode"
        ] = "POPULARITY_FALLBACK"

        fallback[
            "customer"
        ] = {
            "id":
                customer.id,

            "name":
                customer.name,
        }

        return fallback


    return {
        "status":
            "SUCCESS",

        "mode":
            "CO_PURCHASE",

        "customer": {
            "id":
                customer.id,

            "name":
                customer.name,

            "customer_code":
                getattr(
                    customer,
                    "customer_code",
                    "",
                ),

            "type":
                customer.type,
        },

        "summary": {
            "purchased_products":
                len(
                    purchased_product_ids
                ),

            "recommendations":
                len(
                    recommendations
                ),
        },

        "results":
            recommendations,
    }


# ============================================================
# CUSTOMER CHURN RISK
# ============================================================

def generate_customer_churn_analysis():
    """
    Behaviour-based churn risk analysis.

    This is NOT a supervised classifier because
    RetailVision does not currently contain a
    historical churn label.

    Risk is estimated from:
        recency
        frequency
        average purchase interval
        total spending
    """

    today = (
        timezone.localdate()
    )


    customers = (
        Customer.objects.all()
        .order_by(
            "name"
        )
    )


    results = []


    for customer in customers:
        orders = (
            Order.objects
            .filter(
                customer=
                    customer,

                status__in=
                    ELIGIBLE_ORDER_STATUSES,
            )
            .order_by(
                "order_date"
            )
        )


        order_count = (
            orders.count()
        )


        # ----------------------------------------------------
        # NO PURCHASE HISTORY
        # ----------------------------------------------------

        if order_count == 0:
            results.append(
                {
                    "customer_id":
                        customer.id,

                    "customer_code":
                        getattr(
                            customer,
                            "customer_code",
                            "",
                        ),

                    "name":
                        customer.name,

                    "phone":
                        customer.phone,

                    "customer_type":
                        customer.type,

                    "orders":
                        0,

                    "total_spent":
                        0,

                    "average_order_value":
                        0,

                    "days_since_last_order":
                        None,

                    "average_days_between_orders":
                        None,

                    "expected_return_days":
                        30,

                    "risk_score":
                        100,

                    "estimated_churn_probability":
                        100,

                    "risk_level":
                        "HIGH",

                    "status":
                        "NO_PURCHASE_HISTORY",

                    "recommendation":
                        (
                            "Run a first-purchase campaign "
                            "or onboarding offer."
                        ),
                }
            )

            continue


        # ----------------------------------------------------
        # AGGREGATES
        # ----------------------------------------------------

        aggregates = (
            orders.aggregate(
                total_spent=Sum(
                    "grand_total"
                ),

                first_order=Min(
                    "order_date"
                ),

                last_order=Max(
                    "order_date"
                ),
            )
        )


        total_spent = round_number(
            aggregates[
                "total_spent"
            ]
        )


        average_order_value = (
            total_spent
            / order_count
            if order_count > 0
            else 0
        )


        first_order_date = (
            aggregates[
                "first_order"
            ]
            .date()
        )


        last_order_date = (
            aggregates[
                "last_order"
            ]
            .date()
        )


        days_since_last_order = (
            today
            - last_order_date
        ).days


        # ----------------------------------------------------
        # AVERAGE PURCHASE INTERVAL
        # ----------------------------------------------------

        order_dates = [
            order.order_date.date()
            for order in orders
        ]


        gaps = []


        for index in range(
            1,
            len(
                order_dates
            ),
        ):
            gap = (
                order_dates[
                    index
                ]
                - order_dates[
                    index - 1
                ]
            ).days

            gaps.append(
                max(
                    gap,
                    1,
                )
            )


        average_days_between_orders = (
            sum(
                gaps
            )
            / len(
                gaps
            )
            if gaps
            else None
        )


        # ----------------------------------------------------
        # EXPECTED RETURN PERIOD
        # ----------------------------------------------------

        if average_days_between_orders:
            expected_return_days = max(
                int(
                    round(
                        average_days_between_orders
                        * 1.5
                    )
                ),
                14,
            )

        else:
            expected_return_days = 30


        # ----------------------------------------------------
        # RISK SCORE
        # ----------------------------------------------------

        overdue_ratio = (
            days_since_last_order
            / max(
                expected_return_days,
                1,
            )
        )


        recency_score = min(
            overdue_ratio
            * 60,
            60,
        )


        if order_count == 1:
            frequency_score = 25

        elif order_count == 2:
            frequency_score = 15

        elif order_count <= 5:
            frequency_score = 8

        else:
            frequency_score = 0


        # Customers with longer established history
        # receive a small stability advantage.

        customer_age_days = max(
            (
                today
                - first_order_date
            ).days,
            1,
        )


        if customer_age_days >= 180:
            stability_adjustment = -5

        elif customer_age_days >= 90:
            stability_adjustment = -3

        else:
            stability_adjustment = 0


        # High-spend customers receive a small
        # retention/stability adjustment.

        if total_spent >= 100000:
            value_adjustment = -8

        elif total_spent >= 50000:
            value_adjustment = -5

        elif total_spent >= 10000:
            value_adjustment = -2

        else:
            value_adjustment = 0


        risk_score = (
            recency_score
            + frequency_score
            + stability_adjustment
            + value_adjustment
        )


        risk_score = max(
            min(
                risk_score,
                100,
            ),
            0,
        )


        risk_score = round(
            risk_score,
            2,
        )


        # ----------------------------------------------------
        # CLASSIFICATION
        # ----------------------------------------------------

        if risk_score >= 70:
            risk_level = "HIGH"

            recommendation = (
                "Immediate retention action recommended."
            )

        elif risk_score >= 40:
            risk_level = "MEDIUM"

            recommendation = (
                "Send personalized offers and monitor activity."
            )

        else:
            risk_level = "LOW"

            recommendation = (
                "Customer engagement is currently healthy."
            )


        results.append(
            {
                "customer_id":
                    customer.id,

                "customer_code":
                    getattr(
                        customer,
                        "customer_code",
                        "",
                    ),

                "name":
                    customer.name,

                "phone":
                    customer.phone,

                "customer_type":
                    customer.type,

                "orders":
                    order_count,

                "total_spent":
                    total_spent,

                "average_order_value":
                    round_number(
                        average_order_value
                    ),

                "days_since_last_order":
                    days_since_last_order,

                "average_days_between_orders":
                    (
                        round_number(
                            average_days_between_orders
                        )
                        if average_days_between_orders
                        is not None
                        else None
                    ),

                "expected_return_days":
                    expected_return_days,

                "risk_score":
                    risk_score,

                "estimated_churn_probability":
                    risk_score,

                "risk_level":
                    risk_level,

                "status":
                    "ANALYZED",

                "recommendation":
                    recommendation,
            }
        )


    # ========================================================
    # SORT HIGH RISK FIRST
    # ========================================================

    results.sort(
        key=lambda row:
            row[
                "risk_score"
            ],
        reverse=True,
    )


    high_risk = sum(
        1
        for row in results
        if row[
            "risk_level"
        ] == "HIGH"
    )


    medium_risk = sum(
        1
        for row in results
        if row[
            "risk_level"
        ] == "MEDIUM"
    )


    low_risk = sum(
        1
        for row in results
        if row[
            "risk_level"
        ] == "LOW"
    )


    analyzed_customers = sum(
        1
        for row in results
        if row[
            "status"
        ] == "ANALYZED"
    )


    return {
        "status":
            "SUCCESS",

        "model":
            "BEHAVIORAL_RISK_SCORING",

        "note":
            (
                "Risk is estimated from customer behaviour. "
                "It is not a supervised churn classifier "
                "because historical churn labels are not yet available."
            ),

        "summary": {
            "total_customers":
                len(
                    results
                ),

            "analyzed_customers":
                analyzed_customers,

            "high_risk":
                high_risk,

            "medium_risk":
                medium_risk,

            "low_risk":
                low_risk,
        },

        "results":
            results,
    }


# ============================================================
# MARKET BASKET ANALYSIS
# ============================================================

def generate_market_basket_analysis(
    days=365,
    min_support=1,
    min_confidence=10,
    limit=50,
):
    """
    Association-rule style market basket analysis.

    Calculates:
        support
        confidence
        lift
    """

    days = max(
        min(
            int(days),
            1825,
        ),
        1,
    )


    min_support = max(
        float(
            min_support
        ),
        0,
    )


    min_confidence = max(
        float(
            min_confidence
        ),
        0,
    )


    limit = max(
        min(
            int(limit),
            200,
        ),
        1,
    )


    start_date = (
        timezone.localdate()
        - timedelta(
            days=days
        )
    )


    items = (
        OrderItem.objects
        .filter(
            order__status__in=
                ELIGIBLE_ORDER_STATUSES,

            order__order_date__date__gte=
                start_date,

            product__isnull=False,
        )
        .values(
            "order_id",
            "product_id",
            "product__name",
            "product__sku",
        )
        .order_by(
            "order_id"
        )
    )


    order_products = defaultdict(
        set
    )


    product_details = {}


    for item in items:
        product_id = (
            item[
                "product_id"
            ]
        )


        order_products[
            item[
                "order_id"
            ]
        ].add(
            product_id
        )


        product_details[
            product_id
        ] = {
            "id":
                product_id,

            "name":
                item[
                    "product__name"
                ],

            "sku":
                item[
                    "product__sku"
                ],
        }


    total_orders = (
        len(
            order_products
        )
    )


    if total_orders == 0:
        return {
            "status":
                "INSUFFICIENT_DATA",

            "message":
                "No eligible sales orders found.",

            "summary": {
                "orders_analyzed": 0,
                "rules_generated": 0,
            },

            "results": [],
        }


    product_counts = Counter()

    pair_counts = Counter()


    for product_ids in (
        order_products.values()
    ):
        unique_products = sorted(
            product_ids
        )


        for product_id in (
            unique_products
        ):
            product_counts[
                product_id
            ] += 1


        if len(
            unique_products
        ) >= 2:
            for pair in combinations(
                unique_products,
                2,
            ):
                pair_counts[
                    pair
                ] += 1


    rules = []


    for (
        product_a,
        product_b,
    ), pair_count in (
        pair_counts.items()
    ):
        support_fraction = (
            pair_count
            / total_orders
        )


        support_percent = (
            support_fraction
            * 100
        )


        if (
            support_percent
            < min_support
        ):
            continue


        count_a = (
            product_counts[
                product_a
            ]
        )


        count_b = (
            product_counts[
                product_b
            ]
        )


        confidence_a_to_b = (
            (
                pair_count
                / count_a
            )
            * 100
            if count_a > 0
            else 0
        )


        confidence_b_to_a = (
            (
                pair_count
                / count_b
            )
            * 100
            if count_b > 0
            else 0
        )


        support_a = (
            count_a
            / total_orders
        )


        support_b = (
            count_b
            / total_orders
        )


        lift = (
            support_fraction
            / (
                support_a
                * support_b
            )
            if (
                support_a > 0
                and support_b > 0
            )
            else 0
        )


        # ----------------------------------------------------
        # USE STRONGER DIRECTION
        # ----------------------------------------------------

        if (
            confidence_a_to_b
            >= confidence_b_to_a
        ):
            antecedent_id = (
                product_a
            )

            consequent_id = (
                product_b
            )

            confidence = (
                confidence_a_to_b
            )

        else:
            antecedent_id = (
                product_b
            )

            consequent_id = (
                product_a
            )

            confidence = (
                confidence_b_to_a
            )


        if (
            confidence
            < min_confidence
        ):
            continue


        antecedent = (
            product_details[
                antecedent_id
            ]
        )


        consequent = (
            product_details[
                consequent_id
            ]
        )


        strength = (
            "STRONG"
            if lift >= 1.5
            and confidence >= 50

            else "MEDIUM"
            if lift >= 1.0

            else "WEAK"
        )


        rules.append(
            {
                "antecedent":
                    antecedent,

                "consequent":
                    consequent,

                "pair_orders":
                    pair_count,

                "support":
                    round(
                        support_percent,
                        2,
                    ),

                "confidence":
                    round(
                        confidence,
                        2,
                    ),

                "lift":
                    round(
                        lift,
                        3,
                    ),

                "strength":
                    strength,

                "recommendation":
                    (
                        f"Recommend {consequent['name']} "
                        f"when {antecedent['name']} is purchased."
                    ),
            }
        )


    rules.sort(
        key=lambda row: (
            row[
                "lift"
            ],
            row[
                "confidence"
            ],
            row[
                "support"
            ],
        ),
        reverse=True,
    )


    rules = (
        rules[
            :limit
        ]
    )


    strong_rules = sum(
        1
        for rule in rules
        if rule[
            "strength"
        ] == "STRONG"
    )


    return {
        "status":
            "SUCCESS",

        "analysis_days":
            days,

        "summary": {
            "orders_analyzed":
                total_orders,

            "unique_products":
                len(
                    product_counts
                ),

            "product_pairs":
                len(
                    pair_counts
                ),

            "rules_generated":
                len(
                    rules
                ),

            "strong_rules":
                strong_rules,
        },

        "results":
            rules,
    }