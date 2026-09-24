import {
  Search,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import NotificationDropdown
  from "./NotificationDropdown";


function Navbar() {

  const {
    user,
  } = useAuth();


  const navigate =
    useNavigate();


  // =========================================================
  // USER NAME
  // =========================================================

  const fullName =
    [
      user?.first_name,
      user?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
    ||
    user?.username
    ||
    "User";


  // =========================================================
  // ROLE
  // =========================================================

  const roleName =
    user?.role_display
    ||
    String(
      user?.role || ""
    )
      .replace(
        /_/g,
        " "
      );


  // =========================================================
  // PROFILE
  // =========================================================

  const handleProfileClick =
    () => {

      navigate(
        "/profile"
      );
    };


  // =========================================================
  // UI
  // =========================================================

  return (

    <header className="navbar">


      {/* =====================================================
          SEARCH
          ===================================================== */}

      <div className="navbar-search">

        <Search
          size={17}
          className="navbar-search-icon"
        />


        <input
          type="text"
          placeholder="Search RetailVision..."
          aria-label="Search RetailVision"
        />

      </div>


      {/* =====================================================
          RIGHT AREA
          ===================================================== */}

      <div className="navbar-right">


        {/* ===================================================
            NOTIFICATIONS
            =================================================== */}

        <NotificationDropdown />


        {/* ===================================================
            USER PROFILE
            =================================================== */}

        <button
          type="button"
          className="navbar-profile navbar-profile-button"
          onClick={handleProfileClick}
          title="View Profile"
        >

          <div className="navbar-avatar">

            <UserRound size={17} />

          </div>


          <div className="navbar-profile-info">

            <p className="navbar-user-name">
              {fullName}
            </p>


            <p className="navbar-user-role">
              {
                roleName ||
                "User"
              }
            </p>

          </div>

        </button>

      </div>

    </header>
  );
}


export default Navbar;