import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Package,
  ReceiptText,
  RefreshCcw,
  ShoppingCart,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
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

import {
  useNavigate,
} from "react-router-dom";

import api from "../../api/api";


function Dashboard() {
  const navigate =
    useNavigate();

  const [dashboard, setDashboard] =
    useState({
      kpis: {
        total_revenue: 0,
        total_profit: 0,
        total_orders: 0,
        total_customers: 0,
        total_products: 0,
        average_order_value: 0,
        inventory_value: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
      },

      monthly_sales: [],
      sales_by_category: [],
      top_products: [],
      top_customers: [],
      recent_sales: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const formatCurrency = (
    value
  ) =>
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


  const formatDate = (
    value
  ) => {
    if (!value) {
      return "—";
    }

    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  const fetchDashboard =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await api.get(
              "dashboard/summary/"
            );

          setDashboard(
            response.data
          );

        } catch (error) {
          console.error(
            "Dashboard error:",
            error
          );

          setError(
            error.response?.data?.detail ||
            "Unable to load dashboard analytics."
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);


  if (loading) {
    return (
      <div className="page-loading">

        <div className="loading-spinner" />

        <p>
          Loading dashboard...
        </p>

      </div>
    );
  }


  const {
    kpis,
    monthly_sales,
    sales_by_category,
    top_products,
    top_customers,
    recent_sales,
  } = dashboard;


  return (
    <div className="page-content">

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Business Intelligence
          </p>

          <h1 className="page-title">
            Dashboard
          </h1>

          <p className="page-description">
            Monitor sales, profit,
            customers and inventory
            performance.
          </p>

        </div>


        <div className="page-header-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={
              fetchDashboard
            }
          >
            <RefreshCcw
              size={17}
            />

            Refresh
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={
              () =>
                navigate(
                  "/sales/new"
                )
            }
          >
            <ShoppingCart
              size={17}
            />

            New Sale
          </button>

        </div>

      </div>


      {
        error && (
          <div className="page-error">
            {error}
          </div>
        )
      }


      <div className="dashboard-kpi-grid">

        <DashboardKpi
          label="Total Revenue"
          value={
            formatCurrency(
              kpis.total_revenue
            )
          }
          description="Completed sales"
          icon={
            <CircleDollarSign
              size={22}
            />
          }
        />


        <DashboardKpi
          label="Total Profit"
          value={
            formatCurrency(
              kpis.total_profit
            )
          }
          description="Net product profit"
          icon={
            <TrendingUp
              size={22}
            />
          }
        />


        <DashboardKpi
          label="Total Orders"
          value={
            kpis.total_orders
          }
          description="Completed orders"
          icon={
            <ReceiptText
              size={22}
            />
          }
        />


        <DashboardKpi
          label="Customers"
          value={
            kpis.total_customers
          }
          description="Active customers"
          icon={
            <Users
              size={22}
            />
          }
        />


        <DashboardKpi
          label="Average Order"
          value={
            formatCurrency(
              kpis.average_order_value
            )
          }
          description="Average invoice value"
          icon={
            <WalletCards
              size={22}
            />
          }
        />


        <DashboardKpi
          label="Inventory Value"
          value={
            formatCurrency(
              kpis.inventory_value
            )
          }
          description="Based on cost price"
          icon={
            <Boxes
              size={22}
            />
          }
        />

      </div>


      <div className="dashboard-alert-grid">

        <div className="dashboard-alert-card">

          <div className="dashboard-alert-icon warning">
            <AlertTriangle
              size={20}
            />
          </div>

          <div>
            <span>
              Low Stock
            </span>

            <strong>
              {
                kpis.low_stock_count
              }
            </strong>
          </div>

        </div>


        <div className="dashboard-alert-card">

          <div className="dashboard-alert-icon danger">
            <Package
              size={20}
            />
          </div>

          <div>
            <span>
              Out of Stock
            </span>

            <strong>
              {
                kpis.out_of_stock_count
              }
            </strong>
          </div>

        </div>


        <div className="dashboard-alert-card">

          <div className="dashboard-alert-icon">
            <Package
              size={20}
            />
          </div>

          <div>
            <span>
              Products
            </span>

            <strong>
              {
                kpis.total_products
              }
            </strong>
          </div>

        </div>

      </div>


      <div className="dashboard-chart-grid">

        <div className="dashboard-chart-card dashboard-chart-large">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Sales Performance
              </h2>

              <p>
                Revenue and profit
                trend over time
              </p>
            </div>

          </div>


          <div className="dashboard-chart">

            {
              monthly_sales.length > 0
                ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={
                        monthly_sales
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="month"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={
                          (value) =>
                            formatCurrency(
                              value
                            )
                        }
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#e8d65a"
                        strokeWidth={3}
                      />

                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#373733"
                        strokeWidth={3}
                      />

                    </LineChart>

                  </ResponsiveContainer>
                )
                : (
                  <DashboardEmpty
                    text="No sales data available."
                  />
                )
            }

          </div>

        </div>


        <div className="dashboard-chart-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Sales by Category
              </h2>

              <p>
                Revenue distribution
              </p>
            </div>

          </div>


          <div className="dashboard-chart">

            {
              sales_by_category.length >
              0
                ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={
                          sales_by_category
                        }
                        dataKey="revenue"
                        nameKey="category"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >

                        {
                          sales_by_category.map(
                            (
                              entry,
                              index
                            ) => (
                              <Cell
                                key={
                                  `${entry.category}-${index}`
                                }
                                fill={
                                  [
                                    "#e8d65a",
                                    "#373733",
                                    "#c7b749",
                                    "#8f8b72",
                                    "#f0e89c",
                                  ][
                                    index % 5
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

                    </PieChart>

                  </ResponsiveContainer>
                )
                : (
                  <DashboardEmpty
                    text="No category data available."
                  />
                )
            }

          </div>

        </div>

      </div>


      <div className="dashboard-chart-card">

        <div className="dashboard-card-header">

          <div>
            <h2>
              Top Selling Products
            </h2>

            <p>
              Products ranked by
              quantity sold
            </p>
          </div>

        </div>


        <div className="dashboard-chart dashboard-product-chart">

          {
            top_products.length > 0
              ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      top_products
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
                <DashboardEmpty
                  text="No product sales available."
                />
              )
          }

        </div>

      </div>


      <div className="dashboard-table-grid">

        <div className="data-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Top Customers
              </h2>

              <p>
                Highest customer spending
              </p>
            </div>

          </div>


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
                    Total Spent
                  </th>
                </tr>
              </thead>


              <tbody>

                {
                  top_customers.length >
                  0
                    ? top_customers.map(
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
                                  customer.total_spent
                                )
                              }
                            </td>

                          </tr>

                        )
                      )
                    : (
                      <tr>

                        <td colSpan="3">

                          <DashboardEmpty
                            text="No customers available."
                          />

                        </td>

                      </tr>
                    )
                }

              </tbody>

            </table>

          </div>

        </div>


        <div className="data-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Recent Sales
              </h2>

              <p>
                Latest invoices
              </p>
            </div>

          </div>


          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>
                    Invoice
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Date
                  </th>
                </tr>
              </thead>


              <tbody>

                {
                  recent_sales.length >
                  0
                    ? recent_sales.map(
                        (sale) => (

                          <tr
                            key={
                              sale.id
                            }
                            className="dashboard-sale-row"
                            onClick={
                              () =>
                                navigate(
                                  `/sales/${sale.id}`
                                )
                            }
                          >

                            <td>
                              <strong>
                                {
                                  sale.invoice_number
                                }
                              </strong>
                            </td>


                            <td>
                              {
                                sale.customer
                              }
                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  sale.grand_total
                                )
                              }
                            </td>


                            <td>
                              {
                                formatDate(
                                  sale.order_date
                                )
                              }
                            </td>

                          </tr>

                        )
                      )
                    : (
                      <tr>

                        <td colSpan="4">

                          <DashboardEmpty
                            text="No sales available."
                          />

                        </td>

                      </tr>
                    )
                }

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}


function DashboardKpi({
  label,
  value,
  description,
  icon,
}) {
  return (
    <div className="dashboard-kpi-card">

      <div className="dashboard-kpi-content">

        <span className="dashboard-kpi-label">
          {label}
        </span>

        <strong className="dashboard-kpi-value">
          {value}
        </strong>

        <span className="dashboard-kpi-description">
          {description}
        </span>

      </div>


      <div className="dashboard-kpi-icon">
        {icon}
      </div>

    </div>
  );
}


function DashboardEmpty({
  text,
}) {
  return (
    <div className="dashboard-empty">
      {text}
    </div>
  );
}


export default Dashboard;