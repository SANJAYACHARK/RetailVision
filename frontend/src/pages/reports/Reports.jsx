import {
  FileDown,
  FileSpreadsheet,
  Printer,
  RefreshCcw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../../api/api";


const REPORT_TABS = [
  {
    key: "sales",
    label: "Sales Report",
  },
  {
    key: "profit",
    label: "Profit Report",
  },
  {
    key: "inventory",
    label: "Inventory Report",
  },
  {
    key: "customers",
    label: "Customer Report",
  },
  {
    key: "suppliers",
    label: "Supplier Report",
  },
];


function Reports() {
  const [activeTab, setActiveTab] =
    useState("sales");

  const [reportData, setReportData] =
    useState({
      summary: {},
      results: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [exporting, setExporting] =
    useState("");

  const [error, setError] =
    useState("");

  const [filters, setFilters] =
    useState({
      start_date: "",
      end_date: "",
      status: "",
      payment_status: "",
      stock_status: "",
      customer_type: "",
    });


  // =========================================================
  // FORMATTERS
  // =========================================================

  const formatCurrency = (value) =>
    new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(value || 0)
    );


  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // =========================================================
  // BUILD FILTER PARAMS
  // =========================================================

  const buildParams = useCallback(
    () => {
      const params = {};

      if (filters.start_date) {
        params.start_date =
          filters.start_date;
      }

      if (filters.end_date) {
        params.end_date =
          filters.end_date;
      }


      // SALES
      if (
        activeTab === "sales"
      ) {
        if (filters.status) {
          params.status =
            filters.status;
        }

        if (
          filters.payment_status
        ) {
          params.payment_status =
            filters.payment_status;
        }
      }


      // INVENTORY
      if (
        activeTab === "inventory"
      ) {
        if (
          filters.stock_status
        ) {
          params.stock_status =
            filters.stock_status;
        }
      }


      // CUSTOMERS
      if (
        activeTab === "customers"
      ) {
        if (
          filters.customer_type
        ) {
          params.customer_type =
            filters.customer_type;
        }
      }


      // SUPPLIERS
      if (
        activeTab === "suppliers"
        && filters.status
      ) {
        params.status =
          filters.status;
      }


      return params;
    },
    [
      activeTab,
      filters,
    ]
  );


  // =========================================================
  // FETCH REPORT
  // =========================================================

  const fetchReport = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await api.get(
            `reports/${activeTab}/`,
            {
              params:
                buildParams(),
            }
          );

        setReportData({
          summary:
            response.data?.summary ||
            {},

          results:
            response.data?.results ||
            [],
        });

      } catch (error) {
        console.error(
          "Report load error:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load report."
        );

      } finally {
        setLoading(false);
      }
    },
    [
      activeTab,
      buildParams,
    ]
  );


  // =========================================================
  // LOAD REPORT
  // =========================================================

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);


  // =========================================================
  // FILTER CHANGE
  // =========================================================

  const handleFilterChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFilters(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const handleClearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      status: "",
      payment_status: "",
      stock_status: "",
      customer_type: "",
    });
  };


  // =========================================================
  // PRINT REPORT
  // =========================================================

  const handlePrint = () => {
    window.print();
  };


  // =========================================================
  // GET FILENAME FROM RESPONSE
  // =========================================================

  const getDownloadFilename = (
    response,
    format
  ) => {
    const disposition =
      response.headers?.[
        "content-disposition"
      ];

    let filename =
      `retailvision-${activeTab}-report.${
        format === "excel"
          ? "xlsx"
          : "pdf"
      }`;


    if (disposition) {
      const utfFilename =
        disposition.match(
          /filename\*=UTF-8''([^;]+)/i
        );

      const normalFilename =
        disposition.match(
          /filename="?([^";]+)"?/i
        );


      if (
        utfFilename?.[1]
      ) {
        filename =
          decodeURIComponent(
            utfFilename[1]
          );

      } else if (
        normalFilename?.[1]
      ) {
        filename =
          normalFilename[1];
      }
    }


    return filename;
  };


  // =========================================================
  // DOWNLOAD REPORT FILE
  // =========================================================

  const downloadReportFile =
    async (format) => {
      if (exporting) {
        return;
      }

      setExporting(format);
      setError("");

      try {
        const params =
          buildParams();

        const response =
          await api.get(
            `reports/${activeTab}/export/${format}/`,
            {
              params,
              responseType: "blob",
            }
          );


        const contentType =
          response.headers?.[
            "content-type"
          ] ||
          (
            format === "excel"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/pdf"
          );


        // If backend returned JSON error
        // even though responseType is blob.
        if (
          contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.data.text();

          let message =
            "Unable to export report.";

          try {
            const json =
              JSON.parse(text);

            message =
              json.detail ||
              message;

          } catch {
            // Ignore JSON parse failure.
          }

          throw new Error(
            message
          );
        }


        const blob =
          new Blob(
            [
              response.data
            ],
            {
              type:
                contentType,
            }
          );


        const url =
          window.URL
            .createObjectURL(
              blob
            );


        const filename =
          getDownloadFilename(
            response,
            format
          );


        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          filename;


        document.body
          .appendChild(
            link
          );


        link.click();


        document.body
          .removeChild(
            link
          );


        window.URL
          .revokeObjectURL(
            url
          );

      } catch (error) {
        console.error(
          "Report export failed:",
          error
        );

        setError(
          error.message ||
          "Unable to export report."
        );

      } finally {
        setExporting("");
      }
    };


  // =========================================================
  // TAB CHANGE
  // =========================================================

  const handleTabChange =
    (tabKey) => {
      setActiveTab(
        tabKey
      );

      setError("");
    };


  // =========================================================
  // JSX
  // =========================================================

  return (
    <div className="page-content reports-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-header reports-no-print">

        <div>

          <p className="page-eyebrow">
            Business Reports
          </p>

          <h1 className="page-title">
            Reports
          </h1>

          <p className="page-description">
            Generate and review sales,
            profit, inventory,
            customer and supplier
            reports.
          </p>

        </div>


        <div className="page-header-actions">

          {/* REFRESH */}

          <button
            type="button"
            className="secondary-button"
            onClick={
              fetchReport
            }
            disabled={
              loading ||
              Boolean(exporting)
            }
          >
            <RefreshCcw
              size={17}
            />

            Refresh
          </button>


          {/* PRINT */}

          <button
            type="button"
            className="secondary-button"
            onClick={
              handlePrint
            }
            disabled={
              loading
            }
          >
            <Printer
              size={17}
            />

            Print
          </button>


          {/* PDF EXPORT */}

          <button
            type="button"
            className="secondary-button"
            onClick={
              () =>
                downloadReportFile(
                  "pdf"
                )
            }
            disabled={
              loading ||
              Boolean(exporting)
            }
          >
            <FileDown
              size={17}
            />

            {
              exporting === "pdf"
                ? "Exporting..."
                : "PDF"
            }
          </button>


          {/* EXCEL EXPORT */}

          <button
            type="button"
            className="primary-button"
            onClick={
              () =>
                downloadReportFile(
                  "excel"
                )
            }
            disabled={
              loading ||
              Boolean(exporting)
            }
          >
            <FileSpreadsheet
              size={17}
            />

            {
              exporting === "excel"
                ? "Exporting..."
                : "Excel"
            }
          </button>

        </div>

      </div>


      {/* =====================================================
          PRINT HEADER
          ===================================================== */}

      <div className="reports-print-header">

        <h1>
          RetailVision
        </h1>

        <p>
          {
            REPORT_TABS.find(
              (tab) =>
                tab.key ===
                activeTab
            )?.label
          }
        </p>

        {
          (
            filters.start_date ||
            filters.end_date
          ) && (
            <p>
              Period:
              {" "}
              {
                filters.start_date ||
                "Beginning"
              }
              {" "}
              to
              {" "}
              {
                filters.end_date ||
                "Present"
              }
            </p>
          )
        }

      </div>


      {/* =====================================================
          REPORT TABS
          ===================================================== */}

      <div className="reports-tabs reports-no-print">

        {
          REPORT_TABS.map(
            (tab) => (

              <button
                key={tab.key}
                type="button"
                className={
                  activeTab ===
                  tab.key
                    ? "reports-tab active"
                    : "reports-tab"
                }
                onClick={
                  () =>
                    handleTabChange(
                      tab.key
                    )
                }
              >
                {tab.label}
              </button>

            )
          )
        }

      </div>


      {/* =====================================================
          FILTERS
          ===================================================== */}

      <ReportFilters
        activeTab={
          activeTab
        }
        filters={
          filters
        }
        onChange={
          handleFilterChange
        }
        onApply={
          fetchReport
        }
        onClear={
          handleClearFilters
        }
      />


      {/* =====================================================
          ERROR
          ===================================================== */}

      {
        error && (
          <div className="page-error reports-no-print">
            {error}
          </div>
        )
      }


      {/* =====================================================
          CONTENT
          ===================================================== */}

      {
        loading
          ? (
            <div className="page-loading">

              <div className="loading-spinner" />

              <p>
                Loading report...
              </p>

            </div>
          )
          : (
            <>

              <SummaryCards
                tab={
                  activeTab
                }
                summary={
                  reportData.summary
                }
                formatCurrency={
                  formatCurrency
                }
              />


              <ReportTable
                tab={
                  activeTab
                }
                rows={
                  reportData.results
                }
                formatCurrency={
                  formatCurrency
                }
                formatDate={
                  formatDate
                }
              />

            </>
          )
      }

    </div>
  );
}


// ============================================================
// REPORT FILTERS
// ============================================================

function ReportFilters({
  activeTab,
  filters,
  onChange,
  onApply,
  onClear,
}) {

  const showDateFilters =
    activeTab === "sales" ||
    activeTab === "profit" ||
    activeTab === "customers";


  return (
    <div className="reports-filter-card reports-no-print">

      <div className="reports-filter-grid">

        {/* DATE FILTERS */}

        {
          showDateFilters && (
            <>

              <div className="form-group">

                <label>
                  Start Date
                </label>

                <input
                  type="date"
                  name="start_date"
                  className="form-input"
                  value={
                    filters.start_date
                  }
                  onChange={
                    onChange
                  }
                />

              </div>


              <div className="form-group">

                <label>
                  End Date
                </label>

                <input
                  type="date"
                  name="end_date"
                  className="form-input"
                  value={
                    filters.end_date
                  }
                  onChange={
                    onChange
                  }
                />

              </div>

            </>
          )
        }


        {/* SALES FILTERS */}

        {
          activeTab === "sales" && (
            <>

              <div className="form-group">

                <label>
                  Order Status
                </label>

                <select
                  name="status"
                  className="form-select"
                  value={
                    filters.status
                  }
                  onChange={
                    onChange
                  }
                >
                  <option value="">
                    All
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>

                  <option value="RETURNED">
                    Returned
                  </option>
                </select>

              </div>


              <div className="form-group">

                <label>
                  Payment Status
                </label>

                <select
                  name="payment_status"
                  className="form-select"
                  value={
                    filters.payment_status
                  }
                  onChange={
                    onChange
                  }
                >
                  <option value="">
                    All
                  </option>

                  <option value="UNPAID">
                    Unpaid
                  </option>

                  <option value="PARTIAL">
                    Partial
                  </option>

                  <option value="PAID">
                    Paid
                  </option>

                  <option value="REFUNDED">
                    Refunded
                  </option>
                </select>

              </div>

            </>
          )
        }


        {/* INVENTORY FILTER */}

        {
          activeTab ===
            "inventory" && (
            <div className="form-group">

              <label>
                Stock Status
              </label>

              <select
                name="stock_status"
                className="form-select"
                value={
                  filters.stock_status
                }
                onChange={
                  onChange
                }
              >
                <option value="">
                  All
                </option>

                <option value="HEALTHY">
                  Healthy
                </option>

                <option value="LOW_STOCK">
                  Low Stock
                </option>

                <option value="OUT_OF_STOCK">
                  Out of Stock
                </option>
              </select>

            </div>
          )
        }


        {/* CUSTOMER FILTER */}

        {
          activeTab ===
            "customers" && (
            <div className="form-group">

              <label>
                Customer Type
              </label>

              <select
                name="customer_type"
                className="form-select"
                value={
                  filters.customer_type
                }
                onChange={
                  onChange
                }
              >
                <option value="">
                  All
                </option>

                <option value="REGULAR">
                  Regular
                </option>

                <option value="WHOLESALE">
                  Wholesale
                </option>

                <option value="VIP">
                  VIP
                </option>
              </select>

            </div>
          )
        }


        {/* SUPPLIER FILTER */}

        {
          activeTab ===
            "suppliers" && (
            <div className="form-group">

              <label>
                Supplier Status
              </label>

              <select
                name="status"
                className="form-select"
                value={
                  filters.status
                }
                onChange={
                  onChange
                }
              >
                <option value="">
                  All
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

            </div>
          )
        }

      </div>


      <div className="reports-filter-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={
            onClear
          }
        >
          Clear
        </button>


        <button
          type="button"
          className="primary-button"
          onClick={
            onApply
          }
        >
          Apply Filters
        </button>

      </div>

    </div>
  );
}


// ============================================================
// SUMMARY CARDS
// ============================================================

function SummaryCards({
  tab,
  summary,
  formatCurrency,
}) {

  let cards = [];


  // SALES
  if (tab === "sales") {

    cards = [
      {
        label: "Total Sales",
        value:
          formatCurrency(
            summary.total_sales
          ),
      },
      {
        label: "Total Profit",
        value:
          formatCurrency(
            summary.total_profit
          ),
      },
      {
        label: "Orders",
        value:
          summary.total_orders ||
          0,
      },
      {
        label: "Average Order",
        value:
          formatCurrency(
            summary.average_order_value
          ),
      },
    ];

  }


  // PROFIT
  if (tab === "profit") {

    cards = [
      {
        label: "Revenue",
        value:
          formatCurrency(
            summary.total_revenue
          ),
      },
      {
        label: "Profit",
        value:
          formatCurrency(
            summary.total_profit
          ),
      },
      {
        label: "Overall Margin",
        value:
          `${
            Number(
              summary.overall_margin_percent ||
              0
            ).toFixed(2)
          }%`,
      },
    ];

  }


  // INVENTORY
  if (tab === "inventory") {

    cards = [
      {
        label: "Products",
        value:
          summary.total_products ||
          0,
      },
      {
        label: "Cost Value",
        value:
          formatCurrency(
            summary.total_cost_value
          ),
      },
      {
        label: "Retail Value",
        value:
          formatCurrency(
            summary.total_retail_value
          ),
      },
      {
        label: "Low Stock",
        value:
          summary.low_stock_count ||
          0,
      },
      {
        label: "Out of Stock",
        value:
          summary.out_of_stock_count ||
          0,
      },
    ];

  }


  // CUSTOMERS
  if (tab === "customers") {

    cards = [
      {
        label: "Customers",
        value:
          summary.total_customers ||
          0,
      },
      {
        label: "Repeat Customers",
        value:
          summary.repeat_customers ||
          0,
      },
      {
        label: "Customer Spending",
        value:
          formatCurrency(
            summary.total_customer_spending
          ),
      },
    ];

  }


  // SUPPLIERS
  if (tab === "suppliers") {

    cards = [
      {
        label: "Suppliers",
        value:
          summary.total_suppliers ||
          0,
      },
      {
        label: "Products",
        value:
          summary.total_products ||
          0,
      },
      {
        label: "Inventory Cost",
        value:
          formatCurrency(
            summary.inventory_cost_value
          ),
      },
    ];

  }


  return (
    <div className="reports-summary-grid">

      {
        cards.map(
          (card) => (

            <div
              className="reports-summary-card"
              key={
                card.label
              }
            >
              <span>
                {card.label}
              </span>

              <strong>
                {card.value}
              </strong>
            </div>

          )
        )
      }

    </div>
  );
}


// ============================================================
// REPORT TABLE
// ============================================================

function ReportTable({
  tab,
  rows,
  formatCurrency,
  formatDate,
}) {

  if (!rows.length) {
    return (
      <div className="data-card reports-empty">
        No report records found.
      </div>
    );
  }


  return (
    <div className="data-card reports-table-card">

      <div className="reports-table-heading">

        <div>
          <h2>
            Report Details
          </h2>

          <p>
            {rows.length} record(s)
          </p>
        </div>

      </div>


      <div className="table-wrapper">

        {
          tab === "sales" && (
            <SalesTable
              rows={
                rows
              }
              formatCurrency={
                formatCurrency
              }
              formatDate={
                formatDate
              }
            />
          )
        }


        {
          tab === "profit" && (
            <ProfitTable
              rows={
                rows
              }
              formatCurrency={
                formatCurrency
              }
            />
          )
        }


        {
          tab === "inventory" && (
            <InventoryTable
              rows={
                rows
              }
              formatCurrency={
                formatCurrency
              }
            />
          )
        }


        {
          tab === "customers" && (
            <CustomerTable
              rows={
                rows
              }
              formatCurrency={
                formatCurrency
              }
            />
          )
        }


        {
          tab === "suppliers" && (
            <SupplierTable
              rows={
                rows
              }
              formatCurrency={
                formatCurrency
              }
            />
          )
        }

      </div>

    </div>
  );
}


// ============================================================
// SALES TABLE
// ============================================================

function SalesTable({
  rows,
  formatCurrency,
  formatDate,
}) {

  return (
    <table className="data-table">

      <thead>
        <tr>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Payment</th>
          <th>Total</th>
          <th>Profit</th>
          <th>Date</th>
        </tr>
      </thead>


      <tbody>

        {
          rows.map(
            (row) => (

              <tr key={row.id}>

                <td>
                  <strong>
                    {
                      row.invoice_number
                    }
                  </strong>
                </td>

                <td>
                  {row.customer}
                </td>

                <td>
                  <ReportStatus
                    value={
                      row.status
                    }
                  />
                </td>

                <td>
                  <ReportStatus
                    value={
                      row.payment_status
                    }
                  />
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.grand_total
                    )
                  }
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.profit
                    )
                  }
                </td>

                <td>
                  {
                    formatDate(
                      row.order_date
                    )
                  }
                </td>

              </tr>

            )
          )
        }

      </tbody>

    </table>
  );
}


// ============================================================
// PROFIT TABLE
// ============================================================

function ProfitTable({
  rows,
  formatCurrency,
}) {

  return (
    <table className="data-table">

      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Qty Sold</th>
          <th>Revenue</th>
          <th>Profit</th>
          <th>Margin</th>
        </tr>
      </thead>


      <tbody>

        {
          rows.map(
            (row) => (

              <tr
                key={
                  row.product_id
                }
              >

                <td>
                  <div className="table-primary-text">
                    {row.name}
                  </div>

                  <div className="table-secondary-text">
                    {row.sku}
                  </div>
                </td>

                <td>
                  {row.category}
                </td>

                <td>
                  {
                    row.quantity_sold
                  }
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.revenue
                    )
                  }
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.profit
                    )
                  }
                </td>

                <td>
                  {
                    Number(
                      row.margin_percent ||
                      0
                    ).toFixed(2)
                  }%
                </td>

              </tr>

            )
          )
        }

      </tbody>

    </table>
  );
}


// ============================================================
// INVENTORY TABLE
// ============================================================

function InventoryTable({
  rows,
  formatCurrency,
}) {

  return (
    <table className="data-table">

      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Supplier</th>
          <th>Stock</th>
          <th>Reorder</th>
          <th>Cost Value</th>
          <th>Retail Value</th>
          <th>Status</th>
        </tr>
      </thead>


      <tbody>

        {
          rows.map(
            (row) => (

              <tr
                key={
                  row.product_id
                }
              >

                <td>
                  <div className="table-primary-text">
                    {row.name}
                  </div>

                  <div className="table-secondary-text">
                    {row.sku}
                  </div>
                </td>

                <td>
                  {row.category}
                </td>

                <td>
                  {row.supplier}
                </td>

                <td>
                  {
                    row.stock_quantity
                  }
                </td>

                <td>
                  {
                    row.reorder_level
                  }
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.cost_value
                    )
                  }
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.retail_value
                    )
                  }
                </td>

                <td>
                  <ReportStatus
                    value={
                      row.stock_status
                    }
                  />
                </td>

              </tr>

            )
          )
        }

      </tbody>

    </table>
  );
}


// ============================================================
// CUSTOMER TABLE
// ============================================================

function CustomerTable({
  rows,
  formatCurrency,
}) {

  return (
    <table className="data-table">

      <thead>
        <tr>
          <th>Customer</th>
          <th>Type</th>
          <th>Orders</th>
          <th>Total Spent</th>
          <th>Average Order</th>
          <th>Loyalty</th>
        </tr>
      </thead>


      <tbody>

        {
          rows.map(
            (row) => (

              <tr
                key={
                  row.customer_id
                }
              >

                <td>
                  <div className="table-primary-text">
                    {row.name}
                  </div>

                  <div className="table-secondary-text">
                    {
                      row.customer_code
                    }
                    {" · "}
                    {
                      row.phone ||
                      "No Phone"
                    }
                  </div>
                </td>

                <td>
                  <ReportStatus
                    value={
                      row.customer_type ||
                      "—"
                    }
                  />
                </td>

                <td>
                  {row.orders}
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.total_spent
                    )
                  }
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.average_order_value
                    )
                  }
                </td>

                <td>
                  {
                    row.loyalty_points
                  }
                </td>

              </tr>

            )
          )
        }

      </tbody>

    </table>
  );
}


// ============================================================
// SUPPLIER TABLE
// ============================================================

function SupplierTable({
  rows,
  formatCurrency,
}) {

  return (
    <table className="data-table">

      <thead>
        <tr>
          <th>Supplier</th>
          <th>Contact</th>
          <th>Location</th>
          <th>Status</th>
          <th>Products</th>
          <th>Inventory Cost</th>
        </tr>
      </thead>


      <tbody>

        {
          rows.map(
            (row) => (

              <tr
                key={
                  row.supplier_id
                }
              >

                <td>
                  <div className="table-primary-text">
                    {
                      row.company_name
                    }
                  </div>

                  <div className="table-secondary-text">
                    {
                      row.supplier_code
                    }
                  </div>
                </td>

                <td>
                  <div>
                    {
                      row.contact_person ||
                      "—"
                    }
                  </div>

                  <div className="table-secondary-text">
                    {
                      row.phone ||
                      row.email ||
                      "—"
                    }
                  </div>
                </td>

                <td>
                  {
                    [
                      row.city,
                      row.state,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "—"
                  }
                </td>

                <td>
                  <ReportStatus
                    value={
                      row.status
                    }
                  />
                </td>

                <td>
                  {row.products}
                </td>

                <td className="table-money">
                  {
                    formatCurrency(
                      row.inventory_cost_value
                    )
                  }
                </td>

              </tr>

            )
          )
        }

      </tbody>

    </table>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function ReportStatus({
  value,
}) {

  const normalized =
    String(
      value || ""
    )
      .toLowerCase()
      .replace(
        /_/g,
        "-"
      );


  const label =
    String(
      value || "—"
    )
      .replace(
        /_/g,
        " "
      );


  return (
    <span
      className={
        `report-status report-status-${normalized}`
      }
    >
      {label}
    </span>
  );
}


export default Reports;