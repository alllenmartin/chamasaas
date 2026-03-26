import React, { useState } from "react";

const ProductDetails = ({ product, onSave }) => {
  const [activeTab, setActiveTab] = useState("General");
  const [prodData, setProdData] = useState(product);

  if (!product) return <p>Select a product to view details</p>;

  const handleFieldChange = (group, field, value) => {
    setProdData((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  };

  const handleSave = () => {
    onSave(prodData);
  };

  const tabs = ["General", "Finance"];
  if (prodData.type === "Loan") tabs.push("Loan", "Charges", "Guarantor Rules", "Documents");
  if (prodData.type === "Savings") tabs.push("Savings", "Charges", "Documents");

  return (
    <div className="product-details">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${tab === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "General" && (
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={prodData.name}
              onChange={(e) => setProdData({ ...prodData, name: e.target.value })}
            />
            <label>Status:</label>
            <select
              value={prodData.general.status}
              onChange={(e) => handleFieldChange("general", "status", e.target.value)}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <label>Min Age:</label>
            <input
              type="number"
              value={prodData.general.minAge}
              onChange={(e) => handleFieldChange("general", "minAge", Number(e.target.value))}
            />
            <label>Max Age:</label>
            <input
              type="number"
              value={prodData.general.maxAge}
              onChange={(e) => handleFieldChange("general", "maxAge", Number(e.target.value))}
            />
          </div>
        )}

        {activeTab === "Finance" && (
          <div>
            <label>Posting Group:</label>
            <input
              type="text"
              value={prodData.finance.postingGroup || ""}
              onChange={(e) => handleFieldChange("finance", "postingGroup", e.target.value)}
            />
            {prodData.type === "Loan" && (
              <>
                <label>Loan Account:</label>
                <input
                  type="text"
                  value={prodData.finance.loanAccount || ""}
                  onChange={(e) => handleFieldChange("finance", "loanAccount", e.target.value)}
                />
                <label>Interest Income Account:</label>
                <input
                  type="text"
                  value={prodData.finance.interestIncomeAccount || ""}
                  onChange={(e) =>
                    handleFieldChange("finance", "interestIncomeAccount", e.target.value)
                  }
                />
                <label>Interest Expense Account:</label>
                <input
                  type="text"
                  value={prodData.finance.interestExpenseAccount || ""}
                  onChange={(e) =>
                    handleFieldChange("finance", "interestExpenseAccount", e.target.value)
                  }
                />
              </>
            )}
          </div>
        )}

        {activeTab === "Loan" && (
          <div>
            <label>Min Loan Amount:</label>
            <input
              type="number"
              value={prodData.loan.minAmount || ""}
              onChange={(e) => handleFieldChange("loan", "minAmount", Number(e.target.value))}
            />
            <label>Max Loan Amount:</label>
            <input
              type="number"
              value={prodData.loan.maxAmount || ""}
              onChange={(e) => handleFieldChange("loan", "maxAmount", Number(e.target.value))}
            />
            <label>Interest Min %:</label>
            <input
              type="number"
              value={prodData.loan.interestMin || ""}
              onChange={(e) => handleFieldChange("loan", "interestMin", Number(e.target.value))}
            />
            <label>Interest Max %:</label>
            <input
              type="number"
              value={prodData.loan.interestMax || ""}
              onChange={(e) => handleFieldChange("loan", "interestMax", Number(e.target.value))}
            />
            <label>Min Guarantors:</label>
            <input
              type="number"
              value={prodData.loan.minGuarantors || ""}
              onChange={(e) =>
                handleFieldChange("loan", "minGuarantors", Number(e.target.value))
              }
            />
            <label>Max Guarantors:</label>
            <input
              type="number"
              value={prodData.loan.maxGuarantors || ""}
              onChange={(e) =>
                handleFieldChange("loan", "maxGuarantors", Number(e.target.value))
              }
            />
          </div>
        )}

        {activeTab === "Savings" && (
          <div>
            <label>Minimum Balance:</label>
            <input
              type="number"
              value={prodData.savings.minBalance || ""}
              onChange={(e) => handleFieldChange("savings", "minBalance", Number(e.target.value))}
            />
            <label>Interest Min %:</label>
            <input
              type="number"
              value={prodData.savings.interestMin || ""}
              onChange={(e) => handleFieldChange("savings", "interestMin", Number(e.target.value))}
            />
            <label>Interest Max %:</label>
            <input
              type="number"
              value={prodData.savings.interestMax || ""}
              onChange={(e) => handleFieldChange("savings", "interestMax", Number(e.target.value))}
            />
          </div>
        )}

        {/* Charges, Documents, GuarantorRules can be added similarly as dynamic tables */}

      </div>

      <button className="save-btn" onClick={handleSave}>
        Save Product
      </button>
    </div>
  );
};

export default ProductDetails;