import { Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Members from "./components/Members";
import MemberContributions from "./components/MemberContributions";
import MemberCredit from "./components/MemberCredit";
import CreditList from "./components/CreditList";
import UserRegister from "./components/UserRegister";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./components/Unauthorized";


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

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
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
