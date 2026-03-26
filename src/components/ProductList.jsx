import React from "react";

const ProductList = ({ products, onSelect, selectedProduct }) => {
  return (
    <div>
      <h3>Products</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {products.map((p) => (
          <li
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              padding: "10px",
              marginBottom: "5px",
              cursor: "pointer",
              backgroundColor: selectedProduct?.id === p.id ? "#2c7be5" : "#f5f5f5",
              color: selectedProduct?.id === p.id ? "white" : "black",
              borderRadius: "5px",
            }}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;