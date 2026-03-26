const SavingsProductFeatures = () => {

  return (

    <div className="features-section">

      <h3>Savings Features</h3>

      <label>Minimum Balance</label>
      <input type="number"/>

      <label>Withdrawal Fee</label>
      <input type="number"/>

      <label>Interest Rate</label>
      <input type="number"/>

      <label>Allow Overdraft</label>
      <select>
        <option>No</option>
        <option>Yes</option>
      </select>

    </div>

  );

};

export default SavingsProductFeatures;