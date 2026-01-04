import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>403 – Unauthorized</h2>

        <p style={{ marginBottom: "16px", color: "#555", fontSize: "14px" }}>
          You do not have permission to access this page.
        </p>

        <button onClick={() => navigate("/")}>Go to Dashboard</button>
      </div>
    </div>
  );
};

export default Unauthorized;
