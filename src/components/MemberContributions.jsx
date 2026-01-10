import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./Contribution.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [amount, setAmount] = useState(0);
  const [month, setMonth] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stkLoading, setStkLoading] = useState(false);

  /** Fetch members and contributions from backend */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersRes = await fetch("http://127.0.0.1:5000/api/members");
        const membersData = await membersRes.json();
        setMembers(membersData);

        const contribRes = await fetch(
          "http://127.0.0.1:5000/api/contributions"
        );
        const contribData = await contribRes.json();
        setContributions(contribData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch data from server");
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
      toast.error("Fill all fields");
      return;
    }

    let remainingAmount = Number(amount);
    const regRemaining =
      registrationFee - (selectedMember.registrationPaidAmount || 0);

    // Auto-deduct registration fee first
    let registrationPaidAmount = selectedMember.registrationPaidAmount || 0;
    if (regRemaining > 0) {
      if (remainingAmount >= regRemaining) {
        remainingAmount -= regRemaining;
        registrationPaidAmount = registrationFee;
        toast.success(
          `Registration fee of KES ${registrationFee.toLocaleString()} has been fully paid.`
        );
      } else {
        registrationPaidAmount += remainingAmount;
        remainingAmount = 0;
        toast.success(
          `Partial registration payment of KES ${remainingAmount.toLocaleString()} recorded.`
        );
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
      toast.error("Failed to update member registration");
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
      // setAmount("");
      setMonth("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save contribution");
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
        backgroundColor: "#2c3e50",
      },
    ],
  };

  const totalCollected = visibleContributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  // STK push
  // STK push
  // const handleStkPush = async () => {
  //   if (!selectedMember || amount <= 0 || !month) {
  //     toast.error("Select member, month and enter amount");
  //     return;
  //   }

  //   const payload = {
  //     phone_number: selectedMember.phone,
  //     amount: Number(amount),
  //     // month,
  //     reference: selectedMember.id,
  //   };

  //    const mcashpayload = {
  //     phone_number: selectedMember.phone,
  //     amount: Number(amount),
  //     month:month,
  //     reference: selectedMember.id,
  //     code: 'CONTRIBUTION',
  //   };

  //   console.log("STK Push payload:", mcashpayload);

  //    try {
  //     const res = await fetch("http://127.0.0.1:5000/api/mcash", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(mcashpayload),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       throw new Error(data.message || "Savings failed");
  //     }

  //     // OPTIONAL: clear inputs
  //     // setAmount(0);
  //     // setMonth("");

  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to save to mcash");
  //   }

  //   try {
  //     const res = await fetch("http://127.0.0.1:5000/api/stk-push", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       throw new Error(data.message || "STK Push failed");
  //     }

  //     toast.success("STK Push sent successfully. Check phone to complete payment.");

  //     // OPTIONAL: clear inputs
  //     // setAmount(0);
  //     // setMonth("");

  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to send STK Push");
  //   }
  // };

  const handleStkPush = async () => {
    if (!selectedMember || amount <= 0 || !month) {
      toast.error("Select member, month and enter amount");
      return;
    }

    const payload = {
      phone_number: selectedMember.phone,
      amount: Number(amount),
      reference: selectedMember.id,
    };

    const mcashpayload = {
      phone_number: selectedMember.phone,
      amount: Number(amount),
      month: month,
      reference: selectedMember.id,
      code: "CONTRIBUTION",
      LoanNo: '',
    };

 

    try {
      setStkLoading(true); // ⬅ Start loading
      toast.info(`Sending STK Push to ${selectedMember.phone}...`);

      // Save to mcash first
      const mcashRes = await fetch("http://127.0.0.1:5000/api/mcash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mcashpayload),
      });

      const mcashData = await mcashRes.json();
      if (!mcashRes.ok)
        throw new Error(mcashData.message || "Failed to save to mcash");

      // Send STK Push
      const stkRes = await fetch("http://127.0.0.1:5000/api/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const stkData = await stkRes.json();
      if (!stkRes.ok) throw new Error(stkData.message || "STK Push failed");

      toast.success(
        `STK Push sent to ${selectedMember.phone}. Check your phone to complete payment.`
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setStkLoading(false); // ⬅ Stop loading
    }
  };

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
                  value={amount || ""}
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

                {/* STK Push Button */}
                <button
                  className="view-btn"
                  onClick={handleStkPush}
                  disabled={amount <= 0 || stkLoading}
                  style={{
                    marginLeft: "6px",
                    backgroundColor: "#40739e",
                    color: "#fff",
                  }}
                >
                  {stkLoading
                    ? `Sending STK Push to ${selectedMember.phone}...`
                    : "STK Push"}
                </button>
              </>
            )}
          </div>
        )}

        <p style={{ marginBottom: "16px" }}>
          <strong>Total Collected:</strong> KES{" "}
          {totalCollected.toLocaleString()}
        </p>

        <table className="contributions-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {visibleContributions.length > 0 ? (
              visibleContributions.map((c, index) => (
                <tr key={index}>
                  <td>{c.memberName}</td>
                  <td>{c.month}</td>
                  <td>KES {c.amount.toLocaleString()}</td>
                  <td>{c.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  No contributions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 style={{ marginTop: "40px" }}>Monthly Inflow</h2>
        <Bar data={chartData} />
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default MemberContributions;
