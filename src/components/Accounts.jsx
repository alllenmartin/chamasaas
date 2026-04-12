import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Accounts.css";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "ASSET",
    is_postable: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---------------- FETCH ----------------
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/coa");
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ---------------- CREATE / UPDATE ----------------
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.code || !form.name || !form.type) {
    return alert("All fields are required");
  }

  setLoading(true);

  try {
    console.log("Sending:", form); // 👈 DEBUG

    const url = editingId
      ? `http://127.0.0.1:5000/api/coa/${editingId}`
      : "http://127.0.0.1:5000/api/coa";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json(); // 👈 IMPORTANT

    if (!res.ok) {
      console.error("Backend error:", data);
      alert(data.error || "Failed to save account");
      return;
    }

    // Success
    setForm({
      code: "",
      name: "",
      type: "ASSET",
      is_postable: true,
    });

    setEditingId(null);
    fetchAccounts();
  } catch (err) {
    console.error("Network/JS error:", err);
    alert("Error saving account");
  } finally {
    setLoading(false);
  }
};

  // ---------------- EDIT ----------------
  const handleEdit = (acc) => {
    setForm({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      is_postable: acc.is_postable,
    });
    setEditingId(acc.id);
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this account?")) return;

    try {
      await fetch(`http://127.0.0.1:5000/api/coa/${id}`, {
        method: "DELETE",
      });
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert("Error deleting account");
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Accounts" />

      <main className="main-content">
        <header className="header">
          <h1>Accounts</h1>
          <p>Manage chart of accounts</p>
        </header>

        {loading && <p>Loading...</p>}

        {/* FORM */}
        <form className="account-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="code"
            placeholder="Code"
            value={form.code}
            onChange={handleChange}
          />

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
          />

          <select name="type" value={form.type} onChange={handleChange}>
           <option value="Asset">Asset</option>
<option value="Liability">Liability</option>
<option value="Income">Income</option>
<option value="Expense">Expense</option>
<option value="Equity">Equity</option>
          </select>

          <div className="form-group checkbox-row">
  <label className="checkbox-label">
    <input
      type="checkbox"
      name="is_postable"
      checked={form.is_postable}
      onChange={handleChange}
    />
    <span>Postable Account</span>
  </label>
</div>

          <button type="submit">
            {editingId ? "Update" : "Create"}
          </button>
        </form>

        {/* TABLE */}
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Postable</th> 
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {accounts.map((acc) => (
              <tr
  key={acc.id}
  className={acc.is_postable ? "coa-child" : "coa-parent"}
>
                <td>{acc.code}</td>
                <td>{acc.name}</td>
                <td>{acc.type}</td>
                <td>{acc.balance}</td>
                <td>{acc.is_postable ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => handleEdit(acc)}>Edit</button>
                  <button onClick={() => handleDelete(acc.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default Accounts;
