import {
  Boxes,
  ChartColumnBig,
  CircleDollarSign,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../../api/api";

import PredictiveAnalytics
  from "../../components/analytics/PredictiveAnalytics";

import RetailIntelligence
  from "../../components/analytics/RetailIntelligence";

function Analytics() {
  const [overview, setOverview] =
    useState(null);

  const [salesTrend, setSalesTrend] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [abcData, setAbcData] =
    useState([]);

  const [margins, setMargins] =
    useState([]);

  const [inventory, setInventory] =
    useState([]);

  const [period, setPeriod] =
    useState("monthly");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const formatCurrency = (value) =>
    new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );


  // =========================================================
  // FETCH ANALYTICS
  // =========================================================

  const fetchAnalytics =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            overviewResponse,
            trendResponse,
            productResponse,
            categoryResponse,
            customerResponse,
            abcResponse,
            marginResponse,
            inventoryResponse,
          ] = await Promise.all([
            api.get(
              "analytics/overview/"
            ),

            api.get(
              "analytics/sales-trend/",
              {
                params: {
                  period,
                },
              }
            ),

            api.get(
              "analytics/products/"
            ),

            api.get(
              "analytics/categories/"
            ),

            api.get(
              "analytics/customers/"
            ),

            api.get(
              "analytics/abc/"
            ),

            api.get(
              "analytics/margins/"
            ),

            api.get(
              "analytics/inventory/"
            ),
          ]);


          setOverview(
            overviewResponse.data
          );

          setSalesTrend(
            trendResponse.data
              ?.results || []
          );

          setProducts(
            productResponse.data
              ?.results || []
          );

          setCategories(
            categoryResponse.data
              ?.results || []
          );

          setCustomers(
            customerResponse.data
              ?.results || []
          );

          setAbcData(
            abcResponse.data
              ?.results || []
          );

          setMargins(
            marginResponse.data
              ?.results || []
          );

          setInventory(
            inventoryResponse.data
              ?.results || []
          );

        } catch (error) {
          console.error(
            "Analytics load error:",
            error
          );

          setError(
            error.response?.data?.detail ||
            "Unable to load analytics data."
          );

        } finally {
          setLoading(false);
        }
      },
      [period]
    );


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);


  // =========================================================
  // TOP PRODUCTS
  // =========================================================

  const topProducts = useMemo(
    () =>
      products.slice(
        0,
        10
      ),
    [products]
  );


  // =========================================================
  // TOP CUSTOMERS
  // =========================================================

  const topCustomers = useMemo(
    () =>
      customers.slice(
        0,
        10
      ),
    [customers]
  );


  // =========================================================
  // TOP PROFIT MARGINS
  // =========================================================

  const topMargins = useMemo(
    () =>
      margins.slice(
        0,
        10
      ),
    [margins]
  );


  // =========================================================
  // INVENTORY SUMMARY
  // =========================================================

  const inventorySummary =
    useMemo(
      () => {
        return inventory.reduce(
          (
            accumulator,
            product
          ) => {
            accumulator.costValue +=
              Number(
                product.cost_value ||
                0
              );

            accumulator.retailValue +=
              Number(
                product.retail_value ||
                0
              );


            if (
              product.stock_status ===
              "LOW_STOCK"
            ) {
              accumulator.lowStock +=
                1;
            }


            if (
              product.stock_status ===
              "OUT_OF_STOCK"
            ) {
              accumulator.outOfStock +=
                1;
            }


            return accumulator;
          },
          {
            costValue: 0,
            retailValue: 0,
            lowStock: 0,
            outOfStock: 0,
          }
        );
      },
      [inventory]
    );


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="page-loading">

        <div className="loading-spinner" />

        <p>
          Loading advanced analytics...
        </p>

      </div>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page-content">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Business Intelligence
          </p>


          <h1 className="page-title">
            Advanced Analytics
          </h1>


          <p className="page-description">
            Analyze sales trends,
            product performance,
            customers, margins and
            inventory health.
          </p>

        </div>


        <div className="page-header-actions">

          <select
            className="form-select analytics-period-select"
            value={
              period
            }
            onChange={
              (event) =>
                setPeriod(
                  event.target.value
                )
            }
          >

            <option value="daily">
              Daily
            </option>

            <option value="monthly">
              Monthly
            </option>

            <option value="yearly">
              Yearly
            </option>

          </select>


          <button
            type="button"
            className="secondary-button"
            onClick={
              fetchAnalytics
            }
          >
            <RefreshCcw
              size={17}
            />

            Refresh
          </button>

        </div>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {
        error && (
          <div className="page-error">
            {error}
          </div>
        )
      }


      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      {
        overview && (
          <div className="analytics-kpi-grid">

            <AnalyticsKpi
              label="Revenue"
              value={
                formatCurrency(
                  overview.sales
                    ?.revenue
                )
              }
              description="Completed sales"
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
            />


            <AnalyticsKpi
              label="Profit"
              value={
                formatCurrency(
                  overview.sales
                    ?.profit
                )
              }
              description="Total sales profit"
              icon={
                <TrendingUp
                  size={22}
                />
              }
            />


            <AnalyticsKpi
              label="Orders"
              value={
                overview.sales
                  ?.orders || 0
              }
              description="Completed orders"
              icon={
                <ShoppingBag
                  size={22}
                />
              }
            />


            <AnalyticsKpi
              label="Average Order"
              value={
                formatCurrency(
                  overview.sales
                    ?.average_order_value
                )
              }
              description="Average invoice value"
              icon={
                <ChartColumnBig
                  size={22}
                />
              }
            />


            <AnalyticsKpi
              label="Customers"
              value={
                overview.customers
                  ?.total || 0
              }
              description={
                `${
                  overview.customers
                    ?.repeat_customers ||
                  0
                } repeat customers`
              }
              icon={
                <Users
                  size={22}
                />
              }
            />


            <AnalyticsKpi
              label="Inventory Value"
              value={
                formatCurrency(
                  overview.inventory
                    ?.inventory_value
                )
              }
              description={
                `${
                  overview.inventory
                    ?.low_stock || 0
                } low stock`
              }
              icon={
                <Boxes
                  size={22}
                />
              }
            />

          </div>
        )
      }


      {/* =====================================================
          SALES TREND + CATEGORY REVENUE
          ===================================================== */}

      <div className="analytics-chart-grid">

        {/* SALES TREND */}

        <div className="analytics-card analytics-card-large">

          <AnalyticsCardHeader
            title="Sales Trend"
            description={
              `${period} revenue and profit performance`
            }
          />


          <div className="analytics-chart">

            {
              salesTrend.length > 0
                ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={
                        salesTrend
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />


                      <XAxis
                        dataKey="period"
                      />


                      <YAxis />


                      <Tooltip
                        formatter={
                          (
                            value,
                            name
                          ) => {
                            if (
                              name ===
                              "Orders"
                            ) {
                              return value;
                            }


                            return formatCurrency(
                              value
                            );
                          }
                        }
                      />


                      <Legend />


                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#e8d65a"
                        strokeWidth={3}
                        dot={false}
                      />


                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#373733"
                        strokeWidth={3}
                        dot={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>
                )
                : (
                  <AnalyticsEmpty
                    text="No sales trend data available."
                  />
                )
            }

          </div>

        </div>


        {/* ===================================================
            CATEGORY REVENUE
            =================================================== */}

        <div className="analytics-card">

          <AnalyticsCardHeader
            title="Revenue by Category"
            description="Category contribution"
          />


          <div className="analytics-chart">

            {
              categories.length > 0
                ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={
                          categories
                        }
                        dataKey="revenue"
                        nameKey="category"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >

                        {
                          categories.map(
                            (
                              category,
                              index
                            ) => (

                              <Cell
                                key={
                                  `${
                                    category.category
                                  }-${index}`
                                }
                                fill={
                                  [
                                    "#e8d65a",
                                    "#373733",
                                    "#c7b749",
                                    "#8f8b72",
                                    "#f0e89c",
                                    "#b6aa5c",
                                  ][
                                    index % 6
                                  ]
                                }
                              />

                            )
                          )
                        }

                      </Pie>


                      <Tooltip
                        formatter={
                          (value) =>
                            formatCurrency(
                              value
                            )
                        }
                      />


                      <Legend />

                    </PieChart>

                  </ResponsiveContainer>
                )
                : (
                  <AnalyticsEmpty
                    text="No category data available."
                  />
                )
            }

          </div>

        </div>

      </div>


      {/* =====================================================
          TOP PRODUCT PERFORMANCE
          ===================================================== */}

      <div className="analytics-card">

        <AnalyticsCardHeader
          title="Top Product Performance"
          description="Units sold and product revenue"
        />


        <div className="analytics-chart analytics-wide-chart">

          {
            topProducts.length > 0
              ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      topProducts
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />


                    <XAxis
                      dataKey="name"
                    />


                    <YAxis />


                    <Tooltip />


                    <Legend />


                    <Bar
                      dataKey="quantity_sold"
                      name="Units Sold"
                      fill="#e8d65a"
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>
              )
              : (
                <AnalyticsEmpty
                  text="No product performance data."
                />
              )
          }

        </div>

      </div>


      {/* =====================================================
          TOP CUSTOMERS + PROFIT MARGINS
          ===================================================== */}

      <div className="analytics-table-grid">

        {/* TOP CUSTOMERS */}

        <div className="analytics-card">

          <AnalyticsCardHeader
            title="Top Customers"
            description="Customers ranked by spending"
          />


          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>
                    Customer
                  </th>

                  <th>
                    Orders
                  </th>

                  <th>
                    Average
                  </th>

                  <th>
                    Total Spent
                  </th>
                </tr>
              </thead>


              <tbody>

                {
                  topCustomers.length > 0
                    ? topCustomers.map(
                        (customer) => (

                          <tr
                            key={
                              customer.customer_id
                            }
                          >

                            <td>

                              <div className="table-primary-text">
                                {
                                  customer.name
                                }
                              </div>


                              <div className="table-secondary-text">
                                {
                                  customer.phone ||
                                  "—"
                                }
                              </div>

                            </td>


                            <td>
                              {
                                customer.orders
                              }
                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  customer.average_order_value
                                )
                              }
                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  customer.total_spent
                                )
                              }
                            </td>

                          </tr>

                        )
                      )
                    : (
                      <EmptyTableRow
                        columns={4}
                        text="No customer analytics available."
                      />
                    )
                }

              </tbody>

            </table>

          </div>

        </div>


        {/* ===================================================
            PROFIT MARGIN ANALYSIS
            =================================================== */}

        <div className="analytics-card">

          <AnalyticsCardHeader
            title="Profit Margin Analysis"
            description="Top products by profit"
          />


          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>
                    Product
                  </th>

                  <th>
                    Revenue
                  </th>

                  <th>
                    Profit
                  </th>

                  <th>
                    Margin
                  </th>
                </tr>
              </thead>


              <tbody>

                {
                  topMargins.length > 0
                    ? topMargins.map(
                        (item) => (

                          <tr
                            key={
                              item.product_id
                            }
                          >

                            <td>

                              <div className="table-primary-text">
                                {
                                  item.name
                                }
                              </div>


                              <div className="table-secondary-text">
                                {
                                  item.sku
                                }
                              </div>

                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  item.revenue
                                )
                              }
                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  item.profit
                                )
                              }
                            </td>


                            <td>

                              <span className="analytics-margin-badge">

                                {
                                  Number(
                                    item.margin_percent ||
                                    0
                                  ).toFixed(
                                    2
                                  )
                                }%

                              </span>

                            </td>

                          </tr>

                        )
                      )
                    : (
                      <EmptyTableRow
                        columns={4}
                        text="No margin analytics available."
                      />
                    )
                }

              </tbody>

            </table>

          </div>

        </div>

      </div>


      {/* =====================================================
          ABC INVENTORY ANALYSIS
          ===================================================== */}

      <div className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <h2>
              ABC Inventory Analysis
            </h2>


            <p>
              Products classified by
              revenue contribution.
            </p>

          </div>

        </div>


        <div className="analytics-abc-grid">

          {/* CLASS A */}

          <ABCColumn
            title="Class A"
            description="Highest-value products"
            items={
              abcData.filter(
                (item) =>
                  item.classification ===
                  "A"
              )
            }
            formatCurrency={
              formatCurrency
            }
          />


          {/* CLASS B */}

          <ABCColumn
            title="Class B"
            description="Medium-value products"
            items={
              abcData.filter(
                (item) =>
                  item.classification ===
                  "B"
              )
            }
            formatCurrency={
              formatCurrency
            }
          />


          {/* CLASS C */}

          <ABCColumn
            title="Class C"
            description="Lower-value products"
            items={
              abcData.filter(
                (item) =>
                  item.classification ===
                  "C"
              )
            }
            formatCurrency={
              formatCurrency
            }
          />

        </div>

      </div>


      {/* =====================================================
          INVENTORY HEALTH
          ===================================================== */}

      <div className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <h2>
              Inventory Health
            </h2>


            <p>
              Current stock value and
              stock condition.
            </p>

          </div>

        </div>


        {/* ===================================================
            INVENTORY SUMMARY
            =================================================== */}

        <div className="analytics-inventory-summary">

          <div className="analytics-mini-card">

            <span>
              Cost Value
            </span>


            <strong>
              {
                formatCurrency(
                  inventorySummary.costValue
                )
              }
            </strong>

          </div>


          <div className="analytics-mini-card">

            <span>
              Retail Value
            </span>


            <strong>
              {
                formatCurrency(
                  inventorySummary.retailValue
                )
              }
            </strong>

          </div>


          <div className="analytics-mini-card">

            <span>
              Low Stock
            </span>


            <strong>
              {
                inventorySummary.lowStock
              }
            </strong>

          </div>


          <div className="analytics-mini-card">

            <span>
              Out of Stock
            </span>


            <strong>
              {
                inventorySummary.outOfStock
              }
            </strong>

          </div>

        </div>


        {/* ===================================================
            INVENTORY TABLE
            =================================================== */}

        <div className="analytics-card">

          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>

                  <th>
                    Product
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Stock
                  </th>

                  <th>
                    Cost Value
                  </th>

                  <th>
                    Retail Value
                  </th>

                  <th>
                    Status
                  </th>

                </tr>
              </thead>


              <tbody>

                {
                  inventory.length > 0
                    ? inventory.map(
                        (item) => (

                          <tr
                            key={
                              item.product_id
                            }
                          >

                            <td>

                              <div className="table-primary-text">
                                {
                                  item.name
                                }
                              </div>


                              <div className="table-secondary-text">
                                {
                                  item.sku
                                }
                              </div>

                            </td>


                            <td>
                              {
                                item.category
                              }
                            </td>


                            <td>
                              {
                                item.stock_quantity
                              }
                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  item.cost_value
                                )
                              }
                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  item.retail_value
                                )
                              }
                            </td>


                            <td>

                              <StockStatus
                                status={
                                  item.stock_status
                                }
                              />

                            </td>

                          </tr>

                        )
                      )
                    : (
                      <EmptyTableRow
                        columns={6}
                        text="No inventory analytics available."
                      />
                    )
                }

              </tbody>

            </table>

          </div>

        </div>

      </div>


      {/* =====================================================
          MACHINE LEARNING / PREDICTIVE ANALYTICS
          ===================================================== */}

      <PredictiveAnalytics />
      <RetailIntelligence />

    </div>
  );
}


// ============================================================
// ANALYTICS KPI COMPONENT
// ============================================================

function AnalyticsKpi({
  label,
  value,
  description,
  icon,
}) {

  return (
    <div className="analytics-kpi-card">

      <div>

        <span className="analytics-kpi-label">
          {label}
        </span>


        <strong className="analytics-kpi-value">
          {value}
        </strong>


        <span className="analytics-kpi-description">
          {description}
        </span>

      </div>


      <div className="analytics-kpi-icon">
        {icon}
      </div>

    </div>
  );
}


// ============================================================
// ANALYTICS CARD HEADER
// ============================================================

function AnalyticsCardHeader({
  title,
  description,
}) {

  return (
    <div className="analytics-card-header">

      <div>

        <h2>
          {title}
        </h2>


        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// ANALYTICS EMPTY
// ============================================================

function AnalyticsEmpty({
  text,
}) {

  return (
    <div className="analytics-empty">
      {text}
    </div>
  );
}


// ============================================================
// EMPTY TABLE ROW
// ============================================================

function EmptyTableRow({
  columns,
  text,
}) {

  return (
    <tr>

      <td colSpan={columns}>

        <AnalyticsEmpty
          text={
            text
          }
        />

      </td>

    </tr>
  );
}


// ============================================================
// ABC COLUMN
// ============================================================

function ABCColumn({
  title,
  description,
  items,
  formatCurrency,
}) {

  return (
    <div className="analytics-abc-card">

      <div className="analytics-abc-header">

        <div>

          <h3>
            {title}
          </h3>


          <p>
            {description}
          </p>

        </div>


        <span className="analytics-abc-count">
          {items.length}
        </span>

      </div>


      <div className="analytics-abc-list">

        {
          items.length > 0
            ? items
                .slice(
                  0,
                  8
                )
                .map(
                  (item) => (

                    <div
                      key={
                        item.product_id
                      }
                      className="analytics-abc-item"
                    >

                      <div>

                        <strong>
                          {
                            item.name
                          }
                        </strong>


                        <span>
                          {
                            item.sku
                          }
                        </span>

                      </div>


                      <div className="analytics-abc-value">

                        {
                          formatCurrency(
                            item.revenue
                          )
                        }

                      </div>

                    </div>

                  )
                )
            : (
              <AnalyticsEmpty
                text="No products"
              />
            )
        }

      </div>

    </div>
  );
}


// ============================================================
// STOCK STATUS
// ============================================================

function StockStatus({
  status,
}) {

  let label =
    "Healthy";

  let className =
    "stock-status healthy";


  if (
    status ===
    "LOW_STOCK"
  ) {
    label =
      "Low Stock";

    className =
      "stock-status low";
  }


  if (
    status ===
    "OUT_OF_STOCK"
  ) {
    label =
      "Out of Stock";

    className =
      "stock-status out";
  }


  return (
    <span className={className}>
      {label}
    </span>
  );
}


export default Analytics;