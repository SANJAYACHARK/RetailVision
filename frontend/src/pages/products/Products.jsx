import {
  useEffect,
  useState,
} from "react";

import {
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import api from "../../api/api";

import ProductModal
  from "../../components/forms/ProductModal";

import {
  useAuth,
} from "../../context/AuthContext";


function Products() {

  const {
    isAdmin,
    isManager,
  } = useAuth();

  const canManage =
    isAdmin || isManager;


  const [products, setProducts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState(null);


  const loadProducts = async () => {

    setLoading(true);

    try {

      const response =
        await api.get(
          "products/",
          {
            params: {
              search,
            },
          }
        );

      setProducts(
        response.data.results ||
        response.data
      );

    } catch (error) {

      console.error(
        "Failed to load products:",
        error
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {

    const timer =
      setTimeout(
        () => {
          loadProducts();
        },
        300
      );

    return () =>
      clearTimeout(timer);

  }, [search]);


  const openAddModal = () => {

    setSelectedProduct(null);

    setModalOpen(true);
  };


  const openEditModal = (product) => {

    setSelectedProduct(product);

    setModalOpen(true);
  };


  const closeModal = () => {

    setModalOpen(false);

    setSelectedProduct(null);
  };


  const handleDelete =
    async (product) => {

      const confirmed =
        window.confirm(
          `Delete "${product.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {

        await api.delete(
          `products/${product.id}/`
        );

        await loadProducts();

      } catch (error) {

        console.error(
          "Failed to delete product:",
          error
        );

        alert(
          "Unable to delete product."
        );
      }
    };


  return (

    <main className="page-container">

      <div className="page-inner">

        <header className="page-header">

          <div>

            <p className="page-eyebrow">
              Product Management
            </p>

            <h1 className="page-title">
              Products
            </h1>

            <p className="page-description">
              Manage your retail catalog,
              pricing, suppliers and stock settings.
            </p>

          </div>


          {canManage && (

            <button
              type="button"
              onClick={openAddModal}
              className="primary-button"
            >

              <Plus size={17} />

              Add Product

            </button>

          )}

        </header>


        <section className="card toolbar-card">

          <div className="products-toolbar">

            <div className="search-box">

              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value
                    )
                }
                placeholder="Search by name, SKU, barcode, brand..."
                className="search-input"
              />

            </div>


            <div className="products-count">

              <span className="products-count-number">
                {products.length}
              </span>

              <span className="products-count-label">
                Products
              </span>

            </div>

          </div>

        </section>


        <section className="card table-card">

          <div className="table-responsive">

            <table className="data-table product-table">

              <thead>

                <tr>

                  <th>
                    Product
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Supplier
                  </th>

                  <th>
                    Price
                  </th>

                  <th>
                    Profit
                  </th>

                  <th>
                    Stock
                  </th>

                  <th>
                    Status
                  </th>

                  {canManage && (

                    <th>
                      Actions
                    </th>

                  )}

                </tr>

              </thead>


              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={
                        canManage
                          ? 8
                          : 7
                      }
                      className="table-state"
                    >

                      <div className="loading-spinner" />

                      <p>
                        Loading products...
                      </p>

                    </td>

                  </tr>

                ) : products.length === 0 ? (

                  <tr>

                    <td
                      colSpan={
                        canManage
                          ? 8
                          : 7
                      }
                      className="table-state"
                    >

                      <div className="empty-state">

                        <div className="empty-state-icon">

                          <Package size={28} />

                        </div>

                        <h3>
                          No products found
                        </h3>

                        <p>
                          {
                            search
                              ? "Try a different search term."
                              : "Add your first product to start building your catalog."
                          }
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  products.map(
                    (product) => (

                      <tr key={product.id}>

                        <td>

                          <div className="product-name-cell">

                            <div className="product-icon">

                              <Package size={18} />

                            </div>


                            <div>

                              <p className="table-primary-text">
                                {product.name}
                              </p>

                              <p className="table-secondary-text">
                                {product.sku}
                              </p>

                              {product.brand && (

                                <p className="product-brand">
                                  {product.brand}
                                </p>

                              )}

                            </div>

                          </div>

                        </td>


                        <td>

                          <span className="product-category">
                            {
                              product.category_name ||
                              "—"
                            }
                          </span>

                        </td>


                        <td>

                          <span className="product-supplier">
                            {
                              product.supplier_name ||
                              "—"
                            }
                          </span>

                        </td>


                        <td>

                          <div className="price-cell">

                            <span className="selling-price">
                              ₹{product.selling_price}
                            </span>

                            {product.mrp && (

                              <span className="mrp-price">
                                MRP ₹{product.mrp}
                              </span>

                            )}

                          </div>

                        </td>


                        <td>

                          <span className="profit-value">
                            ₹{product.profit_per_unit}
                          </span>

                        </td>


                        <td>

                          <div className="stock-cell">

                            <span
                              className={
                                product.is_low_stock
                                  ? "badge badge-danger"
                                  : "badge badge-warning"
                              }
                            >
                              {product.stock_quantity}
                            </span>

                            <span className="stock-unit">
                              {
                                product.unit ||
                                ""
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              product.status === "ACTIVE"
                                ? "badge badge-success"
                                : "badge badge-neutral"
                            }
                          >
                            {
                              product.status === "ACTIVE"
                                ? "Active"
                                : "Inactive"
                            }
                          </span>

                        </td>


                        {canManage && (

                          <td>

                            <div className="table-actions">

                              <button
                                type="button"
                                onClick={
                                  () =>
                                    openEditModal(
                                      product
                                    )
                                }
                                className="icon-button"
                                title="Edit product"
                              >
                                <Edit3 size={16} />
                              </button>


                              <button
                                type="button"
                                onClick={
                                  () =>
                                    handleDelete(
                                      product
                                    )
                                }
                                className="
                                  icon-button
                                  icon-button-danger
                                "
                                title="Delete product"
                              >
                                <Trash2 size={16} />
                              </button>

                            </div>

                          </td>

                        )}

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>


      <ProductModal
        open={modalOpen}
        product={selectedProduct}
        onClose={closeModal}
        onSuccess={loadProducts}
      />

    </main>
  );
}


export default Products;