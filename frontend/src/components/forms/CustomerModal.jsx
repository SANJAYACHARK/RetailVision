import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  UserPlus,
  X,
} from "lucide-react";

import api from "../../api/api";


const initialForm = {
  customer_code: "",
  name: "",
  phone: "",
  email: "",
  gender: "",
  customer_type: "REGULAR",
  date_of_birth: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  notes: "",
  is_active: true,
};


function CustomerModal({
  open,
  onClose,
  onSuccess,
  customer,
}) {

  const [formData, setFormData] =
    useState(initialForm);

  const [saving, setSaving] =
    useState(false);


  useEffect(() => {

    if (!open) {
      return;
    }

    if (customer) {

      setFormData({
        customer_code:
          customer.customer_code || "",

        name:
          customer.name || "",

        phone:
          customer.phone || "",

        email:
          customer.email || "",

        gender:
          customer.gender || "",

        customer_type:
          customer.customer_type ||
          "REGULAR",

        date_of_birth:
          customer.date_of_birth || "",

        address:
          customer.address || "",

        city:
          customer.city || "",

        state:
          customer.state || "",

        pincode:
          customer.pincode || "",

        notes:
          customer.notes || "",

        is_active:
          customer.is_active ?? true,
      });

    } else {

      setFormData(
        initialForm
      );
    }

  }, [
    customer,
    open,
  ]);


  if (!open) {
    return null;
  }


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

      setSaving(true);

      try {

        const payload = {
          ...formData,

          customer_code:
            formData.customer_code
              .trim()
              .toUpperCase(),

          name:
            formData.name.trim(),

          phone:
            formData.phone.trim(),

          email:
            formData.email.trim(),

          date_of_birth:
            formData.date_of_birth ||
            null,
        };


        if (customer) {

          await api.patch(
            `customers/${customer.id}/`,
            payload
          );

        } else {

          await api.post(
            "customers/",
            payload
          );
        }


        onSuccess?.();

        onClose();

      } catch (error) {

        console.error(
          "Customer save failed:",
          error
        );

        alert(
          JSON.stringify(
            error.response?.data ||
            "Unable to save customer.",
            null,
            2
          )
        );

      } finally {

        setSaving(false);
      }
    };


  return (

    <div className="modal-overlay">

      <div className="modal customer-modal">

        <div className="modal-header">

          <div>

            <p className="modal-subtitle">
              Customer Management
            </p>

            <h2 className="modal-title">
              {
                customer
                  ? "Edit Customer"
                  : "Add Customer"
              }
            </h2>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="modal-close"
          >
            <X size={18} />
          </button>

        </div>


        <form
          onSubmit={handleSubmit}
        >

          <div className="modal-body">

            <div className="customer-modal-intro">

              <div className="customer-modal-icon">

                <UserPlus size={22} />

              </div>

              <div>

                <h3>
                  Customer Profile
                </h3>

                <p>
                  Enter customer contact and
                  classification information.
                </p>

              </div>

            </div>


            <div className="form-grid">

              <div className="form-group">

                <label className="form-label">
                  Customer Code *
                </label>

                <input
                  type="text"
                  name="customer_code"
                  value={
                    formData.customer_code
                  }
                  onChange={handleChange}
                  className="form-input"
                  placeholder="CUS001"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Customer Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Customer full name"
                  required
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
                  placeholder="customer@email.com"
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Gender
                </label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >

                  <option value="">
                    Select Gender
                  </option>

                  <option value="MALE">
                    Male
                  </option>

                  <option value="FEMALE">
                    Female
                  </option>

                  <option value="OTHER">
                    Other
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label className="form-label">
                  Customer Type
                </label>

                <select
                  name="customer_type"
                  value={
                    formData.customer_type
                  }
                  onChange={handleChange}
                  className="form-select"
                >

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

              </div>


              <div className="form-group">

                <label className="form-label">
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="date_of_birth"
                  value={
                    formData.date_of_birth
                  }
                  onChange={handleChange}
                  className="form-input"
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


              <div className="form-group form-full-width">

                <label className="form-label">
                  Address
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Customer address"
                />

              </div>


              <div className="form-group form-full-width">

                <label className="form-label">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Optional customer notes"
                />

              </div>


              {customer && (

                <div className="form-group">

                  <label className="form-label">
                    Status
                  </label>

                  <select
                    name="is_active"
                    value={
                      String(
                        formData.is_active
                      )
                    }
                    onChange={
                      (event) =>
                        setFormData(
                          (previous) => ({
                            ...previous,

                            is_active:
                              event.target.value
                              === "true",
                          })
                        )
                    }
                    className="form-select"
                  >

                    <option value="true">
                      Active
                    </option>

                    <option value="false">
                      Inactive
                    </option>

                  </select>

                </div>

              )}

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
                disabled={saving}
                className="primary-button"
              >

                <Save size={16} />

                {
                  saving
                    ? "Saving..."
                    : customer
                      ? "Update Customer"
                      : "Save Customer"
                }

              </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}


export default CustomerModal;