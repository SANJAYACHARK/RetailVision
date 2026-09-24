from django.urls import path

from .views import (
    ABCInventoryAnalyticsView,
    AnalyticsOverviewView,
    CategoryAnalyticsView,
    CustomerAnalyticsView,
    InventoryAnalyticsView,
    MarginAnalyticsView,
    ProductPerformanceView,
    SalesTrendView,
)
from .ml_views import (
    DemandPredictionView,
    SalesForecastView,
)

from .advanced_ml_views import (
    CustomerChurnView,
    MarketBasketView,
    ProductRecommendationView,
)

urlpatterns = [

    path(
        "overview/",
        AnalyticsOverviewView.as_view(),
        name="analytics-overview",
    ),

    path(
        "sales-trend/",
        SalesTrendView.as_view(),
        name="analytics-sales-trend",
    ),

    path(
        "products/",
        ProductPerformanceView.as_view(),
        name="analytics-products",
    ),

    path(
        "categories/",
        CategoryAnalyticsView.as_view(),
        name="analytics-categories",
    ),

    path(
        "customers/",
        CustomerAnalyticsView.as_view(),
        name="analytics-customers",
    ),

    path(
        "abc/",
        ABCInventoryAnalyticsView.as_view(),
        name="analytics-abc",
    ),

    path(
        "margins/",
        MarginAnalyticsView.as_view(),
        name="analytics-margins",
    ),

    path(
        "inventory/",
        InventoryAnalyticsView.as_view(),
        name="analytics-inventory",
    ),
    
    path(
        "ml/sales-forecast/",
        SalesForecastView.as_view(),
        name="ml-sales-forecast",
    ),

    path(
        "ml/demand-prediction/",
        DemandPredictionView.as_view(),
        name="ml-demand-prediction",
    ),
    
    path(
        "ml/recommendations/",
        ProductRecommendationView.as_view(),
        name="ml-product-recommendations",
    ),

    path(
        "ml/churn/",
        CustomerChurnView.as_view(),
        name="ml-customer-churn",
    ),

    path(
        "ml/market-basket/",
        MarketBasketView.as_view(),
        name="ml-market-basket",
    ),
    


]