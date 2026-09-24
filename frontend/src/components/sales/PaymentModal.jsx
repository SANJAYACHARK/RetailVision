import {
  useEffect,
  useState,
} from "react";

import {
  CreditCard,
  X,
} from "lucide-react";

import api from "../../api/api";


function PaymentModal({
  open,
  onClose,
  onSuccess,
  order,
}) {

  const [amount, setAmount] =
    useState("");

  const [method, setMethod] =
    useState("CASH");

  const [
    referenceNumber,
    setReferenceNumber,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {

    if (open && order) {

      setAmount(
        Number(
          order.balance_amount || 0
        ).toFixed(2)
      );

      setMethod("CASH");
      setReferenceNumber("");
      setNotes("");
      setError("");
    }

  }, [
    open,
    order,
  ]);


  if (!open || !order) {
    return null;
  }


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


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError("");

      const paymentAmount =
        Number(amount);

      if (
        !paymentAmount ||
        paymentAmount <= 0
      ) {

        setError(
          "Enter a valid payment amount."
        );

        return;
      }


      if (
        paymentAmount >
        Number(
          order.balance_amount
        )
      ) {

        setError(
          "Payment cannot exceed the remaining balance."
        );

        return;
      }


      setLoading(true);

      try {

        await api.post(
          "sales/payments/",
          {
            order:
              order.id,

            amount:
              paymentAmount.toFixed(
                2
              ),

            method,

            status:
              "SUCCESS",

            reference_number:
              referenceNumber,

            notes,
          }
        );

        onSuccess();

      } catch (error) {

        console.error(
          "Payment failed:",
          error
        );

        const data =
          error.response?.data;

        if (data) {

          const message =
            Object.values(data)
              .flat()
              .join(" ");

          setError(
            message ||
              "Unable to add payment."
          );

        } else {

          setError(
            "Unable to add payment."
          );
        }

      } finally {

        setLoading(false);
      }
    };


  return (

    <div className="modal-overlay">

      <div className="modal payment-modal">

        <div className="modal-header">

          <div>

            <p className="modal-subtitle">
              {order.invoice_number}
            </p>

            <h2 className="modal-title">
              Add Payment
            </h2>

          </div>


          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            <X size={19} />
          </button>

        </div>


        <form
          onSubmit={handleSubmit}
          className="modal-body"
        >

          <div className="payment-modal-summary">

            <div className="payment-modal-icon">
              <CreditCard size={21} />
            </div>

            <div>

              <span>
                Remaining Balance
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


          {error && (

            <div className="modal-error">
              {error}
            </div>

          )}


          <div className="form-grid">

            <div className="form-group">

              <label className="form-label">
                Amount *
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                className="form-input"
                value={amount}
                onChange={
                  (event) =>
                    setAmount(
                      event.target.value
                    )
                }
                required
              />

            </div>


            <div className="form-group">

              <label className="form-label">
                Payment Method *
              </label>

              <select
                className="form-select"
                value={method}
                onChange={
                  (event) =>
                    setMethod(
                      event.target.value
                    )
                }
              >

                <option value="CASH">
                  Cash
                </option>

                <option value="UPI">
                  UPI
                </option>

                <option value="CARD">
                  Card
                </option>

                <option value="NET_BANKING">
                  Net Banking
                </option>

              </select>

            </div>


            <div className="form-group form-full-width">

              <label className="form-label">
                Reference Number
              </label>

              <input
                type="text"
                className="form-input"
                value={referenceNumber}
                onChange={
                  (event) =>
                    setReferenceNumber(
                      event.target.value
                    )
                }
                placeholder="UPI, card or transaction ID"
              />

            </div>


            <div className="form-group form-full-width">

              <label className="form-label">
                Notes
              </label>

              <textarea
                className="form-textarea"
                value={notes}
                onChange={
                  (event) =>
                    setNotes(
                      event.target.value
                    )
                }
                placeholder="Optional payment notes..."
              />

            </div>

          </div>


          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >

              {
                loading
                  ? "Saving..."
                  : "Add Payment"
              }

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default PaymentModal;