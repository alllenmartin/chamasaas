import React, { useState } from "react";

const NewProductModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("Loan");
  const [features, setFeatures] = useState([]);

  const addFeature = () => {
    setFeatures([...features, { label: "", type: "text", value: "" }]);
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index, key, value) => {
    const updated = [...features];
    updated[index][key] = value;
    setFeatures(updated);
  };

  const handleSave = () => {
    if (!name) return alert("Product name is required!");
    onSave({ name, type, features });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "500px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h3>New Product</h3>

        <div className="form-group">
          <label>Product Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Product Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Loan">Loan</option>
            <option value="Savings">Savings</option>
          </select>
        </div>

        <h4>Features</h4>
        {features.map((f, index) => (
          <div
            key={index}
            style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
          >
            <input
              type="text"
              placeholder="Feature Label"
              value={f.label}
              onChange={(e) => updateFeature(index, "label", e.target.value)}
            />
            <select
              value={f.type}
              onChange={(e) => updateFeature(index, "type", e.target.value)}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
            <input
              type={f.type}
              placeholder="Value"
              value={f.value}
              onChange={(e) => updateFeature(index, "value", e.target.value)}
            />
            <button onClick={() => removeFeature(index)}>❌</button>
          </div>
        ))}

        <button onClick={addFeature} className="save-btn">
          + Add Feature
        </button>

        <div style={{ marginTop: "15px" }}>
          <button className="save-btn" onClick={handleSave}>
            Save Product
          </button>
          <button
            className="save-btn"
            style={{ marginLeft: "10px", background: "#ccc" }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProductModal;