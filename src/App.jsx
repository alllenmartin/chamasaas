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


const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

<Route path="/members/register" element={<MemberRegistration />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/repayment_schedule"
        element={
          <ProtectedRoute>
            <LoanCalculator />
          </ProtectedRoute>
        }
      />

      <Route path="/product-setup" element={<ProductSetup />} />

      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/:id"
        element={
          <ProtectedRoute>
            <MemberDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        }
      />

      <Route
        path="/members/:id"
        element={
          <ProtectedRoute>
            <MemberDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/credit-security/:memberId"
        element={<MemberCreditSecurity />}
      />

      <Route
        path="/contributions"
        element={
          <ProtectedRoute>
            <MemberContributions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/credit"
        element={
          <ProtectedRoute>
            <MemberCredit />
          </ProtectedRoute>
        }
      />

      <Route
        path="/credit-list"
        element={
          <ProtectedRoute>
            <CreditList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credit/:loanId"
        element={
          <ProtectedRoute>
            <CreditCard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <VendorList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendors/ledger"
        element={
          <ProtectedRoute>
            <VendorLedger />
          </ProtectedRoute>
        }
      />

      {/* Optional: protect registration (admin only later) */}
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <UserRegister />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
