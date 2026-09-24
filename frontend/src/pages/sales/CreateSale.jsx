import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Minus,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../api/api";


function CreateSale() {

  const navigate = useNavigate();

  const [customers, setCustomers] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const [customer, setCustomer] =
    useState("");

  const [status, setStatus] =
    useState("COMPLETED");

  const [notes, setNotes] =
    useState("");

  const [
    orderDiscount,
    setOrderDiscount,
  ] = useState("0");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("CASH");

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

  const [
    referenceNumber,
    setReferenceNumber,
  ] = useState("");

  const [items, setItems] =
    useState([]);


  useEffect(() => {

    const loadData =
      async () => {

        try {

          const [
            customersResponse,
            productsResponse,
          ] = await Promise.all([
            api.get(
              "customers/",
              {
                params: {
                  is_active: true,
                },
              }
            ),

            api.get(
              "products/",
              {
                params: {
                  status: "ACTIVE",
                },
              }
            ),
          ]);


          setCustomers(
            Array.isArray(
              customersResponse.data
            )
              ? customersResponse.data
              : customersResponse.data
                  .results || []
          );


          setProducts(
            Array.isArray(
              productsResponse.data
            )
              ? productsResponse.data
              : productsResponse.data
                  .results || []
          );

        } catch (error) {

          console.error(error);

          setError(
            "Unable to load customers and products."
          );

        } finally {

          setLoading(false);
        }
      };


    loadData();

  }, []);


  const addProduct = (
    productId
  ) => {

    if (!productId) {
      return;
    }

    const product =
      products.find(
        (item) =>
          String(item.id) ===
          String(productId)
      );

    if (!product) {
      return;
    }


    const exists =
      items.some(
        (item) =>
          item.product ===
          product.id
      );

    if (exists) {

      setItems(
        (previous) =>
          previous.map(
            (item) =>
              item.product ===
              product.id
                ? {
                    ...item,
                    quantity:
                      item.quantity + 1,
                  }
                : item
          )
      );

      return;
    }


    setItems(
      (previous) => [
        ...previous,
        {
          product: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(
            product.selling_price || 0
          ),
          tax: Number(
            product.tax_percent || 0
          ),
          stock: Number(
            product.stock_quantity || 0
          ),
          quantity: 1,
          discount_amount: 0,
        },
      ]
    );
  };


  const updateQuantity = (
    productId,
    quantity
  ) => {

    const value =
      Math.max(
        1,
        Number(quantity) || 1
      );

    setItems(
      (previous) =>
        previous.map(
          (item) =>
            item.product === productId
              ? {
                  ...item,
                  quantity: value,
                }
              : item
        )
    );
  };


  const updateItemDiscount = (
    productId,
    discount
  ) => {

    setItems(
      (previous) =>
        previous.map(
          (item) =>
            item.product === productId
              ? {
                  ...item,
                  discount_amount:
                    Math.max(
                      0,
                      Number(discount) ||
                        0
                    ),
                }
              : item
        )
    );
  };


  const removeItem = (
    productId
  ) => {

    setItems(
      (previous) =>
        previous.filter(
          (item) =>
            item.product !==
            productId
        )
    );
  };


  const totals = useMemo(() => {

    let subtotal = 0;
    let tax = 0;

    items.forEach(
      (item) => {

        const gross =
          item.price *
          item.quantity;

        const discount =
          Number(
            item.discount_amount ||
            0
          );

        const taxable =
          Math.max(
            0,
            gross - discount
          );

        subtotal += taxable;

        tax +=
          taxable *
          item.tax /
          100;
      }
    );

    const discount =
      Number(
        orderDiscount || 0
      );

    const total =
      Math.max(
        0,
        subtotal -
          discount +
          tax
      );

    return {
      subtotal,
      tax,
      discount,
      total,
    };

  }, [
    items,
    orderDiscount,
  ]);


  useEffect(() => {

    if (
      status === "COMPLETED"
    ) {

      setPaymentAmount(
        totals.total.toFixed(2)
      );

    } else {

      setPaymentAmount("");
    }

  }, [
    totals.total,
    status,
  ]);


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


      if (items.length === 0) {

        setError(
          "Add at least one product to the sale."
        );

        return;
      }


      for (const item of items) {

        if (
          item.quantity >
          item.stock &&
          status === "COMPLETED"
        ) {

          setError(
            `${item.name} has only ${item.stock} unit(s) in stock.`
          );

          return;
        }
      }


      setSaving(true);

      try {

        const payload = {
          customer:
            customer
              ? Number(customer)
              : null,

          status,

          discount_amount:
            Number(
              orderDiscount || 0
            ).toFixed(2),

          notes,

          items:
            items.map(
              (item) => ({
                product:
                  item.product,

                quantity:
                  item.quantity,

                discount_amount:
                  Number(
                    item.discount_amount ||
                    0
                  ).toFixed(2),
              })
            ),
        };


        if (
          Number(
            paymentAmount || 0
          ) > 0
        ) {

          payload.payment = {
            amount:
              Number(
                paymentAmount
              ).toFixed(2),

            method:
              paymentMethod,

            reference_number:
              referenceNumber,
          };
        }


        const response =
          await api.post(
            "sales/orders/",
            payload
          );


        navigate(
          `/sales/${response.data.id}`,
          {
            replace: true,
          }
        );

      } catch (error) {

        console.error(
          "Sale creation failed:",
          error
        );

        const data =
          error.response?.data;


        if (
          typeof data ===
          "string"
        ) {

          setError(data);

        } else if (
          data
        ) {

          const firstError =
            Object.values(data)
              .flat()
              .join(" ");

          setError(
            firstError ||
              "Unable to create sale."
          );

        } else {

          setError(
            "Unable to create sale."
          );
        }

      } finally {

        setSaving(false);
      }
    };


  if (loading) {

    return (

      <div className="page-loading">

        <div className="loading-spinner" />

        <p>
          Loading sale form...
        </p>

      </div>
    );
  }


  return (

    <div className="page-content">

      <div className="page-header">

        <div>

          <button
            type="button"
            className="back-button"
            onClick={
              () =>
                navigate("/sales")
            }
          >
            <ArrowLeft size={17} />
            Back to Sales
          </button>


          <p className="page-eyebrow">
            Sales Management
          </p>

          <h1 className="page-title">
            Create Sale
          </h1>

          <p className="page-description">
            Create an invoice,
            select products and record
            payment.
          </p>

        </div>

      </div>


      {error && (

        <div className="page-error">
          {error}
        </div>

      )}


      <form
        onSubmit={handleSubmit}
        className="sale-create-layout"
      >

        <div className="sale-create-main">


          <section className="form-card">

            <div className="form-card-header">

              <div>

                <h2>
                  Customer & Order
                </h2>

                <p>
                  Select a registered
                  customer or use walk-in.
                </p>

              </div>

            </div>


            <div className="form-grid">

              <div className="form-group">

                <label className="form-label">
                  Customer
                </label>

                <select
                  className="form-select"
                  value={customer}
                  onChange={
                    (event) =>
                      setCustomer(
                        event.target.value
                      )
                  }
                >

                  <option value="">
                    Walk-in Customer
                  </option>

                  {customers.map(
                    (item) => (

                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name} -{" "}
                        {item.phone}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label className="form-label">
                  Order Status
                </label>

                <select
                  className="form-select"
                  value={status}
                  onChange={
                    (event) =>
                      setStatus(
                        event.target.value
                      )
                  }
                >

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                </select>

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
                  placeholder="Optional sale notes..."
                />

              </div>

            </div>

          </section>


          <section className="form-card">

            <div className="form-card-header">

              <div>

                <h2>
                  Products
                </h2>

                <p>
                  Add products to the
                  current invoice.
                </p>

              </div>

            </div>


            <div className="sale-product-picker">

              <select
                className="form-select"
                defaultValue=""
                onChange={
                  (event) => {

                    addProduct(
                      event.target.value
                    );

                    event.target.value =
                      "";
                  }
                }
              >

                <option value="">
                  Select product...
                </option>

                {products.map(
                  (product) => (

                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {" - "}
                      {product.sku}
                      {" - Stock "}
                      {
                        product.stock_quantity
                      }
                    </option>

                  )
                )}

              </select>

            </div>


            {items.length === 0 ? (

              <div className="sale-empty-cart">

                <ShoppingCart
                  size={36}
                />

                <h3>
                  No products added
                </h3>

                <p>
                  Select a product above
                  to start the sale.
                </p>

              </div>

            ) : (

              <div className="table-wrapper">

                <table className="data-table sale-items-table">

                  <thead>

                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Discount</th>
                      <th>Total</th>
                      <th></th>
                    </tr>

                  </thead>


                  <tbody>

                    {items.map(
                      (item) => {

                        const lineTotal =
                          item.price *
                            item.quantity -
                          item.discount_amount;

                        return (

                          <tr
                            key={
                              item.product
                            }
                          >

                            <td>

                              <div className="table-primary-text">
                                {item.name}
                              </div>

                              <div className="table-secondary-text">
                                SKU: {item.sku}
                                {" • "}
                                Stock: {item.stock}
                              </div>

                            </td>


                            <td className="table-money">
                              {
                                formatCurrency(
                                  item.price
                                )
                              }
                            </td>


                            <td>

                              <div className="quantity-control">

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      updateQuantity(
                                        item.product,
                                        item.quantity -
                                          1
                                      )
                                  }
                                >
                                  <Minus size={14} />
                                </button>


                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    item.quantity
                                  }
                                  onChange={
                                    (event) =>
                                      updateQuantity(
                                        item.product,
                                        event.target.value
                                      )
                                  }
                                />


                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      updateQuantity(
                                        item.product,
                                        item.quantity +
                                          1
                                      )
                                  }
                                >
                                  <Plus size={14} />
                                </button>

                              </div>

                            </td>


                            <td>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="table-number-input"
                                value={
                                  item.discount_amount
                                }
                                onChange={
                                  (event) =>
                                    updateItemDiscount(
                                      item.product,
                                      event.target.value
                                    )
                                }
                              />

                            </td>


                            <td className="table-money">

                              {
                                formatCurrency(
                                  lineTotal
                                )
                              }

                            </td>


                            <td>

                              <button
                                type="button"
                                className="icon-button danger-icon-button"
                                onClick={
                                  () =>
                                    removeItem(
                                      item.product
                                    )
                                }
                              >
                                <Trash2 size={16} />
                              </button>

                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>


          <section className="form-card">

            <div className="form-card-header">

              <div>

                <h2>
                  Payment
                </h2>

                <p>
                  Record payment for this
                  sale.
                </p>

              </div>

            </div>


            <div className="form-grid">

              <div className="form-group">

                <label className="form-label">
                  Payment Method
                </label>

                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={
                    (event) =>
                      setPaymentMethod(
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


              <div className="form-group">

                <label className="form-label">
                  Payment Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={paymentAmount}
                  onChange={
                    (event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                  }
                />

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
                  placeholder="UPI / card / transaction reference"
                />

              </div>

            </div>

          </section>

        </div>


        <aside className="sale-summary-card">

          <h2>
            Order Summary
          </h2>


          <div className="sale-summary-row">

            <span>
              Items
            </span>

            <strong>
              {
                items.reduce(
                  (
                    total,
                    item
                  ) =>
                    total +
                    item.quantity,
                  0
                )
              }
            </strong>

          </div>


          <div className="sale-summary-row">

            <span>
              Subtotal
            </span>

            <strong>
              {
                formatCurrency(
                  totals.subtotal
                )
              }
            </strong>

          </div>


          <div className="sale-summary-row">

            <span>
              Tax
            </span>

            <strong>
              {
                formatCurrency(
                  totals.tax
                )
              }
            </strong>

          </div>


          <div className="sale-summary-discount">

            <label className="form-label">
              Order Discount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className="form-input"
              value={orderDiscount}
              onChange={
                (event) =>
                  setOrderDiscount(
                    event.target.value
                  )
              }
            />

          </div>


          <div className="sale-summary-total">

            <span>
              Grand Total
            </span>

            <strong>
              {
                formatCurrency(
                  totals.total
                )
              }
            </strong>

          </div>


          <button
            type="submit"
            className="primary-button sale-submit-button"
            disabled={saving}
          >

            <Save size={17} />

            {
              saving
                ? "Creating Sale..."
                : "Create Sale"
            }

          </button>

        </aside>

      </form>

    </div>
  );
}


export default CreateSale;