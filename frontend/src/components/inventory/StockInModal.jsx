import {
  PackagePlus,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import api from "../../api/api";


function StockInModal({
  open,
  onClose,
  onSuccess,
  products = [],
  selectedProduct = null,
}) {

  const [formData, setFormData] =
    useState({
      product: "",
      quantity: "",
      unit_cost: "",
      reference_number: "",
      remarks: "",
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

      quantity: "",

      unit_cost:
        selectedProduct?.cost_price
          ? String(
              selectedProduct.cost_price
            )
          : "",

      reference_number: "",

      remarks: "",
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
      return "Unable to add stock.";
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


    return "Unable to add stock.";
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
        !formData.quantity ||
        Number(
          formData.quantity
        ) <= 0
      ) {

        setError(
          "Quantity must be greater than zero."
        );

        return;
      }


      setLoading(true);


      try {

        const payload = {

          product:
            Number(
              formData.product
            ),

          quantity:
            Number(
              formData.quantity
            ),

          reference_number:
            formData.reference_number.trim(),

          remarks:
            formData.remarks.trim(),
        };


        if (
          formData.unit_cost !== ""
        ) {

          payload.unit_cost =
            Number(
              formData.unit_cost
            ).toFixed(2);
        }


        await api.post(
          "inventory/stock-in/",
          payload
        );


        if (onSuccess) {
          await onSuccess();
        }

      } catch (error) {

        console.error(
          "Stock in failed:",
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


  return (

    <div className="modal-overlay">

      <div className="inventory-modal">

        <div className="modal-header">

          <div>

            <div className="modal-title-icon">
              <PackagePlus
                size={20}
              />
            </div>

            <div>

              <h2>
                Add Stock
              </h2>

              <p>
                Record incoming inventory.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={loading}
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
                      Cost Price
                    </span>

                    <strong>
                      ₹
                      {
                        Number(
                          selected.cost_price ||
                          0
                        ).toFixed(2)
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

                </div>
              )
            }


            <div className="form-grid-two">

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


              <div className="form-group">

                <label>
                  Unit Cost
                </label>

                <input
                  type="number"
                  name="unit_cost"
                  min="0"
                  step="0.01"
                  value={
                    formData.unit_cost
                  }
                  onChange={
                    handleChange
                  }
                  className="form-input"
                  placeholder="0.00"
                />

              </div>

            </div>


            <div className="form-group">

              <label>
                Reference Number
              </label>

              <input
                type="text"
                name="reference_number"
                value={
                  formData.reference_number
                }
                onChange={
                  handleChange
                }
                className="form-input"
                placeholder="Example: PO-1001 or INV-2001"
              />

            </div>


            <div className="form-group">

              <label>
                Remarks
              </label>

              <textarea
                name="remarks"
                value={
                  formData.remarks
                }
                onChange={
                  handleChange
                }
                className="form-textarea"
                rows="4"
                placeholder="Stock received from supplier..."
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
              <PackagePlus
                size={17}
              />

              {
                loading
                  ? "Adding Stock..."
                  : "Add Stock"
              }

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default StockInModal;