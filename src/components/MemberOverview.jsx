import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./MemberOverview.css";

const MemberOverview = () => {
  const { memberId } = useParams();

  const [member, setMember] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH ALL DATA ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [memberRes, contribRes, loanRes] = await Promise.all([
          fetch(`http://127.0.0.1:5000/api/members/${memberId}`),
          fetch(`http://127.0.0.1:5000/api/contributions/${memberId}`),
          fetch(`http://127.0.0.1:5000/api/members/${memberId}/loans`)
      
        ]);

        const memberData = await memberRes.json();
        const contribData = await contribRes.json();
        const loanData = await loanRes.json();

        setMember(memberData);
        setContributions(contribData);
        setLoans(loanData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [memberId]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <Sidebar active="Members" />

      <main className="main-content">
        <h1>Member Overview</h1>

        {/* ================= MEMBER SUMMARY ================= */}
        <div className="card">
          <h3>{member.name}</h3>
          <p><b>National ID:</b> {member.nationalId}</p>
          <p><b>Phone:</b> {member.phone}</p>
        </div>

        {/* ================= SAVINGS HISTORY ================= */}
        <div className="card">
          <h3>Savings History</h3>

          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {contributions.map((c) => (
                <tr key={c.id}>
                  <td>{c.savingsProduct}</td>
                  <td>{c.month}</td>
                  <td>{c.amount}</td>
                  <td>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= LOANS ================= */}
        <div className="card">
          <h3>Loan History</h3>

          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Interest</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((l) => (
                <tr key={l.loanId}>
                  <td>{l.loanId}</td>
                  <td>{l.amountRequested}</td>
                  <td>{l.status}</td>
                  <td>{l.interestRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
};

export default MemberOverview;