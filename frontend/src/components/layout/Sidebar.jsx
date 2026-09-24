import {
  BarChart3,
  Boxes,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  UserRound,
  Users,
  ScrollText,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";


function Sidebar() {

  const {
    user,
    logout,
  } = useAuth();


  const navigate =
    useNavigate();


  // =========================================================
  // USER ROLE
  // =========================================================

  const userRole =
    String(
      user?.role || ""
    )
      .trim()
      .toUpperCase();


  const isAdmin =
    user?.is_superuser === true ||
    userRole === "ADMIN";


  // =========================================================
  // MAIN MENU
  // =========================================================

  const menuItems = [

    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      end: true,
    },

    {
      label: "Products",
      path: "/products",
      icon: Package,
      end: true,
    },

    {
      label: "Categories",
      path: "/products/categories",
      icon: Tags,
      end: true,
    },

    {
      label: "Suppliers",
      path: "/suppliers",
      icon: Truck,
      end: true,
    },

    {
      label: "Customers",
      path: "/customers",
      icon: Users,
      end: true,
    },

    {
      label: "Sales",
      path: "/sales",
      icon: ShoppingCart,
      end: true,
    },

    {
      label: "Inventory",
      path: "/inventory",
      icon: Boxes,
      end: true,
    },

    {
      label: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      end: true,
    },

    {
      label: "Reports",
      path: "/reports",
      icon: FileBarChart,
      end: true,
    },

    {
      label: "Audit Logs",
      path: "/audit-logs",
      icon: ScrollText,
      end: true,

      // Admin only
      adminOnly: true,
    },

  ];


  // =========================================================
  // ACCOUNT MENU
  // =========================================================

  const accountItems = [

    {
      label: "Profile",
      path: "/profile",
      icon: UserRound,
      end: true,
    },

    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
      end: true,
    },

  ];


  // =========================================================
  // FILTER MENU BASED ON ROLE
  // =========================================================

  const visibleMenuItems =
    menuItems.filter(
      (item) => {

        if (
          item.adminOnly &&
          !isAdmin
        ) {
          return false;
        }


        return true;
      }
    );


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout =
    async () => {

      try {

        await logout();

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      } finally {

        navigate(
          "/login",
          {
            replace: true,
          }
        );
      }
    };


  // =========================================================
  // RENDER LINK
  // =========================================================

  const renderMenuItem =
    (item) => {

      const Icon =
        item.icon;


      return (

        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={
            ({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
          }
        >

          <div className="sidebar-link-left">

            <Icon size={18} />

            <span>
              {item.label}
            </span>

          </div>

        </NavLink>

      );
    };


  // =========================================================
  // UI
  // =========================================================

  return (

    <aside className="sidebar">


      {/* =====================================================
          BRAND
          ===================================================== */}

      <div className="sidebar-logo">

        <div className="sidebar-logo-icon">

          <Boxes size={22} />

        </div>


        <div className="sidebar-logo-text">

          <h1 className="sidebar-logo-title">
            RetailVision
          </h1>

          <p className="sidebar-logo-subtitle">
            Retail Intelligence
          </p>

        </div>

      </div>


      {/* =====================================================
          MAIN NAVIGATION
          ===================================================== */}

      <nav className="sidebar-navigation">

        <p className="sidebar-section-title">
          Main Menu
        </p>


        <div className="sidebar-menu">

          {
            visibleMenuItems.map(
              renderMenuItem
            )
          }

        </div>


        {/* ===================================================
            ACCOUNT
            =================================================== */}

        <p
          className="sidebar-section-title"
          style={{
            marginTop: "24px",
          }}
        >
          Account
        </p>


        <div className="sidebar-menu">

          {
            accountItems.map(
              renderMenuItem
            )
          }

        </div>

      </nav>


      {/* =====================================================
          LOGOUT
          ===================================================== */}

      <div className="sidebar-bottom">

        <button
          type="button"
          onClick={handleLogout}
          className="logout-button"
        >

          <LogOut size={18} />

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}


export default Sidebar;