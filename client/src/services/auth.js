import { jwtDecode } from "jwt-decode";

const login = (token) => {
  localStorage.setItem("token", token);
};

const logout = () => {
  localStorage.removeItem("token");
};

const getCurrentUser = () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      return jwtDecode(token);
    }
    return null;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

export { login, logout, getCurrentUser };