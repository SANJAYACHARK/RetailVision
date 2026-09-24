from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .ml_services import (
    generate_demand_prediction,
    generate_sales_forecast,
)


# ============================================================
# COMMON DAYS PARSER
# ============================================================

def parse_days(
    request,
    default=30,
):
    value = (
        request.query_params.get(
            "days",
            default,
        )
    )


    try:
        days = int(
            value
        )

    except (
        TypeError,
        ValueError,
    ):
        return None, Response(
            {
                "detail":
                    "Days must be a valid integer."
            },
            status=400,
        )


    if days < 1:
        return None, Response(
            {
                "detail":
                    "Days must be greater than 0."
            },
            status=400,
        )


    if days > 365:
        return None, Response(
            {
                "detail":
                    "Maximum prediction period is 365 days."
            },
            status=400,
        )


    return days, None


# ============================================================
# SALES FORECAST
# ============================================================

class SalesForecastView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        days, error = (
            parse_days(
                request
            )
        )


        if error:
            return error


        result = (
            generate_sales_forecast(
                forecast_days=
                    days
            )
        )


        return Response(
            result
        )


# ============================================================
# DEMAND PREDICTION
# ============================================================

class DemandPredictionView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        days, error = (
            parse_days(
                request
            )
        )


        if error:
            return error


        result = (
            generate_demand_prediction(
                prediction_days=
                    days
            )
        )


        return Response(
            result
        )