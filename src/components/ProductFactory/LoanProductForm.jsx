import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "./LoanProduct.css";

const LoanProductForm = ({ mode = "create", initialData = null }) => {
    const isReadOnly = mode === "view";
    const [form, setForm] = useState({
        code: "",
        name: "",
        interest_type: "REDUCING",
        interest_rate: "",
        min_amount: "",
        max_amount: "",
        min_term: "",
        max_term: "",

        // ================= SECURITY =================
        secured: false,
        guarantors_required: 0,
        requires_collateral: false,

        // ================= REPAYMENT =================
        repayment_frequency: "MONTHLY",
        repayment_method: "EMI",
        grace_period_days: 0,
        late_payment_rate: "",
        late_payment_type: "PERCENT_PER_DAY",
        allow_reschedule: false,
        allow_early_repayment: true,
        early_repayment_penalty: "",

        // ================= GL MAPPING =================
        gl: {
            loan_principal: "",
            interest_income: "",
            penalty_income: "",
            charges_income: ""
        },

        rules: [],
        charges: []
    });

    useEffect(() => {
        if (initialData) {
            setForm((prev) => ({
                ...prev,

                ...initialData,

                gl: {
                    loan_principal: initialData.loan_principal_gl || "",
                    interest_income: initialData.interest_income_gl || "",
                    penalty_income: initialData.penalty_income_gl || "",
                    charges_income: initialData.charges_income_gl || ""
                },

                rules: initialData.rules || [],
                charges: initialData.charges || []
            }));
        }
    }, [initialData]);

    // ================= BASIC INPUT =================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleCheckbox = (e) => {
        const { name, checked } = e.target;
        setForm({ ...form, [name]: checked });
    };

    // ================= RULES =================
    const addRule = () => {
        setForm({
            ...form,
            rules: [...form.rules, { type: "", value: "" }]
        });
    };

    const updateRule = (index, field, value) => {
        const updated = [...form.rules];
        updated[index][field] = value;
        setForm({ ...form, rules: updated });
    };

    const removeRule = (index) => {
        setForm({
            ...form,
            rules: form.rules.filter((_, i) => i !== index)
        });
    };

    // ================= CHARGES =================
    const addCharge = () => {
        setForm({
            ...form,
            charges: [
                ...form.charges,
                { name: "", type: "PERCENTAGE", value: "" }
            ]
        });
    };

    const updateCharge = (index, field, value) => {
        const updated = [...form.charges];
        updated[index][field] = value;
        setForm({ ...form, charges: updated });
    };

    const removeCharge = (index) => {
        setForm({
            ...form,
            charges: form.charges.filter((_, i) => i !== index)
        });
    };

    // ================= SUBMIT =================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const url =
            mode === "edit"
                ? `/api/loan-products/${form.id}`
                : "/api/loan-products";

        const method = mode === "edit" ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });

        const data = await res.json();
        alert(data.message || "Saved");
    };

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="main-content">
                <div className="form-container">
                    <h2>Create Loan Product</h2>

                    <form onSubmit={handleSubmit}>

                        {/* ================= BASIC INFO ================= */}
                        <div className="grid">
                            <input
                                name="code"
                                placeholder="Code"
                                value={form.code || ""}
                                onChange={handleChange}
                                disabled={mode === "view"}
                            />

                            <input
                                name="name"
                                placeholder="Name"
                                value={form.name || ""}
                                onChange={handleChange}
                                disabled={mode === "view"}
                            />
                        </div>

                        {/* ================= INTEREST ================= */}
                        <h4>Interest</h4>
                        <div className="grid">
                            <select name="interest_type" onChange={handleChange}  disabled={mode === "view"}>
                                <option value="REDUCING">Reducing</option>
                                <option value="FLAT">Flat</option>
                            </select>

                            <input
                                name="interest_rate"
                                placeholder="Rate (%)"
                                value={form.interest_rate || ""}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />
                        </div>

                        {/* ================= AMOUNT ================= */}
                        <h4>Amount Range</h4>
                        <div className="grid">
                            <input
                                name="min_amount"
                                placeholder="Min"
                                value={form.min_amount || ""}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />

                            <input
                                name="max_amount"
                                placeholder="Max"
                                value={form.max_amount || ""}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />
                        </div>

                        {/* ================= TERM ================= */}
                        <h4>Term</h4>
                        <div className="grid">
                            <input
                                name="min_term"
                                placeholder="Min months"
                                value={form.min_term || ""}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />

                            <input
                                name="max_term"
                                placeholder="Max months"
                                value={form.max_term || ""}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />
                        </div>

                        {/* ================= SECURITY ================= */}
                        <h4>Security Rules</h4>

                        <div className="inline-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="secured"
                                    checked={form.secured}
                                    onChange={handleCheckbox}
                                     disabled={mode === "view"}
                                />
                                Secured Loan
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    name="requires_collateral"
                                    checked={form.requires_collateral}
                                    onChange={handleCheckbox}
                                     disabled={mode === "view"}
                                />
                                Requires Collateral
                            </label>
                        </div>

                        <div className="grid">
                            <input
                                type="number"
                                name="guarantors_required"
                                placeholder="Guarantors Required"
                                value={form.guarantors_required}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />
                        </div>

                        {/* ================= REPAYMENT ================= */}
                        <h4>Repayment Rules</h4>

                        <div className="grid">
                            <select
                                name="repayment_frequency"
                                value={form.repayment_frequency}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            >
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>

                            <select
                                name="repayment_method"
                                value={form.repayment_method}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            >
                                <option value="EMI">EMI</option>
                                <option value="INTEREST_ONLY">Interest Only</option>
                                <option value="BULLET">Bullet</option>
                            </select>
                        </div>

                        <div className="grid">
                            <input
                                type="number"
                                name="grace_period_days"
                                placeholder="Grace Period (days)"
                                value={form.grace_period_days}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />

                            <input
                                type="number"
                                name="late_payment_rate"
                                placeholder="Late Payment Rate (%)"
                                value={form.late_payment_rate}
                                onChange={handleChange}
                                 disabled={mode === "view"}
                            />
                        </div>

                        <div className="grid">
                            <label>
                                <input
                                    type="checkbox"
                                    name="allow_reschedule"
                                    checked={form.allow_reschedule}
                                     disabled={mode === "view"}
                                    onChange={(e) =>
                                        setForm({ ...form, allow_reschedule: e.target.checked })
                                    }
                                />
                                Allow Rescheduling
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    name="allow_early_repayment"
                                    checked={form.allow_early_repayment}
                                     disabled={mode === "view"}
                                    onChange={(e) =>
                                        setForm({ ...form, allow_early_repayment: e.target.checked })
                                    }
                                />
                                Allow Early Repayment
                            </label>
                        </div>

                        <div className="grid">
                            <input
                                type="number"
                                name="early_repayment_penalty"
                                placeholder="Early Repayment Penalty (%)"
                                value={form.early_repayment_penalty}
                                 disabled={mode === "view"}
                                onChange={handleChange}
                            />
                        </div>

                        {/* ================= GL MAPPING ================= */}
                        <h4>GL Mapping</h4>

                        <div className="grid">
                            <input
                                placeholder="Loan Principal GL"
                                value={form.gl.loan_principal}
                                 disabled={mode === "view"}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        gl: { ...form.gl, loan_principal: e.target.value }
                                    })
                                }
                            />

                            <input
                                placeholder="Interest Income GL"
                                value={form.gl.interest_income}
                                 disabled={mode === "view"}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        gl: { ...form.gl, interest_income: e.target.value }
                                    })
                                }
                            />
                        </div>

                        <div className="grid">
                            <input
                                placeholder="Penalty Income GL"
                                value={form.gl.penalty_income}
                                 disabled={mode === "view"}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        gl: { ...form.gl, penalty_income: e.target.value }
                                    })
                                }
                            />

                            <input
                                placeholder="Charges Income GL"
                                value={form.gl.charges_income}
                                 disabled={mode === "view"}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        gl: { ...form.gl, charges_income: e.target.value }
                                    })
                                }
                            />
                        </div>

                        {/* ================= RULES ================= */}
                        <h4>Rules</h4>

                        {form.rules.map((rule, index) => (
                            <div key={index} className="inline-group">
                                <select
                                    value={rule.type}
                                     disabled={mode === "view"}
                                    onChange={(e) =>
                                        updateRule(index, "type", e.target.value)
                                    }
                                >
                                    <option value="">Select Rule</option>
                                    <option value="SAVINGS_MULTIPLIER">Savings Multiplier</option>
                                    <option value="MIN_MEMBERSHIP_MONTHS">Min Membership</option>
                                </select>

                                <input
                                    placeholder="Value"
                                    value={rule.value}
                                     disabled={mode === "view"}
                                    onChange={(e) =>
                                        updateRule(index, "value", e.target.value)
                                    }
                                />

                                <button type="button" className="delete-btn" disabled={isReadOnly} onClick={() => removeRule(index)}>
                                    ❌
                                </button>
                            </div>
                        ))}

                        <button type="button" className="add-btn" onClick={addRule} disabled={isReadOnly} >
                            + Add Rule
                        </button>

                        {/* ================= CHARGES ================= */}
                        <h4>Charges</h4>

                        {form.charges.map((charge, index) => (
                            <div key={index} className="inline-group">
                                <input
                                    placeholder="Name"
                                    value={charge.name}
                                     disabled={mode === "view"}
                                     
                                    onChange={(e) =>
                                        updateCharge(index, "name", e.target.value)
                                    }
                                />

                                <select
                                    value={charge.type}
                                     disabled={mode === "view"}
                                    onChange={(e) =>
                                        updateCharge(index, "type", e.target.value)
                                    }
                                >
                                    <option value="PERCENTAGE">%</option>
                                    <option value="FLAT">Flat</option>
                                </select>

                                <input
                                    placeholder="Value"
                                    value={charge.value}
                                     disabled={mode === "view"}
                                    onChange={(e) =>
                                        updateCharge(index, "value", e.target.value)
                                    }
                                />

                                <button type="button" className="delete-btn" disabled={isReadOnly} onClick={() => removeCharge(index)}>
                                    ❌
                                </button>
                            </div>
                        ))}

                        <button type="button" className="add-btn" onClick={addCharge} disabled={isReadOnly}>
                            + Add Charge
                        </button>

                        <br /><br />
                        <button type="submit" className="submit-btn" disabled={isReadOnly}>
                            Save Product
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoanProductForm;