import {
  BrainCircuit,
  RefreshCcw,
  ShoppingBasket,
  Sparkles,
  UserRoundX,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../api/api";


function RetailIntelligence() {
  const [recommendations, setRecommendations] =
    useState({
      summary: {},
      results: [],
    });

  const [churn, setChurn] =
    useState({
      summary: {},
      results: [],
    });

  const [basket, setBasket] =
    useState({
      summary: {},
      results: [],
    });

  const [selectedCustomer, setSelectedCustomer] =
    useState("");

  const [basketDays, setBasketDays] =
    useState(365);

  const [loading, setLoading] =
    useState(true);

  const [recommendationLoading, setRecommendationLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================================
  // FORMAT
  // =========================================================

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
      Number(
        value || 0
      )
    );


  const formatPercent = (
    value
  ) =>
    `${
      Number(
        value || 0
      ).toFixed(2)
    }%`;


  // =========================================================
  // LOAD MAIN INTELLIGENCE
  // =========================================================

  const fetchIntelligence =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            churnResponse,
            basketResponse,
            recommendationResponse,
          ] = await Promise.all([
            api.get(
              "analytics/ml/churn/"
            ),

            api.get(
              "analytics/ml/market-basket/",
              {
                params: {
                  days:
                    basketDays,
                },
              }
            ),

            api.get(
              "analytics/ml/recommendations/",
              {
                params: {
                  limit: 10,
                },
              }
            ),
          ]);


          setChurn(
            churnResponse.data ||
            {}
          );


          setBasket(
            basketResponse.data ||
            {}
          );


          setRecommendations(
            recommendationResponse.data ||
            {}
          );

        } catch (error) {
          console.error(
            "Retail intelligence error:",
            error
          );


          setError(
            error.response?.data?.detail ||
            "Unable to load retail intelligence."
          );

        } finally {
          setLoading(false);
        }
      },
      [
        basketDays,
      ]
    );


  useEffect(() => {
    fetchIntelligence();
  }, [
    fetchIntelligence,
  ]);


  // =========================================================
  // CUSTOMER RECOMMENDATIONS
  // =========================================================

  const fetchRecommendations =
    async (
      customerId
    ) => {
      setRecommendationLoading(
        true
      );

      setError("");


      try {
        const params = {
          limit: 10,
        };


        if (customerId) {
          params.customer_id =
            customerId;
        }


        const response =
          await api.get(
            "analytics/ml/recommendations/",
            {
              params,
            }
          );


        setRecommendations(
          response.data ||
          {}
        );

      } catch (error) {
        console.error(
          "Recommendation error:",
          error
        );


        setError(
          error.response?.data?.detail ||
          "Unable to load recommendations."
        );

      } finally {
        setRecommendationLoading(
          false
        );
      }
    };


  const handleCustomerChange = (
    event
  ) => {
    const value =
      event.target.value;


    setSelectedCustomer(
      value
    );


    fetchRecommendations(
      value
    );
  };


  // =========================================================
  // CUSTOMER OPTIONS
  // =========================================================

  const customerOptions =
    useMemo(
      () =>
        (
          churn.results ||
          []
        )
          .slice()
          .sort(
            (
              first,
              second
            ) =>
              String(
                first.name || ""
              ).localeCompare(
                String(
                  second.name || ""
                )
              )
          ),
      [
        churn.results,
      ]
    );


  const highRiskCustomers =
    useMemo(
      () =>
        (
          churn.results ||
          []
        ).filter(
          (customer) =>
            customer.risk_level ===
            "HIGH"
        ),
      [
        churn.results,
      ]
    );


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="retail-ai-loading">

        <div className="loading-spinner" />

        <p>
          Analyzing customer and
          basket intelligence...
        </p>

      </div>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <section className="retail-ai-section">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="retail-ai-header">

        <div>

          <p className="page-eyebrow">
            AI Business Intelligence
          </p>


          <h2>
            Retail Intelligence
          </h2>


          <p>
            Discover products customers
            may buy, identify churn risk
            and analyze products frequently
            purchased together.
          </p>

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            fetchIntelligence
          }
        >
          <RefreshCcw
            size={16}
          />

          Refresh
        </button>

      </div>


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

      <div className="retail-ai-kpi-grid">

        <RetailAiKpi
          icon={
            <Sparkles
              size={20}
            />
          }
          label="Recommendations"
          value={
            recommendations.summary
              ?.recommendations ||
            0
          }
          description="Suggested products"
        />


        <RetailAiKpi
          icon={
            <UserRoundX
              size={20}
            />
          }
          label="High Churn Risk"
          value={
            churn.summary
              ?.high_risk ||
            0
          }
          description="Customers needing retention"
        />


        <RetailAiKpi
          icon={
            <ShoppingBasket
              size={20}
            />
          }
          label="Basket Rules"
          value={
            basket.summary
              ?.rules_generated ||
            0
          }
          description="Product associations"
        />


        <RetailAiKpi
          icon={
            <BrainCircuit
              size={20}
            />
          }
          label="Strong Associations"
          value={
            basket.summary
              ?.strong_rules ||
            0
          }
          description="High-value basket rules"
        />

      </div>


      {/* =====================================================
          PRODUCT RECOMMENDATION
          ===================================================== */}

      <div className="analytics-card retail-ai-card">

        <div className="retail-ai-card-header">

          <div>

            <h3>
              Product Recommendations
            </h3>


            <p>
              Select a customer for
              personalized co-purchase
              recommendations.
            </p>

          </div>


          <select
            className="form-select retail-ai-select"
            value={
              selectedCustomer
            }
            onChange={
              handleCustomerChange
            }
          >

            <option value="">
              Overall Popular Products
            </option>


            {
              customerOptions.map(
                (customer) => (

                  <option
                    key={
                      customer.customer_id
                    }
                    value={
                      customer.customer_id
                    }
                  >
                    {
                      customer.name
                    }
                    {
                      customer.customer_code
                        ? ` - ${customer.customer_code}`
                        : ""
                    }
                  </option>

                )
              )
            }

          </select>

        </div>


        {
          recommendationLoading
            ? (
              <div className="analytics-empty">
                Loading recommendations...
              </div>
            )
            : recommendations.results
                ?.length > 0
              ? (
                <div className="retail-recommendation-grid">

                  {
                    recommendations.results.map(
                      (product) => (

                        <div
                          key={
                            product.product_id
                          }
                          className="retail-recommendation-card"
                        >

                          <div className="retail-recommendation-rank">
                            #
                            {
                              product.rank
                            }
                          </div>


                          <div>

                            <strong>
                              {
                                product.name
                              }
                            </strong>


                            <span>
                              {
                                product.sku
                              }
                              {" · "}
                              {
                                product.category
                              }
                            </span>

                          </div>


                          <div className="retail-recommendation-price">
                            {
                              formatCurrency(
                                product.selling_price
                              )
                            }
                          </div>


                          <p>
                            {
                              product.reason
                            }
                          </p>


                          <div className="retail-recommendation-footer">

                            <span>
                              Stock:
                              {" "}
                              {
                                product.stock_quantity
                              }
                            </span>


                            <span>
                              Score:
                              {" "}
                              {
                                product.score
                              }
                            </span>

                          </div>

                        </div>

                      )
                    )
                  }

                </div>
              )
              : (
                <div className="analytics-empty">
                  No recommendations available.
                </div>
              )
        }

      </div>


      {/* =====================================================
          CHURN RISK
          ===================================================== */}

      <div className="analytics-card retail-ai-card">

        <div className="retail-ai-card-header">

          <div>

            <h3>
              Customer Churn Risk
            </h3>


            <p>
              Behaviour-based retention
              risk using customer recency,
              purchase frequency and
              spending.
            </p>

          </div>


          <span className="retail-ai-model-label">
            Behavioral Risk Model
          </span>

        </div>


        <div className="retail-churn-summary">

          <ChurnSummary
            label="High Risk"
            value={
              churn.summary
                ?.high_risk ||
              0
            }
          />


          <ChurnSummary
            label="Medium Risk"
            value={
              churn.summary
                ?.medium_risk ||
              0
            }
          />


          <ChurnSummary
            label="Low Risk"
            value={
              churn.summary
                ?.low_risk ||
              0
            }
          />


          <ChurnSummary
            label="Analyzed"
            value={
              churn.summary
                ?.analyzed_customers ||
              0
            }
          />

        </div>


        <div className="table-wrapper">

          <table className="data-table retail-churn-table">

            <thead>

              <tr>

                <th>
                  Customer
                </th>

                <th>
                  Type
                </th>

                <th>
                  Orders
                </th>

                <th>
                  Spending
                </th>

                <th>
                  Last Purchase
                </th>

                <th>
                  Risk Score
                </th>

                <th>
                  Risk
                </th>

                <th>
                  Recommendation
                </th>

              </tr>

            </thead>


            <tbody>

              {
                (
                  churn.results ||
                  []
                ).length > 0
                  ? (
                    churn.results.map(
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
                                customer.customer_code ||
                                customer.phone ||
                                "—"
                              }
                            </div>

                          </td>


                          <td>
                            {
                              customer.customer_type
                            }
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


                          <td>

                            {
                              customer.days_since_last_order
                                !== null
                                ? `${
                                    customer.days_since_last_order
                                  } days`
                                : "Never"
                            }

                          </td>


                          <td>

                            <strong>
                              {
                                Number(
                                  customer.risk_score ||
                                  0
                                ).toFixed(
                                  1
                                )
                              }
                            </strong>

                          </td>


                          <td>

                            <RetailAiBadge
                              value={
                                customer.risk_level
                              }
                            />

                          </td>


                          <td className="retail-ai-recommendation-text">
                            {
                              customer.recommendation
                            }
                          </td>

                        </tr>

                      )
                    )
                  )
                  : (
                    <tr>

                      <td
                        colSpan={8}
                      >
                        <div className="analytics-empty">
                          No customer churn data.
                        </div>
                      </td>

                    </tr>
                  )
              }

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          HIGH RISK QUICK VIEW
          ===================================================== */}

      {
        highRiskCustomers.length > 0 && (

          <div className="retail-risk-grid">

            {
              highRiskCustomers
                .slice(
                  0,
                  4
                )
                .map(
                  (customer) => (

                    <div
                      key={
                        customer.customer_id
                      }
                      className="retail-risk-card"
                    >

                      <span>
                        High Churn Risk
                      </span>


                      <strong>
                        {
                          customer.name
                        }
                      </strong>


                      <p>
                        {
                          customer.days_since_last_order
                          !== null
                            ? `${
                                customer.days_since_last_order
                              } days since last order`
                            : "No purchase history"
                        }
                      </p>


                      <div>

                        Risk Score

                        <b>
                          {
                            Number(
                              customer.risk_score ||
                              0
                            ).toFixed(
                              1
                            )
                          }
                        </b>

                      </div>

                    </div>

                  )
                )
            }

          </div>
        )
      }


      {/* =====================================================
          MARKET BASKET
          ===================================================== */}

      <div className="analytics-card retail-ai-card">

        <div className="retail-ai-card-header">

          <div>

            <h3>
              Market Basket Analysis
            </h3>


            <p>
              Find product combinations
              that frequently occur in
              the same sales order.
            </p>

          </div>


          <select
            className="form-select retail-ai-select"
            value={
              basketDays
            }
            onChange={
              (event) =>
                setBasketDays(
                  Number(
                    event.target.value
                  )
                )
            }
          >

            <option value={30}>
              Last 30 Days
            </option>

            <option value={90}>
              Last 90 Days
            </option>

            <option value={180}>
              Last 180 Days
            </option>

            <option value={365}>
              Last 1 Year
            </option>

          </select>

        </div>


        <div className="retail-churn-summary">

          <ChurnSummary
            label="Orders"
            value={
              basket.summary
                ?.orders_analyzed ||
              0
            }
          />


          <ChurnSummary
            label="Products"
            value={
              basket.summary
                ?.unique_products ||
              0
            }
          />


          <ChurnSummary
            label="Pairs"
            value={
              basket.summary
                ?.product_pairs ||
              0
            }
          />


          <ChurnSummary
            label="Strong Rules"
            value={
              basket.summary
                ?.strong_rules ||
              0
            }
          />

        </div>


        <div className="table-wrapper">

          <table className="data-table retail-basket-table">

            <thead>

              <tr>

                <th>
                  If Customer Buys
                </th>

                <th>
                  Recommend
                </th>

                <th>
                  Support
                </th>

                <th>
                  Confidence
                </th>

                <th>
                  Lift
                </th>

                <th>
                  Strength
                </th>

              </tr>

            </thead>


            <tbody>

              {
                (
                  basket.results ||
                  []
                ).length > 0
                  ? (
                    basket.results.map(
                      (
                        rule,
                        index
                      ) => (

                        <tr
                          key={
                            `${
                              rule.antecedent?.id
                            }-${
                              rule.consequent?.id
                            }-${index}`
                          }
                        >

                          <td>

                            <div className="table-primary-text">
                              {
                                rule.antecedent
                                  ?.name
                              }
                            </div>


                            <div className="table-secondary-text">
                              {
                                rule.antecedent
                                  ?.sku
                              }
                            </div>

                          </td>


                          <td>

                            <div className="table-primary-text">
                              {
                                rule.consequent
                                  ?.name
                              }
                            </div>


                            <div className="table-secondary-text">
                              {
                                rule.consequent
                                  ?.sku
                              }
                            </div>

                          </td>


                          <td>
                            {
                              formatPercent(
                                rule.support
                              )
                            }
                          </td>


                          <td>
                            {
                              formatPercent(
                                rule.confidence
                              )
                            }
                          </td>


                          <td>
                            {
                              Number(
                                rule.lift ||
                                0
                              ).toFixed(
                                2
                              )
                            }
                          </td>


                          <td>

                            <RetailAiBadge
                              value={
                                rule.strength
                              }
                            />

                          </td>

                        </tr>

                      )
                    )
                  )
                  : (
                    <tr>

                      <td
                        colSpan={6}
                      >

                        <div className="analytics-empty">
                          Not enough product
                          combinations for market
                          basket analysis.
                        </div>

                      </td>

                    </tr>
                  )
              }

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}


// ============================================================
// KPI
// ============================================================

function RetailAiKpi({
  icon,
  label,
  value,
  description,
}) {

  return (
    <div className="retail-ai-kpi-card">

      <div className="retail-ai-kpi-icon">
        {icon}
      </div>


      <div>

        <span>
          {label}
        </span>


        <strong>
          {value}
        </strong>


        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// SUMMARY
// ============================================================

function ChurnSummary({
  label,
  value,
}) {

  return (
    <div className="retail-ai-summary-item">

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

function RetailAiBadge({
  value,
}) {

  const normalized =
    String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /_/g,
        "-"
      );


  const label =
    String(
      value ||
      "—"
    )
      .replace(
        /_/g,
        " "
      );


  return (
    <span
      className={
        `retail-ai-badge retail-ai-badge-${normalized}`
      }
    >
      {label}
    </span>
  );
}


export default RetailIntelligence;