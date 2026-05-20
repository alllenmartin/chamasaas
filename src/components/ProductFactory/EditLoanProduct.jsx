import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LoanProductForm from "./LoanProductForm";

const EditLoanProduct = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(
                    `http://127.0.0.1:5000/api/loan_product_factory/${id}`
                );

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const json = await res.json();

                console.log("LOAN PRODUCT DATA:", json);

                setData(json);
            } catch (err) {
                console.error("Failed to fetch loan product:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return <div>Loading loan product...</div>;
    }

    if (error) {
        return <div style={{ color: "red" }}>Error: {error}</div>;
    }

    if (!data) {
        return <div>No data found</div>;
    }

    return (
        <LoanProductForm
            mode="edit"
            initialData={data}
        />
    );
};

export default EditLoanProduct;