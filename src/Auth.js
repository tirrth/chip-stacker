// src/Auth.js
import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router";

const Auth = () => {
    // Steps: "phone" → "otp" → "name"
    const navigate = useNavigate()
    const [step, setStep] = useState("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [message, setMessage] = useState("");

    // Initialize reCAPTCHA using the container from public/index.html
    useEffect(() => {
        const recaptchaContainer = document.getElementById("recaptcha-container");
        if (!window.recaptchaVerifier && recaptchaContainer) {
            window.recaptchaVerifier = new RecaptchaVerifier(
                recaptchaContainer,
                {
                    size: "invisible",
                    callback: () => {
                        console.log("reCAPTCHA solved");
                    },
                },
                auth
            );
            window.recaptchaVerifier.render().then((widgetId) => {
                console.log("reCAPTCHA rendered with widgetId:", widgetId);
            });
        }
    }, []);

    // Send OTP and move to the OTP step
    const sendOtp = () => {
        const appVerifier = window.recaptchaVerifier;
        signInWithPhoneNumber(auth, phone, appVerifier)
            .then((result) => {
                setConfirmationResult(result);
                setMessage("OTP sent! Please check your phone.");
                setStep("otp");
            })
            .catch((error) => {
                console.error("Error during signInWithPhoneNumber", error);
                setMessage("Error sending OTP. Please try again.");
            });
    };

    // Verify OTP and, if successful, move to name step if needed
    const verifyOtp = () => {
        if (confirmationResult) {
            confirmationResult
                .confirm(otp)
                .then((result) => {
                    const verifiedUser = result.user;
                    // If the user does not have a displayName, prompt for their name.
                    if (!verifiedUser.displayName) {
                        setStep("name");
                    } else {
                        setMessage("User signed in successfully!");
                    }
                })
                .catch((error) => {
                    console.error("Error verifying OTP", error);
                    setMessage("Invalid OTP. Please try again.");
                });
        }
    };

    // Submit the name to update the user profile
    const submitName = () => {
        const currentUser = auth.currentUser;
        if (currentUser && name.trim() !== "") {
            updateProfile(currentUser, { displayName: name })
                .then(() => {
                    setMessage("User registered and signed in successfully!");
                    navigate('/');
                })
                .catch((error) => {
                    console.error("Error updating profile", error);
                    setMessage("Error updating profile.");
                });
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}>
            <h2>Phone Authentication</h2>
            {step === "phone" && (
                <div>
                    <input
                        type="text"
                        placeholder="+1234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
                    />
                    <button onClick={sendOtp} style={{ padding: "0.5rem 1rem" }}>
                        Send OTP
                    </button>
                </div>
            )}
            {step === "otp" && (
                <div>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
                    />
                    <button onClick={verifyOtp} style={{ padding: "0.5rem 1rem" }}>
                        Verify OTP
                    </button>
                </div>
            )}
            {step === "name" && (
                <div>
                    <p>Please enter your name to complete registration</p>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
                    />
                    <button onClick={submitName} style={{ padding: "0.5rem 1rem" }}>
                        Submit Name
                    </button>
                </div>
            )}
            {message && <p>{message}</p>}
        </div>
    );
};

export default Auth;
