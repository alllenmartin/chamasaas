
import React, { useState } from "react";

const ProductCreateModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("Loan");

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Product name is required");
      return;
    }

    const newProduct = {
      name,
      type,
      features: []
    };

    onSave(newProduct);
  };

  return (
    <div className="modal-overlay">

      <div className="modal">

        <h2>Create New Product</h2>

        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            value={name}
            placeholder="Enter product name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Product Type</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="Loan">Loan</option>
            <option value="Savings">Savings</option>
            <option value="Shares">Shares</option>
            <option value="Fixed Deposit">Fixed Deposit</option>
          </select>
        </div>

        <div className="modal-actions">

          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="save-btn"
            onClick={handleSubmit}
          >
            Create Product
          </button>

        </div>

      </div>

    </div>
  );
};

export default ProductCreateModal;