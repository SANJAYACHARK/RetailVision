import {
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import api from "../../api/api";


function StockAdjustmentModal({
  open,
  onClose,
  onSuccess,
  products = [],
  selectedProduct = null,
}) {

  const [formData, setFormData] =
    useState({
      product: "",
      adjustment_type:
        "INCREASE",
      quantity: "",
      reason: "",
    });


  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {

    if (!open) {
      return;
    }


    setFormData({
      product:
        selectedProduct?.id
          ? String(
              selectedProduct.id
            )
          : "",

      adjustment_type:
        "INCREASE",

      quantity: "",

      reason: "",
    });


    setError("");

  }, [
    open,
    selectedProduct,
  ]);


  if (!open) {
    return null;
  }


  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  const getErrorMessage = (
    error
  ) => {

    const data =
      error.response?.data;


    if (!data) {
      return "Unable to adjust stock.";
    }


    if (data.detail) {

      if (
        Array.isArray(
          data.detail
        )
      ) {
        return data.detail.join(" ");
      }

      return String(
        data.detail
      );
    }


    const messages =
      Object.values(data)
        .flat(Infinity)
        .filter(Boolean);


    if (messages.length) {
      return messages.join(" ");
    }


    return "Unable to adjust stock.";
  };


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError("");


      if (!formData.product) {

        setError(
          "Please select a product."
        );

        return;
      }


      if (
        Number(
          formData.quantity
        ) <= 0
      ) {

        setError(
          "Quantity must be greater than zero."
        );

        return;
      }


      if (
        !formData.reason.trim()
      ) {

        setError(
          "Adjustment reason is required."
        );

        return;
      }


      setLoading(true);


      try {

        await api.post(
          "inventory/adjustments/create/",
          {
            product:
              Number(
                formData.product
              ),

            adjustment_type:
              formData.adjustment_type,

            quantity:
              Number(
                formData.quantity
              ),

            reason:
              formData.reason.trim(),
          }
        );


        if (onSuccess) {
          await onSuccess();
        }

      } catch (error) {

        console.error(
          "Stock adjustment failed:",
          error
        );

        setError(
          getErrorMessage(
            error
          )
        );

      } finally {

        setLoading(false);
      }
    };


  const selected =
    products.find(
      (product) =>
        String(product.id) ===
        String(
          formData.product
        )
    );


  const adjustmentRemovesStock =
    [
      "DECREASE",
      "DAMAGED",
      "EXPIRED",
    ].includes(
      formData.adjustment_type
    );


  return (

    <div className="modal-overlay">

      <div className="inventory-modal">

        <div className="modal-header">

          <div>

            <div className="modal-title-icon">
              <SlidersHorizontal
                size={20}
              />
            </div>

            <div>

              <h2>
                Stock Adjustment
              </h2>

              <p>
                Correct or classify stock changes.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="modal-close-button"
            onClick={
              onClose
            }
            disabled={
              loading
            }
          >
            <X size={19} />
          </button>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="modal-body">


            {
              error && (

                <div className="page-error">
                  {error}
                </div>
              )
            }


            <div className="form-group">

              <label>
                Product
              </label>

              <select
                name="product"
                value={
                  formData.product
                }
                onChange={
                  handleChange
                }
                className="form-select"
                disabled={
                  Boolean(
                    selectedProduct
                  )
                }
                required
              >

                <option value="">
                  Select Product
                </option>


                {
                  products.map(
                    (product) => (

                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >

                        {
                          product.name
                        }

                        {" — "}

                        {
                          product.sku
                        }

                        {" — Stock: "}

                        {
                          product.stock_quantity ||
                          0
                        }

                      </option>
                    )
                  )
                }

              </select>

            </div>


            {
              selected && (

                <div className="inventory-selected-product">

                  <div>

                    <span>
                      Current Stock
                    </span>

                    <strong>
                      {
                        selected.stock_quantity ||
                        0
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Reorder Level
                    </span>

                    <strong>
                      {
                        selected.reorder_level ||
                        0
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      SKU
                    </span>

                    <strong>
                      {
                        selected.sku ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>
              )
            }


            <div className="form-grid-two">

              <div className="form-group">

                <label>
                  Adjustment Type
                </label>

                <select
                  name="adjustment_type"
                  value={
                    formData.adjustment_type
                  }
                  onChange={
                    handleChange
                  }
                  className="form-select"
                >

                  <option value="INCREASE">
                    Increase Stock
                  </option>

                  <option value="DECREASE">
                    Decrease Stock
                  </option>

                  <option value="DAMAGED">
                    Damaged Stock
                  </option>

                  <option value="EXPIRED">
                    Expired Stock
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  name="quantity"
                  min="1"
                  step="1"
                  value={
                    formData.quantity
                  }
                  onChange={
                    handleChange
                  }
                  className="form-input"
                  placeholder="Enter quantity"
                  required
                />

              </div>

            </div>


            {
              adjustmentRemovesStock &&
              selected &&
              Number(
                formData.quantity ||
                0
              ) >
              Number(
                selected.stock_quantity ||
                0
              ) && (

                <div className="inventory-warning-box">

                  Requested quantity exceeds the
                  current stock of{" "}

                  <strong>
                    {
                      selected.stock_quantity ||
                      0
                    }
                  </strong>
                  .

                </div>
              )
            }


            <div className="form-group">

              <label>
                Reason
              </label>

              <textarea
                name="reason"
                value={
                  formData.reason
                }
                onChange={
                  handleChange
                }
                className="form-textarea"
                rows="4"
                placeholder="Explain why the stock is being adjusted..."
                required
              />

            </div>

          </div>


          <div className="modal-footer">

            <button
              type="button"
              className="secondary-button"
              onClick={
                onClose
              }
              disabled={
                loading
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="primary-button"
              disabled={
                loading
              }
            >
              <SlidersHorizontal
                size={17}
              />

              {
                loading
                  ? "Updating..."
                  : "Save Adjustment"
              }

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default StockAdjustmentModal;