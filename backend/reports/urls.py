from django.urls import path

from .export_views import (
    ReportExcelExportView,
    ReportPDFExportView,
)

from .views import (
    CustomerReportView,
    InventoryReportView,
    ProfitReportView,
    SalesReportView,
    SupplierReportView,
)


urlpatterns = [

    # ========================================================
    # REPORT DATA
    # ========================================================

    path(
        "sales/",
        SalesReportView.as_view(),
        name="sales-report",
    ),

    path(
        "profit/",
        ProfitReportView.as_view(),
        name="profit-report",
    ),

    path(
        "inventory/",
        InventoryReportView.as_view(),
        name="inventory-report",
    ),

    path(
        "customers/",
        CustomerReportView.as_view(),
        name="customer-report",
    ),

    path(
        "suppliers/",
        SupplierReportView.as_view(),
        name="supplier-report",
    ),


    # ========================================================
    # EXPORTS
    # ========================================================

    path(
        "<str:report_type>/export/excel/",
        ReportExcelExportView.as_view(),
        name="report-excel-export",
    ),

    path(
        "<str:report_type>/export/pdf/",
        ReportPDFExportView.as_view(),
        name="report-pdf-export",
    ),

]