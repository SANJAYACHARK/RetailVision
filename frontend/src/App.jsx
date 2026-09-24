import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout
  from "./components/layout/Layout";

import ProtectedRoute
  from "./routes/ProtectedRoute";

import Login
  from "./pages/auth/Login";

import Unauthorized
  from "./pages/auth/Unauthorized";

import Dashboard
  from "./pages/dashboard/Dashboard";

import Products
  from "./pages/products/Products";

import Categories
  from "./pages/products/Categories";

import Suppliers
  from "./pages/suppliers/Suppliers";

import Customers
  from "./pages/customers/Customers";

import Sales
  from "./pages/sales/Sales";

import CreateSale
  from "./pages/sales/CreateSale";

import SaleDetails
  from "./pages/sales/SaleDetails";

import InvoicePrint
  from "./pages/sales/InvoicePrint";

import Inventory
  from "./pages/inventory/Inventory";

import Analytics
  from "./pages/analytics/Analytics";

import Reports
  from "./pages/reports/Reports";

import Profile
  from "./pages/profile/Profile";

import Settings
  from "./pages/settings/Settings";

import AuditLogs
  from "./pages/audit/AuditLogs";

function App() {

  return (

    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
          ===================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      <Route
        path="/profile"
        element={
          <Profile />
        }
      />

      <Route
        path="/settings"
        element={
          <Settings />
        }
      />


      {/* =====================================================
          PROTECTED ROUTES
          ===================================================== */}

      <Route
        element={<ProtectedRoute />}
      >

        {/* ===================================================
            ROUTES WITH SIDEBAR + NAVBAR
            =================================================== */}

        <Route
          element={<Layout />}
        >

          {/* DASHBOARD */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* PRODUCTS */}

          <Route
            path="/products"
            element={<Products />}
          />


          {/* CATEGORIES */}

          <Route
            path="/products/categories"
            element={<Categories />}
          />


          {/* SUPPLIERS */}

          <Route
            path="/suppliers"
            element={<Suppliers />}
          />


          {/* CUSTOMERS */}

          <Route
            path="/customers"
            element={<Customers />}
          />


          {/* SALES LIST */}

          <Route
            path="/sales"
            element={<Sales />}
          />


          {/* CREATE SALE */}

          <Route
            path="/sales/new"
            element={<CreateSale />}
          />


          {/* SALE DETAILS */}

          <Route
            path="/sales/:id"
            element={<SaleDetails />}
          />


          {/* INVENTORY */}

          <Route
            path="/inventory"
            element={<Inventory />}
          />


          {/* ANALYTICS */}

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/audit-logs"
            element={
              <AuditLogs />
            }
          />


        </Route>


        {/* ===================================================
            PROTECTED ROUTES WITHOUT SIDEBAR / NAVBAR
            =================================================== */}

        {/* PRINTABLE INVOICE */}

        <Route
          path="/sales/:id/invoice"
          element={<InvoicePrint />}
        />

      </Route>


      {/* =====================================================
          ROOT REDIRECT
          ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      {/* =====================================================
          UNKNOWN ROUTE
          ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>

  );
}


export default App;