import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuthStore();
  const { slug } = useParams<{ slug: string }>();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={slug ? `/${slug}` : "/"} replace />;
  }

  if (slug && user.tenant_slug && user.tenant_slug !== slug) {
    return <Navigate to={`/admin/${user.tenant_slug}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
