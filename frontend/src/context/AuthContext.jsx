import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/api";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    const initializeAuth = async () => {

      const accessToken =
        localStorage.getItem(
          "accessToken"
        );

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {

        const response =
          await api.get(
            "accounts/me/"
          );

        setUser(response.data);

      } catch (error) {

        console.error(
          "Authentication failed",
          error
        );

        localStorage.removeItem(
          "accessToken"
        );

        localStorage.removeItem(
          "refreshToken"
        );

        localStorage.removeItem(
          "user"
        );

        setUser(null);

      } finally {

        setLoading(false);
      }
    };


    initializeAuth();

  }, []);


  const login = async (
    username,
    password
  ) => {

    const response =
      await api.post(
        "accounts/login/",
        {
          username,
          password,
        }
      );


    const {
      access,
      refresh,
      user: loggedInUser,
    } = response.data;


    localStorage.setItem(
      "accessToken",
      access
    );

    localStorage.setItem(
      "refreshToken",
      refresh
    );

    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );


    setUser(loggedInUser);


    return loggedInUser;
  };


  const logout = async () => {

    const refreshToken =
      localStorage.getItem(
        "refreshToken"
      );

    try {

      if (refreshToken) {

        await api.post(
          "accounts/logout/",
          {
            refresh: refreshToken,
          }
        );

      }

    } catch (error) {

      console.error(
        "Logout request failed",
        error
      );

    } finally {

      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem(
        "refreshToken"
      );

      localStorage.removeItem(
        "user"
      );

      setUser(null);

    }
  };


  const isAdmin =
    user?.role === "ADMIN";


  const isManager =
    user?.role ===
    "STORE_MANAGER";


  const isSalesExecutive =
    user?.role ===
    "SALES_EXECUTIVE";


  return (

    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,

        login,
        logout,

        isAuthenticated: !!user,

        isAdmin,
        isManager,
        isSalesExecutive,
      }}
    >

      {children}

    </AuthContext.Provider>

  );
}


export function useAuth() {

  return useContext(
    AuthContext
  );
}