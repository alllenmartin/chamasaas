import Sidebar from "../components/Sidebar";
import "./MemberCreditSecurity.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect } from "react"; // ✅ include useEffect

const MemberCreditSecurity = () => {
  const [guarantors, setGuarantors] = useState([]);
  const [collaterals, setCollaterals] = useState([]);
  const [visibleTable, setVisibleTable] = useState(null);
  const [members, setMembers] = useState([]);
  const [guarantorInput, setGuarantorInput] = useState({
    name: "",
    memberNumber: "",
    memberGuaranteed: "",
    amountGuaranteed: "",
    totalShares: "",
    committedAmount: "",
  });
  const [contributions, setContributions] = useState([]);

  const [collateralInput, setCollateralInput] = useState({
    type: "",
    description: "",
    value: "",
    owner: "",
  });

  // ------------------ Guarantor Functions ------------------
  const addGuarantor = () => {
    const { name, memberNumber } = guarantorInput;
    if (!name || !memberNumber) {
      toast.error("Please fill at least Name and Member Number");
      return;
    }
    setGuarantors([...guarantors, guarantorInput]);
    setGuarantorInput({
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

  // ------------------ Collateral Functions ------------------
  const addCollateral = () => {
    const { type, description } = collateralInput;
    if (!type || !description) {
      toast.error("Please fill at least Type and Description");
      return;
    }
    setCollaterals([...collaterals, collateralInput]);
    setCollateralInput({ type: "", description: "", value: "", owner: "" });
  };

  const removeCollateral = (index) => {
    setCollaterals(collaterals.filter((_, i) => i !== index));
  };

  // ------------------ Summary Calculations ------------------
  const totalGuaranteed = guarantors.reduce(
    (sum, g) => sum + Number(g.amountGuaranteed || 0),
    0,
  );

  const totalCollateralValue = collaterals.reduce(
    (sum, c) => sum + Number(c.value || 0),
    0,
  );

  // ------------------ Fetch Members ------------------
  useEffect(() => {
    fetch("http://127.0.0.1:5000/members/lookup")
      .then((res) => res.json())
      .then((data) => setMembers(data))
      .catch((err) => console.error(err));
  }, []);

  // When a member is selected, auto-fill name and totalShares
const handleMemberSelect = (memberId) => {
  // Find the member object
  const selectedMember = members.find((m) => String(m.id) === String(memberId)) || {};

  // Ensure contributions is defined and is an array
  const memberContributions = Array.isArray(contributions)
    ? contributions.filter((c) => String(c.memberId) === String(memberId))
    : [];

  // Sum the total contributions (shares)
  const totalShares = memberContributions.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  // Update the guarantor input
  setGuarantorInput({
    ...guarantorInput,
    memberNumber: memberId,
    name: selectedMember.name || "",
    totalShares: totalShares,
  });

  console.log("Contributions for", memberId, memberContributions);
  console.log("Total shares:", totalShares);

  // If totalShares is 0, optionally fetch from backend
  if (totalShares === 0) {
    fetch(`http://127.0.0.1:5000/api/contributions/${memberId}`)
      .then((res) => res.json())
      .then((data) => {
        const fetchedShares = data.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        if (fetchedShares > 0) {
          setGuarantorInput((prev) => ({
            ...prev,
            totalShares: fetchedShares,
          }));
          console.log("Fetched contributions:", data);
          console.log("Fetched total shares:", fetchedShares);
        }
      })
      .catch((err) => {
        console.error("Error fetching contributions:", err);
        toast.error("Error fetching member contributions");
      });
  }
};
  return (
    <div className="dashboard">
      <Sidebar active="Security" />

      <main className="main-content">
        <h1>Member Security</h1>

        {/* ---------------- Summary Cards (Clickable) ---------------- */}
        <div className="security-summary">
          <div
            className="summary-card clickable"
            onClick={() => setVisibleTable("guarantors")}
          >
            <h4>Total Guarantors</h4>
            <p>{guarantors.length}</p>
          </div>

          <div
            className="summary-card clickable"
            onClick={() => setVisibleTable("collaterals")}
          >
            <h4>Total Collateral</h4>
            <p>{collaterals.length}</p>
          </div>

          <div
            className="summary-card clickable"
            onClick={() => setVisibleTable("guarantors")}
          >
            <h4>Total Guaranteed Amount</h4>
            <p>KES {totalGuaranteed.toLocaleString()}</p>
          </div>

          <div
            className="summary-card clickable"
            onClick={() => setVisibleTable("collaterals")}
          >
            <h4>Total Collateral Value</h4>
            <p>KES {totalCollateralValue.toLocaleString()}</p>
          </div>
        </div>

        {/* ---------------- Guarantors Table ---------------- */}
        {visibleTable === "guarantors" && (
          <div className="table-container">
            <h3>Guarantors</h3>
            <table className="security-table">
              <thead>
                <tr>
                   <th>Member Number</th>
                  <th>Name  </th>
                  <th>Amount Guaranteed</th>
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
                    <td>{g.totalShares}</td>
                    <td>{g.committedAmount}</td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => removeGuarantor(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-entry-form">
              <select
                value={guarantorInput.memberNumber}
                onChange={(e) => handleMemberSelect(e.target.value)}
              >
                <option value="">Select Member Number</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>

              {/* Name auto-filled */}
              <input
                type="text"
                placeholder="Name"
                value={guarantorInput.name}
                readOnly
              />

             
              <input
                type="number"
                placeholder="Amount Guaranteed"
                value={guarantorInput.amountGuaranteed}
                onChange={(e) =>
                  setGuarantorInput({
                    ...guarantorInput,
                    amountGuaranteed: e.target.value,
                  })
                }
              />
              {/* Total shares auto-filled */}
              <input
                type="number"
                placeholder="Total Shares"
                value={guarantorInput.totalShares}
                readOnly
              />
              <input
                type="number"
                placeholder="Committed Amount"
                value={guarantorInput.committedAmount}
                onChange={(e) =>
                  setGuarantorInput({
                    ...guarantorInput,
                    committedAmount: e.target.value,
                  })
                }
              />
              <button className="view-btn" onClick={addGuarantor}>
                Add Guarantor
              </button>
            </div>
          </div>
        )}

        {/* ---------------- Collateral Table ---------------- */}
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
                      <button
                        className="remove-btn"
                        onClick={() => removeCollateral(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-entry-form">
              <input
                type="text"
                placeholder="Type"
                value={collateralInput.type}
                onChange={(e) =>
                  setCollateralInput({
                    ...collateralInput,
                    type: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Description"
                value={collateralInput.description}
                onChange={(e) =>
                  setCollateralInput({
                    ...collateralInput,
                    description: e.target.value,
                  })
                }
              />
              <input
                type="number"
                placeholder="Value"
                value={collateralInput.value}
                onChange={(e) =>
                  setCollateralInput({
                    ...collateralInput,
                    value: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Owner"
                value={collateralInput.owner}
                onChange={(e) =>
                  setCollateralInput({
                    ...collateralInput,
                    owner: e.target.value,
                  })
                }
              />
              <button className="view-btn" onClick={addCollateral}>
                Add Collateral
              </button>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
};

export default MemberCreditSecurity;
