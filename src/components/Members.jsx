import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Members.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newMember, setNewMember] = useState({
    id: "",
    name: "",
    phone: "",
    role: "Member",
    amountPaid: 0,
    status: "Unpaid",
    registrationPaid: false,
  });
  const [editingMember, setEditingMember] = useState(null);

  const settings = JSON.parse(localStorage.getItem("chamaSettings")) || {};
  const contributionAmount = Number(settings.contributionAmount || 0);

  const isCreditEligible = (member) => {
    return member.registrationPaid && member.amountPaid >= contributionAmount;
  };

  /** Fetch members from backend */
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

  /** Add new member */
  const handleAddMember = async () => {
    if (!newMember.name.trim()) return toast.error("Full Name is required");
    if (!/^\d{6,8}$/.test(newMember.id))
      return toast.error("ID Number must be 6–8 digits");
    if (!/^07\d{8}$/.test(newMember.phone) && !/^\+2547\d{8}$/.test(newMember.phone))
      return toast.error("Phone must be 070xxxxxxx or +2547xxxxxxx");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (!res.ok) throw new Error("Failed to add member");
      const savedMember = await res.json();
      setMembers([...members, savedMember]);
      toast.success(`${savedMember.name} added successfully!`);
      setNewMember({
        id: "",
        name: "",
        phone: "",
        role: "Member",
        amountPaid: 0,
        status: "Unpaid",
        registrationPaid: false,
      });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Error adding member");
    }
  };

  /** Edit member */
  const handleSaveEdit = async () => {
    if (!editingMember) return;
    if (!/^\d{6,8}$/.test(editingMember.id))
      return toast.error("ID Number must be 6–8 digits");
    if (!/^07\d{8}$/.test(editingMember.phone) && !/^\+2547\d{8}$/.test(editingMember.phone))
      return toast.error("Phone must be 070xxxxxxx or +2547xxxxxxx");

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/members/${editingMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMember),
      });
      if (!res.ok) throw new Error("Failed to update member");
      const updatedMember = await res.json();
      setMembers(members.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
      toast.success(`${updatedMember.name} updated successfully!`);
      setEditingMember(null);
    } catch (err) {
      console.error(err);
      toast.error("Error updating member");
    }
  };

  /** Remove member */
  const handleRemoveMember = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/members/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete member");
      setMembers(members.filter((m) => m.id !== id));
      toast.success("Member removed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error removing member");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.status.toLowerCase().includes(search.toLowerCase())
  );

  /** Export CSV */
  const handleExport = () => {
    const csvRows = [
      ["ID Number", "Full Name", "Phone", "Role", "Amount Paid", "Status", "Registration Paid"],
      ...members.map((m) => [m.id, m.name, m.phone, m.role, m.amountPaid, m.status, m.registrationPaid]),
    ];
    const csvContent = csvRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "members.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard">
      <Sidebar active="Members" />
      <main className="main-content">
        <h1>All Members</h1>

        <button
          className="view-btn"
          onClick={() => setShowForm(!showForm)}
          style={{ marginBottom: "12px" }}
        >
          + Add New Member
        </button>

        {showForm && (
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Full Name *"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="ID Number *"
              value={newMember.id}
              onChange={(e) => setNewMember({ ...newMember, id: e.target.value })}
            />
            <input
              type="text"
              placeholder="Phone Number *"
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
            />
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
            >
              <option value="Member">Member</option>
              <option value="Treasurer">Treasurer</option>
              <option value="Chairperson">Chairperson</option>
            </select>
            <button onClick={handleAddMember}>Add Member</button>
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Search by name or status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={handleExport} style={{ marginLeft: "12px" }}>
            Export CSV
          </button>
        </div>

        {loading ? (
          <p>Loading members...</p>
        ) : (
          <div className="member-table">
            <div className="table-header">
              <span>Name</span>
              <span>ID</span>
              <span>Phone</span>
              <span>Role</span>
              <span>Status</span>
              <span>Registered</span>
              <span>Credit Eligible</span>
              <span>Action</span>
            </div>

            {filteredMembers.map((member) => (
              <div className="table-row" key={member.id}>
                <span>{member.name}</span>
                <span>{member.id}</span>
                <span>{member.phone}</span>
                <span>{member.role}</span>
                <span className={`status ${member.status.toLowerCase()}`}>{member.status}</span>
                <span>{member.registrationPaid ? "True" : "False"}</span>
                <span style={{ color: isCreditEligible(member) ? "green" : "red", fontWeight: "bold" }}>
                  {isCreditEligible(member) ? "Eligible" : "Not Eligible"}
                </span>
                <div>
                  <button className="view-btn" onClick={() => setEditingMember(member)}>Edit</button>
                  <button className="view-btn" onClick={() => handleRemoveMember(member.id)} style={{ marginLeft: "6px" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editingMember && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Edit Member</h3>
            <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} />
            <input type="text" value={editingMember.id} onChange={(e) => setEditingMember({ ...editingMember, id: e.target.value })} />
            <input type="text" value={editingMember.phone} onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })} />
            <input type="number" value={editingMember.amountPaid} onChange={(e) => setEditingMember({ ...editingMember, amountPaid: Number(e.target.value) })} />
            <select value={editingMember.role} onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}>
              <option value="Member">Member</option>
              <option value="Treasurer">Treasurer</option>
              <option value="Chairperson">Chairperson</option>
            </select>
            <select value={editingMember.status} onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            <p>
              Credit Eligibility:{" "}
              <span style={{ color: isCreditEligible(editingMember) ? "green" : "red", fontWeight: "bold" }}>
                {isCreditEligible(editingMember) ? "Eligible" : "Not Eligible"}
              </span>
            </p>

            <div className="modal-actions">
              <button className="view-btn" onClick={() => setEditingMember(null)}>Cancel</button>
              <button className="view-btn" onClick={handleSaveEdit}>Save</button>
              {!editingMember.registrationPaid && (
                <button className="view-btn" onClick={() => setEditingMember({ ...editingMember, registrationPaid: true })}>
                  Mark Reg Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Members;
