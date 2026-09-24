from datetime import timedelta
from decimal import Decimal

import numpy as np
import pandas as pd

from django.db.models import Sum
from django.db.models.functions import TruncDate

from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

from sales.models import (
    Order,
    OrderItem,
)


# ============================================================
# COMMON HELPERS
# ============================================================

def decimal_to_float(value):
    if value is None:
        return 0.0

    return float(
        Decimal(
            str(value)
        )
    )


def round_money(value):
    return round(
        float(
            value or 0
        ),
        2,
    )


def safe_percent(value):
    if value is None:
        return 0.0

    if np.isnan(value):
        return 0.0

    if np.isinf(value):
        return 0.0

    return round(
        float(value),
        2,
    )


def get_confidence_level(
    r2,
    mae_percentage,
):
    """
    Simple academic confidence label.

    HIGH:
        strong R² and low MAE %

    MEDIUM:
        acceptable R² / MAE

    LOW:
        weak model fit
    """

    if (
        r2 >= 0.75
        and mae_percentage <= 15
    ):
        return "HIGH"

    if (
        r2 >= 0.40
        and mae_percentage <= 30
    ):
        return "MEDIUM"

    return "LOW"


# ============================================================
# SALES DATAFRAME
# ============================================================

def build_daily_sales_dataframe():
    sales = (
        Order.objects
        .filter(
            status__in=[
                Order.Status.COMPLETED,
                Order.Status.RETURNED,
            ]
        )
        .annotate(
            sale_date=TruncDate(
                "order_date"
            )
        )
        .values(
            "sale_date"
        )
        .annotate(
            revenue=Sum(
                "grand_total"
            )
        )
        .order_by(
            "sale_date"
        )
    )


    historical = [
        {
            "date":
                row["sale_date"],

            "revenue":
                decimal_to_float(
                    row["revenue"]
                ),
        }
        for row in sales
    ]


    if not historical:
        return pd.DataFrame()


    dataframe = pd.DataFrame(
        historical
    )


    dataframe["date"] = (
        pd.to_datetime(
            dataframe["date"]
        )
    )


    full_date_range = (
        pd.date_range(
            start=
                dataframe["date"].min(),

            end=
                dataframe["date"].max(),

            freq="D",
        )
    )


    dataframe = (
        dataframe
        .set_index(
            "date"
        )
        .reindex(
            full_date_range
        )
        .fillna(
            {
                "revenue": 0
            }
        )
        .rename_axis(
            "date"
        )
        .reset_index()
    )


    return dataframe


# ============================================================
# SALES FORECAST FEATURES
# ============================================================

def add_sales_features(
    dataframe,
):
    dataframe = (
        dataframe.copy()
    )


    dataframe["day_index"] = (
        np.arange(
            len(dataframe)
        )
    )


    dataframe["weekday"] = (
        dataframe["date"]
        .dt
        .weekday
    )


    dataframe["month"] = (
        dataframe["date"]
        .dt
        .month
    )


    dataframe["day_of_month"] = (
        dataframe["date"]
        .dt
        .day
    )


    dataframe["week_of_year"] = (
        dataframe["date"]
        .dt
        .isocalendar()
        .week
        .astype(int)
    )


    dataframe["is_weekend"] = (
        dataframe["weekday"]
        .isin(
            [
                5,
                6,
            ]
        )
        .astype(int)
    )


    return dataframe


# ============================================================
# SALES FORECAST MODEL
# ============================================================

def generate_sales_forecast(
    forecast_days=30,
):
    dataframe = (
        build_daily_sales_dataframe()
    )


    if dataframe.empty:
        return {
            "model":
                "LINEAR_REGRESSION",

            "status":
                "INSUFFICIENT_DATA",

            "message":
                "No completed sales data available.",

            "historical": [],

            "forecast": [],

            "summary": {},

            "metrics": {},
        }


    if len(dataframe) < 7:
        return {
            "model":
                "LINEAR_REGRESSION",

            "status":
                "INSUFFICIENT_DATA",

            "message":
                (
                    "At least 7 days of sales history "
                    "are required to generate a forecast."
                ),

            "historical": [
                {
                    "date":
                        row["date"].date(),

                    "revenue":
                        round_money(
                            row["revenue"]
                        ),
                }
                for _, row
                in dataframe.iterrows()
            ],

            "forecast": [],

            "summary": {},

            "metrics": {},
        }


    dataframe = (
        add_sales_features(
            dataframe
        )
    )


    feature_columns = [
        "day_index",
        "weekday",
        "month",
        "day_of_month",
        "week_of_year",
        "is_weekend",
    ]


    # ========================================================
    # TRAIN / TEST SPLIT
    # ========================================================

    total_rows = (
        len(dataframe)
    )


    test_size = max(
        int(
            total_rows * 0.20
        ),
        2,
    )


    if (
        total_rows - test_size
        < 5
    ):
        test_size = 2


    train_dataframe = (
        dataframe.iloc[
            :-test_size
        ]
    )


    test_dataframe = (
        dataframe.iloc[
            -test_size:
        ]
    )


    model = LinearRegression()


    model.fit(
        train_dataframe[
            feature_columns
        ],
        train_dataframe[
            "revenue"
        ],
    )


    # ========================================================
    # TEST PREDICTIONS
    # ========================================================

    test_predictions = (
        model.predict(
            test_dataframe[
                feature_columns
            ]
        )
    )


    test_predictions = (
        np.maximum(
            test_predictions,
            0,
        )
    )


    actual_values = (
        test_dataframe[
            "revenue"
        ].values
    )


    mae = (
        mean_absolute_error(
            actual_values,
            test_predictions,
        )
    )


    rmse = np.sqrt(
        mean_squared_error(
            actual_values,
            test_predictions,
        )
    )


    if (
        len(actual_values) >= 2
        and np.var(
            actual_values
        ) > 0
    ):
        r2 = (
            r2_score(
                actual_values,
                test_predictions,
            )
        )
    else:
        r2 = 0.0


    actual_average = (
        np.mean(
            actual_values
        )
    )


    mae_percentage = (
        (
            mae
            / actual_average
        )
        * 100
        if actual_average > 0
        else 0
    )


    confidence = (
        get_confidence_level(
            r2,
            mae_percentage,
        )
    )


    # ========================================================
    # RETRAIN USING ALL DATA
    # ========================================================

    final_model = (
        LinearRegression()
    )


    final_model.fit(
        dataframe[
            feature_columns
        ],
        dataframe[
            "revenue"
        ],
    )


    # ========================================================
    # FUTURE DATA
    # ========================================================

    last_date = (
        dataframe["date"]
        .max()
    )


    future_rows = []


    for index in range(
        1,
        forecast_days + 1,
    ):
        future_date = (
            last_date
            + timedelta(
                days=index
            )
        )


        future_rows.append(
            {
                "date":
                    future_date,

                "day_index":
                    len(dataframe)
                    + index
                    - 1,

                "weekday":
                    future_date.weekday(),

                "month":
                    future_date.month,

                "day_of_month":
                    future_date.day,

                "week_of_year":
                    int(
                        future_date
                        .isocalendar()
                        .week
                    ),

                "is_weekend":
                    (
                        1
                        if future_date.weekday()
                        in [
                            5,
                            6,
                        ]
                        else 0
                    ),
            }
        )


    future_dataframe = (
        pd.DataFrame(
            future_rows
        )
    )


    predictions = (
        final_model.predict(
            future_dataframe[
                feature_columns
            ]
        )
    )


    predictions = (
        np.maximum(
            predictions,
            0,
        )
    )


    # ========================================================
    # RECENT TREND
    # ========================================================

    recent_window = min(
        14,
        len(dataframe),
    )


    older_start = max(
        0,
        len(dataframe)
        - (
            recent_window * 2
        ),
    )


    recent_data = (
        dataframe.tail(
            recent_window
        )
    )


    older_data = (
        dataframe.iloc[
            older_start:
            len(dataframe)
            - recent_window
        ]
    )


    recent_average = (
        recent_data[
            "revenue"
        ]
        .mean()
        if not recent_data.empty
        else 0
    )


    older_average = (
        older_data[
            "revenue"
        ]
        .mean()
        if not older_data.empty
        else recent_average
    )


    growth_percentage = (
        (
            (
                recent_average
                - older_average
            )
            / older_average
        )
        * 100
        if older_average > 0
        else 0
    )


    if growth_percentage > 5:
        trend = "GROWING"

    elif growth_percentage < -5:
        trend = "DECLINING"

    else:
        trend = "STABLE"


    # ========================================================
    # FORECAST RESPONSE
    # ========================================================

    forecast = []


    for index, prediction in enumerate(
        predictions
    ):
        forecast.append(
            {
                "date":
                    future_dataframe
                    .iloc[
                        index
                    ][
                        "date"
                    ]
                    .date(),

                "predicted_revenue":
                    round_money(
                        prediction
                    ),
            }
        )


    historical = [
        {
            "date":
                row["date"].date(),

            "revenue":
                round_money(
                    row["revenue"]
                ),
        }
        for _, row
        in dataframe.iterrows()
    ]


    total_forecast = sum(
        item[
            "predicted_revenue"
        ]
        for item in forecast
    )


    average_forecast = (
        total_forecast
        / len(forecast)
        if forecast
        else 0
    )


    return {
        "model":
            "LINEAR_REGRESSION",

        "status":
            "SUCCESS",

        "forecast_days":
            forecast_days,

        "historical_days":
            len(dataframe),

        "summary": {
            "predicted_total_revenue":
                round_money(
                    total_forecast
                ),

            "predicted_average_daily_revenue":
                round_money(
                    average_forecast
                ),

            "recent_average_daily_revenue":
                round_money(
                    recent_average
                ),

            "older_average_daily_revenue":
                round_money(
                    older_average
                ),

            "growth_percentage":
                safe_percent(
                    growth_percentage
                ),

            "trend":
                trend,

            "confidence":
                confidence,
        },

        "metrics": {
            "mae":
                round_money(
                    mae
                ),

            "rmse":
                round_money(
                    rmse
                ),

            "r2_score":
                round(
                    float(r2),
                    4,
                ),

            "mae_percentage":
                safe_percent(
                    mae_percentage
                ),

            "confidence":
                confidence,
        },

        "historical":
            historical,

        "forecast":
            forecast,
    }


# ============================================================
# PRODUCT DAILY SALES HELPER
# ============================================================

def get_product_daily_sales(
    product_id,
    start_date,
    end_date,
):
    rows = (
        OrderItem.objects
        .filter(
            product_id=
                product_id,

            order__status__in=[
                Order.Status.COMPLETED,
                Order.Status.RETURNED,
            ],

            order__order_date__date__gte=
                start_date,

            order__order_date__date__lte=
                end_date,
        )
        .annotate(
            sale_date=TruncDate(
                "order__order_date"
            )
        )
        .values(
            "sale_date"
        )
        .annotate(
            quantity=Sum(
                "quantity"
            )
        )
        .order_by(
            "sale_date"
        )
    )


    quantity_map = {
        row["sale_date"]:
            int(
                row["quantity"] or 0
            )
        for row in rows
    }


    total_days = (
        end_date - start_date
    ).days + 1


    daily_quantities = []


    for index in range(
        total_days
    ):
        current_date = (
            start_date
            + timedelta(
                days=index
            )
        )

        daily_quantities.append(
            quantity_map.get(
                current_date,
                0,
            )
        )


    return daily_quantities


# ============================================================
# PRODUCT DEMAND PREDICTION
# ============================================================

def generate_demand_prediction(
    prediction_days=30,
):
    items = (
        OrderItem.objects
        .filter(
            order__status__in=[
                Order.Status.COMPLETED,
                Order.Status.RETURNED,
            ]
        )
        .select_related(
            "product",
            "product__category",
        )
    )


    first_item = (
        items
        .order_by(
            "order__order_date"
        )
        .first()
    )


    last_item = (
        items
        .order_by(
            "-order__order_date"
        )
        .first()
    )


    if (
        not first_item
        or not last_item
    ):
        return {
            "status":
                "INSUFFICIENT_DATA",

            "message":
                "No completed sales data available.",

            "prediction_days":
                prediction_days,

            "summary": {},

            "products": [],
        }


    first_date = (
        first_item
        .order
        .order_date
        .date()
    )


    last_date = (
        last_item
        .order
        .order_date
        .date()
    )


    historical_days = max(
        (
            last_date
            - first_date
        ).days
        + 1,
        1,
    )


    # ========================================================
    # PRODUCT TOTALS
    # ========================================================

    product_rows = (
        items
        .values(
            "product_id",
            "product_name",
            "product_sku",
            "product__category__name",
            "product__stock_quantity",
            "product__reorder_level",
            "product__max_stock",
        )
        .annotate(
            total_quantity=Sum(
                "quantity"
            ),

            total_revenue=Sum(
                "subtotal"
            ),
        )
        .order_by(
            "-total_quantity"
        )
    )


    predictions = []


    for row in product_rows:
        product_id = (
            row[
                "product_id"
            ]
        )


        total_quantity = (
            row[
                "total_quantity"
            ]
            or 0
        )


        current_stock = (
            row[
                "product__stock_quantity"
            ]
            or 0
        )


        reorder_level = (
            row[
                "product__reorder_level"
            ]
            or 0
        )


        max_stock = (
            row[
                "product__max_stock"
            ]
            or 0
        )


        # ====================================================
        # OVERALL DAILY DEMAND
        # ====================================================

        overall_daily_average = (
            float(
                total_quantity
            )
            / historical_days
        )


        # ====================================================
        # RECENT VS OLDER TREND
        # ====================================================

        trend_window = min(
            30,
            max(
                historical_days // 2,
                1,
            ),
        )


        recent_start = (
            last_date
            - timedelta(
                days=
                    trend_window
                    - 1
            )
        )


        older_end = (
            recent_start
            - timedelta(
                days=1
            )
        )


        older_start = (
            older_end
            - timedelta(
                days=
                    trend_window
                    - 1
            )
        )


        recent_quantities = (
            get_product_daily_sales(
                product_id,
                recent_start,
                last_date,
            )
        )


        recent_average = (
            np.mean(
                recent_quantities
            )
            if recent_quantities
            else 0
        )


        if (
            older_start
            >= first_date
        ):
            older_quantities = (
                get_product_daily_sales(
                    product_id,
                    older_start,
                    older_end,
                )
            )

            older_average = (
                np.mean(
                    older_quantities
                )
                if older_quantities
                else 0
            )

        else:
            older_average = (
                overall_daily_average
            )


        growth_percentage = (
            (
                (
                    recent_average
                    - older_average
                )
                / older_average
            )
            * 100
            if older_average > 0
            else 0
        )


        # ====================================================
        # TREND CLASSIFICATION
        # ====================================================

        if growth_percentage >= 20:
            trend = "STRONG_GROWTH"

            trend_factor = 1.20

        elif growth_percentage >= 5:
            trend = "GROWING"

            trend_factor = 1.10

        elif growth_percentage <= -20:
            trend = "STRONG_DECLINE"

            trend_factor = 0.80

        elif growth_percentage <= -5:
            trend = "DECLINING"

            trend_factor = 0.90

        else:
            trend = "STABLE"

            trend_factor = 1.00


        # ====================================================
        # WEIGHTED DAILY DEMAND
        # ====================================================

        weighted_daily_demand = (
            (
                overall_daily_average
                * 0.40
            )
            +
            (
                recent_average
                * 0.60
            )
        )


        adjusted_daily_demand = (
            weighted_daily_demand
            * trend_factor
        )


        predicted_quantity = (
            adjusted_daily_demand
            * prediction_days
        )


        predicted_quantity = max(
            predicted_quantity,
            0,
        )


        predicted_quantity_int = (
            int(
                np.ceil(
                    predicted_quantity
                )
            )
        )


        # ====================================================
        # DEMAND VARIABILITY
        # ====================================================

        recent_std = (
            np.std(
                recent_quantities
            )
            if recent_quantities
            else 0
        )


        # Approximate safety stock.
        safety_stock = (
            int(
                np.ceil(
                    recent_std
                    * np.sqrt(
                        max(
                            prediction_days,
                            1,
                        )
                    )
                )
            )
        )


        # ====================================================
        # TARGET STOCK
        # ====================================================

        desired_stock = (
            predicted_quantity_int
            + safety_stock
        )


        desired_stock = max(
            desired_stock,
            reorder_level,
        )


        if max_stock > 0:
            desired_stock = min(
                desired_stock,
                max_stock,
            )


        recommended_reorder = max(
            desired_stock
            - current_stock,
            0,
        )


        # ====================================================
        # STOCK COVERAGE DAYS
        # ====================================================

        if adjusted_daily_demand > 0:
            stock_coverage_days = (
                current_stock
                / adjusted_daily_demand
            )
        else:
            stock_coverage_days = 999


        # ====================================================
        # DEMAND LEVEL
        # ====================================================

        if predicted_quantity_int >= 50:
            demand_level = "HIGH"

        elif predicted_quantity_int >= 20:
            demand_level = "MEDIUM"

        else:
            demand_level = "LOW"


        # ====================================================
        # STOCK RISK
        # ====================================================

        if current_stock <= 0:
            stock_risk = (
                "OUT_OF_STOCK"
            )

        elif (
            stock_coverage_days
            <= 7
        ):
            stock_risk = (
                "CRITICAL"
            )

        elif (
            desired_stock
            > current_stock
        ):
            stock_risk = (
                "HIGH_RISK"
            )

        elif (
            current_stock
            <= reorder_level
        ):
            stock_risk = (
                "LOW_STOCK"
            )

        else:
            stock_risk = (
                "SAFE"
            )


        # ====================================================
        # PRODUCT CONFIDENCE
        # ====================================================

        if historical_days >= 90:
            confidence = "HIGH"

        elif historical_days >= 30:
            confidence = "MEDIUM"

        else:
            confidence = "LOW"


        predictions.append(
            {
                "product_id":
                    product_id,

                "product_name":
                    row[
                        "product_name"
                    ],

                "sku":
                    row[
                        "product_sku"
                    ],

                "category":
                    (
                        row[
                            "product__category__name"
                        ]
                        or "Uncategorized"
                    ),

                "historical_quantity":
                    total_quantity,

                "historical_days":
                    historical_days,

                "average_daily_demand":
                    round(
                        overall_daily_average,
                        2,
                    ),

                "recent_average_daily_demand":
                    round(
                        float(
                            recent_average
                        ),
                        2,
                    ),

                "older_average_daily_demand":
                    round(
                        float(
                            older_average
                        ),
                        2,
                    ),

                "growth_percentage":
                    safe_percent(
                        growth_percentage
                    ),

                "trend":
                    trend,

                "prediction_days":
                    prediction_days,

                "predicted_quantity":
                    predicted_quantity_int,

                "current_stock":
                    current_stock,

                "reorder_level":
                    reorder_level,

                "max_stock":
                    max_stock,

                "safety_stock":
                    safety_stock,

                "desired_stock":
                    desired_stock,

                "recommended_reorder_quantity":
                    recommended_reorder,

                "stock_coverage_days":
                    (
                        round(
                            stock_coverage_days,
                            1,
                        )
                        if stock_coverage_days
                        != 999
                        else None
                    ),

                "demand_level":
                    demand_level,

                "stock_risk":
                    stock_risk,

                "confidence":
                    confidence,

                "historical_revenue":
                    round_money(
                        row[
                            "total_revenue"
                        ]
                    ),
            }
        )


    # ========================================================
    # SORT BY IMPORTANCE
    # ========================================================

    risk_priority = {
        "OUT_OF_STOCK": 5,
        "CRITICAL": 4,
        "HIGH_RISK": 3,
        "LOW_STOCK": 2,
        "SAFE": 1,
    }


    predictions.sort(
        key=lambda item: (
            risk_priority.get(
                item[
                    "stock_risk"
                ],
                0,
            ),
            item[
                "recommended_reorder_quantity"
            ],
            item[
                "predicted_quantity"
            ],
        ),
        reverse=True,
    )


    high_demand = sum(
        1
        for product
        in predictions
        if product[
            "demand_level"
        ] == "HIGH"
    )


    stock_risk_products = sum(
        1
        for product
        in predictions
        if product[
            "stock_risk"
        ] != "SAFE"
    )


    critical_products = sum(
        1
        for product
        in predictions
        if product[
            "stock_risk"
        ] in [
            "CRITICAL",
            "OUT_OF_STOCK",
        ]
    )


    growing_products = sum(
        1
        for product
        in predictions
        if product[
            "trend"
        ] in [
            "GROWING",
            "STRONG_GROWTH",
        ]
    )


    total_reorder = sum(
        product[
            "recommended_reorder_quantity"
        ]
        for product
        in predictions
    )


    return {
        "status":
            "SUCCESS",

        "prediction_days":
            prediction_days,

        "historical_days":
            historical_days,

        "summary": {
            "products_analyzed":
                len(
                    predictions
                ),

            "high_demand_products":
                high_demand,

            "stock_risk_products":
                stock_risk_products,

            "critical_stock_products":
                critical_products,

            "growing_demand_products":
                growing_products,

            "recommended_total_reorder":
                total_reorder,
        },

        "products":
            predictions,
    }