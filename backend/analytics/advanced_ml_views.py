from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .advanced_ml_services import (
    generate_customer_churn_analysis,
    generate_market_basket_analysis,
    generate_product_recommendations,
)


# ============================================================
# PRODUCT RECOMMENDATION
# ============================================================

class ProductRecommendationView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        customer_id = (
            request.query_params.get(
                "customer_id"
            )
        )


        limit = (
            request.query_params.get(
                "limit",
                10,
            )
        )


        try:
            limit = int(
                limit
            )

        except (
            TypeError,
            ValueError,
        ):
            return Response(
                {
                    "detail":
                        "Limit must be an integer."
                },
                status=400,
            )


        result = (
            generate_product_recommendations(
                customer_id=
                    customer_id,

                limit=
                    limit,
            )
        )


        if (
            result.get(
                "status"
            )
            == "NOT_FOUND"
        ):
            return Response(
                result,
                status=404,
            )


        return Response(
            result
        )


# ============================================================
# CUSTOMER CHURN
# ============================================================

class CustomerChurnView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        result = (
            generate_customer_churn_analysis()
        )


        return Response(
            result
        )


# ============================================================
# MARKET BASKET
# ============================================================

class MarketBasketView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        try:
            days = int(
                request.query_params.get(
                    "days",
                    365,
                )
            )

            min_support = float(
                request.query_params.get(
                    "min_support",
                    1,
                )
            )

            min_confidence = float(
                request.query_params.get(
                    "min_confidence",
                    10,
                )
            )

            limit = int(
                request.query_params.get(
                    "limit",
                    50,
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            return Response(
                {
                    "detail":
                        (
                            "Invalid market basket "
                            "analysis parameters."
                        )
                },
                status=400,
            )


        result = (
            generate_market_basket_analysis(
                days=
                    days,

                min_support=
                    min_support,

                min_confidence=
                    min_confidence,

                limit=
                    limit,
            )
        )


        return Response(
            result
        )