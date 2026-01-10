import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./VendorLedger.css";
import { useNavigate } from "react-router-dom";

const VendorLedger = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const navigate = useNavigate();


  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [amountInput, setAmountInput] = useState("");

  const money = (value) => Number(value || 0).toLocaleString();

  useEffect(() => {
    const fetchLedger = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/api/vendor-ledger?month=${month}`
        );
        if (!res.ok) throw new Error("Failed to fetch ledger");
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load ledger");
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [month]);

  const openModal = (entry) => {
    setSelectedEntry(entry);
    setAmountInput(""); // clear previous input
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedEntry(null);
    setModalOpen(false);
  };

  const submitReceived = async () => {
    if (!amountInput || Number(amountInput) <= 0)
      return alert("Enter a valid amount");

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/vendor-ledger/${selectedEntry.id}/receive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(amountInput) }),
        }
      );

      if (!res.ok) throw new Error("Failed to mark received");
      const updated = await res.json();

      setEntries((prev) =>
        prev.map((e) => (e.id === selectedEntry.id ? { ...e, ...updated } : e))
      );
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to update received amount");
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Vendor Ledger" />
      <main className="main-content">
        <h1>Vendor</h1>
        <div className="vendor-switch">
          <button className="view-btn" onClick={() => navigate("/vendors")}>
            Vendor List
          </button>
          <button className="view-btn active">Vendor Ledger</button>
        </div>

        <label>
          Month:
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="ledger-table-container">
            <table className="ledger-table clean-table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Month</th>
                  <th>Expected</th>
                  <th>Received</th>
                  <th>Outstanding</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.length ? (
                  entries.map((e) => (
                    <tr key={e.id}>
                      <td>{e.vendor_id}</td>
                      <td>
                        {new Date(e.month).toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td>{money(e.expected_amount)}</td>
                      <td>{money(e.received_amount)}</td>
                      <td>{money(e.outstanding_amount)}</td>
                      <td>
                        <button
                          onClick={() => openModal(e)}
                          disabled={e.outstanding_amount <= 0}
                        >
                          Receive
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", color: "#888" }}
                    >
                      No entries found
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
              <h2>Receive Payment</h2>
              <p>Vendor: {selectedEntry.vendor_id}</p>
              <p>Outstanding: KES {money(selectedEntry.outstanding_amount)}</p>
              <input
                type="number"
                placeholder="Enter amount received"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                min="1"
                max={selectedEntry.outstanding_amount}
              />
              <div className="modal-actions">
                <button onClick={submitReceived}>Submit</button>
                <button onClick={closeModal} className="cancel-btn">
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

export default VendorLedger;
