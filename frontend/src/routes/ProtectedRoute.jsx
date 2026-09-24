import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";


function ProtectedRoute({
  allowedRoles,
}) {

  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();


  if (loading) {

    return (

      <div className="auth-loading-screen">

        <div className="loading-spinner" />

        <p>
          Loading RetailVision...
        </p>

      </div>

    );
  }


  if (!isAuthenticated) {

    return (

      <Navigate
        to="/login"
        replace
      />

    );
  }


  if (
    allowedRoles &&
    !allowedRoles.includes(
      user?.role
    )
  ) {

    return (

      <Navigate
        to="/unauthorized"
        replace
      />

    );
  }


  return <Outlet />;
}


export default ProtectedRoute;