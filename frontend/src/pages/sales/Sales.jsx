import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Eye,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../api/api";


function Sales() {

  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [
    paymentStatusFilter,
    setPaymentStatusFilter,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const [count, setCount] =
    useState(0);

  const pageSize = 20;


  const totalPages = useMemo(() => {

    return Math.max(
      1,
      Math.ceil(
        count / pageSize
      )
    );

  }, [count]);


  const fetchOrders = async () => {

    setLoading(true);
    setError("");

    try {

      const params = {
        page,
      };

      if (search.trim()) {
        params.search =
          search.trim();
      }

      if (statusFilter) {
        params.status =
          statusFilter;
      }

      if (paymentStatusFilter) {
        params.payment_status =
          paymentStatusFilter;
      }

      const response =
        await api.get(
          "sales/orders/",
          {
            params,
          }
        );

      const data =
        response.data;

      if (
        Array.isArray(data)
      ) {

        setOrders(data);
        setCount(data.length);

      } else {

        setOrders(
          data.results || []
        );

        setCount(
          data.count || 0
        );
      }

    } catch (error) {

      console.error(
        "Failed to load sales:",
        error
      );

      setError(
        "Unable to load sales."
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {

    fetchOrders();

  }, [
    page,
    statusFilter,
    paymentStatusFilter,
  ]);


  useEffect(() => {

    const timeout =
      setTimeout(() => {

        setPage(1);
        fetchOrders();

      }, 450);

    return () =>
      clearTimeout(timeout);

  }, [search]);


  const formatCurrency = (
    value
  ) => {

    const amount =
      Number(
        value || 0
      );

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
      }
    ).format(amount);
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


  const getStatusClass = (
    status
  ) => {

    switch (status) {

      case "COMPLETED":
        return "badge badge-success";

      case "PENDING":
        return "badge badge-warning";

      case "CANCELLED":
        return "badge badge-danger";

      case "RETURNED":
        return "badge badge-muted";

      default:
        return "badge";
    }
  };


  const getPaymentClass = (
    status
  ) => {

    switch (status) {

      case "PAID":
        return "badge badge-success";

      case "PARTIAL":
        return "badge badge-warning";

      case "UNPAID":
        return "badge badge-danger";

      case "REFUNDED":
        return "badge badge-muted";

      default:
        return "badge";
    }
  };


  return (

    <div className="page-content">

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Sales Management
          </p>

          <h1 className="page-title">
            Sales
          </h1>

          <p className="page-description">
            Manage invoices, orders,
            payments and returns.
          </p>

        </div>


        <div className="page-header-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={fetchOrders}
          >
            <RefreshCcw size={17} />
            Refresh
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={
              () =>
                navigate(
                  "/sales/new"
                )
            }
          >
            <Plus size={17} />
            New Sale
          </button>

        </div>

      </div>


      <div className="sales-kpi-grid">

        <SalesKpi
          title="Invoices"
          value={count}
          icon={
            <ReceiptText size={20} />
          }
        />

        <SalesKpi
          title="Completed"
          value={
            orders.filter(
              (order) =>
                order.status ===
                "COMPLETED"
            ).length
          }
        />

        <SalesKpi
          title="Pending"
          value={
            orders.filter(
              (order) =>
                order.status ===
                "PENDING"
            ).length
          }
        />

        <SalesKpi
          title="Unpaid"
          value={
            orders.filter(
              (order) =>
                order.payment_status ===
                "UNPAID"
            ).length
          }
        />

      </div>


      <div className="data-card">

        <div className="data-toolbar">

          <div className="search-box">

            <Search
              size={17}
              className="search-box-icon"
            />

            <input
              type="text"
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Search invoice, customer or phone..."
              className="search-input"
            />

          </div>


          <div className="filter-group">

            <select
              value={statusFilter}
              onChange={
                (event) => {

                  setStatusFilter(
                    event.target.value
                  );

                  setPage(1);
                }
              }
              className="filter-select"
            >

              <option value="">
                All Order Status
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>

              <option value="RETURNED">
                Returned
              </option>

            </select>


            <select
              value={
                paymentStatusFilter
              }
              onChange={
                (event) => {

                  setPaymentStatusFilter(
                    event.target.value
                  );

                  setPage(1);
                }
              }
              className="filter-select"
            >

              <option value="">
                All Payment Status
              </option>

              <option value="UNPAID">
                Unpaid
              </option>

              <option value="PARTIAL">
                Partial
              </option>

              <option value="PAID">
                Paid
              </option>

              <option value="REFUNDED">
                Refunded
              </option>

            </select>

          </div>

        </div>


        {error && (

          <div className="page-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="table-loading">

            <div className="loading-spinner" />

            <p>
              Loading sales...
            </p>

          </div>

        ) : orders.length === 0 ? (

          <div className="empty-state">

            <ReceiptText size={40} />

            <h3>
              No sales found
            </h3>

            <p>
              Create your first sale or
              change the current filters.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="data-table">

              <thead>

                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Action</th>
                </tr>

              </thead>


              <tbody>

                {orders.map(
                  (order) => (

                    <tr key={order.id}>

                      <td>

                        <button
                          type="button"
                          className="table-link-button"
                          onClick={
                            () =>
                              navigate(
                                `/sales/${order.id}`
                              )
                          }
                        >
                          {
                            order.invoice_number
                          }
                        </button>

                      </td>


                      <td>

                        <div className="table-primary-text">

                          {
                            order.customer_name ||
                            "Walk-in Customer"
                          }

                        </div>

                        <div className="table-secondary-text">

                          {
                            order.customer_code ||
                            "No customer account"
                          }

                        </div>

                      </td>


                      <td>
                        {
                          formatDate(
                            order.order_date
                          )
                        }
                      </td>


                      <td>

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

                      </td>


                      <td>

                        <span
                          className={
                            getPaymentClass(
                              order.payment_status
                            )
                          }
                        >
                          {
                            order.payment_status_display ||
                            order.payment_status
                          }
                        </span>

                      </td>


                      <td className="table-money">
                        {
                          formatCurrency(
                            order.grand_total
                          )
                        }
                      </td>


                      <td className="table-money">
                        {
                          formatCurrency(
                            order.balance_amount
                          )
                        }
                      </td>


                      <td>

                        <button
                          type="button"
                          className="icon-button"
                          onClick={
                            () =>
                              navigate(
                                `/sales/${order.id}`
                              )
                          }
                          title="View sale"
                        >
                          <Eye size={17} />
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}


        {!loading &&
          totalPages > 1 && (

            <div className="pagination">

              <button
                type="button"
                className="pagination-button"
                disabled={page <= 1}
                onClick={
                  () =>
                    setPage(
                      (previous) =>
                        previous - 1
                    )
                }
              >
                Previous
              </button>


              <span className="pagination-info">
                Page {page} of{" "}
                {totalPages}
              </span>


              <button
                type="button"
                className="pagination-button"
                disabled={
                  page >= totalPages
                }
                onClick={
                  () =>
                    setPage(
                      (previous) =>
                        previous + 1
                    )
                }
              >
                Next
              </button>

            </div>

          )}

      </div>

    </div>
  );
}


function SalesKpi({
  title,
  value,
  icon,
}) {

  return (

    <div className="sales-kpi-card">

      <div>

        <p className="sales-kpi-label">
          {title}
        </p>

        <h3 className="sales-kpi-value">
          {value}
        </h3>

      </div>


      {icon && (

        <div className="sales-kpi-icon">
          {icon}
        </div>

      )}

    </div>
  );
}


export default Sales;