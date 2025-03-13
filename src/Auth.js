// src/Auth.js
import React, { useState } from 'react';
import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from "firebase/auth";

const Auth = () => {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [message, setMessage] = useState("");

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(
                'recaptcha-container',
                {
                    size: 'invisible',
                    callback: (response) => {
                        console.log("reCAPTCHA solved");
                    }
                },
                auth
            );
            // Render the reCAPTCHA widget explicitly
            window.recaptchaVerifier.render().then((widgetId) => {
                console.log("reCAPTCHA rendered with widgetId:", widgetId);
            });
        }
    };

    // Send OTP to the provided phone number
    const sendOtp = () => {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        signInWithPhoneNumber(auth, phone, appVerifier)
            .then((result) => {
                setConfirmationResult(result);
                setMessage("OTP sent! Please check your phone.");
            })
            .catch((error) => {
                console.error("Error during signInWithPhoneNumber", error);
                setMessage("Error sending OTP. Please try again.");
            });
    };

    // Verify the OTP and update the user profile if needed
    const verifyOtp = () => {
        if (confirmationResult) {
            confirmationResult.confirm(otp)
                .then((result) => {
                    const user = result.user;
                    // If the user doesn't have a displayName and a name is provided, update the profile
                    if (user && !user.displayName && name.trim() !== "") {
                        updateProfile(user, { displayName: name })
                            .then(() => {
                                setMessage("User registered and signed in successfully!");
                            })
                            .catch((error) => {
                                console.error("Error updating profile", error);
                                setMessage("Error updating profile.");
                            });
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

    return (
        <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
            <h2>Phone Authentication</h2>
            {/* If OTP hasn't been sent, show phone input */}
            {!confirmationResult ? (
                <div>
                    <input
                        type="text"
                        placeholder="+1234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                    />
                    <button onClick={sendOtp} style={{ padding: '0.5rem 1rem' }}>
                        Send OTP
                    </button>
                </div>
            ) : (
                <div>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                    />
                    {/* If the current user doesn't have a displayName, prompt for a name */}
                    {(!auth.currentUser || !auth.currentUser.displayName) && (
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                        />
                    )}
                    <button onClick={verifyOtp} style={{ padding: '0.5rem 1rem' }}>
                        Verify OTP
                    </button>
                </div>
            )}
            <div id="recaptcha-container"></div>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Auth;
