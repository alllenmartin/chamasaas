import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const UserRegister = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    role: "admin",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.fullName || !form.phone || !form.password) {
      setError("All fields are required");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const userExists = users.some((u) => u.phone === form.phone);
    if (userExists) {
      setError("User with this phone number already exists");
      return;
    }

    const newUser = {
      id: Date.now(),
      fullName: form.fullName,
      phone: form.phone,
      password: form.password, // dev only
      role: form.role,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("users", JSON.stringify([...users, newUser]));

    setSuccess("User registered successfully ✔");

    setTimeout(() => navigate("/login"), 1200);
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create System User</h2>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="treasurer">Treasurer</option>
          <option value="secretary">Secretary</option>
        </select>

        <button type="submit">Register</button>

        <p className="auth-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default UserRegister;
