import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./MemberCredit.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";
import LoanCalculator from "../components/LoanCalculator";

const settings = JSON.parse(localStorage.getItem("chamaSettings")) || {};

// const CREDIT_MULTIPLIER = Number(settings.creditMultiplier || 0.95);
const INTEREST_RATE = Number(settings.interestRate || 10);
const registrationFee = Number(settings.registrationFee || 0);
const MIN_CREDIT_AMOUNT = 1000;
const insuranceFee = Number(settings.insuranceFee || 2);

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
  const [settings, setSettings] = useState({});
  const [memberLoans, setMemberLoans] = useState([]);
  const [availableCredit, setAvailableCredit] = useState(0);
  const CREDIT_MULTIPLIER = Number(settings.creditMultiplier / 100 || 0);
  const maxInstallments = Number(settings.installments || 0);
  const [guarantors, setGuarantors] = useState([]);
  const [collaterals, setCollaterals] = useState([]);
  const [showSecurity, setShowSecurity] = useState(false);
  const [guarantorInput, setGuarantorInput] = useState("");
  const [collateralInput, setCollateralInput] = useState("");
  const navigate = useNavigate();

  const [newGuarantor, setNewGuarantor] = useState({
    name: "",
    memberNumber: "",
    memberGuaranteed: "",
    amountGuaranteed: "",
    totalShares: "",
    committedAmount: "",
  });

  // Security
  const addGuarantor = () => {
    // Ensure all required fields are filled
    const {
      name,
      memberNumber,
      memberGuaranteed,
      amountGuaranteed,
      totalShares,
      committedAmount,
    } = newGuarantor;
    if (!name || !memberNumber || !memberGuaranteed || !amountGuaranteed)
      return;

    setGuarantors([...guarantors, newGuarantor]);
    setNewGuarantor({
      name: "",
      memberNumber: "",
      memberGuaranteed: "",
      amountGuaranteed: "",
      totalShares: "",
      committedAmount: "",
    });
  };

  const removeGuarantor = (index) => {
    setGuarantors(guarantors.filter((_, i) => i !== index));
  };

  const addCollateral = () => {
    if (!collateralInput.trim()) return;
    setCollaterals([...collaterals, collateralInput.trim()]);
    setCollateralInput("");
  };

  const removeCollateral = (index) => {
    setCollaterals(collaterals.filter((_, i) => i !== index));
  };

  // ----------------- Fetch Settings -----------------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setSettings(data);
        console.log("Settings loaded:", data);
      } catch (err) {
        console.error(err);
        toast.error("Error fetching settings");
      }
    };

    fetchSettings();
  }, []);

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

    console.log(isRegistered)

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
          (loan) => loan.status.toLowerCase() === "active",
        );
        const totalActiveLoans = activeLoans.reduce(
          (sum, loan) => sum + Number(loan.amountRequested),
          0,
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
    (loan) => loan.status.toLowerCase() === "defaulted",
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
      insuranceFee: insuranceFee,
    };

    const res = await fetch("http://127.0.0.1:5000/api/credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Request failed");

    // Backend returns the created loan
    const newLoan = await res.json();

    toast.success("Credit request submitted successfully");

    // Reset modal state
    setAmountRequested("");
    setInstallments("");
    setShowModal(false);

    // Redirect to Loan Detail page immediately
    if (newLoan?.loanId) {
      navigate(`/credit/${newLoan.loanId}`);
    } else {
      console.warn("Loan ID not returned. Cannot redirect to loan details.");
    }

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
            // onChange={(e) => setSelectedMemberId(Number(e.target.value))}-
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
                  .filter(
                    (loan) =>
                      loan.status === "Active" || loan.status === "Defaulted",
                  )
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
  

   <button
  className="view-btn"
  onClick={() => setShowModal(true)}
  disabled={availableCredit <= 0}
>
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

            {Number(installments) > maxInstallments && (
              <p style={{ color: "#e74c3c" }}>
                Installments exceed the maximum allowed
              </p>
            )}

            {installments && (
              <p style={{ marginTop: "8px" }}>
                <strong>Expected Completion:</strong>{" "}
                {completionDateFromInstallments(installments)}
              </p>
            )}

          

            <div className="modal-actions" style={{ marginTop: "16px" }}>
              <button
                className="view-btn"
                disabled={isSubmitting}
                onClick={() => {
                  setShowModal(false);
                  setAmountRequested("");
                  setInstallments("");
                  setShowSecurity(false);
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
