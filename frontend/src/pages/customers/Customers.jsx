import {
  useEffect,
  useState,
} from "react";

import {
  Edit3,
  MapPin,
  Plus,
  Search,
  UserCheck,
  UserRound,
  UserX,
} from "lucide-react";

import api from "../../api/api";

import CustomerModal
  from "../../components/forms/CustomerModal";

import {
  useAuth,
} from "../../context/AuthContext";


function Customers() {

  const {
    isAdmin,
    isManager,
  } = useAuth();

  const canManage =
    isAdmin || isManager;


  const [customers, setCustomers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [customerType, setCustomerType] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [totalCount, setTotalCount] =
    useState(0);

  const [hasNext, setHasNext] =
    useState(false);

  const [hasPrevious, setHasPrevious] =
    useState(false);


  const loadCustomers = async () => {

    setLoading(true);

    try {

      const params = {
        search,
        page,
      };


      if (customerType) {

        params.customer_type =
          customerType;
      }


      if (statusFilter) {

        params.is_active =
          statusFilter;
      }


      const response =
        await api.get(
          "customers/",
          {
            params,
          }
        );


      if (
        response.data.results
      ) {

        setCustomers(
          response.data.results
        );

        setTotalCount(
          response.data.count || 0
        );

        setHasNext(
          Boolean(
            response.data.next
          )
        );

        setHasPrevious(
          Boolean(
            response.data.previous
          )
        );

      } else {

        setCustomers(
          response.data
        );

        setTotalCount(
          response.data.length
        );

        setHasNext(false);
        setHasPrevious(false);
      }

    } catch (error) {

      console.error(
        "Failed to load customers:",
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
          loadCustomers();
        },
        300
      );

    return () =>
      clearTimeout(timer);

  }, [
    search,
    customerType,
    statusFilter,
    page,
  ]);


  useEffect(() => {

    setPage(1);

  }, [
    search,
    customerType,
    statusFilter,
  ]);


  const openAddModal = () => {

    setSelectedCustomer(null);

    setModalOpen(true);
  };


  const openEditModal =
    (customer) => {

      setSelectedCustomer(
        customer
      );

      setModalOpen(true);
    };


  const closeModal = () => {

    setSelectedCustomer(null);

    setModalOpen(false);
  };


  const changeStatus =
    async (
      customer,
      isActive
    ) => {

      const action =
        isActive
          ? "activate"
          : "deactivate";

      const confirmed =
        window.confirm(
          `${action} "${customer.name}"?`
        );

      if (!confirmed) {
        return;
      }


      try {

        await api.patch(
          `customers/${customer.id}/`,
          {
            is_active:
              isActive,
          }
        );

        await loadCustomers();

      } catch (error) {

        console.error(
          "Unable to update customer:",
          error
        );

        alert(
          "Unable to update customer status."
        );
      }
    };


  const getCustomerBadge =
    (type) => {

      if (type === "VIP") {
        return "badge badge-vip";
      }

      if (
        type === "WHOLESALE"
      ) {
        return "badge badge-wholesale";
      }

      return "badge badge-regular";
    };


  return (

    <main className="page-container">

      <div className="page-inner">

        <header className="page-header">

          <div>

            <p className="page-eyebrow">
              Customer Management
            </p>

            <h1 className="page-title">
              Customers
            </h1>

            <p className="page-description">
              Manage customer profiles,
              contact details, loyalty status
              and customer types.
            </p>

          </div>


          <button
            type="button"
            onClick={openAddModal}
            className="primary-button"
          >

            <Plus size={17} />

            Add Customer

          </button>

        </header>


        <section className="card toolbar-card">

          <div className="customers-toolbar">

            <div className="customer-search-area">

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
                  className="search-input"
                  placeholder="Search name, code, phone, email..."
                />

              </div>


              <select
                value={customerType}
                onChange={
                  (event) =>
                    setCustomerType(
                      event.target.value
                    )
                }
                className="filter-select"
              >

                <option value="">
                  All Types
                </option>

                <option value="REGULAR">
                  Regular
                </option>

                <option value="WHOLESALE">
                  Wholesale
                </option>

                <option value="VIP">
                  VIP
                </option>

              </select>


              <select
                value={statusFilter}
                onChange={
                  (event) =>
                    setStatusFilter(
                      event.target.value
                    )
                }
                className="filter-select"
              >

                <option value="">
                  All Status
                </option>

                <option value="true">
                  Active
                </option>

                <option value="false">
                  Inactive
                </option>

              </select>

            </div>


            <div className="customers-count">

              <span className="customers-count-number">
                {totalCount}
              </span>

              <span className="customers-count-label">
                Customers
              </span>

            </div>

          </div>

        </section>


        <section className="card table-card">

          <div className="table-responsive">

            <table className="data-table customer-table">

              <thead>

                <tr>

                  <th>
                    Customer
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Loyalty
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
                          ? 7
                          : 6
                      }
                      className="table-state"
                    >

                      <div className="loading-spinner" />

                      Loading customers...

                    </td>

                  </tr>

                ) : customers.length === 0 ? (

                  <tr>

                    <td
                      colSpan={
                        canManage
                          ? 7
                          : 6
                      }
                      className="table-state"
                    >

                      <div className="empty-state">

                        <div className="empty-state-icon">

                          <UserRound size={28} />

                        </div>

                        <h3>
                          No customers found
                        </h3>

                        <p>
                          Add your first customer or
                          change the search filters.
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  customers.map(
                    (customer) => (

                      <tr key={customer.id}>

                        <td>

                          <div className="customer-name-cell">

                            <div className="customer-avatar">

                              <UserRound size={18} />

                            </div>


                            <div>

                              <p className="table-primary-text">
                                {customer.name}
                              </p>

                              <p className="table-secondary-text">
                                {
                                  customer.customer_code
                                }
                              </p>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="customer-contact">

                            <span className="customer-phone">
                              {customer.phone}
                            </span>

                            <span className="customer-email">
                              {
                                customer.email ||
                                "No email"
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              getCustomerBadge(
                                customer.customer_type
                              )
                            }
                          >
                            {
                              customer.customer_type_display ||
                              customer.customer_type
                            }
                          </span>

                        </td>


                        <td>

                          <div className="customer-location">

                            <MapPin size={14} />

                            <span>
                              {
                                [
                                  customer.city,
                                  customer.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ") ||
                                "—"
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <div className="loyalty-cell">

                            <strong>
                              {
                                customer.loyalty_points
                              }
                            </strong>

                            <span>
                              points
                            </span>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              customer.is_active
                                ? "badge badge-success"
                                : "badge badge-neutral"
                            }
                          >
                            {
                              customer.is_active
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
                                      customer
                                    )
                                }
                                className="icon-button"
                                title="Edit customer"
                              >
                                <Edit3 size={16} />
                              </button>


                              {customer.is_active ? (

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      changeStatus(
                                        customer,
                                        false
                                      )
                                  }
                                  className="
                                    icon-button
                                    icon-button-danger
                                  "
                                  title="Deactivate customer"
                                >
                                  <UserX size={16} />
                                </button>

                              ) : (

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      changeStatus(
                                        customer,
                                        true
                                      )
                                  }
                                  className="
                                    icon-button
                                    icon-button-success
                                  "
                                  title="Activate customer"
                                >
                                  <UserCheck size={16} />
                                </button>

                              )}

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


          {!loading &&
            totalCount > 0 && (

              <div className="table-pagination">

                <span className="pagination-info">
                  Page {page}
                </span>


                <div className="pagination-actions">

                  <button
                    type="button"
                    disabled={!hasPrevious}
                    onClick={
                      () =>
                        setPage(
                          (previous) =>
                            Math.max(
                              previous - 1,
                              1
                            )
                        )
                    }
                    className="secondary-button pagination-button"
                  >
                    Previous
                  </button>


                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={
                      () =>
                        setPage(
                          (previous) =>
                            previous + 1
                        )
                    }
                    className="secondary-button pagination-button"
                  >
                    Next
                  </button>

                </div>

              </div>

            )}

        </section>

      </div>


      <CustomerModal
        open={modalOpen}
        customer={selectedCustomer}
        onClose={closeModal}
        onSuccess={loadCustomers}
      />

    </main>
  );
}


export default Customers;