import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 IMPORTANT

  // Load user once
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setLoading(false);
  }, []);

  // Inactivity timer
  useEffect(() => {
    if (!user) return;

    let timer;

    const logout = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("loggedInUser");
      navigate("/login", { replace: true });
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 5 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user, navigate]);

  // ⛔ WAIT until localStorage is read
  if (loading) return null; // or a spinner

  // 🔒 Not logged in
  if (!user) {
    console,console.log('Here One');
    
    return <Navigate to="/login" replace />;
  }

  // 🔐 Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;