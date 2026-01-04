import React, { useState, useEffect } from "react";
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

const settings = JSON.parse(localStorage.getItem("chamaSettings")) || {};
const registrationFee = Number(settings.registrationFee || 0);

const MemberContributions = () => {
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const [loading, setLoading] = useState(true);

  /** Fetch members and contributions from backend */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersRes = await fetch("http://127.0.0.1:5000/api/members");
        const membersData = await membersRes.json();
        setMembers(membersData);

        const contribRes = await fetch("http://127.0.0.1:5000/api/contributions");
        const contribData = await contribRes.json();
        setContributions(contribData);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch data from server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  /* ======================
     ADD CONTRIBUTION
  ====================== */
  const handleAddContribution = async () => {
    if (!selectedMemberId || !amount || !month) {
      alert("Fill all fields");
      return;
    }

    let remainingAmount = Number(amount);
    const regRemaining = registrationFee - (selectedMember.registrationPaidAmount || 0);

    // Auto-deduct registration fee first
    let registrationPaidAmount = selectedMember.registrationPaidAmount || 0;
    if (regRemaining > 0) {
      if (remainingAmount >= regRemaining) {
        remainingAmount -= regRemaining;
        registrationPaidAmount = registrationFee;
        alert(
          `Registration fee of KES ${registrationFee.toLocaleString()} has been fully paid.`
        );
      } else {
        registrationPaidAmount += remainingAmount;
        remainingAmount = 0;
        alert(`Partial registration payment of KES ${remainingAmount.toLocaleString()} recorded.`);
      }
    }

    // Update member registrationPaidAmount in backend
    try {
      await fetch(`http://127.0.0.1:5000/api/members/${selectedMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selectedMember, registrationPaidAmount }),
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMemberId ? { ...m, registrationPaidAmount } : m
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update member registration");
      return;
    }

    if (remainingAmount <= 0) return;

    // Add contribution in backend
    const newContribution = {
      memberId: selectedMemberId,
      memberName: selectedMember.name,
      month,
      amount: remainingAmount,
      date: new Date().toLocaleDateString(),
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContribution),
      });
      const savedContribution = await res.json();
      setContributions([...contributions, savedContribution]);
      setAmount("");
      setMonth("");
    } catch (err) {
      console.error(err);
      alert("Failed to save contribution");
    }
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

  const totalCollected = visibleContributions.reduce((sum, c) => sum + c.amount, 0);

  if (loading) return <p>Loading data...</p>;

  return (
    <div className="dashboard">
      <Sidebar active="Contributions" />
      <main className="main-content">
        <h1>Contributions</h1>

        <div style={{ marginBottom: "12px" }}>
          <button className="view-btn" onClick={() => setViewAll(!viewAll)}>
            {viewAll ? "View Per Member" : "View All Contributions"}
          </button>
        </div>

        {!viewAll && (
          <div style={{ marginBottom: "12px" }}>
            <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
              <option value="">Select Member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{" "}
                  {m.registrationPaidAmount < registrationFee ? "(Registration Pending)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {!viewAll && selectedMember && (
          <div style={{ marginBottom: "16px" }}>
            {selectedMember.registrationPaidAmount < registrationFee ? (
              <p style={{ color: "#e74c3c", fontWeight: "bold" }}>
                ⚠ Registration fee not fully paid. Contributions are locked.
              </p>
            ) : (
              <>
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ marginLeft: "6px" }}
                />
                <button className="view-btn" onClick={handleAddContribution} style={{ marginLeft: "6px" }}>
                  Add
                </button>
              </>
            )}
          </div>
        )}

        <p style={{ marginBottom: "16px" }}>
          <strong>Total Collected:</strong> KES {totalCollected.toLocaleString()}
        </p>

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

        <h2 style={{ marginTop: "40px" }}>Monthly Inflow</h2>
        <Bar data={chartData} />
      </main>
    </div>
  );
};

export default MemberContributions;
