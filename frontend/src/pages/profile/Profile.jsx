import {
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import api from "../../api/api";


function Profile() {
  const [profile, setProfile] =
    useState({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      full_name: "",
      role: "",
    });


  const [loading, setLoading] =
    useState(true);


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  // =========================================================
  // FETCH PROFILE
  // =========================================================

  const fetchProfile =
    async () => {
      setLoading(true);
      setError("");


      try {
        const response =
          await api.get(
            "accounts/profile/"
          );


        setProfile(
          response.data
        );

      } catch (error) {
        console.error(
          "Profile load error:",
          error
        );


        setError(
          error.response?.data?.detail ||
          "Unable to load profile."
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    fetchProfile();
  }, []);


  // =========================================================
  // CHANGE
  // =========================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;


    setProfile(
      (previous) => ({
        ...previous,

        [name]:
          value,
      })
    );
  };


  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      setSaving(true);
      setError("");
      setSuccess("");


      try {
        const response =
          await api.put(
            "accounts/profile/",
            {
              first_name:
                profile.first_name,

              last_name:
                profile.last_name,

              email:
                profile.email,
            }
          );


        setProfile(
          (previous) => ({
            ...previous,
            ...response.data.profile,
          })
        );


        setSuccess(
          response.data?.message ||
          "Profile updated successfully."
        );

      } catch (error) {
        console.error(
          "Profile update error:",
          error
        );


        setError(
          error.response?.data?.detail ||
          "Unable to update profile."
        );

      } finally {
        setSaving(false);
      }
    };


  if (loading) {
    return (
      <div className="page-loading">

        <div className="loading-spinner" />

        <p>
          Loading profile...
        </p>

      </div>
    );
  }


  return (
    <div className="page-content">

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Account
          </p>


          <h1 className="page-title">
            My Profile
          </h1>


          <p className="page-description">
            Manage your personal account
            information.
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


      <div className="profile-grid">

        <div className="profile-summary-card">

          <div className="profile-avatar-large">

            <UserRound
              size={34}
            />

          </div>


          <h2>
            {
              profile.full_name ||
              profile.username
            }
          </h2>


          <p>
            @{profile.username}
          </p>


          <span className="profile-role-badge">

            <ShieldCheck
              size={14}
            />

            {
              String(
                profile.role ||
                "User"
              )
                .replace(
                  /_/g,
                  " "
                )
            }

          </span>

        </div>


        <div className="settings-card">

          <div className="settings-card-header">

            <div>

              <h2>
                Personal Information
              </h2>


              <p>
                Update your account
                information.
              </p>

            </div>

          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="settings-form"
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  First Name
                </label>


                <input
                  type="text"
                  name="first_name"
                  className="form-input"
                  value={
                    profile.first_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="First name"
                />

              </div>


              <div className="form-group">

                <label>
                  Last Name
                </label>


                <input
                  type="text"
                  name="last_name"
                  className="form-input"
                  value={
                    profile.last_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Last name"
                />

              </div>


              <div className="form-group form-group-full">

                <label>
                  Email Address
                </label>


                <div className="input-with-icon">

                  <Mail
                    size={17}
                  />


                  <input
                    type="email"
                    name="email"
                    value={
                      profile.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Email address"
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Username
                </label>


                <input
                  type="text"
                  className="form-input"
                  value={
                    profile.username
                  }
                  disabled
                />

              </div>


              <div className="form-group">

                <label>
                  Role
                </label>


                <input
                  type="text"
                  className="form-input"
                  value={
                    String(
                      profile.role ||
                      ""
                    )
                      .replace(
                        /_/g,
                        " "
                      )
                  }
                  disabled
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
                    ? "Saving..."
                    : "Save Changes"
                }

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}


export default Profile;