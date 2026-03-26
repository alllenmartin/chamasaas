import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./CreditCard.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoanCalculator from "../components/LoanCalculator";

const CreditCard = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [calcMethod, setCalcMethod] = useState("Amortized");
  const [installments, setInstallments] = useState("");

  const money = (value) => Math.round(Number(value || 0)).toLocaleString();

  const handleGenerateSchedule = async () => {
  try {
    await fetch(`http://127.0.0.1:5000/api/credit/${loan.loanId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...loan,
        installments: Number(installments),
        interestRate: loan.interestRate,
        amountRequested: loan.amountRequested
      }),
    });

    toast.success("Schedule generated and saved!");
  } catch {
    toast.error("Failed to generate schedule");
  }
};

  // Load loan details
  useEffect(() => {
    if (!loanId) return;
    fetch(`http://127.0.0.1:5000/api/credit/${loanId}`)
      .then((res) => res.json())
      .then((data) => {
        setLoan(data);
        setStatus(data.status);
        setInstallments(data.installments);
      })
      .catch(() => toast.error("Failed to load loan"));
  }, [loanId]);

  const isPending = status === "Pending";

  const handleSave = async () => {
    if (!loan) return;
    setLoading(true);
    try {
      await fetch(`http://127.0.0.1:5000/api/credit/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          installments: Number(installments),
          interestMethod: calcMethod,
        }),
      });
      toast.success("Loan updated successfully");
    } catch {
      toast.error("Failed to save loan");
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return <p>Loading...</p>;

  return (
    <div className="credit-card-page">
      {/* -------------------------
          Loan Info Card
      ------------------------- */}
      <div className="credit-card">
        <div className={`loan-status-badge ${status.toLowerCase()}`}>
          {status}
        </div>
        <h2>Loan Information</h2>

        <div className="card-details">
          {/* Static Fields */}
          <div className="card-row">
            <label>Loan ID:</label>
            <span>{loan.loanId}</span>
          </div>
          <div className="card-row">
            <label>Member ID:</label>
            <span>{loan.memberId}</span>
          </div>
          <div className="card-row">
            <label>Member Name:</label>
            <span>{loan.memberName}</span>
          </div>
          <div className="card-row">
            <label>Amount:</label>
            <span>KES {money(loan.amountRequested)}</span>
          </div>
          <div className="card-row">
            <label>Interest Rate:</label>
            <span>{loan.interestRate}%</span>
          </div>
          <div className="card-row">
            <label>Amount Paid:</label>
            <span>KES {money(loan.amountPaid)}</span>
          </div>
          <div className="card-row">
            <label>Outstanding Balance:</label>
            <span>KES {money(loan.remainingBalance)}</span>
          </div>

          {/* -------------------------
              Editable Fields (Pending Only)
          ------------------------- */}
          <div className="card-row">
            <label>Status:</label>
            <select value={status} disabled={!isPending} onChange={(e) => setStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="card-row">
            <label>Installments:</label>
            <input
              type="number"
              value={installments}
              disabled={!isPending}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </div>

          <div className="card-row">
            <label>Interest Method:</label>
            <select value={calcMethod} disabled={!isPending} onChange={(e) => setCalcMethod(e.target.value)}>
              <option value="Amortized">Amortized</option>
              <option value="Straight Line">Straight Line</option>
            </select>
          </div>

          {/* -------------------------
              Actions
          ------------------------- */}
          <div className="card-actions">
            {isPending && (
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
            {(status === "Pending" || status === "Active") && (
              <button
                className="btn-secondary"
                onClick={() => navigate(`/credit-security/${loan.loanId}`)}
              >
                Manage Guarantors / Collateral
              </button>
            )}
            {/* <button
              className="btn-secondary"
              onClick={() => window.location.reload()}
              style={{ padding: "6px 12px", fontSize: "14px" }}
            >
              Re-generate Schedule
            </button> */}

            <button
  className="btn-secondary"
  onClick={handleGenerateSchedule}
>
  Re-generate Schedule
</button>
          </div>
        </div>
      </div>

      {/* -------------------------
          Repayment Schedule
      ------------------------- */}
      <div className="schedule-card">
        <LoanCalculator loan={loan} calcMethod={calcMethod} />
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </div>
  );
};

export default CreditCard;