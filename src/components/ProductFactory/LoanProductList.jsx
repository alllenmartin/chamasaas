import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./LoanProduct.css";

const LoanProductList = () => {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const res = await fetch("http://127.0.0.1:5000/api/loan_product_factory");
        const data = await res.json();
        setProducts(data);
        console.log(data)
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;

        await fetch(`http://127.0.0.1:5000/api/loan_product_factory/${id}`, {
            method: "DELETE"
        });

        fetchProducts();
    };

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="main-content">
                <div className="form-container">

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <h2>Loan Products</h2>

                        <button
                            className="add-btn"
                            onClick={() => navigate("/loan-products/new")}
                        >
                            + Add Product
                        </button>
                    </div>

                    <table style={{ width: "100%", marginTop: "20px" }}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Interest</th>
                                <th>Range</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.code}</td>
                                    <td>{p.name}</td>
                                    <td>
                                        {p.config?.interest
                                            ? `${p.config.interest.rate}% (${p.config.interest.type})`
                                            : "N/A"}
                                    </td>

                                    <td>
                                        {p.config?.amount
                                            ? `${p.config.amount.min} - ${p.config.amount.max}`
                                            : "N/A"}
                                    </td>

                                 <td>
  <div className="action-buttons">
    <button onClick={() => navigate(`/loan-products/view/${p.id}`)}>
      View
    </button>

    <button onClick={() => navigate(`/loan-products/edit/${p.id}`)}>
      Edit
    </button>

    <button
      className="delete-btn"
      onClick={() => handleDelete(p.id)}
    >
      Delete
    </button>
  </div>
</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    );
};

export default LoanProductList;