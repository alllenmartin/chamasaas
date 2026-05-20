import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import "./Contribution.css";
import "./LoanRepayments.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReceiptJournal = () => {
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [loans, setLoans] = useState([]);
    const [selectedLoanId, setSelectedLoanId] = useState("");
    const [amount, setAmount] = useState("");
    const [repayments, setRepayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState(""); // LOAN or SAVINGS
    const [savingsProducts, setSavingsProducts] = useState([]);
    const [selectedSavingsProduct, setSelectedSavingsProduct] = useState("");
    const [transactionDate, setTransactionDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    // ================= INIT LOAD =================
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);

                const [membersRes, savingsRes] = await Promise.all([
                    fetch("http://127.0.0.1:5000/api/members"),
                    fetch("http://127.0.0.1:5000/api/savingsproductcategory"),
                ]);

                const membersData = await membersRes.json();
                const savingsData = await savingsRes.json();

                setMembers(membersData);
                setSavingsProducts(savingsData);

            } catch (err) {
                console.error(err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // ================= LOANS =================
    useEffect(() => {
        if (mode === "LOAN" && selectedMemberId) {
            fetch(`http://127.0.0.1:5000/api/loans/active?member_id=${selectedMemberId}`)
                .then(res => res.json())
                .then(data => setLoans(data))
                .catch(() => toast.error("Failed to fetch loans"));
        } else {
            setLoans([]);
            setSelectedLoanId("");
        }
    }, [mode, selectedMemberId]);

    const handleSubmit = async () => {
    if (!mode || !selectedMemberId || !amount) {
        toast.error("Fill required fields");
        return;
    }

    if (mode === "LOAN" && !selectedLoanId) {
        toast.error("Select loan");
        return;
    }

    if (mode === "SAVINGS" && !selectedSavingsProduct) {
        toast.error("Select savings type");
        return;
    }

    const payload = {
        mode,
        memberId: selectedMemberId,
        loanId: selectedLoanId,
        savingsProduct: selectedSavingsProduct,
        amount: Number(amount),
        date: transactionDate, // 👈 IMPORTANT: use state, not new Date()
    };

    // ================= ROUTE SELECTION =================
    const url =
        mode === "LOAN"
            ? "http://127.0.0.1:5000/api/loan_journal"
            : "http://127.0.0.1:5000/api/contributions";

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to post");
        }

        const data = await res.json();
        setRepayments([...repayments, data]);

        setAmount("");
        toast.success("Transaction saved");

    } catch (err) {
        toast.error(err.message);
    }
};

    if (loading) return <p>Loading data...</p>;

    return (
        <div className="dashboard">
            <Sidebar active="Receipt Journal" />

            <main className="main-content">
                <h1>Receipt</h1>
                <div style={{ marginBottom: "12px" }}>
                    <label>Transaction Date:</label>
                    <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                    />
                </div>

                {/* ================= MODE SELECT ================= */}
                <div style={{ marginBottom: "12px" }}>
                    <select
                        value={mode}
                        onChange={(e) => {
                            setMode(e.target.value);

                            setSelectedMemberId("");
                            setSelectedLoanId("");
                            setSelectedSavingsProduct("");
                            setLoans([]);
                            setAmount("");
                        }}
                    >
                        <option value="">Select Loan or Savings</option>
                        <option value="SAVINGS">Savings</option>
                        <option value="LOAN">Loan</option>
                    </select>
                </div>

                {/* ================= SAVINGS FLOW ================= */}
                {mode === "SAVINGS" && (
                    <div style={{ marginBottom: "12px" }}>
                        <select
                            value={selectedSavingsProduct}
                            onChange={(e) => setSelectedSavingsProduct(e.target.value)}
                        >
                            <option value="">Select Savings Type</option>
                            {savingsProducts.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {mode === "SAVINGS" && selectedSavingsProduct && (
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
                )}

                {mode === "SAVINGS" && selectedMemberId && (
                    <div style={{ marginBottom: "16px" }}>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <button className="view-btn" onClick={handleSubmit}>
                            Post Savings
                        </button>
                    </div>
                )}

                {/* ================= LOAN FLOW ================= */}
                {mode === "LOAN" && (
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
                )}

                {mode === "LOAN" && selectedMemberId && (
                    <div style={{ marginBottom: "12px" }}>
                        <select
                            value={selectedLoanId}
                            onChange={(e) => setSelectedLoanId(e.target.value)}
                        >
                            <option value="">Select Loan</option>
                            {loans.map((l) => (
                                <option key={l.loanId} value={l.loanId}>
                                    {l.loanId} - KES {l.totalOutstanding.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {mode === "LOAN" && selectedLoanId && (
                    <div style={{ marginBottom: "16px" }}>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <button className="view-btn" onClick={handleSubmit}>
                            Add Repayment
                        </button>
                    </div>
                )}

            </main>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default ReceiptJournal;