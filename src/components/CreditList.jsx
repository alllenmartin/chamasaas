import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./MemberCredit.css";

// Mock loan data
const loansData = [
  {
    id: "L001",
    memberName: "Jane Doe",
    amount: 15000,
    installments: 12,
    completedInstallments: 6,
    status: "active",
  },
  {
    id: "L002",
    memberName: "John Smith",
    amount: 5000,
    installments: 6,
    completedInstallments: 0,
    status: "defaulted",
  },
  {
    id: "L003",
    memberName: "Alice Mwangi",
    amount: 10000,
    installments: 10,
    completedInstallments: 10,
    status: "completed",
  },
  {
    id: "L004",
    memberName: "David Karanja",
    amount: 20000,
    installments: 12,
    completedInstallments: 3,
    status: "active",
  },
];

const CreditList = () => {
  const [loans] = useState(loansData);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLoans = loans
    .filter((loan) => loan.status === activeTab)
    .filter(
      (loan) =>
        loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return <span className="status-active">Active</span>;
      case "defaulted":
        return <span className="status-defaulted">Defaulted</span>;
      case "completed":
        return <span className="status-completed">Completed</span>;
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
          <button
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active
          </button>
          <button
            className={`tab-btn ${activeTab === "defaulted" ? "active" : ""}`}
            onClick={() => setActiveTab("defaulted")}
          >
            Defaulted
          </button>
          <button
            className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by Member Name or Loan ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="loan-search"
        />

        {/* Table */}
        <table className="credit-table clean-table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Member Name</th>
              <th>Amount (KES)</th>
              <th>Installments</th>
              <th>Completed</th>
              <th>Remaining</th> {/* New column */}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => {
                const remainingInstallments =
                  loan.installments - loan.completedInstallments;
                return (
                  <tr key={loan.id}>
                    <td>{loan.id}</td>
                    <td>{loan.memberName}</td>
                    <td>{loan.amount.toLocaleString()}</td>
                    <td>{loan.installments}</td>
                    <td>{loan.completedInstallments}</td>
                    <td>{remainingInstallments}</td> {/* Display remaining */}
                    <td>{getStatusLabel(loan.status)}</td>
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
      </main>
    </div>
  );
};

export default CreditList;
