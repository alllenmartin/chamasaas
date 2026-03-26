import React, { useState } from "react";

const ProductForm = ({ product, onSave }) => {
  const [features, setFeatures] = useState(product.features || []);
  const [name, setName] = useState(product.name || "");

  // Add new feature dynamically
  const addFeature = () => {
    setFeatures([...features, { label: "", type: "text", value: "" }]);
  };

  // Remove a feature
  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Update feature value
  const updateFeature = (index, key, value) => {
    const updated = [...features];
    updated[index][key] = value;
    setFeatures(updated);
  };

  // Save handler
  const handleSave = () => {
    const updatedProduct = { ...product, name, features };
    onSave(updatedProduct);
  };

  return (
    <div>
      <h3>{product.name} Details</h3>

      <div className="form-group">
        <label>Product Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Product Type</label>
        <input type="text" value={product.type} disabled />
      </div>

      <h4>Features</h4>
      {features.map((f, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "10px",
          }}
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
          <button type="button" onClick={() => removeFeature(index)}>
            ❌
          </button>
        </div>
      ))}

      <button type="button" onClick={addFeature} className="save-btn">
        + Add Feature
      </button>

      <button type="button" onClick={handleSave} className="save-btn" style={{ marginLeft: "10px" }}>
        Save Product
      </button>
    </div>
  );
};

export default ProductForm;