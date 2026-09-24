from django.urls import path

from .views import (
    ExpiredProductListView,
    InventorySummaryView,
    InventoryTransactionListView,
    LowStockListView,
    StockAdjustmentCreateView,
    StockAdjustmentListView,
    StockInCreateView,
)


urlpatterns = [

    # ========================================================
    # SUMMARY
    # ========================================================

    path(
        "summary/",
        InventorySummaryView.as_view(),
        name="inventory-summary",
    ),


    # ========================================================
    # INVENTORY TRANSACTIONS
    # ========================================================

    path(
        "transactions/",
        InventoryTransactionListView.as_view(),
        name="inventory-transactions",
    ),


    # ========================================================
    # STOCK IN
    # ========================================================

    path(
        "stock-in/",
        StockInCreateView.as_view(),
        name="inventory-stock-in",
    ),


    # ========================================================
    # STOCK ADJUSTMENTS
    # ========================================================

    path(
        "adjustments/",
        StockAdjustmentListView.as_view(),
        name="inventory-adjustments",
    ),

    path(
        "adjustments/create/",
        StockAdjustmentCreateView.as_view(),
        name="inventory-adjustment-create",
    ),


    # ========================================================
    # ALERTS
    # ========================================================

    path(
        "low-stock/",
        LowStockListView.as_view(),
        name="inventory-low-stock",
    ),

    path(
        "expired/",
        ExpiredProductListView.as_view(),
        name="inventory-expired",
    ),
]