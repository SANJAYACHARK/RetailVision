import {
  ArrowLeft,
  Ban,
  CreditCard,
  PackageCheck,
  Printer,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../api/api";

import PaymentModal from "../../components/sales/PaymentModal";
import ReturnModal from "../../components/sales/ReturnModal";


function SaleDetails() {

  const { id } = useParams();

  const navigate = useNavigate();


  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    paymentModalOpen,
    setPaymentModalOpen,
  ] = useState(false);

  const [
    returnModalOpen,
    setReturnModalOpen,
  ] = useState(false);


  /* =========================================================
     LOAD ORDER
     ========================================================= */

  const fetchOrder =
    useCallback(
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
            "Unable to load sale:",
            error
          );

          const data =
            error.response?.data;

          if (data?.detail) {

            setError(
              data.detail
            );

          } else {

            setError(
              "Unable to load sale details."
            );
          }

        } finally {

          setLoading(false);
        }

      },
      [id]
    );


  useEffect(() => {

    fetchOrder();

  }, [fetchOrder]);


  /* =========================================================
     FORMATTERS
     ========================================================= */

  const formatCurrency = (
    value
  ) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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


  /* =========================================================
     BADGE CLASS
     ========================================================= */

  const getStatusClass = (
    status
  ) => {

    switch (status) {

      case "COMPLETED":
      case "PAID":
      case "SUCCESS":
        return "badge badge-success";

      case "PENDING":
      case "PARTIAL":
        return "badge badge-warning";

      case "CANCELLED":
      case "UNPAID":
      case "FAILED":
        return "badge badge-danger";

      case "RETURNED":
      case "REFUNDED":
        return "badge badge-muted";

      default:
        return "badge badge-neutral";
    }
  };


  /* =========================================================
     ERROR PARSER
     ========================================================= */

  const getErrorMessage = (
    error,
    fallback
  ) => {

    const data =
      error.response?.data;

    if (!data) {
      return fallback;
    }


    if (
      typeof data === "string"
    ) {
      return data;
    }


    if (data.detail) {

      return Array.isArray(
        data.detail
      )
        ? data.detail.join(" ")
        : String(
            data.detail
          );
    }


    if (data.status) {

      return Array.isArray(
        data.status
      )
        ? data.status.join(" ")
        : String(
            data.status
          );
    }


    const values =
      Object.values(data)
        .flat(Infinity)
        .filter(Boolean);

    if (values.length > 0) {

      return values.join(" ");
    }


    return fallback;
  };


  /* =========================================================
     COMPLETE ORDER
     ========================================================= */

  const handleCompleteOrder =
    async () => {

      if (!order) {
        return;
      }


      const confirmed =
        window.confirm(
          "Complete this pending sale? Product stock will be deducted."
        );

      if (!confirmed) {
        return;
      }


      setActionLoading(true);
      setError("");

      try {

        await api.patch(
          `sales/orders/${order.id}/`,
          {
            status:
              "COMPLETED",
          }
        );

        await fetchOrder();

      } catch (error) {

        console.error(
          "Unable to complete sale:",
          error
        );

        setError(
          getErrorMessage(
            error,
            "Unable to complete sale."
          )
        );

      } finally {

        setActionLoading(false);
      }
    };


  /* =========================================================
     CANCEL ORDER
     ========================================================= */

  const handleCancelOrder =
    async () => {

      if (!order) {
        return;
      }


      const confirmed =
        window.confirm(
          "Cancel this sale? If stock was already deducted, it will be restored."
        );

      if (!confirmed) {
        return;
      }


      setActionLoading(true);
      setError("");

      try {

        await api.patch(
          `sales/orders/${order.id}/`,
          {
            status:
              "CANCELLED",
          }
        );

        await fetchOrder();

      } catch (error) {

        console.error(
          "Unable to cancel sale:",
          error
        );

        setError(
          getErrorMessage(
            error,
            "Unable to cancel sale."
          )
        );

      } finally {

        setActionLoading(false);
      }
    };


  /* =========================================================
     DERIVED VALUES
     ========================================================= */

  const balanceAmount =
    Number(
      order?.balance_amount || 0
    );

  const canAddPayment =
    order &&
    balanceAmount > 0 &&
    order.status !==
      "CANCELLED" &&
    order.status !==
      "RETURNED";

  const canProcessReturn =
    order?.status ===
    "COMPLETED";

  const canCancel =
    order &&
    order.status !==
      "CANCELLED" &&
    order.status !==
      "RETURNED";

  const canComplete =
    order?.status ===
    "PENDING";


  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {

    return (

      <div className="page-loading">

        <div className="loading-spinner" />

        <p>
          Loading invoice...
        </p>

      </div>
    );
  }


  /* =========================================================
     NOT FOUND / LOAD ERROR
     ========================================================= */

  if (!order) {

    return (

      <div className="page-content">

        <button
          type="button"
          className="back-button"
          onClick={
            () =>
              navigate(
                "/sales"
              )
          }
        >
          <ArrowLeft size={17} />

          Back to Sales
        </button>


        <div className="page-error">

          {
            error ||
            "Sale not found."
          }

        </div>

      </div>
    );
  }


  return (

    <div className="page-content">


      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-header">

        <div>

          <button
            type="button"
            className="back-button"
            onClick={
              () =>
                navigate(
                  "/sales"
                )
            }
          >
            <ArrowLeft size={17} />

            Back to Sales
          </button>


          <p className="page-eyebrow">
            Sales Invoice
          </p>


          <h1 className="page-title">
            {
              order.invoice_number
            }
          </h1>


          <p className="page-description">

            Created on{" "}

            {
              formatDate(
                order.order_date
              )
            }

          </p>

        </div>


        <div className="page-header-actions">


          {/* REFRESH */}

          <button
            type="button"
            className="secondary-button"
            onClick={
              fetchOrder
            }
            disabled={
              actionLoading
            }
          >
            <RefreshCcw size={17} />

            Refresh
          </button>


          {/* PRINT INVOICE */}

          <button
            type="button"
            className="secondary-button"
            onClick={
              () =>
                navigate(
                  `/sales/${order.id}/invoice`
                )
            }
          >
            <Printer size={17} />

            Invoice
          </button>


          {/* COMPLETE */}

          {
            canComplete && (

              <button
                type="button"
                className="primary-button"
                onClick={
                  handleCompleteOrder
                }
                disabled={
                  actionLoading
                }
              >
                <PackageCheck size={17} />

                {
                  actionLoading
                    ? "Processing..."
                    : "Complete Sale"
                }

              </button>
            )
          }


          {/* CANCEL */}

          {
            canCancel && (

              <button
                type="button"
                className="danger-button"
                onClick={
                  handleCancelOrder
                }
                disabled={
                  actionLoading
                }
              >
                <Ban size={17} />

                Cancel Sale
              </button>
            )
          }

        </div>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {
        error && (

          <div className="page-error sale-details-error">
            {error}
          </div>
        )
      }


      {/* =====================================================
          TOP STATUS CARDS
          ===================================================== */}

      <div className="sale-details-status-grid">


        {/* ORDER STATUS */}

        <div className="sale-details-status-card">

          <span>
            Order Status
          </span>


          <div>

            <span
              className={
                getStatusClass(
                  order.status
                )
              }
            >

              {
                order.status_display ||
                order.status
              }

            </span>

          </div>

        </div>


        {/* PAYMENT STATUS */}

        <div className="sale-details-status-card">

          <span>
            Payment Status
          </span>


          <div>

            <span
              className={
                getStatusClass(
                  order.payment_status
                )
              }
            >

              {
                order.payment_status_display ||
                order.payment_status
              }

            </span>

          </div>

        </div>


        {/* AMOUNT PAID */}

        <div className="sale-details-status-card">

          <span>
            Amount Paid
          </span>

          <strong>

            {
              formatCurrency(
                order.amount_paid
              )
            }

          </strong>

        </div>


        {/* BALANCE */}

        <div className="sale-details-status-card">

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


      {/* =====================================================
          MAIN DETAILS LAYOUT
          ===================================================== */}

      <div className="sale-details-layout">


        {/* ===================================================
            LEFT SIDE
            =================================================== */}

        <div className="sale-details-main">


          {/* CUSTOMER INFORMATION */}

          <section className="sale-details-card">

            <div className="sale-details-card-header">

              <div>

                <p className="sale-details-card-eyebrow">
                  Customer
                </p>

                <h2>
                  Customer Information
                </h2>

              </div>


              <UserRound size={20} />

            </div>


            <div className="sale-details-info-grid">

              <InfoItem
                label="Customer"
                value={
                  order.customer_name ||
                  "Walk-in Customer"
                }
              />


              <InfoItem
                label="Customer Code"
                value={
                  order.customer_code ||
                  "—"
                }
              />


              <InfoItem
                label="Created By"
                value={
                  order.created_by_name ||
                  "—"
                }
              />


              <InfoItem
                label="Invoice Date"
                value={
                  formatDate(
                    order.order_date
                  )
                }
              />

            </div>

          </section>


          {/* =================================================
              PRODUCTS
              ================================================= */}

          <section className="sale-details-card">

            <div className="sale-details-card-header">

              <div>

                <p className="sale-details-card-eyebrow">
                  Invoice Items
                </p>

                <h2>
                  Products Sold
                </h2>

              </div>


              <ReceiptText size={20} />

            </div>


            {
              order.items?.length >
              0
                ? (

                  <div className="table-wrapper">

                    <table className="data-table sale-details-items-table">

                      <thead>

                        <tr>

                          <th>
                            Product
                          </th>

                          <th>
                            Unit Price
                          </th>

                          <th>
                            Qty
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
                          order.items.map(
                            (item) => (

                              <tr
                                key={
                                  item.id
                                }
                              >


                                {/* PRODUCT */}

                                <td>

                                  <div className="table-primary-text">

                                    {
                                      item.product_name ||
                                      item.product_name_display ||
                                      "Product"
                                    }

                                  </div>


                                  <div className="table-secondary-text">

                                    SKU:{" "}

                                    {
                                      item.product_sku ||
                                      "—"
                                    }

                                  </div>

                                </td>


                                {/* UNIT PRICE */}

                                <td className="table-money">

                                  {
                                    formatCurrency(
                                      item.unit_price
                                    )
                                  }

                                </td>


                                {/* QUANTITY */}

                                <td>

                                  {
                                    item.quantity
                                  }

                                </td>


                                {/* DISCOUNT */}

                                <td className="table-money">

                                  {
                                    formatCurrency(
                                      item.discount_amount
                                    )
                                  }

                                </td>


                                {/* TAX */}

                                <td>

                                  <div className="table-primary-text">

                                    {
                                      formatCurrency(
                                        item.tax_amount
                                      )
                                    }

                                  </div>


                                  <div className="table-secondary-text">

                                    {
                                      Number(
                                        item.tax_percent ||
                                        0
                                      )
                                    }
                                    %

                                  </div>

                                </td>


                                {/* TOTAL */}

                                <td className="table-money">

                                  {
                                    formatCurrency(
                                      item.subtotal
                                    )
                                  }

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

                  <div className="sale-details-empty">

                    <ReceiptText size={32} />

                    <h3>
                      No products found
                    </h3>

                    <p>
                      This invoice does not
                      contain any products.
                    </p>

                  </div>
                )
            }

          </section>


          {/* =================================================
              PAYMENT HISTORY
              ================================================= */}

          <section className="sale-details-card">

            <div className="sale-details-card-header">

              <div>

                <p className="sale-details-card-eyebrow">
                  Payments
                </p>

                <h2>
                  Payment History
                </h2>

              </div>


              <CreditCard size={20} />

            </div>


            {
              order.payments?.length >
              0
                ? (

                  <div className="table-wrapper">

                    <table className="data-table">

                      <thead>

                        <tr>

                          <th>
                            Date
                          </th>

                          <th>
                            Method
                          </th>

                          <th>
                            Reference
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Amount
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          order.payments.map(
                            (payment) => (

                              <tr
                                key={
                                  payment.id
                                }
                              >


                                <td>

                                  {
                                    formatDate(
                                      payment.paid_at
                                    )
                                  }

                                </td>


                                <td>

                                  {
                                    payment.method_display ||
                                    payment.method
                                  }

                                </td>


                                <td>

                                  {
                                    payment.reference_number ||
                                    "—"
                                  }

                                </td>


                                <td>

                                  <span
                                    className={
                                      getStatusClass(
                                        payment.status
                                      )
                                    }
                                  >

                                    {
                                      payment.status_display ||
                                      payment.status
                                    }

                                  </span>

                                </td>


                                <td className="table-money">

                                  {
                                    formatCurrency(
                                      payment.amount
                                    )
                                  }

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

                  <div className="sale-details-empty">

                    <WalletCards size={32} />

                    <h3>
                      No payments recorded
                    </h3>

                    <p>
                      Add a payment to
                      this invoice when
                      payment is received.
                    </p>

                  </div>
                )
            }

          </section>


          {/* =================================================
              RETURNS
              ================================================= */}

          {
            order.returns?.length >
              0 && (

              <section className="sale-details-card">

                <div className="sale-details-card-header">

                  <div>

                    <p className="sale-details-card-eyebrow">
                      Returns
                    </p>

                    <h2>
                      Return History
                    </h2>

                  </div>


                  <RotateCcw size={20} />

                </div>


                <div className="table-wrapper">

                  <table className="data-table">

                    <thead>

                      <tr>

                        <th>
                          Return
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Reason
                        </th>

                        <th>
                          Refund
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {
                        order.returns.map(
                          (
                            salesReturn
                          ) => (

                            <tr
                              key={
                                salesReturn.id
                              }
                            >

                              <td className="table-primary-text">

                                {
                                  salesReturn.return_number
                                }

                              </td>


                              <td>

                                {
                                  formatDate(
                                    salesReturn.returned_at
                                  )
                                }

                              </td>


                              <td>

                                {
                                  salesReturn.reason ||
                                  "—"
                                }

                              </td>


                              <td className="table-money">

                                {
                                  formatCurrency(
                                    salesReturn.refund_amount
                                  )
                                }

                              </td>

                            </tr>

                          )
                        )
                      }

                    </tbody>

                  </table>

                </div>

              </section>
            )
          }

        </div>


        {/* ===================================================
            RIGHT SIDEBAR
            =================================================== */}

        <aside className="sale-details-sidebar">


          {/* INVOICE SUMMARY */}

          <section className="sale-details-summary-card">

            <h2>
              Invoice Summary
            </h2>


            <SummaryRow
              label="Subtotal"
              value={
                formatCurrency(
                  order.subtotal
                )
              }
            />


            <SummaryRow
              label="Tax"
              value={
                formatCurrency(
                  order.tax_amount
                )
              }
            />


            <SummaryRow
              label="Discount"
              value={
                `- ${formatCurrency(
                  order.discount_amount
                )}`
              }
            />


            <div className="sale-details-grand-total">

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


            <SummaryRow
              label="Amount Paid"
              value={
                formatCurrency(
                  order.amount_paid
                )
              }
            />


            <SummaryRow
              label="Balance"
              value={
                formatCurrency(
                  order.balance_amount
                )
              }
            />

          </section>


          {/* ADD PAYMENT */}

          {
            canAddPayment && (

              <button
                type="button"
                className="primary-button sale-details-action-button"
                onClick={
                  () =>
                    setPaymentModalOpen(
                      true
                    )
                }
              >
                <CreditCard size={17} />

                Add Payment
              </button>
            )
          }


          {/* PROCESS RETURN */}

          {
            canProcessReturn && (

              <button
                type="button"
                className="secondary-button sale-details-action-button"
                onClick={
                  () =>
                    setReturnModalOpen(
                      true
                    )
                }
              >
                <RotateCcw size={17} />

                Process Return
              </button>
            )
          }


          {/* PRINT INVOICE */}

          <button
            type="button"
            className="secondary-button sale-details-action-button"
            onClick={
              () =>
                navigate(
                  `/sales/${order.id}/invoice`
                )
            }
          >
            <Printer size={17} />

            Print Invoice
          </button>


          {/* NOTES */}

          {
            order.notes && (

              <section className="sale-details-notes-card">

                <span>
                  Notes
                </span>

                <p>
                  {
                    order.notes
                  }
                </p>

              </section>
            )
          }

        </aside>

      </div>


      {/* =====================================================
          PAYMENT MODAL
          ===================================================== */}

      <PaymentModal
        open={
          paymentModalOpen
        }
        order={
          order
        }
        onClose={
          () =>
            setPaymentModalOpen(
              false
            )
        }
        onSuccess={
          async () => {

            setPaymentModalOpen(
              false
            );

            await fetchOrder();
          }
        }
      />


      {/* =====================================================
          RETURN MODAL
          ===================================================== */}

      <ReturnModal
        open={
          returnModalOpen
        }
        order={
          order
        }
        onClose={
          () =>
            setReturnModalOpen(
              false
            )
        }
        onSuccess={
          async () => {

            setReturnModalOpen(
              false
            );

            await fetchOrder();
          }
        }
      />

    </div>
  );
}


/* =========================================================
   INFORMATION ITEM
   ========================================================= */

function InfoItem({
  label,
  value,
}) {

  return (

    <div className="sale-info-item">

      <span>
        {label}
      </span>

      <strong>
        {
          value ||
          "—"
        }
      </strong>

    </div>
  );
}


/* =========================================================
   SUMMARY ROW
   ========================================================= */

function SummaryRow({
  label,
  value,
}) {

  return (

    <div className="sale-details-summary-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


export default SaleDetails;