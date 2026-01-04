import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./MemberCredit.css";

const CreditList = () => {
  const [loans, setLoans] = useState([]);
  const [activeTab, setActiveTab] = useState("Active");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     FETCH LOANS
  ====================== */
  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/credit");
        if (!res.ok) throw new Error("Failed to fetch credit records");

        const data = await res.json();
        setLoans(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load credit records");
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  /* ======================
     FILTERING
  ====================== */
  const filteredLoans = loans
    .filter((loan) => loan.status === activeTab)
    .filter(
      (loan) =>
        loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.memberId.toLowerCase().includes(searchTerm.toLowerCase())
    );

  /* ======================
     STATUS LABELS
  ====================== */
  const getStatusLabel = (status) => {
    switch (status) {
      case "Active":
        return <span className="status-active">Active</span>;
      case "Completed":
        return <span className="status-completed">Completed</span>;
      case "Rejected":
      case "Defaulted":
        return <span className="status-defaulted">{status}</span>;
      default:
        return status;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Credit" />

      <main className="main-content">
        <h1>Credit / Loan List</h1>

        {/* Tabs */}
        <div className="loan-tabs">
          {["Active", "Completed", "Rejected","Defaulted"].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by Loan ID or Member ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="loan-search"
        />

        {/* Loader */}
        {loading ? (
          <p>Loading credit records...</p>
        ) : (
          <table className="credit-table clean-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Member ID</th>
                 <th>Member Name</th>
                <th>Amount (KES)</th>
                <th>Installments</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const completed =
                    loan.status === "Completed" ? loan.installments : 0;
                  const remaining = loan.installments - completed;

                  return (
                    <tr key={loan.loanId}>
                      <td>{loan.loanId}</td>
                      <td>{loan.memberId}</td>
                       <td>{loan.memberName}</td>
                      <td>{loan.amountRequested.toLocaleString()}</td>
                      <td>{loan.installments}</td>
                      <td>{remaining}</td>
                      <td>{getStatusLabel(loan.status)}</td>
                      <td>{loan.createdAt}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#888" }}>
                    No loans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default CreditList;
