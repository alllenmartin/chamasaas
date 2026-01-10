import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler, // for area under line
  Title, // optional if you use chart titles
} from "chart.js";
import { Pie, Bar, Doughnut, Line } from "react-chartjs-2";
// import { LineElement, PointElement, Filler } from "chart.js";

ChartJS.register(
  ArcElement, // Pie/Doughnut
  Tooltip,
  Legend,
  CategoryScale, // X-axis for Bar/Line
  LinearScale, // Y-axis for Bar/Line
  BarElement, // Bar chart
  LineElement, // Line chart
  PointElement, // Points on line
  Filler, // Fill under line
  Title // optional, only if using chart titles
);

const Dashboard = () => {
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [contributionsbymonth, setContributionsByMonth] = useState([]);
  const [credits, setCredits] = useState([]);
  const [repaymentschedule, setRepaymentSchedule] = useState([]);
  const [settings, setSettings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAllMembers, setShowAllMembers] = useState(false);

  const contributionAmount = Number(settings.contributionAmount || 0);
  const cutOffDay = Number(settings.cutOffDay || 14);
  const cutOffDate = cutOffDay
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), cutOffDay)
    : null;

  const previewCount = 5; // show first 5 members by default
  const displayMembers = showAllMembers
    ? members
    : members.slice(0, previewCount);

  // Fetch repayment schedule
  useEffect(() => {
    const fetchRepaymentSchedule = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/repayments");

        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setRepaymentSchedule(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRepaymentSchedule();
  }, []);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/settings");
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  // Fetch Contributions
  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/contributions");
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setContributions(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContributions();
  }, []);

  // Fetch Members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/members");
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMembers();
  }, []);

  // Fetch Credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/credit");
        if (!res.ok) throw new Error("Failed to fetch credit");
        const data = await res.json();
        setCredits(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCredits();
  }, []);

  // Change Month
  const changeMonth = (dir) => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() + dir);
    setCurrentDate(d);
  };

  const monthYear = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Filter contribution by month
  const fetchContributionsByMonth = async (date) => {
    try {
      // Format the month like "YYYY-MM"
      const monthStr = date.toISOString().slice(0, 7); // "2026-01"

      const res = await fetch(
        `http://127.0.0.1:5000/api/contributionsbymonth?month=${monthStr}`
      );
      if (!res.ok) throw new Error("Failed to fetch contributions");

      const data = await res.json();
      setContributionsByMonth(data); // update state
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentDate) {
      fetchContributionsByMonth(currentDate);
    }
  }, [currentDate]); // run this effect every time month changes

  // Membership Stats
  const totalMembers = members.length;
  const membersPaidCount = members.filter(
    (m) => m.status?.toLowerCase() === "paid"
  ).length;

  const unregisteredCount = members.filter((m) => !m.registrationPaid).length;
  const eligibleMembers = members.filter(
    (m) => m.registrationPaid && m.amountPaid >= contributionAmount
  ).length;
  const paidPercent =
    totalMembers > 0 ? Math.round((membersPaidCount / totalMembers) * 100) : 0;

  const totalCollected = contributions.reduce(
    (sum, m) => sum + (m.amount || 0),
    0
  );
  const totalCollectedByMonth = contributionsbymonth.reduce(
    (sum, m) => sum + (m.amount || 0),
    0
  );

  const totalGoal = contributionAmount * totalMembers;

  const outstandingContributions = Math.max(
    0,
    totalGoal - totalCollectedByMonth
  );

  const progressPercent =
    totalGoal > 0 ? (totalCollectedByMonth / totalGoal) * 100 : 0;

  // Loans
  const validLoanStatuses = ["Active", "Completed", "Defaulted"];
  const totalLoansIssued = credits
    .filter((l) => validLoanStatuses.includes(l.status))
    .reduce((sum, l) => sum + (l.amountRequested || 0), 0);
  const outstandingLoans = credits
    .filter((l) => ["Active", "Defaulted"].includes(l.status))
    .reduce((sum, l) => sum + (l.amountRequested || 0), 0);
  // const interestEarned = credits
  //   .filter((l) => l.status === "Completed")
  //   .reduce(
  //     (sum, l) =>
  //       sum + ((l.amountRequested || 0) * (l.interestRate || 0)) / 100,
  //     0
  //   );

  const interestEarned = repaymentschedule.reduce(
    (sum, m) => sum + (m.interest_paid || 0),
    0
  );

  const projectedInterest = repaymentschedule.reduce(
    (sum, m) => sum + (m.interest || 0),
    0
  );

  const atRiskLoans = credits.filter((l) => l.status === "Defaulted").length;

  // Charts
  // const memberStatusChart = {
  //   labels: ["Paid", "Unpaid"],
  //   datasets: [{ data: [membersPaidCount, totalMembers - membersPaidCount], backgroundColor: ["#27ae60", "#e74c3c"] }]
  // };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  const loanStatusChart = {
    labels: ["Active", "Completed", "Defaulted"],
    datasets: [
      {
        data: [
          credits.filter((l) => l.status === "Active").length,
          credits.filter((l) => l.status === "Completed").length,
          credits.filter((l) => l.status === "Defaulted").length,
        ],
        backgroundColor: ["#2575fc", "#27ae60", "#e74c3c"],
        borderWidth: 1,
        borderColor: "#fff",
        offset: [10, 10, 10], // <-- Exploded slices: adjust this to control gap
      },
    ],
  };

  const monthlyTrendData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Contributions (KES)",
        data: [
          totalCollected * 0.25,
          totalCollected * 0.3,
          totalCollected * 0.2,
          totalCollected * 0.25,
        ],
        backgroundColor: "#2575fc",
      },
    ],
  };

  // const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  // Alerts
  const defaultedLoansAlert = credits.filter((l) => l.status === "Defaulted");
  const unpaidAfterCutoff = members.filter(
    (m) =>
      m.status?.toLowerCase() !== "paid" &&
      cutOffDate &&
      currentDate > cutOffDate
  );

  // weekly data
  const getWeeklyContributions = (contribs) => {
    const weeks = [0, 0, 0, 0];

    contribs.forEach((c) => {
      const [dayStr] = c.date.split("/"); // "dd/mm/yyyy"
      const day = parseInt(dayStr, 10);

      if (day <= 7) weeks[0] += c.amount;
      else if (day <= 14) weeks[1] += c.amount;
      else if (day <= 21) weeks[2] += c.amount;
      else weeks[3] += c.amount;
    });

    return weeks;
  };
  const weeklyData = getWeeklyContributions(contributionsbymonth);

  return (
    <div className="dashboard">
      <Sidebar active="Dashboard" />
      <main className="main-content">
        {/* Header */}
        <div className="header-top">
          {console.log(
            "Rendering header with date:",
            currentDate,
            "Cutoff:",
            cutOffDate
          )}
          <button className="month-btn" onClick={() => changeMonth(-1)}>
            ‹
          </button>
          <div className="header-title">
            <h1>{monthYear} Overview</h1>
            {cutOffDate && (
              <p className="cutoff">
                Cut-off Date: {cutOffDate.toDateString()}
              </p>
            )}
          </div>
          <button className="month-btn" onClick={() => changeMonth(1)}>
            ›
          </button>
        </div>

        {/* Membership Section */}
        <section className="dashboard-section">
          <h3>Membership</h3>
          <div className="summary-cards">
            <div className="card">
              <div className="card-content">
                <span className="card-icon">👥</span>
                <div>
                  <p className="card-label">Total Members</p>
                  <p className="card-value">{totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="card success">
              <div className="card-content">
                <span className="card-icon">💰</span>
                <div>
                  <p className="card-label">Members Paid</p>
                  <p className="card-value">{membersPaidCount}</p>
                </div>
              </div>
            </div>

            <div className="card danger">
              <div className="card-content">
                <span className="card-icon">❌</span>
                <div>
                  <p className="card-label">Unregistered</p>
                  <p className="card-value">{unregisteredCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="card pie-chart-small">
            <p>Paid vs Unpaid</p>
            <Pie
              data={memberStatusChart}
              options={{
                ...pieOptions,
                maintainAspectRatio: false,
                responsive: false, // disable responsiveness for fixed size
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: false },
                },
                rotation: -90,
                circumference: 180,
              }}
              plugins={[centerTextPlugin]}
            />
          </div> */}
        </section>
        <div className="members-preview">
          <h4>Members Preview</h4>
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Member ID</th>
                <th>phone</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Amount Paid (KES)</th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((m) => (
                <tr key={m.id} className={m.status?.toLowerCase()}>
                  <td>{m.name}</td>
                  <td>{m.id}</td>
                  <td>{m.phone}</td>
                  <td>{m.registrationPaid ? "True" : "False"}</td>
                  <td>{m.status || "Unpaid"}</td>
                  <td style={{ textAlign: "center" }}>
                    {(m.amountPaid || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.length > previewCount && (
            <button
              className="show-more-btn"
              onClick={() => setShowAllMembers(!showAllMembers)}
            >
              {showAllMembers
                ? "Show Less"
                : `Show More (${members.length - previewCount})`}
            </button>
          )}
        </div>

        <section className="dashboard-section">
          <h3>Contributions</h3>

          {/* Doughnut cards */}
          <div className="summary-cards contributions-cards">
            {/* Total Collected */}
            <div className="card">
              <p>Total Collected</p>
              <div className="card-chart">
                <Doughnut
                  data={{
                    labels: ["Collected", "Remaining"],
                    datasets: [
                      {
                        data: [totalCollected, outstandingContributions],
                        backgroundColor: ["#27ae60", "#f0f0f0"],
                        borderWidth: 1,
                        borderColor: "#fff",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: { legend: { display: false } },
                  }}
                />
                {/* <div className="center-text">
                  {totalGoal > 0
                    ? Math.round((totalCollected / totalGoal) * 100)
                    : 0}
                  %
                </div> */}
              </div>
              <p>KES {totalCollected.toLocaleString()}</p>
            </div>

            {/* Collected This Month */}
            <div className="card">
              <p>Total Collected this month</p>
              <div className="card-chart">
                <Doughnut
                  data={{
                    labels: ["Collected", "Remaining"],
                    datasets: [
                      {
                        data: [totalCollectedByMonth, totalGoal],
                        backgroundColor: ["#27ae60", "#f0f0f0"],
                        borderWidth: 1,
                        borderColor: "#fff",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: { legend: { display: false } },
                  }}
                />
                <div className="center-text">
                  {totalGoal > 0
                    ? Math.round((totalCollectedByMonth / totalGoal) * 100)
                    : 0}
                  %
                </div>
              </div>
              <p>KES {totalCollectedByMonth.toLocaleString()}</p>
            </div>

            {/* Outstanding */}
            <div className="card warning">
              <p>Outstanding</p>
              <div className="card-chart">
                <Doughnut
                  data={{
                    labels: ["Outstanding", "Collected"],
                    datasets: [
                      {
                        data: [outstandingContributions, totalCollectedByMonth],
                        backgroundColor: ["#e74c3c", "#f0f0f0"],
                        borderWidth: 1,
                        borderColor: "#fff",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: { legend: { display: false } },
                  }}
                />
                <div className="center-text">
                  {totalGoal > 0
                    ? Math.round((outstandingContributions / totalGoal) * 100)
                    : 0}
                  %
                </div>
              </div>
              <p>KES {outstandingContributions.toLocaleString()}</p>
            </div>

            {/* Progress */}
            <div className="card success">
              <p>Progress</p>
              <div className="card-chart">
                <Doughnut
                  data={{
                    labels: ["Progress", "Remaining"],
                    datasets: [
                      {
                        data: [totalCollected, outstandingContributions],
                        backgroundColor: ["#2575fc", "#f0f0f0"],
                        borderWidth: 1,
                        borderColor: "#fff",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: { legend: { display: false } },
                  }}
                />
                <div className="center-text">
                  {Math.round(progressPercent)}%
                </div>
              </div>
              <p>{Math.round(progressPercent)}%</p>
            </div>
          </div>

          {/* Line chart for contributions trend */}
          <div className="chart-card wide">
            <Line
              data={{
                labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                datasets: [
                  {
                    label: "Contributions (KES)",
                    data: weeklyData,
                    borderColor: "#2575fc",
                    backgroundColor: "rgba(37, 117, 252, 0.2)",
                    tension: 0.3, // smooth line
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </section>

        <section className="dashboard-section">
          <h3>Credit / Loans</h3>
          <div className="summary-cards">
            {/* Total Loans Issued */}
            <div className="card">
              <p>Total Loans Issued</p>
              <p>KES {totalLoansIssued.toLocaleString()}</p>
              <div className="mini-chart">
                <Pie
                  data={{
                    labels: ["Issued", "Remaining"],
                    datasets: [
                      {
                        data: [totalLoansIssued, 0], // single slice for visual effect
                        backgroundColor: ["#2575fc", "#f0f0f0"],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%", // doughnut effect
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Outstanding Loans */}
            <div className="card warning">
              <p>Outstanding Loans</p>
              <p>KES {outstandingLoans.toLocaleString()}</p>
              <div className="mini-chart">
                <Pie
                  data={{
                    labels: ["Outstanding", "Paid"],
                    datasets: [
                      {
                        data: [
                          outstandingLoans,
                          totalLoansIssued - outstandingLoans,
                        ],
                        backgroundColor: ["#f39c12", "#f0f0f0"],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    cutout: "70%",
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Interest Earned */}
            <div className="card success">
              <p>Interest Received</p>
              <p>KES {interestEarned.toLocaleString()}</p>

              <div className="mini-chart">
                <Doughnut
                  data={{
                    labels: ["Interest Received", "Remaining Interest"],
                    datasets: [
                      {
                        data: [
                          interestEarned,
                          Math.max(projectedInterest - interestEarned, 0),
                        ],
                        backgroundColor: ["#27ae60", "#f0f0f0"],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    cutout: "70%", // this makes it a doughnut
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `KES ${ctx.raw.toLocaleString()}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* At-Risk Loans */}
            <div className="card danger">
              <p>At-Risk Loans</p>
              <p>{atRiskLoans}</p>
              <div className="mini-chart">
                <Pie
                  data={{
                    labels: ["At-Risk", "Safe"],
                    datasets: [
                      {
                        data: [atRiskLoans, totalLoansIssued - atRiskLoans],
                        backgroundColor: ["#e74c3c", "#f0f0f0"],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    cutout: "70%",
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Credit Eligibility */}
        <section className="dashboard-section">
          <h3>Credit Eligibility</h3>
          <div className="summary-cards">
            <div className="card success">
              <div className="card-content">
                <span className="card-icon">✅</span>
                <div>
                  <p className="card-label">Eligible Members</p>
                  <p className="card-value">{eligibleMembers}</p>
                </div>
              </div>
            </div>

            <div className="card danger">
              <div className="card-content">
                <span className="card-icon">❌</span>
                <div>
                  <p className="card-label">Not Eligible</p>
                  <p className="card-value">{totalMembers - eligibleMembers}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="dashboard-section alerts">
          <h3>Alerts</h3>
          {defaultedLoansAlert.length > 0 && (
            <p className="alert danger">
              ⚠ {defaultedLoansAlert.length} defaulted loan(s)
            </p>
          )}
          {unpaidAfterCutoff.length > 0 && (
            <p className="alert warning">
              ⚠ {unpaidAfterCutoff.length} unpaid after cut-off
            </p>
          )}
          {defaultedLoansAlert.length === 0 &&
            unpaidAfterCutoff.length === 0 && (
              <p className="alert success">✅ No critical alerts</p>
            )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
