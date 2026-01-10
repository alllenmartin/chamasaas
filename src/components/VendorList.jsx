import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./VendorLedger.css";
import { useNavigate } from "react-router-dom";

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [form, setForm] = useState({
    vendor_id: "",
    name: "",
    phone: "",
    default_monthly_amount: "",
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/vendors");
      const data = await res.json();
      setVendors(data);
    } catch {
      alert("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openCreate = () => {
    setEditingVendor(null);
    setForm({ vendor_id: "", name: "",phone:"", default_monthly_amount: "" });
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditingVendor(v);
    setForm({
      vendor_id: v.vendor_id,
      name: v.name,
      phone: v.phone,
      default_monthly_amount: v.default_monthly_amount,
    });
    setModalOpen(true);
  };

  const saveVendor = async () => {
    if (!form.vendor_id || !form.name)
      return alert("Vendor ID & Name required");

    const url = editingVendor
      ? `http://127.0.0.1:5000/api/vendors/${editingVendor.id}`
      : "http://127.0.0.1:5000/api/vendors";

    const method = editingVendor ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: form.vendor_id,
        name: form.name,
        phone: form.phone,
        default_monthly_amount: Number(form.default_monthly_amount || 0),
      }),
    });

    if (!res.ok) return alert("Failed to save vendor");

    setModalOpen(false);
    fetchVendors();
  };

  const deleteVendor = async (id) => {
    if (!window.confirm("Delete this vendor?")) return;

    const res = await fetch(`http://127.0.0.1:5000/api/vendors/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) return alert("Failed to delete vendor");

    fetchVendors();
  };

  return (
    <div className="dashboard">
      <Sidebar active="Vendors" />
      <main className="main-content">
        <h1>Vendors</h1>

        <div className="vendor-switch">
          <button className="view-btn active">Vendor List</button>
          <button
            className="view-btn"
            onClick={() => navigate("/vendors/ledger")}
          >
            Vendor Ledger
          </button>
          {/* <button className="view-btn" onClick={openCreate} disabled> 
            + Add Vendor
          </button> */}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="ledger-table-container">
            <table className="ledger-table clean-table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Monthly Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length ? (
                  vendors.map((v) => (
                    <tr key={v.id}>
                      <td>{v.vendor_id}</td>
                      <td>{v.name}</td>
                      <td>{v.phone}</td>
                      <td>
                        {Number(v.default_monthly_amount).toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => openEdit(v)}
                        >
                          Edit
                        </button>
                        <button
                          className="view-btn"
                          style={{ background: "#dc2626", marginLeft: 6 }}
                          onClick={() => deleteVendor(v.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", color: "#888" }}
                    >
                      No vendors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="modal-backdrop">
            <div className="modal">
              <h2>{editingVendor ? "Edit Vendor" : "Add Vendor"}</h2>

              <input
                placeholder="Vendor ID"
                value={form.vendor_id}
                onChange={(e) =>
                  setForm({ ...form, vendor_id: e.target.value })
                }
              />

              <input
                placeholder="Vendor Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <input
                type="number"
                placeholder="Monthly Amount"
                value={form.default_monthly_amount}
                onChange={(e) =>
                  setForm({ ...form, default_monthly_amount: e.target.value })
                }
              />

              <div className="modal-actions">
                <button onClick={saveVendor}>Save</button>
                <button
                  className="cancel-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorList;
