import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./MemberRegistration.css";

const steps = [
  "Personal Info",
  "Contact Info",
  "Membership",
  "Financial",
  "Employment",
  "Beneficiaries",
  "Review",
];

const MemberRegistration = () => {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    lastName: "",
    nationalId: "",
    gender: "",
    dob: "",
    nationality: "",
    county: "",
    subCounty: "",
    phone: "",
    email: "",
    address: "",
    memberId: "MBR-" + Math.floor(100000 + Math.random() * 900000),
    role: "Member",
    bankName: "",
    branchName: "",
    accountNumber: "",
    employment: "",
    employer: "",
    department: "",
    termsOfEmployment: "",
    businessType: "",
    businessName: "",
    businessLocation: "",
    landmark: "",
  });

  const [beneficiaries, setBeneficiaries] = useState([
    {
      name: "",
      phone: "",
      relation: "",
      share: 0,
      idNumber: "",
      address: "",
      guardian: "",
    },
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  const handleBeneficiaryChange = (index, e) => {
    const values = [...beneficiaries];
    values[index][e.target.name] = e.target.value;
    setBeneficiaries(values);
  };

  const addBeneficiary = () =>
    setBeneficiaries([
      ...beneficiaries,
      { name: "", phone: "", relation: "", share: 0, idNumber: "", address: "", guardian: "" },
    ]);

  const removeBeneficiary = (index) => {
    const values = [...beneficiaries];
    values.splice(index, 1);
    setBeneficiaries(values);
  };

  // Validate required fields per step
  const validateStep = () => {
    switch (step) {
      case 0:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.nationalId &&
          formData.gender &&
          formData.dob
        );
      case 1:
        return formData.nationality && formData.county && formData.subCounty && formData.phone;
      case 2:
        return formData.memberId && formData.role;
      case 3:
        return formData.bankName && formData.branchName && formData.accountNumber;
      case 4:
        if (!formData.employment) return false;
        if (formData.employment === "Employed") {
          return formData.employer && formData.department && formData.termsOfEmployment;
        }
        if (formData.employment === "Self Employed") {
          return formData.businessType && formData.businessName && formData.businessLocation;
        }
        return false;
      case 5:
        const totalShare = beneficiaries.reduce((sum, b) => sum + Number(b.share), 0);
        const allFilled = beneficiaries.every((b) => b.name && b.relation && b.share);
        return allFilled && totalShare === 100;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep()) {
      alert("Please complete all required fields in this step before continuing.");
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const totalShare = beneficiaries.reduce((sum, b) => sum + Number(b.share), 0);

  const saveMember = () => {
    const data = { ...formData, beneficiaries };
    console.log("Member Saved:", data);
    alert("Member saved successfully! Check console for data.");
  };

  return (
    <div className="dashboard">
      <Sidebar active="Members" />
      <main className="main-content">
        <div className="registration-container">
          <h2>Member Registration</h2>

          {/* HORIZONTAL WIZARD */}
          <div className="wizard-progress">
            {steps.map((s, index) => (
              <div
                key={index}
                className={`wizard-step ${index <= step ? "active" : ""} ${index > step ? "disabled" : ""}`}
                onClick={() => {
                  if (index <= step) setStep(index); // cannot jump ahead
                }}
              >
                <div className="step-circle">{index < step ? "✓" : index + 1}</div>
                <div className="step-title">{s}</div>
              </div>
            ))}
            <div
              className="progress-line"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
          </div>

          <div className="registration-form">
            <h3>{steps[step]}</h3>

            {/* STEP 0: PERSONAL INFO */}
            {step === 0 && (
              <div className="form-grid">
                <div className="photo-upload">
                  <label>
                    {photo ? (
                      <img src={photo} alt="preview" className="photo-preview" />
                    ) : (
                      <div className="photo-circle">Upload Photo</div>
                    )}
                    <input type="file" hidden onChange={handlePhoto} />
                  </label>
                </div>
                <input name="firstName" placeholder="First Name" onChange={handleChange} />
                <input name="secondName" placeholder="Second Name" onChange={handleChange} />
                <input name="lastName" placeholder="Last Name" onChange={handleChange} />
                <input name="nationalId" placeholder="National ID" onChange={handleChange} />
                <select name="gender" onChange={handleChange}>
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
                <input type="date" name="dob" onChange={handleChange} />
              </div>
            )}

            {/* STEP 1: CONTACT */}
            {step === 1 && (
              <div className="form-grid">
                <input name="nationality" placeholder="Nationality" onChange={handleChange} />
                <input name="county" placeholder="County" onChange={handleChange} />
                <input name="subCounty" placeholder="Sub County" onChange={handleChange} />
                <input name="phone" placeholder="Phone" onChange={handleChange} />
                <input name="email" placeholder="Email" onChange={handleChange} />
                <input name="address" placeholder="Address" onChange={handleChange} />
              </div>
            )}

            {/* STEP 2: MEMBERSHIP */}
            {step === 2 && (
              <div className="form-grid">
                <input value={formData.memberId} readOnly />
                <select name="role" onChange={handleChange}>
                  <option>Member</option>
                  <option>Chairperson</option>
                  <option>Treasurer</option>
                </select>
              </div>
            )}

            {/* STEP 3: FINANCIAL */}
            {step === 3 && (
              <div className="form-grid">
                <input name="bankName" placeholder="Bank Name" onChange={handleChange} />
                <input name="branchName" placeholder="Branch Name" onChange={handleChange} />
                <input name="accountNumber" placeholder="Account Number" onChange={handleChange} />
              </div>
            )}

            {/* STEP 4: EMPLOYMENT */}
            {step === 4 && (
              <div className="form-grid">
                <select name="employment" onChange={handleChange} value={formData.employment}>
                  <option value="">Employment Status</option>
                  <option>Employed</option>
                  <option>Self Employed</option>
                </select>

                {formData.employment === "Employed" && (
                  <>
                    <input name="employer" placeholder="Employer Name" onChange={handleChange} value={formData.employer} />
                    <input name="department" placeholder="Department" onChange={handleChange} value={formData.department} />
                    <input name="termsOfEmployment" placeholder="Terms of Employment" onChange={handleChange} value={formData.termsOfEmployment || ""} />
                  </>
                )}

                {formData.employment === "Self Employed" && (
                  <>
                    <input name="businessType" placeholder="Business Type" onChange={handleChange} value={formData.businessType || ""} />
                    <input name="businessName" placeholder="Business Name" onChange={handleChange} value={formData.businessName || ""} />
                    <input name="businessLocation" placeholder="Business Location" onChange={handleChange} value={formData.businessLocation || ""} />
                    <input name="landmark" placeholder="Landmark" onChange={handleChange} value={formData.landmark || ""} />
                  </>
                )}
              </div>
            )}

            {/* STEP 5: BENEFICIARIES */}
            {step === 5 && (
              <div>
                {beneficiaries.map((b, index) => (
                  <div key={index} className="beneficiary-card-vertical">
                    <input name="name" placeholder="Name" value={b.name} onChange={(e) => handleBeneficiaryChange(index, e)} />
                    <input name="phone" placeholder="Phone" value={b.phone} onChange={(e) => handleBeneficiaryChange(index, e)} />
                    <input name="relation" placeholder="Relation" value={b.relation} onChange={(e) => handleBeneficiaryChange(index, e)} />
                    <input type="number" name="share" placeholder="Share %" value={b.share} onChange={(e) => handleBeneficiaryChange(index, e)} />
                    <input name="idNumber" placeholder="ID Number" value={b.idNumber} onChange={(e) => handleBeneficiaryChange(index, e)} />
                    <input name="address" placeholder="Address" value={b.address} onChange={(e) => handleBeneficiaryChange(index, e)} />
                    <input name="guardian" placeholder="Guardian (if minor)" value={b.guardian} onChange={(e) => handleBeneficiaryChange(index, e)} />
                    {index > 0 && <button className="remove-kin" onClick={() => removeBeneficiary(index)}>Remove</button>}
                  </div>
                ))}
                <button className="add-kin" onClick={addBeneficiary}>+ Add Another Beneficiary</button>
                <p>Total Share: {totalShare}%</p>
              </div>
            )}

            {/* STEP 6: REVIEW */}
        {/* STEP 6: REVIEW */}
{step === 6 && (
  <div className="review-box">
    <h3>Member Details</h3>
    {Object.entries(formData).map(([k, v]) => (
      <div key={k} className="review-field">
        <strong>{k}</strong>
        <span>{v}</span>
      </div>
    ))}

    <h4>Beneficiaries</h4>
    {beneficiaries.map((b, i) => (
      <div key={i} className="beneficiary-card-review">
        <p><strong>Name:</strong> {b.name}</p>
        <p><strong>Phone:</strong> {b.phone}</p>
        <p><strong>Relation:</strong> {b.relation}</p>
        <p><strong>Share:</strong> {b.share}%</p>
        <p><strong>ID:</strong> {b.idNumber}</p>
        <p><strong>Address:</strong> {b.address}</p>
        <p><strong>Guardian:</strong> {b.guardian}</p>
      </div>
    ))}

    <div className="review-buttons">
      <button className="prev-btn" onClick={prevStep}>Previous</button>
      <button className="save-btn" onClick={saveMember}>Save Member</button>
    </div>
  </div>
)}

            {/* NAVIGATION */}
            <div className="wizard-buttons">
              {step > 0 && <button className="prev-btn" onClick={prevStep}>Previous</button>}
              {step < steps.length - 1 ? (
                <button className="next-btn" onClick={nextStep}>Next</button>
              ) : (
                <button className="save-btn" onClick={saveMember}>Save Member</button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberRegistration;