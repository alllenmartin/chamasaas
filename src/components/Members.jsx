import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ----------------- Fetch Members -----------------
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/members");
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error(err);
        toast.error("Error fetching members from server");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar active="Members" />
      <main className="main-content">
        <h1>All Members</h1>

        <div style={{ marginBottom: "12px" }}>
          <button
            onClick={() => navigate("/members/register")}
            className="add-member-btn"
          >
            + Add New Member
          </button>
        </div>

        {/* Members Table */}
        {loading ? (
          <p>Loading members...</p>
        ) : (
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name || `${m.fname} ${m.lname}`}</td>
                  <td>{m.nationalId}</td>
                  <td>{m.phone}</td>
                  <td>{m.role}</td>
                  <td>{m.registrationPaid ? "Yes" : "No"}</td>
                  <td>
                    {/* <button
                      className="view-btn"
                      onClick={() => navigate(`/members/${m.memberId}`)}
                    >
                      View
                    </button> */}
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/members/${m.memberId}/overview`)}
                    >
                      Overview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
};

export default Members;