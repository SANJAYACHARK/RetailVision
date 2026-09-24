import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  History,
  PackageOpen,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Warehouse,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

import StockInModal from "../../components/inventory/StockInModal";
import StockAdjustmentModal from "../../components/inventory/StockAdjustmentModal";


function Inventory() {
  const { user } = useAuth();

  const [summary, setSummary] = useState({
    total_products: 0,
    total_stock: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    inventory_value: 0,
    today_transactions: 0,
    stock_in_today: 0,
    stock_out_today: 0,
  });

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [transactionType, setTransactionType] =
    useState("");

  const [stockInModalOpen, setStockInModalOpen] =
    useState(false);

  const [
    adjustmentModalOpen,
    setAdjustmentModalOpen,
  ] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("STOCK");


  const canManageInventory = [
    "ADMIN",
    "STORE_MANAGER",
  ].includes(user?.role);


  /* =========================================================
     HELPERS
     ========================================================= */

  const normalizeResults = useCallback((data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      Array.isArray(data.results)
    ) {
      return data.results;
    }

    return [];
  }, []);


  const formatCurrency = (value) =>
    new Intl.NumberFormat(
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


  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString(
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
      if (
        Array.isArray(data.detail)
      ) {
        return data.detail.join(" ");
      }

      return String(data.detail);
    }

    const messages =
      Object.values(data)
        .flat(Infinity)
        .filter(Boolean);

    if (messages.length) {
      return messages.join(" ");
    }

    return fallback;
  };


  /* =========================================================
     FETCH PRODUCTS
     ========================================================= */

  const fetchProducts =
    useCallback(
      async () => {
        try {
          const firstResponse =
            await api.get(
              "products/",
              {
                params: {
                  status: "ACTIVE",
                  ordering: "name",
                  page: 1,
                },
              }
            );

          const firstData =
            firstResponse.data;

          if (
            Array.isArray(firstData)
          ) {
            setProducts(
              firstData
            );

            return;
          }

          const firstResults =
            normalizeResults(
              firstData
            );

          if (!firstData.next) {
            setProducts(
              firstResults
            );

            return;
          }

          let allProducts = [
            ...firstResults,
          ];

          let nextUrl =
            firstData.next;

          while (nextUrl) {
            const response =
              await api.get(
                nextUrl
              );

            const data =
              response.data;

            allProducts = [
              ...allProducts,
              ...normalizeResults(data),
            ];

            nextUrl =
              data.next;
          }

          setProducts(
            allProducts
          );

        } catch (error) {
          console.error(
            "Unable to load products:",
            error
          );

          throw error;
        }
      },
      [normalizeResults]
    );


  /* =========================================================
     FETCH SUMMARY
     ========================================================= */

  const fetchSummary =
    useCallback(
      async () => {
        const response =
          await api.get(
            "inventory/summary/"
          );

        setSummary(
          response.data
        );
      },
      []
    );


  /* =========================================================
     FETCH TRANSACTIONS
     ========================================================= */

  const fetchTransactions =
    useCallback(
      async () => {
        setTransactionsLoading(
          true
        );

        try {
          const params = {
            ordering:
              "-created_at",
          };

          if (
            transactionType
          ) {
            params.transaction_type =
              transactionType;
          }

          const response =
            await api.get(
              "inventory/transactions/",
              {
                params,
              }
            );

          setTransactions(
            normalizeResults(
              response.data
            )
          );

        } catch (error) {
          console.error(
            "Unable to load inventory transactions:",
            error
          );

        } finally {
          setTransactionsLoading(
            false
          );
        }
      },
      [
        transactionType,
        normalizeResults,
      ]
    );


  /* =========================================================
     FETCH INVENTORY PAGE
     ========================================================= */

  const fetchInventory =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          await Promise.all([
            fetchSummary(),
            fetchProducts(),
          ]);

        } catch (error) {
          setError(
            getErrorMessage(
              error,
              "Unable to load inventory."
            )
          );

        } finally {
          setLoading(false);
        }
      },
      [
        fetchProducts,
        fetchSummary,
      ]
    );


  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);


  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);


  /* =========================================================
     FILTER PRODUCTS
     ========================================================= */

  const filteredProducts =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return products.filter(
          (product) => {
            const productName =
              String(
                product.name || ""
              ).toLowerCase();

            const sku =
              String(
                product.sku || ""
              ).toLowerCase();

            const categoryName =
              String(
                product.category_name ||
                product.category?.name ||
                ""
              ).toLowerCase();

            const supplierName =
              String(
                product.supplier_name ||
                product.supplier?.company_name ||
                ""
              ).toLowerCase();

            const matchesSearch =
              !query ||
              productName.includes(
                query
              ) ||
              sku.includes(
                query
              ) ||
              categoryName.includes(
                query
              ) ||
              supplierName.includes(
                query
              );

            const stock =
              Number(
                product.stock_quantity ||
                0
              );

            const reorderLevel =
              Number(
                product.reorder_level ||
                0
              );

            let matchesStock =
              true;

            if (
              stockFilter === "LOW"
            ) {
              matchesStock =
                stock > 0 &&
                stock <= reorderLevel;
            }

            if (
              stockFilter === "OUT"
            ) {
              matchesStock =
                stock <= 0;
            }

            if (
              stockFilter ===
              "AVAILABLE"
            ) {
              matchesStock =
                stock >
                reorderLevel;
            }

            return (
              matchesSearch &&
              matchesStock
            );
          }
        );
      },
      [
        products,
        search,
        stockFilter,
      ]
    );


  /* =========================================================
     FILTER TRANSACTIONS
     ========================================================= */

  const filteredTransactions =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return transactions;
        }

        return transactions.filter(
          (transaction) =>
            [
              transaction.product_name,
              transaction.product_sku,
              transaction.reference_number,
              transaction.remarks,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      query
                    )
              )
        );
      },
      [
        search,
        transactions,
      ]
    );


  /* =========================================================
     STOCK STATUS
     ========================================================= */

  const getStockStatus = (
    product
  ) => {
    const stock =
      Number(
        product.stock_quantity ||
        0
      );

    const reorderLevel =
      Number(
        product.reorder_level ||
        0
      );

    if (stock <= 0) {
      return {
        label:
          "Out of Stock",
        className:
          "badge badge-danger",
      };
    }

    if (
      stock <= reorderLevel
    ) {
      return {
        label:
          "Low Stock",
        className:
          "badge badge-warning",
      };
    }

    return {
      label:
        "In Stock",
      className:
        "badge badge-success",
    };
  };


  /* =========================================================
     TRANSACTION HELPERS
     ========================================================= */

  const getTransactionClass =
    (type) => {
      switch (type) {
        case "STOCK_IN":
        case "SALES_RETURN":
        case "ADJUSTMENT_IN":
        case "CANCELLED_SALE":
          return (
            "inventory-transaction inventory-transaction-in"
          );

        case "SALE":
        case "ADJUSTMENT_OUT":
        case "DAMAGED":
        case "EXPIRED":
          return (
            "inventory-transaction inventory-transaction-out"
          );

        default:
          return (
            "inventory-transaction"
          );
      }
    };


  const getTransactionSign =
    (type) => {
      const incoming = [
        "STOCK_IN",
        "SALES_RETURN",
        "ADJUSTMENT_IN",
        "CANCELLED_SALE",
      ];

      return incoming.includes(
        type
      )
        ? "+"
        : "-";
    };


  /* =========================================================
     MODALS
     ========================================================= */

  const openStockIn = (
    product = null
  ) => {
    setSelectedProduct(
      product
    );

    setStockInModalOpen(
      true
    );
  };


  const openAdjustment = (
    product = null
  ) => {
    setSelectedProduct(
      product
    );

    setAdjustmentModalOpen(
      true
    );
  };


  const handleInventoryChange =
    async () => {
      setSelectedProduct(
        null
      );

      await Promise.all([
        fetchInventory(),
        fetchTransactions(),
      ]);
    };


  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />

        <p>
          Loading inventory...
        </p>
      </div>
    );
  }


  return (
    <div className="page-content">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <p className="page-eyebrow">
            Stock Management
          </p>

          <h1 className="page-title">
            Inventory
          </h1>

          <p className="page-description">
            Track stock levels,
            inventory movements,
            adjustments and
            low-stock alerts.
          </p>
        </div>


        <div className="page-header-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={
              async () => {
                await Promise.all([
                  fetchInventory(),
                  fetchTransactions(),
                ]);
              }
            }
          >
            <RefreshCcw size={17} />

            Refresh
          </button>


          {
            canManageInventory && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    () =>
                      openAdjustment()
                  }
                >
                  <SlidersHorizontal
                    size={17}
                  />

                  Adjustment
                </button>


                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    () =>
                      openStockIn()
                  }
                >
                  <Plus size={17} />

                  Stock In
                </button>
              </>
            )
          }

        </div>

      </div>


      {
        error && (
          <div className="page-error">
            {error}
          </div>
        )
      }


      {/* KPI CARDS */}

      <div className="inventory-kpi-grid">

        <InventoryKpiCard
          label="Total Products"
          value={
            summary.total_products
          }
          description={
            `${summary.total_stock || 0} units in stock`
          }
          icon={
            <Boxes size={22} />
          }
        />


        <InventoryKpiCard
          label="Low Stock"
          value={
            summary.low_stock_count
          }
          description="Need restocking soon"
          icon={
            <AlertTriangle
              size={22}
            />
          }
          warning
        />


        <InventoryKpiCard
          label="Out of Stock"
          value={
            summary.out_of_stock_count
          }
          description="Products unavailable"
          icon={
            <PackageOpen
              size={22}
            />
          }
          danger
        />


        <InventoryKpiCard
          label="Inventory Value"
          value={
            formatCurrency(
              summary.inventory_value
            )
          }
          description="Based on cost price"
          icon={
            <CircleDollarSign
              size={22}
            />
          }
        />

      </div>


      {/* TODAY SUMMARY */}

      <div className="inventory-today-grid">

        <div className="inventory-today-card">
          <span>
            Today's Transactions
          </span>

          <strong>
            {
              summary.today_transactions ||
              0
            }
          </strong>
        </div>


        <div className="inventory-today-card">
          <span>
            Stock Added Today
          </span>

          <strong className="inventory-positive-text">
            +
            {
              summary.stock_in_today ||
              0
            }
          </strong>
        </div>


        <div className="inventory-today-card">
          <span>
            Stock Removed Today
          </span>

          <strong className="inventory-negative-text">
            -
            {
              summary.stock_out_today ||
              0
            }
          </strong>
        </div>

      </div>


      {/* TABS */}

      <div className="inventory-tabs">

        <button
          type="button"
          className={
            activeTab === "STOCK"
              ? "inventory-tab active"
              : "inventory-tab"
          }
          onClick={
            () =>
              setActiveTab(
                "STOCK"
              )
          }
        >
          <Warehouse size={17} />

          Stock Overview
        </button>


        <button
          type="button"
          className={
            activeTab ===
            "TRANSACTIONS"
              ? "inventory-tab active"
              : "inventory-tab"
          }
          onClick={
            () =>
              setActiveTab(
                "TRANSACTIONS"
              )
          }
        >
          <History size={17} />

          Transaction History
        </button>

      </div>


      {/* STOCK OVERVIEW */}

      {
        activeTab === "STOCK" && (

          <div className="data-card">

            <div className="data-toolbar">

              <div className="search-box">

                <Search
                  className="search-box-icon"
                  size={18}
                />

                <input
                  type="text"
                  className="search-input"
                  placeholder="Search product, SKU, category or supplier..."
                  value={search}
                  onChange={
                    (event) =>
                      setSearch(
                        event.target.value
                      )
                  }
                />

              </div>


              <div className="filter-group">

                <select
                  className="filter-select"
                  value={
                    stockFilter
                  }
                  onChange={
                    (event) =>
                      setStockFilter(
                        event.target.value
                      )
                  }
                >
                  <option value="ALL">
                    All Stock
                  </option>

                  <option value="AVAILABLE">
                    In Stock
                  </option>

                  <option value="LOW">
                    Low Stock
                  </option>

                  <option value="OUT">
                    Out of Stock
                  </option>
                </select>

              </div>

            </div>


            <div className="table-wrapper">

              <table className="data-table inventory-table">

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Cost</th>
                    <th>Stock Value</th>
                    <th>Status</th>

                    {
                      canManageInventory && (
                        <th>
                          Actions
                        </th>
                      )
                    }
                  </tr>
                </thead>


                <tbody>

                  {
                    filteredProducts.length >
                    0
                      ? filteredProducts.map(
                          (product) => {
                            const stockStatus =
                              getStockStatus(
                                product
                              );

                            const stockValue =
                              Number(
                                product.stock_quantity ||
                                0
                              ) *
                              Number(
                                product.cost_price ||
                                0
                              );

                            return (
                              <tr
                                key={
                                  product.id
                                }
                              >

                                <td>
                                  <div className="table-primary-text">
                                    {
                                      product.name
                                    }
                                  </div>

                                  <div className="table-secondary-text">
                                    SKU:{" "}
                                    {
                                      product.sku ||
                                      "—"
                                    }
                                  </div>
                                </td>


                                <td>
                                  {
                                    product.category_name ||
                                    product.category?.name ||
                                    "—"
                                  }
                                </td>


                                <td>
                                  {
                                    product.supplier_name ||
                                    product.supplier?.company_name ||
                                    "—"
                                  }
                                </td>


                                <td>
                                  <strong className="inventory-stock-number">
                                    {
                                      product.stock_quantity ??
                                      0
                                    }
                                  </strong>

                                  <span className="inventory-unit-text">
                                    {
                                      product.unit_display ||
                                      product.unit ||
                                      ""
                                    }
                                  </span>
                                </td>


                                <td>
                                  {
                                    product.reorder_level ??
                                    0
                                  }
                                </td>


                                <td className="table-money">
                                  {
                                    formatCurrency(
                                      product.cost_price
                                    )
                                  }
                                </td>


                                <td className="table-money">
                                  {
                                    formatCurrency(
                                      stockValue
                                    )
                                  }
                                </td>


                                <td>
                                  <span
                                    className={
                                      stockStatus.className
                                    }
                                  >
                                    {
                                      stockStatus.label
                                    }
                                  </span>
                                </td>


                                {
                                  canManageInventory && (
                                    <td>
                                      <div className="inventory-row-actions">

                                        <button
                                          type="button"
                                          className="inventory-small-button"
                                          onClick={
                                            () =>
                                              openStockIn(
                                                product
                                              )
                                          }
                                        >
                                          Stock In
                                        </button>


                                        <button
                                          type="button"
                                          className="inventory-small-button"
                                          onClick={
                                            () =>
                                              openAdjustment(
                                                product
                                              )
                                          }
                                        >
                                          Adjust
                                        </button>

                                      </div>
                                    </td>
                                  )
                                }

                              </tr>
                            );
                          }
                        )
                      : (
                        <tr>
                          <td
                            colSpan={
                              canManageInventory
                                ? 9
                                : 8
                            }
                          >
                            <div className="inventory-empty">

                              <PackageOpen
                                size={34}
                              />

                              <h3>
                                No products found
                              </h3>

                              <p>
                                Try changing the
                                search or stock filter.
                              </p>

                            </div>
                          </td>
                        </tr>
                      )
                  }

                </tbody>

              </table>

            </div>

          </div>
        )
      }


      {/* TRANSACTION HISTORY */}

      {
        activeTab ===
        "TRANSACTIONS" && (

          <div className="data-card">

            <div className="data-toolbar">

              <div className="search-box">

                <Search
                  size={18}
                  className="search-box-icon"
                />

                <input
                  type="text"
                  className="search-input"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={
                    (event) =>
                      setSearch(
                        event.target.value
                      )
                  }
                />

              </div>


              <div className="filter-group">

                <select
                  className="filter-select"
                  value={
                    transactionType
                  }
                  onChange={
                    (event) =>
                      setTransactionType(
                        event.target.value
                      )
                  }
                >
                  <option value="">
                    All Transactions
                  </option>

                  <option value="STOCK_IN">
                    Stock In
                  </option>

                  <option value="SALE">
                    Sale
                  </option>

                  <option value="SALES_RETURN">
                    Sales Return
                  </option>

                  <option value="CANCELLED_SALE">
                    Cancelled Sale
                  </option>

                  <option value="ADJUSTMENT_IN">
                    Adjustment In
                  </option>

                  <option value="ADJUSTMENT_OUT">
                    Adjustment Out
                  </option>

                  <option value="DAMAGED">
                    Damaged
                  </option>

                  <option value="EXPIRED">
                    Expired
                  </option>
                </select>

              </div>

            </div>


            {
              transactionsLoading
                ? (
                  <div className="table-loading">

                    <div className="loading-spinner" />

                    <p>
                      Loading transactions...
                    </p>

                  </div>
                )
                : (
                  <div className="table-wrapper">

                    <table className="data-table inventory-history-table">

                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Product</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Before</th>
                          <th>After</th>
                          <th>Reference</th>
                          <th>Created By</th>
                        </tr>
                      </thead>


                      <tbody>

                        {
                          filteredTransactions.length >
                          0
                            ? filteredTransactions.map(
                                (item) => (
                                  <tr
                                    key={
                                      item.id
                                    }
                                  >

                                    <td>
                                      {
                                        formatDate(
                                          item.created_at
                                        )
                                      }
                                    </td>


                                    <td>
                                      <div className="table-primary-text">
                                        {
                                          item.product_name
                                        }
                                      </div>

                                      <div className="table-secondary-text">
                                        {
                                          item.product_sku ||
                                          "—"
                                        }
                                      </div>
                                    </td>


                                    <td>
                                      <span
                                        className={
                                          getTransactionClass(
                                            item.transaction_type
                                          )
                                        }
                                      >
                                        {
                                          item.transaction_type_display ||
                                          item.transaction_type
                                        }
                                      </span>
                                    </td>


                                    <td>
                                      <strong
                                        className={
                                          getTransactionSign(
                                            item.transaction_type
                                          ) === "+"
                                            ? "inventory-positive-text"
                                            : "inventory-negative-text"
                                        }
                                      >
                                        {
                                          getTransactionSign(
                                            item.transaction_type
                                          )
                                        }
                                        {
                                          item.quantity
                                        }
                                      </strong>
                                    </td>


                                    <td>
                                      {
                                        item.quantity_before
                                      }
                                    </td>


                                    <td>
                                      {
                                        item.quantity_after
                                      }
                                    </td>


                                    <td>
                                      <div className="table-primary-text">
                                        {
                                          item.reference_number ||
                                          "—"
                                        }
                                      </div>

                                      {
                                        item.remarks && (
                                          <div className="table-secondary-text">
                                            {
                                              item.remarks
                                            }
                                          </div>
                                        )
                                      }
                                    </td>


                                    <td>
                                      {
                                        item.created_by_name ||
                                        "System"
                                      }
                                    </td>

                                  </tr>
                                )
                              )
                            : (
                              <tr>
                                <td colSpan="8">

                                  <div className="inventory-empty">

                                    <History
                                      size={34}
                                    />

                                    <h3>
                                      No transactions found
                                    </h3>

                                    <p>
                                      Inventory movements
                                      will appear here.
                                    </p>

                                  </div>

                                </td>
                              </tr>
                            )
                        }

                      </tbody>

                    </table>

                  </div>
                )
            }

          </div>
        )
      }


      <StockInModal
        open={
          stockInModalOpen
        }
        products={
          products
        }
        selectedProduct={
          selectedProduct
        }
        onClose={
          () => {
            setStockInModalOpen(
              false
            );

            setSelectedProduct(
              null
            );
          }
        }
        onSuccess={
          async () => {
            setStockInModalOpen(
              false
            );

            await handleInventoryChange();
          }
        }
      />


      <StockAdjustmentModal
        open={
          adjustmentModalOpen
        }
        products={
          products
        }
        selectedProduct={
          selectedProduct
        }
        onClose={
          () => {
            setAdjustmentModalOpen(
              false
            );

            setSelectedProduct(
              null
            );
          }
        }
        onSuccess={
          async () => {
            setAdjustmentModalOpen(
              false
            );

            await handleInventoryChange();
          }
        }
      />

    </div>
  );
}


function InventoryKpiCard({
  label,
  value,
  description,
  icon,
  warning = false,
  danger = false,
}) {
  let className =
    "inventory-kpi-card";

  if (warning) {
    className +=
      " inventory-kpi-warning";
  }

  if (danger) {
    className +=
      " inventory-kpi-danger";
  }

  return (
    <div className={className}>

      <div className="inventory-kpi-content">

        <span className="inventory-kpi-label">
          {label}
        </span>

        <strong className="inventory-kpi-value">
          {value}
        </strong>

        <span className="inventory-kpi-description">
          {description}
        </span>

      </div>


      <div className="inventory-kpi-icon">
        {icon}
      </div>

    </div>
  );
}


export default Inventory;