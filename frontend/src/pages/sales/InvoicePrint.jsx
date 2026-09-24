import {
  ArrowLeft,
  Printer,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../api/api";


function InvoicePrint() {

  const { id } = useParams();

  const navigate =
    useNavigate();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    const fetchInvoice =
      async () => {

        setLoading(true);
        setError("");

        try {

          const response =
            await api.get(
              `sales/orders/${id}/`
            );

          setOrder(
            response.data
          );

        } catch (error) {

          console.error(
            "Unable to load invoice:",
            error
          );

          setError(
            "Unable to load invoice."
          );

        } finally {

          setLoading(false);
        }
      };


    fetchInvoice();

  }, [id]);


  const formatCurrency = (
    value
  ) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
      }
    ).format(
      Number(value || 0)
    );
  };


  const formatDate = (
    value
  ) => {

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


  if (loading) {

    return (

      <div className="invoice-loading">

        <div className="loading-spinner" />

        <p>
          Preparing invoice...
        </p>

      </div>
    );
  }


  if (
    error ||
    !order
  ) {

    return (

      <div className="invoice-loading">

        <p className="page-error">
          {
            error ||
            "Invoice not found."
          }
        </p>

      </div>
    );
  }


  return (

    <div className="invoice-print-page">


      {/* ACTION BAR */}

      <div className="invoice-screen-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={
            () =>
              navigate(
                `/sales/${order.id}`
              )
          }
        >
          <ArrowLeft size={17} />

          Back
        </button>


        <button
          type="button"
          className="primary-button"
          onClick={
            () =>
              window.print()
          }
        >
          <Printer size={17} />

          Print Invoice
        </button>

      </div>


      {/* INVOICE */}

      <div className="invoice-document">


        {/* HEADER */}

        <header className="invoice-header">

          <div>

            <div className="invoice-brand">

              <div className="invoice-brand-mark">
                RV
              </div>

              <div>

                <h1>
                  RetailVision
                </h1>

                <p>
                  Retail Sales Analytics &
                  Business Intelligence System
                </p>

              </div>

            </div>

          </div>


          <div className="invoice-title-area">

            <p>
              SALES INVOICE
            </p>

            <h2>
              {
                order.invoice_number
              }
            </h2>

          </div>

        </header>


        <div className="invoice-divider" />


        {/* INFORMATION */}

        <section className="invoice-info-grid">

          <div>

            <p className="invoice-section-label">
              Billed To
            </p>

            <h3>
              {
                order.customer_name ||
                "Walk-in Customer"
              }
            </h3>

            {
              order.customer_code && (

                <p>
                  Customer ID:{" "}
                  {
                    order.customer_code
                  }
                </p>

              )
            }

          </div>


          <div>

            <p className="invoice-section-label">
              Invoice Details
            </p>


            <div className="invoice-detail-row">

              <span>
                Invoice Date
              </span>

              <strong>
                {
                  formatDate(
                    order.order_date
                  )
                }
              </strong>

            </div>


            <div className="invoice-detail-row">

              <span>
                Order Status
              </span>

              <strong>
                {
                  order.status_display ||
                  order.status
                }
              </strong>

            </div>


            <div className="invoice-detail-row">

              <span>
                Payment
              </span>

              <strong>
                {
                  order.payment_status_display ||
                  order.payment_status
                }
              </strong>

            </div>

          </div>

        </section>


        {/* ITEMS */}

        <section className="invoice-items-section">

          <table className="invoice-table">

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  Item
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Unit Price
                </th>

                <th>
                  Discount
                </th>

                <th>
                  Tax
                </th>

                <th>
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              {
                order.items?.map(
                  (
                    item,
                    index
                  ) => (

                    <tr key={item.id}>

                      <td>
                        {
                          index + 1
                        }
                      </td>


                      <td>

                        <strong>
                          {
                            item.product_name
                          }
                        </strong>

                        <span className="invoice-item-sku">
                          SKU:{" "}
                          {
                            item.product_sku
                          }
                        </span>

                      </td>


                      <td>
                        {
                          item.quantity
                        }
                      </td>


                      <td>
                        {
                          formatCurrency(
                            item.unit_price
                          )
                        }
                      </td>


                      <td>
                        {
                          formatCurrency(
                            item.discount_amount
                          )
                        }
                      </td>


                      <td>
                        {
                          formatCurrency(
                            item.tax_amount
                          )
                        }
                      </td>


                      <td>
                        <strong>
                          {
                            formatCurrency(
                              item.subtotal
                            )
                          }
                        </strong>
                      </td>

                    </tr>

                  )
                )
              }

            </tbody>

          </table>

        </section>


        {/* BOTTOM */}

        <section className="invoice-bottom">


          <div className="invoice-payment-area">

            <p className="invoice-section-label">
              Payment Summary
            </p>


            {
              order.payments?.length > 0
                ? (

                  <div className="invoice-payments">

                    {
                      order.payments.map(
                        (payment) => (

                          <div
                            className="invoice-payment-row"
                            key={
                              payment.id
                            }
                          >

                            <div>

                              <strong>
                                {
                                  payment.method_display ||
                                  payment.method
                                }
                              </strong>

                              <span>
                                {
                                  payment.reference_number ||
                                  formatDate(
                                    payment.paid_at
                                  )
                                }
                              </span>

                            </div>


                            <strong>
                              {
                                formatCurrency(
                                  payment.amount
                                )
                              }
                            </strong>

                          </div>

                        )
                      )
                    }

                  </div>

                )
                : (

                  <p className="invoice-muted-text">
                    No payment recorded.
                  </p>

                )
            }


            {
              order.notes && (

                <div className="invoice-notes">

                  <p className="invoice-section-label">
                    Notes
                  </p>

                  <p>
                    {order.notes}
                  </p>

                </div>

              )
            }

          </div>


          <div className="invoice-totals">

            <div className="invoice-total-row">

              <span>
                Subtotal
              </span>

              <strong>
                {
                  formatCurrency(
                    order.subtotal
                  )
                }
              </strong>

            </div>


            <div className="invoice-total-row">

              <span>
                Tax
              </span>

              <strong>
                {
                  formatCurrency(
                    order.tax_amount
                  )
                }
              </strong>

            </div>


            <div className="invoice-total-row">

              <span>
                Discount
              </span>

              <strong>
                -{" "}
                {
                  formatCurrency(
                    order.discount_amount
                  )
                }
              </strong>

            </div>


            <div className="invoice-grand-total">

              <span>
                Grand Total
              </span>

              <strong>
                {
                  formatCurrency(
                    order.grand_total
                  )
                }
              </strong>

            </div>


            <div className="invoice-total-row">

              <span>
                Paid
              </span>

              <strong>
                {
                  formatCurrency(
                    order.amount_paid
                  )
                }
              </strong>

            </div>


            <div className="invoice-balance-row">

              <span>
                Balance
              </span>

              <strong>
                {
                  formatCurrency(
                    order.balance_amount
                  )
                }
              </strong>

            </div>

          </div>

        </section>


        <footer className="invoice-footer">

          <p>
            Thank you for your business.
          </p>

          <span>
            Generated using RetailVision
          </span>

        </footer>

      </div>

    </div>
  );
}


export default InvoicePrint;