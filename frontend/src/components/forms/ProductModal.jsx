import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  X,
} from "lucide-react";

import api
  from "../../api/api";


const initialForm = {
  sku: "",
  barcode: "",
  name: "",
  category: "",
  supplier: "",
  brand: "",
  description: "",
  cost_price: "",
  selling_price: "",
  mrp: "",
  tax_percent: "0",
  stock_quantity: "0",
  reorder_level: "5",
  minimum_stock: "0",
  maximum_stock: "100",
  manufacturing_date: "",
  expiry_date: "",
  unit: "PIECE",
  status: "ACTIVE",
};


function ProductModal({
  open,
  onClose,
  onSuccess,
  product,
}) {

  const [categories, setCategories] =
    useState([]);

  const [suppliers, setSuppliers] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState(initialForm);


  useEffect(() => {

    if (!open) {
      return;
    }

    loadDropdowns();

  }, [open]);


  useEffect(() => {

    if (!open) {
      return;
    }

    if (product) {

      setFormData({
        sku:
          product.sku || "",

        barcode:
          product.barcode || "",

        name:
          product.name || "",

        category:
          product.category || "",

        supplier:
          product.supplier || "",

        brand:
          product.brand || "",

        description:
          product.description || "",

        cost_price:
          product.cost_price || "",

        selling_price:
          product.selling_price || "",

        mrp:
          product.mrp || "",

        tax_percent:
          product.tax_percent ?? "0",

        stock_quantity:
          product.stock_quantity ?? "0",

        reorder_level:
          product.reorder_level ?? "5",

        minimum_stock:
          product.minimum_stock ?? "0",

        maximum_stock:
          product.maximum_stock ?? "100",

        manufacturing_date:
          product.manufacturing_date || "",

        expiry_date:
          product.expiry_date || "",

        unit:
          product.unit || "PIECE",

        status:
          product.status || "ACTIVE",
      });

    } else {

      setFormData(
        initialForm
      );
    }

  }, [
    product,
    open,
  ]);


  const loadDropdowns =
    async () => {

      try {

        const [
          categoryResponse,
          supplierResponse,
        ] = await Promise.all([
          api.get(
            "products/categories/"
          ),

          api.get(
            "suppliers/"
          ),
        ]);


        setCategories(
          categoryResponse.data.results ||
          categoryResponse.data
        );

        setSuppliers(
          supplierResponse.data.results ||
          supplierResponse.data
        );

      } catch (error) {

        console.error(
          "Failed loading dropdown data:",
          error
        );
      }
    };


  const handleChange =
    (event) => {

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


  const preparePayload = () => {

    return {
      ...formData,

      supplier:
        formData.supplier || null,

      barcode:
        formData.barcode || null,

      mrp:
        formData.mrp || null,

      manufacturing_date:
        formData.manufacturing_date ||
        null,

      expiry_date:
        formData.expiry_date ||
        null,

      cost_price:
        Number(
          formData.cost_price
        ),

      selling_price:
        Number(
          formData.selling_price
        ),

      tax_percent:
        Number(
          formData.tax_percent
        ),

      stock_quantity:
        Number(
          formData.stock_quantity
        ),

      reorder_level:
        Number(
          formData.reorder_level
        ),

      minimum_stock:
        Number(
          formData.minimum_stock
        ),

      maximum_stock:
        Number(
          formData.maximum_stock
        ),
    };
  };


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setLoading(true);

      try {

        const payload =
          preparePayload();


        if (product) {

          await api.patch(
            `products/${product.id}/`,
            payload
          );

        } else {

          await api.post(
            "products/",
            payload
          );
        }


        await onSuccess?.();

        onClose();

      } catch (error) {

        console.error(
          "Failed saving product:",
          error
        );


        const responseData =
          error.response?.data;


        if (responseData) {

          alert(
            JSON.stringify(
              responseData,
              null,
              2
            )
          );

        } else {

          alert(
            "Failed to save product."
          );
        }

      } finally {

        setLoading(false);
      }
    };


  if (!open) {
    return null;
  }


  return (

    <div className="modal-overlay">

      <div className="modal modal-large">

        <div className="modal-header">

          <div>

            <p className="modal-subtitle">
              Product Management
            </p>

            <h2 className="modal-title">
              {
                product
                  ? "Edit Product"
                  : "Add Product"
              }
            </h2>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            title="Close"
          >
            <X size={18} />
          </button>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="modal-body">

            <div className="form-grid">

              <div className="form-group">

                <label className="form-label">
                  SKU *
                </label>

                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="SKU001"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Barcode
                </label>

                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Barcode"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Product Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Product name"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Brand
                </label>

                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Brand name"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Category *
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                  required
                >

                  <option value="">
                    Select Category
                  </option>

                  {categories.map(
                    (category) => (

                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label className="form-label">
                  Supplier
                </label>

                <select
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="form-select"
                >

                  <option value="">
                    No Supplier
                  </option>

                  {suppliers.map(
                    (supplier) => (

                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {
                          supplier.company_name
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label className="form-label">
                  Cost Price *
                </label>

                <input
                  type="number"
                  name="cost_price"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={handleChange}
                  className="form-input"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Selling Price *
                </label>

                <input
                  type="number"
                  name="selling_price"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={handleChange}
                  className="form-input"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  MRP
                </label>

                <input
                  type="number"
                  name="mrp"
                  step="0.01"
                  min="0"
                  value={formData.mrp}
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Tax %
                </label>

                <input
                  type="number"
                  name="tax_percent"
                  step="0.01"
                  min="0"
                  value={
                    formData.tax_percent
                  }
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Current Stock
                </label>

                <input
                  type="number"
                  name="stock_quantity"
                  min="0"
                  value={
                    formData.stock_quantity
                  }
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Reorder Level
                </label>

                <input
                  type="number"
                  name="reorder_level"
                  min="0"
                  value={
                    formData.reorder_level
                  }
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Minimum Stock
                </label>

                <input
                  type="number"
                  name="minimum_stock"
                  min="0"
                  value={
                    formData.minimum_stock
                  }
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Maximum Stock
                </label>

                <input
                  type="number"
                  name="maximum_stock"
                  min="0"
                  value={
                    formData.maximum_stock
                  }
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Manufacturing Date
                </label>

                <input
                  type="date"
                  name="manufacturing_date"
                  value={
                    formData.manufacturing_date
                  }
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Expiry Date
                </label>

                <input
                  type="date"
                  name="expiry_date"
                  value={
                    formData.expiry_date
                  }
                  onChange={handleChange}
                  className="form-input"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Unit
                </label>

                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="form-select"
                >

                  <option value="PIECE">
                    Piece
                  </option>

                  <option value="KG">
                    Kilogram
                  </option>

                  <option value="GRAM">
                    Gram
                  </option>

                  <option value="LITRE">
                    Litre
                  </option>

                  <option value="ML">
                    Millilitre
                  </option>

                  <option value="BOX">
                    Box
                  </option>

                  <option value="PACKET">
                    Packet
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label className="form-label">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                </select>

              </div>


              <div className="form-group form-full-width">

                <label className="form-label">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Product description"
                />

              </div>

            </div>


            <div className="modal-actions">

              <button
                type="button"
                onClick={onClose}
                className="secondary-button"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={loading}
                className="primary-button"
              >

                <Save size={16} />

                {
                  loading
                    ? "Saving..."
                    : product
                      ? "Update Product"
                      : "Create Product"
                }

              </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}


export default ProductModal;