import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Use the environment variable if available, otherwise default to localhost
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
export const API_BASE_URL = API_URL;
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    // fetch current user when a token is present
    fetchCurrentUser();
  }, [token]);

  const clearSession = (redirect = false) => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setLoading(false);
    if (redirect) {
      navigate("/login");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      console.error("Fetch current user error:", message);
      if (err.response?.status === 401) {
        clearSession(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const newToken = response.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      await fetchCurrentUser();
      navigate("/feed");
      return true;
    } catch (err) {
      const message =
        err.response?.data?.error || "Login failed. Please try again.";
      console.error("Login error:", message);
      setError(message);
      setLoading(false);
      return false;
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
      });
      return true;
    } catch (err) {
      const message =
        err.response?.data?.error || "Signup failed. Please try again.";
      console.error("Signup error:", message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession(true);
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
    error,
    setError,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
