// src/PublicRoute.js
import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    // If the user exists and has a displayName, redirect to Home.
    if (user && user.displayName) return <Navigate to="/" replace />;
    return children;
};

export default PublicRoute;
