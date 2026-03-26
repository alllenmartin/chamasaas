import { useEffect, useState } from "react";
import "./LoanCalculator.css";

const LoanCalculator = ({ loan, calcMethod }) => {
  const [schedule, setSchedule] = useState([]);
  const [emi, setEmi] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(value);
  };

  const generateSchedule = async () => {
    if (!loan) return;

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/generate-schedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            principal: Number(loan.amountRequested),
            annual_rate: Number(loan.interestRate),
            months: Number(loan.installments),
            start_date: new Date().toISOString().slice(0, 10),
            method: calcMethod === "Amortized" ? "amortized" : "straight",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate schedule");

      const data = await response.json();
      setSchedule(data.schedule);
      setEmi(data.emi);
    } catch (error) {
      console.error("Error generating schedule:", error);
      setSchedule([]);
      setEmi(null);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate schedule whenever loan or interest method changes
  useEffect(() => {
    generateSchedule();
  }, [loan, calcMethod]);

  return (
    <div className="loan-container">
      <h2>Repayment Schedule</h2>

      {emi && (
        <h3>
          Monthly EMI: <span>{formatCurrency(emi)}</span>
        </h3>
      )}

      {loading && <p>Generating schedule...</p>}

      {!loading && schedule.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Opening Balance</th>
                <th>Interest</th>
                <th>Principal</th>
                <th>EMI</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{row.payment_date}</td>
                  <td>{formatCurrency(row.opening_balance)}</td>
                  <td>{formatCurrency(row.interest)}</td>
                  <td>{formatCurrency(row.principal_paid)}</td>
                  <td>{formatCurrency(row.emi)}</td>
                  <td>{formatCurrency(row.closing_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && schedule.length === 0 && <p>No schedule available.</p>}
    </div>
  );
};

export default LoanCalculator;