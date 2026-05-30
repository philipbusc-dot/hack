import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/AuthContext";
import { Spinner } from "../components/ui";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optionally require a specific role (e.g. "admin"). */
  role?: "admin";
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted">
        <Spinner /> Authenticating…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/ai" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
