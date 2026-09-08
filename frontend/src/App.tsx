import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Posts from "./pages/Posts";
import Editor from "./pages/Editor";
import Scheduled from "./pages/Scheduled";
import ApiKeys from "./pages/ApiKeys";
import Account from "./pages/Account";

import DashboardLayout from "./components/layout/DashboardLayout";
import { getToken } from "./services/api";

function ProtectedLayout() {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
}

function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      {/* Protected dashboard */}
      <Route element={<ProtectedLayout />}>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/posts"
          element={<Posts />}
        />

        <Route
          path="/editor"
          element={<Editor />}
        />

        <Route
          path="/editor/:id"
          element={<Editor />}
        />

        <Route
          path="/scheduled"
          element={<Scheduled />}
        />

        <Route
          path="/api-keys"
          element={<ApiKeys />}
        />

        <Route
          path="/account"
          element={<Account />}
        />
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;