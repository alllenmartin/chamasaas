import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MemberCreditSecurity.css";

const MemberCreditSecurity = ({ loanId: propLoanId }) => {
    
  // const  loanId  = useParams();
  const { loanId } = useParams()



  const [guarantors, setGuarantors] = useState([]);
  const [collaterals, setCollaterals] = useState([]);
  const [visibleTable, setVisibleTable] = useState(null);
  const [members, setMembers] = useState([]);
  const [guarantorInput, setGuarantorInput] = useState({
    name: "",
    memberNumber: "",
    amountGuaranteed: 0,
    availableForGuarantee: 0,
    totalShares: 0,
    committedAmount: 0,
  });
  const [collateralInput, setCollateralInput] = useState({
    type: "",
    description: "",
    value: 0,
    owner: "",
  });

  // ---------------- Fetch Members ----------------
  useEffect(() => {
    fetch("http://127.0.0.1:5000/members/lookup")
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error(err));
  }, []);

  // ---------------- Fetch Existing Loan Security ----------------
  useEffect(() => {
    if (!loanId) return;

    fetch(`http://127.0.0.1:5000/api/loans/${loanId}/security`)
      .then(res => res.json())
      .then(data => {
        setGuarantors(data.guarantors || []);
        setCollaterals(data.collaterals || []);
      })
      .catch(err => console.error("Error fetching loan security:", err));
  }, [loanId]);

  // ---------------- Handle Member Select ----------------
  const handleMemberSelect = (memberId) => {
    const selectedMember = members.find(m => m.memberId === memberId) || {};
    if (!selectedMember.memberId) return;

    // Fetch current commitment from backend
    fetch(`http://127.0.0.1:5000/api/member/${memberId}/current_commitment`)
      .then(res => res.json())
      .then(data => {
        setGuarantorInput({
          memberNumber: memberId,
          name: selectedMember.name,
          totalShares: data.totalSavings || 0,
          committedAmount: data.totalCommitment || 0,
          availableForGuarantee: data.availableForGuarantee || 0,
          amountGuaranteed: data.availableForGuarantee || 0,
        });
      })
      .catch(err => console.error("Error fetching member commitment:", err));
  };

  // ---------------- Add / Remove Guarantor ----------------
  const addGuarantor = () => {
    if (!guarantorInput.memberNumber) return toast.error("Select a member");

    // Check duplicate
    if (guarantors.some(g => g.memberNumber === guarantorInput.memberNumber)) {
      return toast.error("Member already added");
    }

    // Check max guarantee
    if (guarantorInput.amountGuaranteed > guarantorInput.availableForGuarantee) {
      return toast.error("Amount exceeds available for guarantorship");
    }

    setGuarantors([...guarantors, guarantorInput]);
    setGuarantorInput({
      name: "",
      memberNumber: "",
      amountGuaranteed: 0,
      availableForGuarantee: 0,
      totalShares: 0,
      committedAmount: 0,
    });
  };

  const removeGuarantor = (index) => setGuarantors(guarantors.filter((_, i) => i !== index));

  // ---------------- Add / Remove Collateral ----------------
  const addCollateral = () => {
    if (!collateralInput.type || !collateralInput.description) {
      return toast.error("Type and description required");
    }
    setCollaterals([...collaterals, collateralInput]);
    setCollateralInput({ type: "", description: "", value: 0, owner: "" });
  };

  const removeCollateral = (index) => setCollaterals(collaterals.filter((_, i) => i !== index));

  // ---------------- Calculations ----------------
  const totalGuaranteed = guarantors.reduce((sum, g) => sum + Number(g.amountGuaranteed || 0), 0);
  const totalCollateralValue = collaterals.reduce((sum, c) => sum + Number(c.value || 0), 0);

  // ---------------- Save All ----------------
  const saveAll = async () => {
    if (!loanId) return toast.error("Loan ID not defined");

    try {
      // Save guarantors
      const guarantorRes = await fetch("http://127.0.0.1:5000/api/guarantors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, guarantors }),
      });
      if (!guarantorRes.ok) {
        const err = await guarantorRes.json();
        return toast.error(err.error || "Failed to save guarantors");
      }

      // Save collaterals
      const collateralRes = await fetch("http://127.0.0.1:5000/api/collaterals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, collaterals }),
      });
      if (!collateralRes.ok) {
        const err = await collateralRes.json();
        return toast.error(err.error || "Failed to save collaterals");
      }

      toast.success("Loan security saved successfully ✅");
    } catch (error) {
      console.error(error);
      toast.error("Server error while saving security");
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Security" />
      <main className="main-content">
        <h1>Member Security</h1>

        {/* Summary Cards */}
        <div className="security-summary">
          <div className="summary-card clickable" onClick={() => setVisibleTable("guarantors")}>
            <h4>Total Guarantors</h4>
            <p>{guarantors.length}</p>
          </div>
          <div className="summary-card clickable" onClick={() => setVisibleTable("collaterals")}>
            <h4>Total Collateral</h4>
            <p>{collaterals.length}</p>
          </div>
          <div className="summary-card clickable" onClick={() => setVisibleTable("guarantors")}>
            <h4>Total Guaranteed Amount</h4>
            <p>KES {totalGuaranteed.toLocaleString()}</p>
          </div>
          <div className="summary-card clickable" onClick={() => setVisibleTable("collaterals")}>
            <h4>Total Collateral Value</h4>
            <p>KES {totalCollateralValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Guarantors Table */}
        {visibleTable === "guarantors" && (
          <div className="table-container">
            <h3>Guarantors</h3>
            <table className="security-table">
              <thead>
                <tr>
                  <th>Member Number</th>
                  <th>Name</th>
                  <th>Amount Guaranteed</th>
                  <th>Available for Guarantorship</th>
                  <th>Total Shares</th>
                  <th>Committed Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {guarantors.map((g, idx) => (
                  <tr key={idx}>
                    <td>{g.memberNumber}</td>
                    <td>{g.name}</td>
                    <td>{g.amountGuaranteed}</td>
                    <td>{g.availableForGuarantee}</td>
                    <td>{g.totalShares}</td>
                    <td>{g.committedAmount}</td>
                    <td>
                      <button className="remove-btn"  style={{ backgroundColor: "red", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }} onClick={() => removeGuarantor(idx)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Guarantor */}
            <div className="add-entry-form">
              <select value={guarantorInput.memberNumber} onChange={(e) => handleMemberSelect(e.target.value)}>
                <option value="">Select Member Number</option>
                {members
                  .filter(m => !guarantors.some(g => g.memberNumber === m.memberId)) // hide already added
                  .map(m => (
                    <option key={m.memberId} value={m.memberId}>{m.memberId}</option>
                  ))}
              </select>

              <input type="text" placeholder="Name" value={guarantorInput.name} readOnly />

              <input
                type="number"
                placeholder="Amount Guaranteed"
                value={guarantorInput.amountGuaranteed}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const max = Number(guarantorInput.availableForGuarantee || 0);
                  setGuarantorInput({ ...guarantorInput, amountGuaranteed: val > max ? max : val });
                }}
              />

              <input type="number" placeholder="Available for Guarantorship" value={guarantorInput.availableForGuarantee} readOnly />
              <input type="number" placeholder="Total Shares" value={guarantorInput.totalShares} readOnly />
              <input type="number" placeholder="Committed Amount" value={guarantorInput.committedAmount} readOnly />

              <button className="view-btn" onClick={addGuarantor}>Add Guarantor</button>
            </div>
          </div>
        )}

        {/* Collaterals Table */}
        {visibleTable === "collaterals" && (
          <div className="table-container">
            <h3>Collaterals</h3>
            <table className="security-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Value</th>
                  <th>Owner</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {collaterals.map((c, idx) => (
                  <tr key={idx}>
                    <td>{c.type}</td>
                    <td>{c.description}</td>
                    <td>{c.value}</td>
                    <td>{c.owner}</td>
                    <td>
                      <button className="remove-btn" onClick={() => removeCollateral(idx)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-entry-form">
              <input type="text" placeholder="Type" value={collateralInput.type}
                onChange={(e) => setCollateralInput({ ...collateralInput, type: e.target.value })} />
              <input type="text" placeholder="Description" value={collateralInput.description}
                onChange={(e) => setCollateralInput({ ...collateralInput, description: e.target.value })} />
              <input type="number" placeholder="Value" value={collateralInput.value}
                onChange={(e) => setCollateralInput({ ...collateralInput, value: e.target.value })} />
              <input type="text" placeholder="Owner" value={collateralInput.owner}
                onChange={(e) => setCollateralInput({ ...collateralInput, owner: e.target.value })} />
              <button className="view-btn" onClick={addCollateral}>Add Collateral</button>
            </div>
          </div>
        )}

        <button className="save-btn" onClick={saveAll}>Save Security</button>

        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
};

export default MemberCreditSecurity;