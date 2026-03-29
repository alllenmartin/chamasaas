import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ active = "Dashboard" }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "guest";

  const [loggingOut, setLoggingOut] = useState(false); // loader state

  const canAccess = (allowedRoles) =>
    allowedRoles.some((r) => r.toLowerCase() === role.toLowerCase()) ||
    role.toLowerCase() === "admin";

  const handleLogout = () => {
    setLoggingOut(true); // show loader
    setTimeout(() => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("accessToken");
      navigate("/login");
    }, 500); // short delay so loader is visible
  };

  const formatRole = (role) =>
    role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <h2 className="logo">Chama Admin</h2>
      </div>

      {/* User Info */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{formatRole(user.role)}</span>
          </div>
        </div>
      )}

      <nav>
        <ul>
          <li className={active === "Dashboard" ? "active" : ""}>
            <Link to="/">
              <span className="icon">🏠</span>
              <span className="text">Dashboard</span>
            </Link>
          </li>

          {canAccess(["treasurer", "secretary"]) && (
            <li className={active === "Members" ? "active" : ""}>
              <Link to="/members">
                <span className="icon">👥</span>
                <span className="text">Members</span>
              </Link>
            </li>
          )}

          {canAccess(["treasurer"]) && (
            <li className={active === "Contributions" ? "active" : ""}>
              <Link to="/contributions">
                <span className="icon">💰</span>
                <span className="text">Contributions</span>
              </Link>
            </li>
          )}

          {canAccess(["treasurer"]) && (
            <li className={active === "Credit" ? "active" : ""}>
              <Link to="/credit">
                <span className="icon">💳</span>
                <span className="text">Credit</span>
              </Link>
            </li>
          )}
                {canAccess(["treasurer"]) && (
            <li className={active === "Credit Journal" ? "active" : ""}>
              <Link to="/loan_journal">
                <span className="icon">📒</span>
                <span className="text">Credit Journal</span>
              </Link>
            </li>
          )}

          

          {canAccess(["treasurer"]) && (
            <li className={active === "Vendor" ? "active" : ""}>
              <Link to="/vendors">
                <span className="icon">🏪</span>
                <span className="text">Vendors</span>
              </Link>
            </li>
          )}

          {role.toLowerCase() === "admin" && (
            <li className={active === "Settings" ? "active" : ""}>
              <Link to="/settings">
                <span className="icon">⚙️</span>
                <span className="text">Settings</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          🚪 Logout
        </button>
      </div>

      {/* Logout Loader */}
      {loggingOut && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
