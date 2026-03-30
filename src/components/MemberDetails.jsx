import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Members.css";
//import "./MemberDetails.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/members`);
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        const memberData = data.find((m) => m.id === Number(id));
        if (!memberData) {
          toast.error("Member not found");
        }
        setMember(memberData || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load member details");
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  const renderTab = () => {
    if (!member) return null;

    switch (activeTab) {
      case "personal":
        return (
          <div className="tab-content">
            <p><strong>Full Name:</strong> {member.name}</p>
            <p><strong>Gender:</strong> {member.gender}</p>
            <p><strong>Date of Birth:</strong> {member.dob}</p>
            <p><strong>Status:</strong> {member.status || "N/A"}</p>
            <p><strong>National ID:</strong> {member.nationalId || "N/A"}</p>
          </div>
        );

      case "contact":
        return (
          <div className="tab-content">
            <p><strong>Phone:</strong> {member.phone}</p>
            <p><strong>Email:</strong> {member.email || "N/A"}</p>
            <p><strong>Address:</strong> {member.address || "N/A"}</p>
            <p><strong>County:</strong> {member.county || "N/A"}</p>
            <p><strong>Sub County:</strong> {member.subcounty || member.cubcounty || "N/A"}</p>
            <p><strong>Nationality:</strong> {member.nationality || "N/A"}</p>
          </div>
        );

      case "membership":
        return (
          <div className="tab-content">
            <p><strong>Membership ID:</strong> {member.id}</p>
            <p><strong>Role:</strong> {member.role}</p>
            <p><strong>Registered:</strong> {member.registrationPaid ? "Yes" : "No"}</p>
          </div>
        );

      case "financial":
        return (
          <div className="tab-content">
            <p><strong>Bank Code:</strong> {member.bankCode || "N/A"}</p>
            <p><strong>Bank Name:</strong> {member.bankName || "N/A"}</p>
            <p><strong>Branch Code:</strong> {member.branchCode || "N/A"}</p>
            <p><strong>Branch Name:</strong> {member.branchName || "N/A"}</p>
            <p><strong>Bank Account No.:</strong> {member.bankAccountNumber || "N/A"}</p>
          </div>
        );

      case "employment":
        return (
          <div className="tab-content">
            <p><strong>Employment Type:</strong> {member.employmentType || "N/A"}</p>
            {member.employmentType === "self-employed" && (
              <>
                <p><strong>Business Name:</strong> {member.businessName || "N/A"}</p>
                <p><strong>Business Type:</strong> {member.otherBusinessType || "N/A"}</p>
                <p><strong>Business Location:</strong> {member.businessLocation || "N/A"}</p>
                <p><strong>Landmark:</strong> {member.landmark || "N/A"}</p>
                <p><strong>Longitude:</strong> {member.longitude || "N/A"}</p>
                <p><strong>Latitude:</strong> {member.latitude || "N/A"}</p>
              </>
            )}
            {member.employmentType === "employed" && (
              <>
                <p><strong>Employer Name:</strong> {member.employerName || "N/A"}</p>
                <p><strong>Employer Code:</strong> {member.employerCode || "N/A"}</p>
                <p><strong>Department:</strong> {member.departmentName || member.memberDepartment || "N/A"}</p>
                <p><strong>Terms of Employment:</strong> {member.termsOfEmployment || "N/A"}</p>
                <p><strong>Payroll/Staff No:</strong> {member.payrollNumber || "N/A"}</p>
                <p><strong>Appointment Date:</strong> {member.appointmentDate || "N/A"}</p>
              </>
            )}
          </div>
        );

      case "emergency":
        return (
          <div className="tab-content">
            {member.nextOfKin && member.nextOfKin.length > 0 ? (
              member.nextOfKin.map((kin, idx) => (
                <div key={idx} style={{ marginBottom: "8px" }}>
                  <p><strong>Name:</strong> {kin.name}</p>
                  <p><strong>Phone:</strong> {kin.phone}</p>
                  <p><strong>Relationship:</strong> {kin.relation}</p>
                </div>
              ))
            ) : (
              <p>No next of kin information.</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Members" />
      <main className="main-content">
        <button onClick={() => navigate(-1)} style={{ marginBottom: "12px" }}>
          ← Back to Members
        </button>
        {loading ? (
          <p>Loading member details...</p>
        ) : member ? (
          <>
            <h1>{member.name}</h1>

            {/* Tabs Navigation */}
            <div className="tabs">
              {[
                { key: "personal", label: "Personal Info" },
                { key: "contact", label: "Contact Info" },
                { key: "membership", label: "Membership Details" },
                { key: "financial", label: "Financial Info" },
                { key: "employment", label: "Employment / Income" },
                { key: "emergency", label: "Next of Kin" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={activeTab === tab.key ? "active-tab" : ""}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            {renderTab()}
          </>
        ) : (
          <p>Member not found</p>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
};

export default MemberDetails;