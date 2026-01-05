import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./CreditCard.css";

const CreditCard = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [calcMethod, setCalcMethod] = useState("Amortized");

  const money = (value) => Math.round(Number(value || 0)).toLocaleString();

  // -------------------------
  // Load loan and repayment schedule
  // -------------------------
  useEffect(() => {
    if (!loanId) return;

    // Fetch loan details
    fetch(`http://127.0.0.1:5000/api/credit/${loanId}`)
      .then((res) => res.json())
      .then((data) => {
        setLoan(data);
        setStatus(data.status);
      });

    // Fetch repayment schedule
    fetch(`http://127.0.0.1:5000/api/credit/${loanId}/schedule`)
      .then((res) => res.json())
      .then((data) => {
        if (data.schedule) {
          const formatted = data.schedule.map((item) => ({
            installmentNumber: item.installment_number,
            date: item.due_date,
            principal: Math.round(item.principal),
            interest: Math.round(item.interest),
            total: Math.round(item.total),
            remainingBalance: Math.round(item.remaining_balance),
            paid: item.paid,
          }));
          setSchedule(formatted);
        }
      })
      .catch((err) => console.error("Failed to fetch schedule", err));
  }, [loanId]);

  // -------------------------
  // Save loan status
  // -------------------------
  const handleSave = async () => {
    setLoading(true);
    await fetch(`http://127.0.0.1:5000/api/credit/${loanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    navigate("/credit");
  };

  // -------------------------
  // Generate repayment schedule
  // -------------------------
  const generateSchedule = async () => {
    if (!loan) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/credit/${loan.loanId}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: calcMethod === "Amortized" ? "amortized" : "straight",
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate schedule");
        return;
      }

      const data = await res.json();

      // Update schedule in state
      if (data.schedule) {
        const formatted = data.schedule.map((item) => ({
          installmentNumber: item.installment_number,
          date: item.due_date,
          principal: Math.round(item.principal),
          interest: Math.round(item.interest),
          total: Math.round(item.total),
          remainingBalance: Math.round(item.remaining_balance),
          paid: item.paid,
        }));
        setSchedule(formatted);
        alert("Repayment schedule saved & locked successfully");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while saving schedule");
    }
  };

  // -------------------------
  // Mark installment as paid
  // -------------------------
  const markAsPaid = async (installmentNumber) => {
    const repayment = schedule.find(
      (item) => item.installmentNumber === installmentNumber
    );
    if (!repayment || repayment.paid) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/repayment/${repayment.installmentNumber}/pay`,
        { method: "PATCH" }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to mark as paid");
        return;
      }

      // Update schedule state instantly
      const updatedSchedule = schedule.map((item) =>
        item.installmentNumber === installmentNumber
          ? { ...item, paid: true }
          : item
      );
      setSchedule(updatedSchedule);

      // Update loan info
      const updatedLoan = { ...loan };
      updatedLoan.amountPaid += repayment.total;
      updatedLoan.remainingBalance -= repayment.total;
      if (updatedLoan.remainingBalance <= 0) updatedLoan.status = "Completed";
      setLoan(updatedLoan);
    } catch (err) {
      console.error(err);
      alert("Network error while marking installment as paid");
    }
  };

  if (!loan) return <p>Loading...</p>;

  const isCompleted = loan.status === "Completed";

return (
  <div
    className="credit-card-container"
    style={{
      display: "flex",
      gap: "24px",
      marginLeft: "40px",
      marginRight: "40px",
      height: "100vh", // give the container a fixed height
    }}
  >
    {/* -------------------------
        Loan Details (Left)
    ------------------------- */}
    <div
      className="credit-card"
      style={{
        flex: 1,
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        overflowY: "auto", // make it scrollable
      }}
    >
      <h2>Loan Card</h2>

      {[
        ["Loan ID", loan.loanId],
        ["Member ID", loan.memberId],
        ["Member Name", loan.memberName],
        ["Amount", `KES ${money(loan.amountRequested)}`],
        ["Interest Rate", `${loan.interestRate}%`],
        ["Interest Amount", `KES ${money(loan.interestAmount)}`],
        ["Installments", loan.installments],
        ["Total Payable", `KES ${money(loan.totalPayable)}`],
        ["Amount Paid", `KES ${money(loan.amountPaid)}`],
        ["Remaining Balance", `KES ${money(loan.remainingBalance)}`],
      ].map(([label, value]) => (
        <div className="card-row" key={label}>
          <strong>{label}:</strong>
          <span>{value}</span>
        </div>
      ))}

      <div className="card-row">
        <strong>Status:</strong>
        <select
          value={status}
          disabled={isCompleted}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {!isCompleted && (
        <button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      )}

      {/* Interest Method */}
      <div className="card-row" style={{ marginTop: "20px" }}>
        <strong>Interest Method:</strong>
        <select value={calcMethod} onChange={(e) => setCalcMethod(e.target.value)}>
          <option value="Amortized">Amortized</option>
          <option value="Straight Line">Straight Line</option>
        </select>
      </div>

      <button
        onClick={generateSchedule}
        style={{ backgroundColor: "#10b981", marginTop: "12px" }}
      >
        Generate Repayment Schedule
      </button>
    </div>

    {/* -------------------------
        Repayment Schedule (Right)
    ------------------------- */}
    <div
      className="schedule-card"
      style={{
        flex: 1,
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        overflowY: "auto", // make it scrollable
      }}
    >
      <h3>Repayment Schedule</h3>

      {schedule.length === 0 && <p>No schedule generated yet.</p>}

      {schedule.map((item) => (
        <div className="schedule-item" key={item.installmentNumber}>
          <div className="schedule-index">{item.installmentNumber}</div>

          <div className="schedule-details">
            <span>
              <strong>Date:</strong> {item.date}
            </span>

            <span>
              <strong>Principal:</strong> KES {money(item.principal)}
            </span>

            <span>
              <strong>Interest:</strong> KES {money(item.interest)}
            </span>

            <span>
              <strong>Total:</strong> KES {money(item.total)}
            </span>

            <span>
              <strong>Remaining:</strong> KES {money(item.remainingBalance)}
            </span>

            {!item.paid && !isCompleted && (
              <button
                style={{ marginTop: "6px" }}
                onClick={() => markAsPaid(item.installmentNumber)}
              >
                Mark as Paid
              </button>
            )}

            {item.paid && (
              <span style={{ color: "#10b981", fontWeight: "bold" }}>Paid</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

};

export default CreditCard;
