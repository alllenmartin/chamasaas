import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import LoanProductForm from "./LoanProductForm";

const ViewLoanProduct = () => {
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
        return (
            <div style={{ display: "flex" }}>
                <Sidebar />
                <div style={{ padding: "20px" }}>Loading loan product...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: "flex" }}>
                <Sidebar />
                <div style={{ padding: "20px", color: "red" }}>
                    Error: {error}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ display: "flex" }}>
                <Sidebar />
                <div style={{ padding: "20px" }}>No data found</div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex" }}>
            <Sidebar />

            <div style={{ flex: 1 }}>
                <LoanProductForm
                    mode="view"
                    initialData={data}
                    readOnly={true}
                />
            </div>
        </div>
    );
};

export default ViewLoanProduct;