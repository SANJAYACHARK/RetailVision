import {
  KeyRound,
  LockKeyhole,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";

import {
  useState,
} from "react";

import api from "../../api/api";


function Settings() {
  const [passwordForm, setPasswordForm] =
    useState({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;


    setPasswordForm(
      (previous) => ({
        ...previous,

        [name]:
          value,
      })
    );
  };


  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      setSaving(true);
      setError("");
      setSuccess("");


      if (
        passwordForm.new_password
        !==
        passwordForm.confirm_password
      ) {
        setError(
          "New passwords do not match."
        );

        setSaving(false);

        return;
      }


      try {
        const response =
          await api.post(
            "accounts/change-password/",
            passwordForm
          );


        setSuccess(
          response.data?.message ||
          "Password changed successfully."
        );


        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

      } catch (error) {
        console.error(
          "Password update error:",
          error
        );


        const detail =
          error.response?.data?.detail;


        if (
          Array.isArray(
            detail
          )
        ) {
          setError(
            detail.join(" ")
          );

        } else {
          setError(
            detail ||
            "Unable to change password."
          );
        }

      } finally {
        setSaving(false);
      }
    };


  return (
    <div className="page-content">

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Configuration
          </p>


          <h1 className="page-title">
            Settings
          </h1>


          <p className="page-description">
            Manage account security
            and application preferences.
          </p>

        </div>

      </div>


      {
        error && (
          <div className="page-error">
            {error}
          </div>
        )
      }


      {
        success && (
          <div className="page-success">
            {success}
          </div>
        )
      }


      <div className="settings-layout">

        <div className="settings-navigation">

          <div className="settings-navigation-item active">

            <KeyRound
              size={18}
            />

            Security

          </div>


          <div className="settings-navigation-item">

            <SettingsIcon
              size={18}
            />

            Preferences

          </div>

        </div>


        <div className="settings-card">

          <div className="settings-card-header">

            <div>

              <h2>
                Change Password
              </h2>


              <p>
                Use a strong password
                to protect your
                RetailVision account.
              </p>

            </div>


            <div className="settings-card-icon">

              <LockKeyhole
                size={22}
              />

            </div>

          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="settings-form"
          >

            <div className="form-group">

              <label>
                Current Password
              </label>


              <input
                type="password"
                name="current_password"
                className="form-input"
                value={
                  passwordForm.current_password
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


            <div className="form-grid">

              <div className="form-group">

                <label>
                  New Password
                </label>


                <input
                  type="password"
                  name="new_password"
                  className="form-input"
                  value={
                    passwordForm.new_password
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Confirm Password
                </label>


                <input
                  type="password"
                  name="confirm_password"
                  className="form-input"
                  value={
                    passwordForm.confirm_password
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>


            <div className="settings-form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving
                }
              >

                <Save
                  size={17}
                />


                {
                  saving
                    ? "Updating..."
                    : "Update Password"
                }

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}


export default Settings;