import {
  useEffect,
  useState,
} from "react";

import {
  Edit3,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react";

import api from "../../api/api";

import SupplierModal
  from "../../components/forms/SupplierModal";

import {
  useAuth,
} from "../../context/AuthContext";


function Suppliers() {

  const {
    isAdmin,
    isManager,
  } = useAuth();

  const canManage =
    isAdmin || isManager;


  const [suppliers, setSuppliers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [selectedSupplier, setSelectedSupplier] =
    useState(null);


  const loadSuppliers = async () => {

    setLoading(true);

    try {

      const response =
        await api.get(
          "suppliers/",
          {
            params: {
              search,
            },
          }
        );

      setSuppliers(
        response.data.results ||
        response.data
      );

    } catch (error) {

      console.error(
        "Failed to load suppliers:",
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
          loadSuppliers();
        },
        300
      );

    return () =>
      clearTimeout(timer);

  }, [search]);


  const openAdd = () => {

    setSelectedSupplier(null);

    setModalOpen(true);
  };


  const openEdit = (supplier) => {

    setSelectedSupplier(supplier);

    setModalOpen(true);
  };


  const closeModal = () => {

    setModalOpen(false);

    setSelectedSupplier(null);
  };


  const handleDelete =
    async (supplier) => {

      const confirmed =
        window.confirm(
          `Delete "${supplier.company_name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {

        await api.delete(
          `suppliers/${supplier.id}/`
        );

        await loadSuppliers();

      } catch (error) {

        console.error(
          "Failed to delete supplier:",
          error
        );

        alert(
          "Unable to delete supplier. The supplier may already be linked with products."
        );
      }
    };


  return (

    <main className="page-container">

      <div className="page-inner">

        <header className="page-header">

          <div>

            <p className="page-eyebrow">
              Procurement Network
            </p>

            <h1 className="page-title">
              Suppliers
            </h1>

            <p className="page-description">
              Manage supplier details, contact information
              and business locations.
            </p>

          </div>


          {canManage && (

            <button
              type="button"
              onClick={openAdd}
              className="primary-button"
            >
              <Plus size={17} />
              Add Supplier
            </button>

          )}

        </header>


        <section className="card toolbar-card">

          <div className="suppliers-toolbar">

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
                placeholder="Search supplier, code, contact, city..."
                className="search-input"
              />

            </div>


            <div className="suppliers-count">

              <span className="suppliers-count-number">
                {suppliers.length}
              </span>

              <span className="suppliers-count-label">
                Suppliers
              </span>

            </div>

          </div>

        </section>


        <section className="card table-card">

          <div className="table-responsive">

            <table className="data-table supplier-table">

              <thead>

                <tr>

                  <th>
                    Supplier
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    GST Number
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
                          ? 6
                          : 5
                      }
                      className="table-state"
                    >

                      <div className="loading-spinner" />

                      <p>
                        Loading suppliers...
                      </p>

                    </td>

                  </tr>

                ) : suppliers.length === 0 ? (

                  <tr>

                    <td
                      colSpan={
                        canManage
                          ? 6
                          : 5
                      }
                      className="table-state"
                    >

                      <div className="empty-state">

                        <div className="empty-state-icon">

                          <Truck size={28} />

                        </div>

                        <h3>
                          No suppliers found
                        </h3>

                        <p>
                          {
                            search
                              ? "Try a different search term."
                              : "Add your first supplier to start managing procurement."
                          }
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  suppliers.map(
                    (supplier) => (

                      <tr key={supplier.id}>

                        <td>

                          <div className="supplier-name-cell">

                            <div className="supplier-icon">

                              <Truck size={18} />

                            </div>


                            <div>

                              <p className="table-primary-text">
                                {supplier.company_name}
                              </p>

                              <p className="table-secondary-text">
                                {supplier.supplier_code}
                              </p>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="supplier-contact">

                            <span className="supplier-contact-name">
                              {
                                supplier.contact_person ||
                                "—"
                              }
                            </span>

                            <span className="supplier-phone">
                              {
                                supplier.phone ||
                                "No phone"
                              }
                            </span>

                            {supplier.email && (

                              <span className="supplier-email">
                                {supplier.email}
                              </span>

                            )}

                          </div>

                        </td>


                        <td>

                          <div className="supplier-location">

                            <span className="supplier-location-text">
                              {
                                [
                                  supplier.city,
                                  supplier.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ") ||
                                "—"
                              }
                            </span>


                            {supplier.google_maps_url && (

                              <a
                                href={
                                  supplier.google_maps_url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="supplier-map-link"
                              >

                                Open Map

                                <ExternalLink size={12} />

                              </a>

                            )}

                          </div>

                        </td>


                        <td>

                          <span className="supplier-gst">
                            {
                              supplier.gst_number ||
                              "—"
                            }
                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              supplier.status === "ACTIVE"
                                ? "badge badge-success"
                                : "badge badge-neutral"
                            }
                          >
                            {
                              supplier.status === "ACTIVE"
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
                                    openEdit(
                                      supplier
                                    )
                                }
                                className="icon-button"
                                title="Edit supplier"
                              >
                                <Edit3 size={16} />
                              </button>


                              <button
                                type="button"
                                onClick={
                                  () =>
                                    handleDelete(
                                      supplier
                                    )
                                }
                                className="
                                  icon-button
                                  icon-button-danger
                                "
                                title="Delete supplier"
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


      <SupplierModal
        open={modalOpen}
        supplier={selectedSupplier}
        onClose={closeModal}
        onSuccess={loadSuppliers}
      />

    </main>
  );
}


export default Suppliers;