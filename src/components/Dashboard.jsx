import React, { useState } from "react";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";

// Add registrationPaidAmount to track registration
const members = [
  { name: "Jane Doe", role: "Member", amountPaid: 5000, registrationPaidAmount: 1000, status: "Paid" },
  { name: "John Smith", role: "Treasurer", amountPaid: 0, registrationPaidAmount: 0, status: "Unpaid" },
  { name: "Alice Mwangi", role: "Member", amountPaid: 5000, registrationPaidAmount: 1000, status: "Paid" },
  { name: "Peter Otieno", role: "Member", amountPaid: 0, registrationPaidAmount: 0, status: "Unpaid" },
];

// Load registration fee from settings
const settings = JSON.parse(localStorage.getItem("chamaSettings")) || {};
const registrationFee = Number(settings.registrationFee || 0);

const totalCollected = members.reduce((sum, m) => sum + m.amountPaid, 0);

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const savedSettings = settings;

  const cutOffDay = Number(savedSettings.cutOffDay || 14);
  const cutOffDate = cutOffDay
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), cutOffDay)
    : null;

  const contributionAmount = Number(savedSettings.contributionAmount || 0);
  const totalGoal = contributionAmount * members.length;
  const progressPercent = totalGoal > 0 ? (totalCollected / totalGoal) * 100 : 0;

  const membersPaidCount = members.filter((m) => m.status === "Paid").length;

  const sanitizeStatus = (status) => status.toLowerCase();

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthYear = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Count unregistered members
  const unregisteredCount = members.filter(
    (m) => (m.registrationPaidAmount || 0) < registrationFee
  ).length;

  return (
    <div className="dashboard">
      <Sidebar active="Dashboard" />

      <main className="main-content">
        <header className="header">
          {/* Month Navigation */}
          <div className="header-title">
            <button
              className="month-btn"
              onClick={() => changeMonth(-1)}
              aria-label="Previous Month"
            >
              ‹
            </button>

            <div>
              <h1>{monthYear} Contributions</h1>

              {cutOffDate && (
                <p className="cutoff">
                  Cut-off Date: {cutOffDate.toDateString()}
                </p>
              )}
            </div>

            <button
              className="month-btn"
              onClick={() => changeMonth(1)}
              aria-label="Next Month"
            >
              ›
            </button>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            {/* ✅ Unregistered Members card */}
            <div className="card outstanding">
              <p>Unregistered Members</p>
              <p>
                {unregisteredCount} / {members.length}
              </p>
            </div>

            <div className="card total-collected">
              <p>Total Collected</p>
              <p>KES {totalCollected.toLocaleString()}</p>
            </div>

            <div className="card members-paid">
              <p>Members Paid</p>
              <p>
                {membersPaidCount} / {members.length}
              </p>
            </div>

            <div className="card outstanding">
              <p>Outstanding</p>
              <p>KES {(totalGoal - totalCollected).toLocaleString()}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            <span className="progress-text">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </header>

        {/* Members Table */}
        <section className="member-section">
          <h2>Members</h2>

          <div className="member-table">
            <div className="table-header">
              <span>Name</span>
              <span>Role</span>
              <span>Amount Paid</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {members.map((member) => {
              const isUnregistered = (member.registrationPaidAmount || 0) < registrationFee;
              return (
                <div className="table-row" key={member.name}>
                  <span>
                    {member.name}{" "}
                    {isUnregistered && (
                      <span style={{ color: "#e74c3c", fontWeight: "bold", marginLeft: "6px" }}>
                        ⚠ Registration Pending
                      </span>
                    )}
                  </span>
                  <span>{member.role}</span>
                  <span>KES {member.amountPaid.toLocaleString()}</span>
                  <span className={`status ${sanitizeStatus(member.status)}`}>
                    {member.status}
                  </span>
                  <button className="view-btn">View/Edit</button>
                </div>
              );
            })}
          </div>

          {/* View All Members button */}
          <div style={{ marginTop: "12px" }}>
            <button
              className="view-all-btn"
              onClick={() => (window.location.href = "/members")}
            >
              View All Members
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
