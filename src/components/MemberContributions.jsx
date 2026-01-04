import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const membersData = [
  { id: "12345678", name: "Jane Doe", registrationPaidAmount: 1000 },
  { id: "87654321", name: "John Smith", registrationPaidAmount: 200 },
  { id: "99887766", name: "Alice Mwangi", registrationPaidAmount: 1000 },
];

const settings = JSON.parse(localStorage.getItem("chamaSettings")) || {};
const registrationFee = Number(settings.registrationFee || 0);

const MemberContributions = () => {
  const [members, setMembers] = useState(membersData);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [viewAll, setViewAll] = useState(false);

  const [contributions, setContributions] = useState([
    {
      memberId: "12345678",
      memberName: "Jane Doe",
      month: "2024-01",
      amount: 5000,
      date: "01/01/2024",
    },
    {
      memberId: "87654321",
      memberName: "John Smith",
      month: "2024-01",
      amount: 3000,
      date: "02/01/2024",
    },
    {
      memberId: "99887766",
      memberName: "Alice Mwangi",
      month: "2024-02",
      amount: 5000,
      date: "01/02/2024",
    },
  ]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Count unregistered members
//   const unregisteredCount = members.filter(
//     (m) => m.registrationPaidAmount < registrationFee
//   ).length;

  /* ======================
     ADD CONTRIBUTION
  ====================== */
  const handleAddContribution = () => {
    if (!selectedMemberId || !amount || !month) {
      alert("Fill all fields");
      return;
    }

    let remainingAmount = Number(amount);
    const regRemaining = registrationFee - selectedMember.registrationPaidAmount;

    // Auto-deduct registration fee first
    if (regRemaining > 0) {
      if (remainingAmount >= regRemaining) {
        // Fully pay registration fee
        remainingAmount -= regRemaining;
        setMembers((prev) =>
          prev.map((m) =>
            m.id === selectedMemberId
              ? { ...m, registrationPaidAmount: registrationFee }
              : m
          )
        );
        alert(
          `Registration fee of KES ${registrationFee.toLocaleString()} has been paid. Remaining contribution applied.`
        );
      } else {
        // Partial registration payment
        setMembers((prev) =>
          prev.map((m) =>
            m.id === selectedMemberId
              ? { ...m, registrationPaidAmount: m.registrationPaidAmount + remainingAmount }
              : m
          )
        );
        alert(
          `Partial registration payment of KES ${remainingAmount.toLocaleString()} recorded.`
        );
        return; // nothing left for contribution
      }
    }

    if (remainingAmount <= 0) return;

    setContributions([
      ...contributions,
      {
        memberId: selectedMemberId,
        memberName: selectedMember.name,
        month,
        amount: remainingAmount,
        date: new Date().toLocaleDateString(),
      },
    ]);

    setAmount("");
    setMonth("");
  };

  /* ======================
     FILTERING
  ====================== */
  const visibleContributions = viewAll
    ? contributions
    : contributions.filter((c) => c.memberId === selectedMemberId);

  /* ======================
     PER-MONTH TOTALS
  ====================== */
  const monthlyTotals = {};
  contributions.forEach((c) => {
    monthlyTotals[c.month] = (monthlyTotals[c.month] || 0) + c.amount;
  });

  const chartData = {
    labels: Object.keys(monthlyTotals),
    datasets: [
      {
        label: "Monthly Inflow (KES)",
        data: Object.values(monthlyTotals),
        backgroundColor: "#2563eb",
      },
    ],
  };

  /* ======================
     TOTALS
  ====================== */
  const totalCollected = visibleContributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  return (
    <div className="dashboard">
      <Sidebar active="Contributions" />

      <main className="main-content">
        <h1>Contributions</h1>

        {/* Dashboard Card: Unregistered Members */}
        {/* <div style={{ marginBottom: "16px" }}>
          <strong>Unregistered Members:</strong> {unregisteredCount} /{" "}
          {members.length}
        </div> */}

        {/* View Toggle */}
        <div style={{ marginBottom: "12px" }}>
          <button className="view-btn" onClick={() => setViewAll(!viewAll)}>
            {viewAll ? "View Per Member" : "View All Contributions"}
          </button>
        </div>

        {/* Member Selector */}
        {!viewAll && (
          <div style={{ marginBottom: "12px" }}>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="">Select Member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{" "}
                  {m.registrationPaidAmount < registrationFee
                    ? "(Registration Pending)"
                    : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Add Contribution */}
        {!viewAll && selectedMember && (
          <div style={{ marginBottom: "16px" }}>
            {selectedMember.registrationPaidAmount < registrationFee ? (
              <p style={{ color: "#e74c3c", fontWeight: "bold" }}>
                ⚠ Registration fee not fully paid. Contributions are locked.
              </p>
            ) : (
              <>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ marginLeft: "6px" }}
                />

                <button
                  className="view-btn"
                  onClick={handleAddContribution}
                  style={{ marginLeft: "6px" }}
                >
                  Add
                </button>
              </>
            )}
          </div>
        )}

        {/* Totals */}
        <p style={{ marginBottom: "16px" }}>
          <strong>Total Collected:</strong> KES{" "}
          {totalCollected.toLocaleString()}
        </p>

        {/* Contributions Table */}
        <div className="member-table">
          <div className="table-header">
            <span>Member</span>
            <span>Month</span>
            <span>Amount</span>
            <span>Date</span>
          </div>

          {visibleContributions.map((c, index) => (
            <div className="table-row" key={index}>
              <span>{c.memberName}</span>
              <span>{c.month}</span>
              <span>KES {c.amount.toLocaleString()}</span>
              <span>{c.date}</span>
            </div>
          ))}

          {visibleContributions.length === 0 && <p>No contributions found.</p>}
        </div>

        {/* Chart */}
        <h2 style={{ marginTop: "40px" }}>Monthly Inflow</h2>

        <Bar data={chartData} />
      </main>
    </div>
  );
};

export default MemberContributions;
