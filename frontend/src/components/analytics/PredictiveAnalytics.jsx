import {
  AlertTriangle,
  BrainCircuit,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../../api/api";


const PERIOD_OPTIONS = [
  {
    value: 7,
    label: "7 Days",
  },
  {
    value: 30,
    label: "30 Days",
  },
  {
    value: 60,
    label: "60 Days",
  },
  {
    value: 90,
    label: "90 Days",
  },
];


function PredictiveAnalytics() {
  const [days, setDays] =
    useState(30);

  const [forecast, setForecast] =
    useState({
      status: "",
      summary: {},
      metrics: {},
      historical: [],
      forecast: [],
    });

  const [demand, setDemand] =
    useState({
      status: "",
      summary: {},
      products: [],
    });

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


  const formatCompactCurrency =
    (value) =>
      new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          notation: "compact",
          maximumFractionDigits: 1,
        }
      ).format(
        Number(value || 0)
      );


  const formatDate = (value) => {
    if (!value) {
      return "";
    }


    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };


  const formatPercent = (
    value
  ) =>
    `${
      Number(
        value || 0
      ).toFixed(2)
    }%`;


  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchPredictiveAnalytics =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            forecastResponse,
            demandResponse,
          ] = await Promise.all([
            api.get(
              "analytics/ml/sales-forecast/",
              {
                params: {
                  days,
                },
              }
            ),

            api.get(
              "analytics/ml/demand-prediction/",
              {
                params: {
                  days,
                },
              }
            ),
          ]);


          setForecast(
            forecastResponse.data ||
            {}
          );


          setDemand(
            demandResponse.data ||
            {}
          );

        } catch (error) {
          console.error(
            "Predictive analytics error:",
            error
          );


          setError(
            error.response?.data?.detail ||
            "Unable to load predictive analytics."
          );

        } finally {
          setLoading(false);
        }
      },
      [
        days,
      ]
    );


  useEffect(() => {
    fetchPredictiveAnalytics();
  }, [
    fetchPredictiveAnalytics,
  ]);


  // =========================================================
  // CHART DATA
  // =========================================================

  const chartData = useMemo(
    () => {
      const historical =
        (
          forecast.historical ||
          []
        ).map(
          (item) => ({
            date:
              item.date,

            label:
              formatDate(
                item.date
              ),

            actualRevenue:
              Number(
                item.revenue ||
                0
              ),

            predictedRevenue:
              null,
          })
        );


      const forecastRows =
        (
          forecast.forecast ||
          []
        ).map(
          (item) => ({
            date:
              item.date,

            label:
              formatDate(
                item.date
              ),

            actualRevenue:
              null,

            predictedRevenue:
              Number(
                item.predicted_revenue ||
                0
              ),
          })
        );


      return [
        ...historical,
        ...forecastRows,
      ];
    },
    [
      forecast.historical,
      forecast.forecast,
    ]
  );


  // =========================================================
  // DEMAND PRODUCTS
  // =========================================================

  const demandRows =
    useMemo(
      () =>
        (
          demand.products ||
          []
        ),
      [
        demand.products,
      ]
    );


  // =========================================================
  // TREND ICON
  // =========================================================

  const ForecastTrendIcon =
    forecast.summary
      ?.trend ===
      "DECLINING"
      ? TrendingDown
      : TrendingUp;


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="predictive-loading">

        <div className="loading-spinner" />

        <p>
          Running predictive analytics...
        </p>

      </div>
    );
  }


  return (
    <section className="predictive-section">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="predictive-header">

        <div>

          <p className="page-eyebrow">
            Machine Learning
          </p>


          <h2>
            Predictive Analytics
          </h2>


          <p>
            Forecast future revenue,
            measure model accuracy,
            identify changing product
            demand and improve inventory
            planning.
          </p>

        </div>


        <div className="predictive-actions">

          <select
            className="form-select predictive-period-select"
            value={
              days
            }
            onChange={
              (event) =>
                setDays(
                  Number(
                    event.target.value
                  )
                )
            }
          >

            {
              PERIOD_OPTIONS.map(
                (option) => (

                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>

                )
              )
            }

          </select>


          <button
            type="button"
            className="secondary-button"
            onClick={
              fetchPredictiveAnalytics
            }
          >
            <RefreshCcw
              size={16}
            />

            Refresh
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


      {/* =====================================================
          WARNING
          ===================================================== */}

      {
        forecast.status ===
          "INSUFFICIENT_DATA" && (

          <div className="predictive-warning-card">

            <AlertTriangle
              size={20}
            />


            <div>

              <strong>
                More sales history
                required
              </strong>


              <p>
                {
                  forecast.message ||
                  "More historical sales are required."
                }
              </p>

            </div>

          </div>
        )
      }


      {/* =====================================================
          PRIMARY KPI
          ===================================================== */}

      <div className="predictive-kpi-grid">

        <PredictiveKpi
          label="Predicted Revenue"
          value={
            formatCurrency(
              forecast.summary
                ?.predicted_total_revenue
            )
          }
          description={
            `Next ${days} days`
          }
          icon={
            <TrendingUp
              size={20}
            />
          }
        />


        <PredictiveKpi
          label="Daily Forecast"
          value={
            formatCurrency(
              forecast.summary
                ?.predicted_average_daily_revenue
            )
          }
          description="Expected daily revenue"
          icon={
            <BrainCircuit
              size={20}
            />
          }
        />


        <PredictiveKpi
          label="High Demand"
          value={
            demand.summary
              ?.high_demand_products ||
            0
          }
          description="High-demand products"
          icon={
            <PackageSearch
              size={20}
            />
          }
        />


        <PredictiveKpi
          label="Stock Risk"
          value={
            demand.summary
              ?.stock_risk_products ||
            0
          }
          description="Products requiring action"
          icon={
            <AlertTriangle
              size={20}
            />
          }
        />

      </div>


      {/* =====================================================
          BUSINESS TREND
          ===================================================== */}

      <div className="analytics-card predictive-trend-card">

        <div className="predictive-trend-content">

          <div className="predictive-trend-icon">

            <ForecastTrendIcon
              size={24}
            />

          </div>


          <div>

            <span>
              Sales Trend
            </span>


            <strong>
              {
                String(
                  forecast.summary
                    ?.trend ||
                  "UNKNOWN"
                )
                  .replace(
                    /_/g,
                    " "
                  )
              }
            </strong>


            <p>
              Recent average:
              {" "}
              {
                formatCurrency(
                  forecast.summary
                    ?.recent_average_daily_revenue
                )
              }
              {" "}
              vs previous:
              {" "}
              {
                formatCurrency(
                  forecast.summary
                    ?.older_average_daily_revenue
                )
              }
            </p>

          </div>


          <div className="predictive-growth-value">

            <span>
              Growth
            </span>


            <strong>
              {
                formatPercent(
                  forecast.summary
                    ?.growth_percentage
                )
              }
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================================
          SALES FORECAST CHART
          ===================================================== */}

      <div className="analytics-card predictive-chart-card">

        <div className="analytics-card-header">

          <div>

            <h3>
              Sales Forecast
            </h3>


            <p>
              Actual historical revenue
              compared with machine-learning
              forecast.
            </p>

          </div>

        </div>


        {
          chartData.length > 0
            ? (
              <div className="predictive-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={
                      chartData
                    }
                    margin={{
                      top: 10,
                      right: 15,
                      left: 5,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />


                    <XAxis
                      dataKey="label"
                      interval="preserveStartEnd"
                    />


                    <YAxis
                      tickFormatter={
                        formatCompactCurrency
                      }
                    />


                    <Tooltip
                      formatter={
                        (
                          value,
                          name
                        ) => [
                          formatCurrency(
                            value
                          ),
                          name ===
                            "actualRevenue"
                            ? "Actual Revenue"
                            : "Forecast Revenue",
                        ]
                      }
                    />


                    <Line
                      type="monotone"
                      dataKey="actualRevenue"
                      name="actualRevenue"
                      stroke="#373733"
                      strokeWidth={3}
                      dot={false}
                      connectNulls={false}
                    />


                    <Line
                      type="monotone"
                      dataKey="predictedRevenue"
                      name="predictedRevenue"
                      stroke="#e8d65a"
                      strokeWidth={3}
                      strokeDasharray="7 5"
                      dot={false}
                      connectNulls={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>
            )
            : (
              <div className="analytics-empty">
                No forecast chart data
                available.
              </div>
            )
        }

      </div>


      {/* =====================================================
          ACCURACY + MODEL INFO
          ===================================================== */}

      <div className="predictive-secondary-grid">

        {/* MODEL ACCURACY */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <h3>
                Forecast Accuracy
              </h3>


              <p>
                Evaluation on historical
                test data.
              </p>

            </div>

          </div>


          <div className="prediction-summary-list">

            <PredictionSummaryItem
              label="MAE"
              value={
                formatCurrency(
                  forecast.metrics
                    ?.mae
                )
              }
            />


            <PredictionSummaryItem
              label="RMSE"
              value={
                formatCurrency(
                  forecast.metrics
                    ?.rmse
                )
              }
            />


            <PredictionSummaryItem
              label="R² Score"
              value={
                Number(
                  forecast.metrics
                    ?.r2_score ||
                  0
                ).toFixed(4)
              }
            />


            <PredictionSummaryItem
              label="MAE Percentage"
              value={
                formatPercent(
                  forecast.metrics
                    ?.mae_percentage
                )
              }
            />

          </div>

        </div>


        {/* MODEL INFORMATION */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <h3>
                Model Information
              </h3>


              <p>
                Current model and
                prediction confidence.
              </p>

            </div>

          </div>


          <div className="prediction-model-info">

            <ModelInfo
              label="Model"
              value={
                (
                  forecast.model ||
                  "Linear Regression"
                )
                  .replace(
                    /_/g,
                    " "
                  )
              }
            />


            <ModelInfo
              label="Forecast Period"
              value={
                `${days} days`
              }
            />


            <ModelInfo
              label="Historical Days"
              value={
                forecast.historical_days ||
                0
              }
            />


            <div>

              <span>
                Confidence
              </span>


              <PredictiveBadge
                value={
                  forecast.metrics
                    ?.confidence ||
                  forecast.summary
                    ?.confidence ||
                  "UNKNOWN"
                }
              />

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          DEMAND SUMMARY
          ===================================================== */}

      <div className="predictive-kpi-grid">

        <PredictiveKpi
          label="Products Analyzed"
          value={
            demand.summary
              ?.products_analyzed ||
            0
          }
          description="Products included"
          icon={
            <PackageSearch
              size={20}
            />
          }
        />


        <PredictiveKpi
          label="Growing Demand"
          value={
            demand.summary
              ?.growing_demand_products ||
            0
          }
          description="Products trending upward"
          icon={
            <TrendingUp
              size={20}
            />
          }
        />


        <PredictiveKpi
          label="Critical Stock"
          value={
            demand.summary
              ?.critical_stock_products ||
            0
          }
          description="Urgent stock action"
          icon={
            <AlertTriangle
              size={20}
            />
          }
        />


        <PredictiveKpi
          label="Recommended Reorder"
          value={
            `${
              demand.summary
                ?.recommended_total_reorder ||
              0
            } units`
          }
          description="Suggested total purchase"
          icon={
            <ShieldCheck
              size={20}
            />
          }
        />

      </div>


      {/* =====================================================
          DEMAND TABLE
          ===================================================== */}

      <div className="analytics-card predictive-table-card">

        <div className="analytics-card-header">

          <div>

            <h3>
              Smart Demand Prediction
            </h3>


            <p>
              Trend-adjusted demand,
              safety stock and reorder
              recommendations.
            </p>

          </div>

        </div>


        {
          demandRows.length > 0
            ? (
              <div className="table-wrapper">

                <table className="data-table">

                  <thead>

                    <tr>

                      <th>
                        Product
                      </th>

                      <th>
                        Demand Trend
                      </th>

                      <th>
                        Growth
                      </th>

                      <th>
                        Predicted
                      </th>

                      <th>
                        Stock
                      </th>

                      <th>
                        Coverage
                      </th>

                      <th>
                        Safety Stock
                      </th>

                      <th>
                        Reorder
                      </th>

                      <th>
                        Risk
                      </th>

                      <th>
                        Confidence
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      demandRows.map(
                        (product) => (

                          <tr
                            key={
                              product.product_id
                            }
                          >

                            <td>

                              <div className="table-primary-text">
                                {
                                  product.product_name
                                }
                              </div>


                              <div className="table-secondary-text">
                                {
                                  product.sku
                                }
                                {" · "}
                                {
                                  product.category
                                }
                              </div>

                            </td>


                            <td>

                              <PredictiveBadge
                                value={
                                  product.trend
                                }
                              />

                            </td>


                            <td>

                              {
                                formatPercent(
                                  product.growth_percentage
                                )
                              }

                            </td>


                            <td>

                              <strong>
                                {
                                  product.predicted_quantity
                                }
                              </strong>

                            </td>


                            <td>
                              {
                                product.current_stock
                              }
                            </td>


                            <td>

                              {
                                product.stock_coverage_days
                                  ? `${
                                      product.stock_coverage_days
                                    } days`
                                  : "—"
                              }

                            </td>


                            <td>
                              {
                                product.safety_stock
                              }
                            </td>


                            <td>

                              <strong>
                                {
                                  product.recommended_reorder_quantity
                                }
                              </strong>

                            </td>


                            <td>

                              <PredictiveBadge
                                value={
                                  product.stock_risk
                                }
                              />

                            </td>


                            <td>

                              <PredictiveBadge
                                value={
                                  product.confidence
                                }
                              />

                            </td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>
            )
            : (
              <div className="analytics-empty">

                No demand prediction
                data available.

              </div>
            )
        }

      </div>

    </section>
  );
}


// ============================================================
// KPI
// ============================================================

function PredictiveKpi({
  label,
  value,
  description,
  icon,
}) {

  return (
    <div className="predictive-kpi-card">

      <div className="predictive-kpi-top">

        <div className="predictive-kpi-icon">
          {icon}
        </div>


        <span>
          {label}
        </span>

      </div>


      <strong>
        {value}
      </strong>


      <p>
        {description}
      </p>

    </div>
  );
}


// ============================================================
// SUMMARY ITEM
// ============================================================

function PredictionSummaryItem({
  label,
  value,
}) {

  return (
    <div className="prediction-summary-item">

      <span>
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>
  );
}


// ============================================================
// MODEL INFO
// ============================================================

function ModelInfo({
  label,
  value,
}) {

  return (
    <div>

      <span>
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>
  );
}


// ============================================================
// BADGE
// ============================================================

function PredictiveBadge({
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
        `predictive-badge predictive-badge-${normalized}`
      }
    >
      {label}
    </span>
  );
}


export default PredictiveAnalytics;