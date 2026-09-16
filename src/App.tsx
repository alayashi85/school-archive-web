import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import StudentsPage from "./pages/StudentsPage";
import StudentFormPage from "./pages/StudentFormPage";
import UsersPage from "./pages/UsersPage";
import ExportPdfPage from "./pages/ExportPdfPage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const storedUser =
    localStorage.getItem(
      "user"
    );

  if (!storedUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const user =
      JSON.parse(
        storedUser
      );

    if (
      user.role !== "ADMIN"
    ) {
      return (
        <Navigate
          to="/students"
          replace
        />
      );
    }
  } catch {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/new"
        element={
          <ProtectedRoute>
            <StudentFormPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/:id/edit"
        element={
          <ProtectedRoute>
            <StudentFormPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/export"
        element={
          <ProtectedRoute>
            <ExportPdfPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <AdminRoute>
            <SettingsPage />
          </AdminRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/students"
            replace
          />
        }
      />
    </Routes>
  );
}