// src/PublicRoute.js
import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading)
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    background: "#f0f2f5",
                }}
            >
                <img src="/logo.svg" alt="Logo" style={{ width: "100px" }} />
            </div>
        );
    // If the user exists and has a displayName, redirect to Home.
    if (user && user.displayName) return <Navigate to="/" replace />;
    return children;
};

export default PublicRoute;
