import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Members.css";

const steps = [
  "Personal Information",
  "Contact Information",
  "Membership Details",
  "Financial Details",
  "Employment Details",
  "Next Of Kin"
];

const generateMemberId = () =>
  "MEM" + Math.floor(100000 + Math.random() * 900000);

const MembersRegistrationWizard = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);

  const initialState = {
    id: generateMemberId(),
    fname: "",
    sname: "",
    lname: "",
    nationalId: "",
    gender: "Male",
    dob: "",

    nationality: "",
    county: "",
    subcounty: "",
    phone: "",
    email: "",
    address: "",

    role: "Member",

    bankName: "",
    branchName: "",
    accountNumber: "",

    employmentType: "",
    employerName: "",
    department: "",

    businessName: "",
    businessLocation: "",

    nextOfKin: [{ name: "", phone: "", relation: "" }],

    registrationPaid: false
  };

  const [form, setForm] = useState(initialState);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/members");
      const data = await res.json();
      setMembers(data);
    } catch {
      toast.error("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const nextStep = () => {
    if (step === 0 && (!form.fname || !form.lname)) {
      toast.error("First and Last Name required");
      return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const addNextOfKin = () => {
    setForm({
      ...form,
      nextOfKin: [...form.nextOfKin, { name: "", phone: "", relation: "" }]
    });
  };

  const updateKin = (index, field, value) => {
    const updated = [...form.nextOfKin];
    updated[index][field] = value;

    setForm({
      ...form,
      nextOfKin: updated
    });
  };

  const saveMember = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const saved = await res.json();

      setMembers([...members, saved]);

      toast.success("Member registered successfully");

      setForm(initialState);
      setStep(0);
      setShowForm(false);
    } catch {
      toast.error("Failed to register member");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <input placeholder="First Name" value={form.fname}
              onChange={e => handleChange("fname", e.target.value)} />

            <input placeholder="Second Name" value={form.sname}
              onChange={e => handleChange("sname", e.target.value)} />

            <input placeholder="Last Name" value={form.lname}
              onChange={e => handleChange("lname", e.target.value)} />

            <input placeholder="National ID"
              value={form.nationalId}
              onChange={e => handleChange("nationalId", e.target.value)} />

            <select value={form.gender}
              onChange={e => handleChange("gender", e.target.value)}>
              <option>Male</option>
              <option>Female</option>
            </select>

            <input type="date"
              value={form.dob}
              onChange={e => handleChange("dob", e.target.value)} />
          </>
        );

      case 1:
        return (
          <>
            <input placeholder="Nationality"
              value={form.nationality}
              onChange={e => handleChange("nationality", e.target.value)} />

            <input placeholder="County"
              value={form.county}
              onChange={e => handleChange("county", e.target.value)} />

            <input placeholder="Sub County"
              value={form.subcounty}
              onChange={e => handleChange("subcounty", e.target.value)} />

            <input placeholder="Phone"
              value={form.phone}
              onChange={e => handleChange("phone", e.target.value)} />

            <input placeholder="Email"
              value={form.email}
              onChange={e => handleChange("email", e.target.value)} />

            <input placeholder="Address"
              value={form.address}
              onChange={e => handleChange("address", e.target.value)} />
          </>
        );

      case 2:
        return (
          <>
            <input value={form.id} disabled />

            <select value={form.role}
              onChange={e => handleChange("role", e.target.value)}>
              <option>Member</option>
              <option>Chairperson</option>
              <option>Treasurer</option>
            </select>
          </>
        );

      case 3:
        return (
          <>
            <input placeholder="Bank Name"
              value={form.bankName}
              onChange={e => handleChange("bankName", e.target.value)} />

            <input placeholder="Branch Name"
              value={form.branchName}
              onChange={e => handleChange("branchName", e.target.value)} />

            <input placeholder="Account Number"
              value={form.accountNumber}
              onChange={e => handleChange("accountNumber", e.target.value)} />
          </>
        );

      case 4:
        return (
          <>
            <select value={form.employmentType}
              onChange={e => handleChange("employmentType", e.target.value)}>
              <option value="">Employment Type</option>
              <option value="employed">Employed</option>
              <option value="self">Self Employed</option>
            </select>

            {form.employmentType === "employed" && (
              <>
                <input placeholder="Employer"
                  value={form.employerName}
                  onChange={e => handleChange("employerName", e.target.value)} />

                <input placeholder="Department"
                  value={form.department}
                  onChange={e => handleChange("department", e.target.value)} />
              </>
            )}

            {form.employmentType === "self" && (
              <>
                <input placeholder="Business Name"
                  value={form.businessName}
                  onChange={e => handleChange("businessName", e.target.value)} />

                <input placeholder="Business Location"
                  value={form.businessLocation}
                  onChange={e => handleChange("businessLocation", e.target.value)} />
              </>
            )}
          </>
        );

      case 5:
        return (
          <>
            {form.nextOfKin.map((kin, i) => (
              <div key={i}>
                <input placeholder="Name"
                  value={kin.name}
                  onChange={e => updateKin(i, "name", e.target.value)} />

                <input placeholder="Phone"
                  value={kin.phone}
                  onChange={e => updateKin(i, "phone", e.target.value)} />

                <input placeholder="Relation"
                  value={kin.relation}
                  onChange={e => updateKin(i, "relation", e.target.value)} />
              </div>
            ))}

            <button onClick={addNextOfKin}>
              + Add Next Of Kin
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Members" />

      <main className="main-content">

        <h1>Members Registration</h1>

        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "+ Register Member"}
        </button>

        {showForm && (
          <div className="wizard">

            <div className="step-indicator">
              {steps.map((s, i) => (
                <div key={i}
                  className={`step ${i <= step ? "active" : ""}`}>
                  {i + 1}
                </div>
              ))}
            </div>

            <h3>{steps[step]}</h3>

            {renderStep()}

            <div className="wizard-buttons">

              {step > 0 && (
                <button onClick={prevStep}>Previous</button>
              )}

              {step < steps.length - 1 ? (
                <button onClick={nextStep}>Next</button>
              ) : (
                <button onClick={saveMember}>Finish</button>
              )}

            </div>

          </div>
        )}

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
              </tr>
            </thead>

            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.fname} {m.lname}</td>
                  <td>{m.id}</td>
                  <td>{m.phone}</td>
                  <td>{m.role}</td>
                  <td>{m.registrationPaid ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <ToastContainer autoClose={3000} />

      </main>
    </div>
  );
};

export default MembersRegistrationWizard;