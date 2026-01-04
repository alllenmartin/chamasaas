import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./MemberCredit.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";

const settings = JSON.parse(localStorage.getItem("chamaSettings")) || {};

const CREDIT_MULTIPLIER = Number(settings.creditMultiplier || 0.95);
const INTEREST_RATE = Number(settings.interestRate || 10);
const registrationFee = Number(settings.registrationFee || 0);
const MIN_CREDIT_AMOUNT = 1000;

const completionDateFromInstallments = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() + Number(months));
  return date.toDateString();
};

const MemberCredit = () => {
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [amountRequested, setAmountRequested] = useState("");
  const [installments, setInstallments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [memberLoans, setMemberLoans] = useState([]);
  const [availableCredit, setAvailableCredit] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/credit/members")
      .then((res) => res.json())
      .then((data) => setMembers(data))
      .catch((err) => console.error(err));
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const isRegistered =
    selectedMember?.registrationPaidAmount >= registrationFee;

  const qualifiedAmount = selectedMember
    ? selectedMember.totalContribution * CREDIT_MULTIPLIER
    : 0;

  // Automatically fetch member loans when member changes
  useEffect(() => {
    if (!selectedMemberId) return;

    const fetchMemberLoans = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/credit");
        const data = await res.json();

        // All loans of the member
        const loans = data.filter((loan) => loan.memberId === selectedMemberId);
        setMemberLoans(loans);

        // Active loans sum
        const activeLoans = loans.filter(
          (loan) => loan.status.toLowerCase() === "active"
        );
        const totalActiveLoans = activeLoans.reduce(
          (sum, loan) => sum + Number(loan.amountRequested),
          0
        );

        // Available credit = qualified - active loans
        setAvailableCredit(qualifiedAmount - totalActiveLoans);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMemberLoans();
  }, [selectedMemberId, selectedMember, qualifiedAmount]);

  // Check qualification
  const hasDefaultedLoan = memberLoans.some(
    (loan) => loan.status.toLowerCase() === "defaulted"
  );

  const isQualified =
    isRegistered && qualifiedAmount >= MIN_CREDIT_AMOUNT && !hasDefaultedLoan;

  const handleSubmitCredit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        memberId: selectedMember.id,
        amountRequested: Number(amountRequested),
        installments: Number(installments),
        interestRate: INTEREST_RATE,
      };

      const res = await fetch("http://127.0.0.1:5000/api/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Request failed");

      toast.success("Credit request submitted successfully");

      setAmountRequested("");
      setInstallments("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit credit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Credit" />

      <main className="main-content">
        <h1>Credit</h1>

        <div className="member-selector-container">
          <button className="view-btn" onClick={() => navigate("/credit-list")}>
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
              <span>
                KES {selectedMember.totalContribution.toLocaleString()}
              </span>
            </div>

            <div className="credit-row">
              <span>Existing Loans</span>
              <span>
                KES{" "}
                {memberLoans
                  .reduce((sum, loan) => sum + Number(loan.amountRequested), 0)
                  .toLocaleString()}
              </span>
            </div>

            <div className="credit-row">
              <span>Multiplier</span>
              <span>{CREDIT_MULTIPLIER * 100}%</span>
            </div>

            <div className="credit-highlight">
              Qualified Amount: KES {qualifiedAmount.toLocaleString()}
            </div>
            <div className="credit-highlight">
              Available For Credit: KES {availableCredit.toLocaleString()}
            </div>

            <div className="credit-row">
              <span>Interest Rate</span>
              <span>{INTEREST_RATE}%</span>
            </div>

            {!isQualified && (
              <div className="credit-warning">
                ⚠ Member does not qualify for credit.
                {hasDefaultedLoan && " (Has defaulted loan)"}
              </div>
            )}

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

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Request Credit</h3>

            <p>
              <strong>Max Allowed:</strong> KES{" "}
              {availableCredit.toLocaleString()}
            </p>

            <input
              type="number"
              placeholder="Amount Requested"
              value={amountRequested}
              onChange={(e) => setAmountRequested(e.target.value)}
            />

            {Number(amountRequested) > availableCredit && (
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
            {/* Repayment schedule */}
            {/* {installments && amountRequested && (
              <div className="repayment-schedule">
                <h4>Repayment Schedule</h4>
                <ul>
                  {Array.from({ length: Number(installments) }, (_, i) => {
                    const monthlyAmount = (
                      Number(amountRequested) / Number(installments)
                    ).toFixed(2);
                    const monthDate = new Date();
                    monthDate.setMonth(monthDate.getMonth() + i + 1);
                    return (
                      <li key={i}>
                        Month {i + 1} ({monthDate.toDateString()}): KES{" "}
                        {monthlyAmount}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )} */}

            <div className="modal-actions">
              <button
                className="view-btn"
                disabled={isSubmitting}
                onClick={() => {
                  setShowModal(false);
                  setAmountRequested("");
                  setInstallments("");
                }}
              >
                Cancel
              </button>

              <button
                className="view-btn"
                disabled={
                  isSubmitting ||
                  !amountRequested ||
                  !installments ||
                  Number(amountRequested) > availableCredit
                }
                onClick={handleSubmitCredit}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default MemberCredit;
