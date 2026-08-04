import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Wait for the initial /api/auth/me check before deciding — otherwise
    // a logged-in user gets bounced to /login for a flash on every refresh.
    if (loading) return <p className="empty-state">Loading…</p>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;