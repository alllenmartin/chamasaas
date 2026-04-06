import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./Contribution.css";
import "./LoanRepayments.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoanRepayments = () => {
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [loans, setLoans] = useState([]);
    const [selectedLoanId, setSelectedLoanId] = useState("");
    const [amount, setAmount] = useState("");
    const [repayments, setRepayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch members and optionally loans
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const membersRes = await fetch("http://127.0.0.1:5000/api/members");
                const membersData = await membersRes.json();
                setMembers(membersData);
                console.log(selectedMemberId)

                // Fetch loans if a member is selected
                if (selectedMemberId) {
                    const loansRes = await fetch(
                        `http://127.0.0.1:5000/api/loans/active?member_id=${selectedMemberId}`
                    );
                    const loansData = await loansRes.json();
                    setLoans(loansData);
                } else {
                    setLoans([]);
                }

                // Fetch repayments for selected member
                if (selectedMemberId) {
                    const repRes = await fetch(
                        `http://127.0.0.1:5000/api/repayments?member_id=${selectedMemberId}`
                    );
                    const repData = await repRes.json();
                    setRepayments(repData);
                } else {
                    setRepayments([]);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch data from server");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedMemberId]);

    const selectedMember = members.find((m) => m.memberId === selectedMemberId);
    const selectedLoan = loans.find((l) => l.loanId === selectedLoanId);

    // Handle adding repayment
    const handleAddRepayment = async () => {
        if (!selectedMemberId || !selectedLoanId || !amount) {
            toast.error("Fill all fields");
            return;
        }

        const repaymentPayload = {
            memberId: selectedMemberId,
            loanId: selectedLoanId,
            amount: Number(amount),
            date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        };

        try {
            const res = await fetch("http://127.0.0.1:5000/api/loan_journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(repaymentPayload),
            });

            if (!res.ok) throw new Error("Failed to add repayment");

            const savedRepayment = await res.json();
            setRepayments([...repayments, savedRepayment]);
            setAmount("");
            toast.success("Repayment recorded successfully");
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        }
    };

    if (loading) return <p>Loading data...</p>;

    return (
        <div className="dashboard">
            <Sidebar active="Loan Repayments" />
            <main className="main-content">
                <h1>Loan Repayments</h1>

                {/* Select Member */}
                <div style={{ marginBottom: "12px" }}>
                    <select
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                    >
                        <option value="">Select Member</option>
                        {members.map((m) => (
                            <option key={m.memberId} value={m.memberId}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Select Loan */}
                {selectedMember && loans.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                        <select
                            value={selectedLoanId}
                            onChange={(e) => setSelectedLoanId(e.target.value)}
                        >
                            <option value="">Select Loan</option>
                            {loans.map((l) => (
                                <option key={l.loanId} value={l.loanId}>
                                    {l.loanId} - Outstanding: KES {l.totalOutstanding.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Enter Repayment */}
                {selectedLoan && (
                    <div style={{ marginBottom: "16px" }}>
                        <input
                            type="number"
                            placeholder="Repayment Amount"
                            value={amount}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                // prevent overpayment
                                if (val > selectedLoan.totalOutstanding) {
                                    toast.error(
                                        `Maximum allowed is KES ${selectedLoan.totalOutstanding.toLocaleString()}`
                                    );
                                    setAmount(selectedLoan.totalOutstanding);
                                } else {
                                    setAmount(val);
                                }
                            }}
                            style={{ marginRight: "6px" }}
                        />
                        <button
                            className="view-btn"
                            onClick={handleAddRepayment}
                            disabled={amount <= 0 || amount > selectedLoan.totalOutstanding}
                        >
                            Add Repayment
                        </button>
                    </div>
                )}


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

export default LoanRepayments;