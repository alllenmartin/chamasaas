import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false); // true after password verified

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Step 1: Password login → send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.phone || !form.password) {
      setError("Phone number and password are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Login failed");
        setLoading(false);
        return;
      }

      // Move to OTP step
      setOtpStep(true);
      setLoading(false);
    } catch (err) {
      setError("Unable to connect to server");
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      setError("OTP is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Invalid OTP");
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));

      navigate("/"); // redirect to dashboard
    } catch (err) {
      setError("Unable to connect to server");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue</p>

        {error && <div className="auth-error">{error}</div>}

        {!otpStep ? (
          <>
            {/* Phone input */}
            <div className="input-group floating-label">
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder=" "
              />
              <label>Phone Number</label>
              <span className="input-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h2l3 7-2 2-2 2v2h2l2-2 2-2 7 3v2h2V5h-2l-7 3-2-2-2-2H3v2z"
                  />
                </svg>
              </span>
            </div>

            {/* Password input */}
            <div className="input-group floating-label">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder=" "
              />
              <label>Password</label>
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </span>
              <span className="input-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c1.656 0 3-1.344 3-3s-1.344-3-3-3-3 1.344-3 3 1.344 3 3 3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 11v10h12V11H6z"
                  />
                </svg>
              </span>
            </div>

            <button
              type="button"
              disabled={loading}
              className="login-button"
              onClick={handleSubmit}
            >
              {loading ? <div className="button-loader"></div> : "Login"}
            </button>
          </>
        ) : (
          <>
            {/* OTP input */}
            <div className="input-group floating-label">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder=" "
              />
              <label>Enter OTP</label>
            </div>

            <button
              type="button"
              disabled={loading}
              className="login-button"
              onClick={handleVerifyOtp}
            >
              {loading ? <div className="button-loader"></div> : "Verify OTP"}
            </button>
          </>
        )}

        {loading && !otpStep && (
          <div className="loader-overlay">
            <div className="loader"></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;