import { useState } from "react";

const ProductSidebar = ({ products, selectedProduct, onSelect, onCreate }) => {
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="product-sidebar">

      <div className="sidebar-header">
        <h3>Products</h3>
        <button onClick={onCreate}>+ New</button>
      </div>

      {/* SEARCH */}
      <input
        className="product-search"
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul className="product-list">
        {filteredProducts.map((p) => (
          <li
            key={p.id}
            className={selectedProduct?.id === p.id ? "active" : ""}
            onClick={() => onSelect(p)}
          >
            <strong>{p.name}</strong>
            <span>{p.type}</span>
          </li>
        ))}
      </ul>

    </div>
  );
};

export default ProductSidebar;