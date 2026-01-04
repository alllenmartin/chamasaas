import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // for navigation
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./MemberCredit.css";

const settings = JSON.parse(localStorage.getItem("chamaSettings")) || {};

const CREDIT_MULTIPLIER = Number(settings.creditMultiplier || 0.95); // 95%
const INTEREST_RATE = Number(settings.interestRate || 10); // %
const registrationFee = Number(settings.registrationFee || 0);
const MIN_CREDIT_AMOUNT = 1000; // Minimum credit amount to qualify

const completionDateFromInstallments = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() + Number(months));
  return date.toDateString();
};

// Mock data
const membersData = [
  {
    id: "12345678",
    name: "Jane Doe",
    registrationPaidAmount: 0,
    totalContribution: 10,
  },
  {
    id: "87654321",
    name: "John Smith",
    registrationPaidAmount: 200,
    totalContribution: 5000,
  },
  {
    id: "99887766",
    name: "Alice Mwangi",
    registrationPaidAmount: 1000,
    totalContribution: 15000,
  },
];

const MemberCredit = () => {
  const [members] = useState(membersData);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [amountRequested, setAmountRequested] = useState("");
  const [installments, setInstallments] = useState("");

  const navigate = useNavigate(); // navigation hook

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Check registration
  const isRegistered = selectedMember?.registrationPaidAmount >= registrationFee;
  const qualifiedAmount = selectedMember
    ? selectedMember.totalContribution * CREDIT_MULTIPLIER
    : 0;

  // New: Member must be registered AND qualified amount must meet minimum
  const isQualified = isRegistered && qualifiedAmount >= MIN_CREDIT_AMOUNT;

  return (
    <div className="dashboard">
      <Sidebar active="Credit" />

      <main className="main-content">
        <h1>Credit</h1>

        {/* Flex container for button and member selector */}
        <div className="member-selector-container">
          <button
            className="view-btn"
            onClick={() => navigate("/credit-list")}
          >
            Go to Credit List
          </button>

          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {selectedMember && (
          <div className="credit-summary">
            <h3>Member Credit Details</h3>

            <div className="credit-row">
              <span>Member</span>
              <span>{selectedMember.name}</span>
            </div>

            <div className="credit-row">
              <span>Total Contributions</span>
              <span>KES {selectedMember.totalContribution.toLocaleString()}</span>
            </div>

            <div className="credit-row">
              <span>Multiplier</span>
              <span>{CREDIT_MULTIPLIER * 100}%</span>
            </div>

            <div className="credit-highlight">
              Qualified Amount: KES {qualifiedAmount.toLocaleString()}
            </div>

            <div className="credit-row">
              <span>Interest Rate</span>
              <span>{INTEREST_RATE}%</span>
            </div>

            {/* Warning if not qualified */}
            {!isQualified && (
              <div className="credit-warning">
                ⚠ Member does not qualify for credit.
              </div>
            )}

            {/* Show request button only if qualified */}
            {isQualified && (
              <div className="credit-action">
                <button className="view-btn" onClick={() => setShowModal(true)}>
                  Request Credit
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Credit Request Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Request Credit</h3>

            <p>
              <strong>Max Allowed:</strong> KES {qualifiedAmount.toLocaleString()}
            </p>

            <input
              type="number"
              placeholder="Amount Requested"
              value={amountRequested}
              onChange={(e) => setAmountRequested(e.target.value)}
            />

            {Number(amountRequested) > qualifiedAmount && (
              <p style={{ color: "#e74c3c" }}>Amount exceeds qualified limit</p>
            )}

            <input
              type="number"
              placeholder="Repayment Period (months)"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              style={{ marginTop: "8px" }}
            />

            {installments && (
              <p style={{ marginTop: "8px" }}>
                <strong>Expected Completion:</strong>{" "}
                {completionDateFromInstallments(installments)}
              </p>
            )}

            <p>
              <strong>Interest Rate:</strong> {INTEREST_RATE}%
            </p>

            <div className="modal-actions">
              <button
                className="view-btn"
                onClick={() => {
                  setShowModal(false);
                  setInstallments("");
                  setAmountRequested("");
                }}
              >
                Cancel
              </button>

              <button
                className="view-btn"
                disabled={
                  !amountRequested ||
                  !installments ||
                  Number(amountRequested) > qualifiedAmount
                }
                onClick={() => {
                  alert(
                    `Credit request submitted:
Amount: KES ${Number(amountRequested).toLocaleString()}
Installments: ${installments} months
Expected Completion: ${completionDateFromInstallments(installments)}`
                  );

                  setAmountRequested("");
                  setInstallments("");
                  setShowModal(false);
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberCredit;
