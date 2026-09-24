import {
  useEffect,
  useState,
} from "react";

import {
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";


function Login() {

  const navigate = useNavigate();

  const {
    login,
    user,
  } = useAuth();


  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  useEffect(() => {

    if (user) {

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    }

  }, [
    user,
    navigate,
  ]);


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError("");
      setLoading(true);

      try {

        await login(
          username,
          password
        );

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

      } catch (error) {

        console.error(
          "Login failed:",
          error
        );

        setError(
          "Invalid username or password."
        );

      } finally {

        setLoading(false);
      }
    };


  return (

    <div className="login-page">

      <div className="login-card">

        {/* =========================
            LEFT BRAND PANEL
        ========================== */}

        <section className="login-brand-panel">

          <div className="login-brand-content">

            <div className="login-logo">

              <div className="login-logo-icon">

                <BarChart3 size={23} />

              </div>

              <span className="login-logo-text">
                RetailVision
              </span>

            </div>


            <div className="login-brand-badge">
              Retail Business Intelligence
            </div>


            <h1 className="login-brand-title">
              Turn retail data into better
              business decisions.
            </h1>


            <p className="login-brand-description">
              Monitor sales, inventory,
              customers, profitability and
              business performance from one
              intelligent analytics platform.
            </p>


            <div className="login-brand-highlights">

              <LoginFeature
                icon={<TrendingUp size={17} />}
                title="Sales Analytics"
                description="Track revenue and sales performance"
              />

              <LoginFeature
                icon={<Boxes size={17} />}
                title="Inventory Intelligence"
                description="Monitor products and stock levels"
              />

              <LoginFeature
                icon={<WalletCards size={17} />}
                title="Profit Insights"
                description="Understand margins and profitability"
              />

            </div>

          </div>


          <div className="login-brand-footer">

            RetailVision

            <span>
              Retail Sales Analytics &
              Business Intelligence System
            </span>

          </div>

        </section>


        {/* =========================
            RIGHT LOGIN PANEL
        ========================== */}

        <section className="login-form-panel">

          <div className="login-form-container">

            {/* Mobile logo */}

            <div className="login-mobile-logo">

              <div className="login-mobile-logo-icon">

                <BarChart3 size={21} />

              </div>

              <span>
                RetailVision
              </span>

            </div>


            <div className="login-form-header">

              <p className="login-form-eyebrow">
                Welcome back
              </p>

              <h2 className="login-form-title">
                Sign in to RetailVision
              </h2>

              <p className="login-form-description">
                Enter your credentials to
                access your retail analytics
                workspace.
              </p>

            </div>


            {error && (

              <div className="login-error">
                {error}
              </div>

            )}


            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              {/* Username */}

              <div className="login-field">

                <label
                  htmlFor="username"
                  className="login-label"
                >
                  Username
                </label>


                <div className="login-input-wrapper">

                  <UserRound
                    size={18}
                    className="login-input-icon"
                  />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={
                      (event) =>
                        setUsername(
                          event.target.value
                        )
                    }
                    placeholder="Enter username"
                    className="login-input"
                    autoComplete="username"
                    required
                  />

                </div>

              </div>


              {/* Password */}

              <div className="login-field">

                <label
                  htmlFor="password"
                  className="login-label"
                >
                  Password
                </label>


                <div className="login-input-wrapper">

                  <LockKeyhole
                    size={18}
                    className="login-input-icon"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={
                      (event) =>
                        setPassword(
                          event.target.value
                        )
                    }
                    placeholder="Enter password"
                    className="login-input"
                    autoComplete="current-password"
                    required
                  />


                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={
                      () =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {
                      showPassword
                        ? (
                          <EyeOff size={18} />
                        )
                        : (
                          <Eye size={18} />
                        )
                    }

                  </button>

                </div>

              </div>


              <button
                type="submit"
                disabled={loading}
                className="login-button"
              >

                {
                  loading
                    ? (
                      <>
                        <span className="login-spinner" />
                        Signing in...
                      </>
                    )
                    : "Sign In"
                }

              </button>

            </form>


            <p className="login-account-note">
              RetailVision accounts are
              managed by your organization
              administrator.
            </p>

          </div>

        </section>

      </div>

    </div>
  );
}


function LoginFeature({
  icon,
  title,
  description,
}) {

  return (

    <div className="login-feature">

      <div className="login-feature-icon">
        {icon}
      </div>


      <div>

        <p className="login-feature-title">
          {title}
        </p>

        <p className="login-feature-description">
          {description}
        </p>

      </div>

    </div>
  );
}


export default Login;