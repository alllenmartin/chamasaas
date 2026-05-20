import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ active = "Dashboard" }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "guest";

  const [creditOpen, setCreditOpen] = useState(true);
 const toggleCredit = () => {
  setCreditOpen((prev) => {
    localStorage.setItem("creditOpen", !prev);
    return !prev;
  });
};

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
            <li className={active === "Credit Journal" ? "active" : ""}>
              <Link to="/receipt_journal">
                <span className="icon">📒</span>
                <span className="text">Receipt Journal</span>
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
            // <li className="menu-section">
            <li className={active === "Credit" ? "active" : ""}>
              <div
                className="menu-title"
                onClick={toggleCredit}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>💳 Credit Management</span>
                <span>{creditOpen ? "▾" : "▸"}</span>
              </div>

              {creditOpen && (
                <ul className="submenu">
                  <li>
                    <Link 
                    to="/loan-products"> <span className="icon">🏦</span>
                <span className="text">Loan Products</span></Link>
                  </li>
                  <li>
                    <Link to="/credit">Loan Applications</Link>
                  </li>
                  <li>
                    <Link to="/credit-list">Approvals</Link>
                  </li>
                  <li>
                    <Link to="/loan-disbursements">Disbursements</Link>
                  </li>
                  <li>
                    <Link to="/loan-repayments">Repayments</Link>
                  </li>
                </ul>
              )}
            </li>
          )}

  

          {canAccess(["treasurer"]) && (
            <li className={active === "COA" ? "active" : ""}>
              <Link to="/coa">
                <span className="icon">📊</span>
                <span className="text">Chart of Accounts</span>
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
