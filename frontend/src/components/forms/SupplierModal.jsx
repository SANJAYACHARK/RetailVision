import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  Truck,
  X,
} from "lucide-react";

import api
  from "../../api/api";


const initialForm = {
  supplier_code: "",
  company_name: "",
  contact_person: "",
  phone: "",
  email: "",
  gst_number: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  google_maps_url: "",
  status: "ACTIVE",
};


function SupplierModal({
  open,
  onClose,
  onSuccess,
  supplier,
}) {

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState(initialForm);


  useEffect(() => {

    if (!open) {
      return;
    }


    if (supplier) {

      setFormData({
        supplier_code:
          supplier.supplier_code || "",

        company_name:
          supplier.company_name || "",

        contact_person:
          supplier.contact_person || "",

        phone:
          supplier.phone || "",

        email:
          supplier.email || "",

        gst_number:
          supplier.gst_number || "",

        address:
          supplier.address || "",

        city:
          supplier.city || "",

        state:
          supplier.state || "",

        pincode:
          supplier.pincode || "",

        google_maps_url:
          supplier.google_maps_url || "",

        status:
          supplier.status || "ACTIVE",
      });

    } else {

      setFormData(
        initialForm
      );
    }

  }, [
    supplier,
    open,
  ]);


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


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setLoading(true);


      try {

        const payload = {
          ...formData,

          supplier_code:
            formData.supplier_code
              .trim()
              .toUpperCase(),

          company_name:
            formData.company_name
              .trim(),

          phone:
            formData.phone.trim(),

          email:
            formData.email.trim(),

          google_maps_url:
            formData.google_maps_url
              .trim(),
        };


        if (supplier) {

          await api.patch(
            `suppliers/${supplier.id}/`,
            payload
          );

        } else {

          await api.post(
            "suppliers/",
            payload
          );
        }


        await onSuccess?.();

        onClose();

      } catch (error) {

        console.error(
          "Supplier save failed:",
          error
        );


        alert(
          JSON.stringify(
            error.response?.data ||
            "Unable to save supplier.",
            null,
            2
          )
        );

      } finally {

        setLoading(false);
      }
    };


  if (!open) {
    return null;
  }


  return (

    <div className="modal-overlay">

      <div className="modal supplier-modal">

        <div className="modal-header">

          <div>

            <p className="modal-subtitle">
              Supplier Management
            </p>

            <h2 className="modal-title">
              {
                supplier
                  ? "Edit Supplier"
                  : "Add Supplier"
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

            <div className="supplier-modal-intro">

              <div className="supplier-modal-intro-icon">

                <Truck size={21} />

              </div>


              <div>

                <h3>
                  Supplier Profile
                </h3>

                <p>
                  Store supplier contact,
                  GST and location details.
                </p>

              </div>

            </div>


            <div className="form-grid">

              <div className="form-group">

                <label className="form-label">
                  Supplier Code *
                </label>

                <input
                  type="text"
                  name="supplier_code"
                  value={
                    formData.supplier_code
                  }
                  onChange={handleChange}
                  className="form-input"
                  placeholder="SUP001"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Company Name *
                </label>

                <input
                  type="text"
                  name="company_name"
                  value={
                    formData.company_name
                  }
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Supplier company"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Contact Person
                </label>

                <input
                  type="text"
                  name="contact_person"
                  value={
                    formData.contact_person
                  }
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Contact person"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Phone *
                </label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="9876543210"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="supplier@email.com"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  GST Number
                </label>

                <input
                  type="text"
                  name="gst_number"
                  value={
                    formData.gst_number
                  }
                  onChange={handleChange}
                  className="form-input"
                  placeholder="GST number"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Bengaluru"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Karnataka"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Pincode
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="560001"
                />

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
                  Google Maps URL
                </label>

                <input
                  type="url"
                  name="google_maps_url"
                  value={
                    formData.google_maps_url
                  }
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Paste Google Maps location URL"
                />

              </div>


              <div className="form-group form-full-width">

                <label className="form-label">
                  Address
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Supplier address"
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
                    : supplier
                      ? "Update Supplier"
                      : "Create Supplier"
                }

              </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}


export default SupplierModal;