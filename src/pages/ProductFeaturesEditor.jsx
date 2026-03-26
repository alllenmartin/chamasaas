
import { useState } from "react";

const ProductFeaturesEditor = ({ product, onSave }) => {

  const [features, setFeatures] = useState(product.features);

  const handleChange = (index, value) => {
    const updated = [...features];
    updated[index].value = value;
    setFeatures(updated);
  };

  const handleSave = () => {
    onSave({ ...product, features });
  };

  return (
    <div>

      {features.map((f, i) => (
        <div key={i} className="feature-field">

          <label>{f.label}</label>

          <input
            type={f.type}
            value={f.value}
            onChange={(e) => handleChange(i, e.target.value)}
          />

        </div>
      ))}

      <button onClick={handleSave}>Save Product</button>

    </div>
  );
};

export default ProductFeaturesEditor;