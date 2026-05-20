import { Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Members from "./components/Members";
import MemberDetail from "./components/MembersRegistrationWizard";
import MemberContributions from "./components/MemberContributions";
import MemberCredit from "./components/MemberCredit";
import CreditList from "./components/CreditList";
import UserRegister from "./components/UserRegister";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./components/Unauthorized";
import CreditCard from "./components/CreditCard";
import VendorLedger from "./components/VendorLedger";
import VendorList from "./components/VendorList";
import LoanCalculator from "./components/LoanCalculator";
import MemberCreditSecurity from "./components/MemberCreditSecurity";
import MemberDetails from "./components/MemberDetails";
import MemberRegistration from "./components/MemberRegistration";
import ProductSetup from "./pages/ProductSetup";
import LoanRepayment from "./components/LoanRepayment";
import Accounts from "./components/Accounts";
// import LoanProductForm from "./components/ProductFactory/LoansProductFactory";
import LoanProductList from "./components/ProductFactory/LoanProductList";
import LoanProductForm from "./components/ProductFactory/LoanProductForm";
import EditLoanProduct from "./components/ProductFactory/EditLoanProduct";
import ViewLoanProduct from "./components/ProductFactory/ViewLoanProduct";
import ReceiptJournal from "./components/Receipt";
import MemberOverview from "./components/MemberOverview";


const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route path="/" element={ <ProtectedRoute>  <Dashboard /> </ProtectedRoute>  } />
      <Route path="/members/register" element={<ProtectedRoute><MemberRegistration /></ProtectedRoute>} />
      <Route path="/settings"  element={   <ProtectedRoute>  <Settings />  </ProtectedRoute>  }    />
      <Route path="/repayment_schedule" element={<ProtectedRoute> <LoanCalculator /> </ProtectedRoute>}/>
      <Route path="/product-setup" element={<ProtectedRoute><ProductSetup /></ProtectedRoute>} />
      <Route path="/loan_journal" element={<ProtectedRoute><LoanRepayment /></ProtectedRoute>} />
      <Route path="/receipt_journal" element={<ProtectedRoute><ReceiptJournal /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>}/>
      <Route  path="/members/:id"  element={<ProtectedRoute><MemberDetails /></ProtectedRoute>} />
      <Route  path="/members" element={  <ProtectedRoute> <Members />  </ProtectedRoute>}/>
      <Route  path="/members/:member_id"  element={ <ProtectedRoute>  <MemberDetail /> </ProtectedRoute> } />
      <Route  path="/credit-security/:loanId" element={<MemberCreditSecurity />} />
      {/* <Route path="/loans/:loanId/security" element={<MemberCreditSecurity />} /> */}
      <Route path="/contributions" element={ <ProtectedRoute>  <MemberContributions /> </ProtectedRoute> } />
      <Route path="/credit"  element={ <ProtectedRoute>  <MemberCredit />   </ProtectedRoute> }/>
      <Route path="/credit-list" element={<ProtectedRoute>   <CreditList /> </ProtectedRoute> }/>
      <Route path="/credit/:loanId"  element={  <ProtectedRoute>  <CreditCard /> </ProtectedRoute> }/>
      <Route path="/vendors"  element={ <ProtectedRoute>  <VendorList />  </ProtectedRoute> }/>
      <Route path="/vendors/ledger"  element={ <ProtectedRoute>  <VendorLedger /> </ProtectedRoute> }/>
      <Route path="/loan-products"  element={ <ProtectedRoute>  <LoanProductList /> </ProtectedRoute> }/>
      <Route path="/loan-products/new" element={<ProtectedRoute> <LoanProductForm mode="create" /> </ProtectedRoute>} />
      <Route path="/loan-products/edit/:id" element={<ProtectedRoute> <EditLoanProduct /> </ProtectedRoute>} />
      <Route path="/loan-products/view/:id" element={<ProtectedRoute> <ViewLoanProduct /> </ProtectedRoute>} />
      {/* Optional: protect registration (admin only later) */}
      <Route path="/register"  element={  <ProtectedRoute>   <UserRegister />  </ProtectedRoute>} />
      <Route path="/coa"  element={  <ProtectedRoute>   <Accounts />  </ProtectedRoute>} />

      <Route path="/members/:memberId/overview" element={<MemberOverview />} />
    </Routes>
  );
};

export default App;
