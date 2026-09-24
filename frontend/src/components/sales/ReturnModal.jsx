import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RotateCcw,
  X,
} from "lucide-react";

import api from "../../api/api";


function ReturnModal({
  open,
  onClose,
  onSuccess,
  order,
}) {

  const [items, setItems] =
    useState([]);

  const [reason, setReason] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {

    if (
      open &&
      order
    ) {

      setItems(
        (order.items || []).map(
          (item) => ({
            order_item:
              item.id,

            name:
              item.product_name,

            sku:
              item.product_sku,

            sold_quantity:
              item.quantity,

            quantity: 0,
          })
        )
      );

      setReason("");
      setError("");
    }

  }, [
    open,
    order,
  ]);


  const selectedItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            Number(
              item.quantity
            ) > 0
        ),
      [items]
    );


  if (!open || !order) {
    return null;
  }


  const updateQuantity = (
    orderItemId,
    value
  ) => {

    setItems(
      (previous) =>
        previous.map(
          (item) => {

            if (
              item.order_item !==
              orderItemId
            ) {
              return item;
            }

            const quantity =
              Math.min(
                item.sold_quantity,
                Math.max(
                  0,
                  Number(value) || 0
                )
              );

            return {
              ...item,
              quantity,
            };
          }
        )
    );
  };


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError("");


      if (
        selectedItems.length === 0
      ) {

        setError(
          "Select at least one product to return."
        );

        return;
      }


      setLoading(true);

      try {

        await api.post(
          "sales/returns/",
          {
            order:
              order.id,

            reason,

            items:
              selectedItems.map(
                (item) => ({
                  order_item:
                    item.order_item,

                  quantity:
                    item.quantity,
                })
              ),
          }
        );

        onSuccess();

      } catch (error) {

        console.error(
          "Return failed:",
          error
        );

        const data =
          error.response?.data;

        if (data) {

          const message =
            Object.values(data)
              .flat(Infinity)
              .join(" ");

          setError(
            message ||
              "Unable to process return."
          );

        } else {

          setError(
            "Unable to process return."
          );
        }

      } finally {

        setLoading(false);
      }
    };


  return (

    <div className="modal-overlay">

      <div className="modal return-modal">

        <div className="modal-header">

          <div>

            <p className="modal-subtitle">
              {order.invoice_number}
            </p>

            <h2 className="modal-title">
              Process Return
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

          <div className="return-modal-intro">

            <div className="return-modal-icon">
              <RotateCcw size={20} />
            </div>

            <div>

              <h3>
                Select returned items
              </h3>

              <p>
                Returned quantities will
                automatically be added back
                to stock.
              </p>

            </div>

          </div>


          {error && (

            <div className="modal-error">
              {error}
            </div>

          )}


          <div className="table-wrapper">

            <table className="data-table return-items-table">

              <thead>

                <tr>
                  <th>Product</th>
                  <th>Sold Qty</th>
                  <th>Return Qty</th>
                </tr>

              </thead>


              <tbody>

                {
                  items.map(
                    (item) => (

                      <tr
                        key={
                          item.order_item
                        }
                      >

                        <td>

                          <div className="table-primary-text">
                            {item.name}
                          </div>

                          <div className="table-secondary-text">
                            SKU: {item.sku}
                          </div>

                        </td>


                        <td>
                          {
                            item.sold_quantity
                          }
                        </td>


                        <td>

                          <input
                            type="number"
                            min="0"
                            max={
                              item.sold_quantity
                            }
                            className="return-quantity-input"
                            value={
                              item.quantity
                            }
                            onChange={
                              (event) =>
                                updateQuantity(
                                  item.order_item,
                                  event.target.value
                                )
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


          <div className="form-group return-reason-group">

            <label className="form-label">
              Return Reason
            </label>

            <textarea
              className="form-textarea"
              value={reason}
              onChange={
                (event) =>
                  setReason(
                    event.target.value
                  )
              }
              placeholder="Reason for return..."
            />

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
              disabled={
                loading ||
                selectedItems.length ===
                  0
              }
            >

              {
                loading
                  ? "Processing..."
                  : "Process Return"
              }

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default ReturnModal;