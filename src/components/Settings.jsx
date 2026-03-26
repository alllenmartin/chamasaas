import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Settings.css";
import { getCutOffDate } from "../utils/dateUtils";

const Settings = () => {
  const [settings, setSettings] = useState({
    contributionAmount: "",
    registrationFee: "",
    frequency: "Monthly",
    cutOffDay: "",
    organizationType: "Savings",
    notificationsEnabled: false,
    notificationDate: "",
    creditMultiplier: "",
    interestRate: "",
    installments: "",
    loanpenalty:"",
  });

  const [errors, setErrors] = useState({});
  const [maxCredit, setMaxCredit] = useState(0);
  const [loading, setLoading] = useState(false); // loader

  const isCreditEnabled =
    settings.organizationType === "Credit" ||
    settings.organizationType === "Both";

  /** Auto-calculate max credit */
  useEffect(() => {
    if (
      isCreditEnabled &&
      settings.contributionAmount &&
      settings.creditMultiplier
    ) {
      setMaxCredit(
        Number(settings.contributionAmount) * Number(settings.creditMultiplier)
      );
    } else {
      setMaxCredit(0);
    }
  }, [settings.contributionAmount, settings.creditMultiplier, isCreditEnabled]);

  /** Fetch settings from backend on mount */
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");

        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Error fetching settings:", err);
        alert("Failed to load settings from server");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /** Validation */
  const validate = () => {
    const newErrors = {};

    if (settings.registrationFee < 0) {
      newErrors.registrationFee = "Registration fee cannot be negative";
    }

    if (!settings.contributionAmount || settings.contributionAmount <= 0) {
      newErrors.contributionAmount =
        "Contribution amount must be greater than 0";
    }

    if (!settings.cutOffDay || settings.cutOffDay < 1 || settings.cutOffDay > 28) {
      newErrors.cutOffDay = "Cut-off day must be between 1 and 28";
    }

    if (settings.notificationsEnabled && !settings.notificationDate) {
      newErrors.notificationDate = "Notification date is required";
    }

    if (isCreditEnabled) {
      if (!settings.creditMultiplier || settings.creditMultiplier < 1) {
        newErrors.creditMultiplier = "Multiplier must be at least 1";
      }

      if (settings.interestRate < 0) {
        newErrors.interestRate = "Interest rate cannot be negative";
      }

      if (!settings.installments || settings.installments < 1) {
        newErrors.installments = "Installments must be at least 1";
      }
       if (settings.loanpenalty < 0) {
        newErrors.loanpenalty = "Interest rate cannot be negative";
      }
      
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Save settings to backend */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      console.log(settings)
    
      const res = await fetch("http://127.0.0.1:5000/api/settings", {
      
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const data = await res.json();
      setSettings(data);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar active="Settings" />

      <main className="main-content">
        <header className="header">
          <h1>Settings</h1>
          <p>Configure contribution and credit rules</p>
        </header>

        {/* Loader Overlay */}
        {loading && (
          <div className="loader-overlay">
            <div className="loader"></div>
          </div>
        )}

        <form
          className="settings-form"
          onSubmit={handleSubmit}
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {/* Contribution */}
          <div className="form-group">
            <label>Contribution Amount (KES)</label>
            <input
              type="number"
              name="contributionAmount"
              value={settings.contributionAmount}
              onChange={handleChange}
            />
            {errors.contributionAmount && (
              <span className="error">{errors.contributionAmount}</span>
            )}
          </div>

          {/* Registration Fee */}
          <div className="form-group">
            <label>Registration Fee (KES)</label>
            <input
              type="number"
              name="registrationFee"
              value={settings.registrationFee}
              onChange={handleChange}
            />
            {errors.registrationFee && (
              <span className="error">{errors.registrationFee}</span>
            )}
          </div>

          {/* Frequency */}
          <div className="form-group">
            <label>Frequency</label>
            <select
              name="frequency"
              value={settings.frequency}
              onChange={handleChange}
            >
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>

          {/* Cut-off */}
          <div className="form-group">
            <label>Cut-off Day of Month</label>
            <input
              type="number"
              name="cutOffDay"
              min="1"
              max="28"
              placeholder="e.g. 14"
              value={settings.cutOffDay}
              onChange={handleChange}
            />
            <small>
              System will calculate the actual cut-off date every month
            </small>
          </div>
          {settings.cutOffDay && (
            <div className="form-group">
              <label>Calculated Cut-off Date (This Month)</label>
              <input
                type="text"
                value={getCutOffDate(settings.cutOffDay).toDateString()}
                disabled
              />
            </div>
          )}

          {/* Org Type */}
          <div className="form-group">
            <label>Organization Type</label>
            <select
              name="organizationType"
              value={settings.organizationType}
              onChange={handleChange}
            >
              <option>Savings</option>
              <option>Credit</option>
              <option>Both</option>
            </select>
          </div>

          {/* Notifications */}
          <label className="checkbox">
            <input
              type="checkbox"
              name="notificationsEnabled"
              checked={settings.notificationsEnabled}
              onChange={handleChange}
            />
            Enable Notifications
          </label>

          {settings.notificationsEnabled && (
            <div className="form-group">
              <label>Notification Date</label>
              <input
                type="date"
                name="notificationDate"
                value={settings.notificationDate}
                onChange={handleChange}
              />
              {errors.notificationDate && (
                <span className="error">{errors.notificationDate}</span>
              )}
            </div>
          )}

          {/* Credit Section */}
          {isCreditEnabled && (
            <>
              <h3>Credit Settings</h3>

              <div className="form-group">
                <label>Credit Multiplier</label>
                <input
                  type="number"
                  name="creditMultiplier"
                  value={settings.creditMultiplier}
                  onChange={handleChange}
                />
                {errors.creditMultiplier && (
                  <span className="error">{errors.creditMultiplier}</span>
                )}
              </div>

              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  name="interestRate"
                  value={settings.interestRate}
                  onChange={handleChange}
                />
                {errors.interestRate && (
                  <span className="error">{errors.interestRate}</span>
                )}
              </div>

              <div className="form-group">
                <label>Installments</label>
                <input
                  type="number"
                  name="installments"
                  value={settings.installments}
                  onChange={handleChange}
                />
                {errors.installments && (
                  <span className="error">{errors.installments}</span>
                )}
              </div>

                 <div className="form-group">
                <label>Loan Penalty %</label>
                <input
                  type="number"
                  name="loanpenalty"
                  value={settings.loanpenalty}
                  onChange={handleChange}
                />
                {errors.loanpenalty && (
                  <span className="error">{errors.loanpenalty}</span>
                )}
              </div>

              {/* Auto-calculated */}
              <div className="form-group">
                <label>Max Credit (Auto-calculated)</label>
                <input type="number" value={maxCredit} disabled />
              </div>
            </>
          )}

          <button className="save-btn" disabled={loading}>
            Save Settings
          </button>
        </form>
      </main>
    </div>
  );
};

export default Settings;
