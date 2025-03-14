// src/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user || !user.displayName) {
        // If there's no user or displayName is missing, redirect to /auth.
        return <Navigate to="/auth" replace />;
    }
    return children;
};

export default ProtectedRoute;
