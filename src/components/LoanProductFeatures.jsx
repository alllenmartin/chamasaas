const LoanProductFeatures = () => {

  return (

    <div className="features-section">

      <h3>Loan Features</h3>

      <label>Interest Rate (%)</label>
      <input type="number"/>

      <label>Minimum Amount</label>
      <input type="number"/>

      <label>Maximum Amount</label>
      <input type="number"/>

      <label>Installments</label>
      <input type="number"/>

      <label>Calculation Method</label>
      <select>
        <option>Reducing Balance</option>
        <option>Flat Rate</option>
      </select>

      <label>Processing Fee</label>
      <input type="number"/>

    </div>

  );

};

export default LoanProductFeatures;