// src/Auth.js
import React, { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router";
import { Form, Input, Button, Typography, Space } from "antd";

const { Title, Text } = Typography;
const OTP_LENGTH = 6;

// Helper function to format digits as (123) 456-7890
const formatPhoneNumber = (digits) => {
    if (!digits) return "";
    if (digits.length <= 3) return "(" + digits;
    if (digits.length <= 6)
        return "(" + digits.slice(0, 3) + ") " + digits.slice(3);
    return (
        "(" +
        digits.slice(0, 3) +
        ") " +
        digits.slice(3, 6) +
        "-" +
        digits.slice(6, 10)
    );
};

const Auth = () => {
    const navigate = useNavigate();

    // Steps: "phone" → "otp" → "name"
    const [step, setStep] = useState("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [name, setName] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error"); // "error" or "success"

    // Loading states for each action
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [nameLoading, setNameLoading] = useState(false);

    // Refs for OTP input fields
    const otpInputRefs = useRef([]);

    // When step changes to "otp", focus the first OTP input
    useEffect(() => {
        if (step === "otp") {
            otpInputRefs.current[0]?.focus();
        }
    }, [step]);

    // Initialize reCAPTCHA using container from public/index.html
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

    // Handle phone input change and format as (123) 456-7890
    const handlePhoneChange = (e) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, "");
        const formatted = formatPhoneNumber(digits);
        setPhone(formatted);
    };

    // Handle sending OTP; remove formatting and prepend "+1"
    const handleSendOtp = () => {
        setPhoneLoading(true);
        const appVerifier = window.recaptchaVerifier;
        const digits = phone.replace(/\D/g, "");
        const fullPhoneNumber = "+1" + digits;
        signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier)
            .then((result) => {
                setConfirmationResult(result);
                setMessage("OTP sent! Please check your phone.");
                setMessageType("success");
                setStep("otp");
            })
            .catch((error) => {
                console.error("Error during signInWithPhoneNumber", error);
                setMessage("Error sending OTP. Please try again.");
                setMessageType("error");
            })
            .finally(() => {
                setPhoneLoading(false);
            });
    };

    // Handle OTP input change for each digit
    const handleOtpChange = (e, index) => {
        const { value } = e.target;
        if (/^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value.slice(-1);
            setOtp(newOtp);
            if (value && index < OTP_LENGTH - 1) {
                otpInputRefs.current[index + 1]?.focus();
            }
            if (newOtp.every((digit) => digit !== "")) {
                handleVerifyOtp(newOtp.join(""));
            }
        }
    };

    // Handle backspace: if current input is empty, move focus back and clear previous input
    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const newOtp = [...otp];
            newOtp[index - 1] = "";
            setOtp(newOtp);
            otpInputRefs.current[index - 1]?.focus();
            e.preventDefault();
        }
    };

    // Verify OTP and then prompt for name if needed
    const handleVerifyOtp = (otpCodeParam) => {
        setOtpLoading(true);
        const otpCode = otpCodeParam || otp.join("");
        if (confirmationResult) {
            confirmationResult
                .confirm(otpCode)
                .then((result) => {
                    const verifiedUser = result.user;
                    if (!verifiedUser.displayName) {
                        setStep("name");
                    } else {
                        setMessage("User signed in successfully!");
                        setMessageType("success");
                        navigate("/");
                    }
                })
                .catch((error) => {
                    console.error("Error verifying OTP", error);
                    setMessage("Invalid OTP. Please try again.");
                    setMessageType("error");
                })
                .finally(() => {
                    setOtpLoading(false);
                });
        }
    };

    // Submit the name to update the user's profile
    const handleSubmitName = () => {
        setNameLoading(true);
        const currentUser = auth.currentUser;
        if (currentUser && name.trim() !== "") {
            updateProfile(currentUser, { displayName: name })
                .then(() => {
                    setMessage("User registered and signed in successfully!");
                    setMessageType("success");
                    navigate("/");
                })
                .catch((error) => {
                    console.error("Error updating profile", error);
                    setMessage("Error updating profile.");
                    setMessageType("error");
                })
                .finally(() => {
                    setNameLoading(false);
                });
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").trim();
        // Optionally, allow pastes that are longer than OTP_LENGTH and slice them
        if (pasteData && /^\d+$/.test(pasteData)) {
            const digits = pasteData.slice(0, OTP_LENGTH).split('');
            setOtp(digits);
            // Optionally focus the last input
            otpInputRefs.current[OTP_LENGTH - 1]?.focus();
            // Optionally, auto-verify the OTP:
            handleVerifyOtp(digits.join(""));
        }
    };

    return (
        <>
            <div id="recaptcha-container"></div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh", // fill viewport height
                    padding: "0 1rem", // horizontal padding so card isn't flush
                    boxSizing: "border-box",
                    background: "#f0f2f5",
                    overflow: "hidden", // disable scrolling
                }}
            >
                <div style={{
                    maxWidth: "400px",
                    width: "100%"
                }}>
                    {/* Logo at the top, centered, 10px inside the card */}
                    <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <img
                            src="/logo.png" // Replace with your logo path
                            alt="Logo"
                            style={{ maxWidth: "100px", marginBottom: '5px' }}
                        />
                    </div>
                    <div
                        style={{
                            padding: "0rem 1.5rem",
                            background: "#fff",
                            border: "1px solid #eaeaea",
                            borderRadius: "6px",
                        }}
                    >
                        <Title level={3} style={{ textAlign: "center" }}>
                            Sign In / Sign Up
                        </Title>

                        {step === "phone" && (
                            <Form layout="vertical">
                                <Form.Item label="Mobile Number">
                                    <Input
                                        size="large"
                                        addonBefore="+1"
                                        placeholder="Enter your mobile number"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Button
                                        size="large"
                                        type="primary"
                                        block
                                        onClick={handleSendOtp}
                                        loading={phoneLoading}
                                    >
                                        Send OTP
                                    </Button>
                                </Form.Item>
                            </Form>
                        )}

                        {step === "otp" && (
                            <div>
                                <Text strong>Enter OTP</Text>
                                <Space
                                    style={{
                                        marginTop: "1rem",
                                        marginBottom: "1rem",
                                        justifyContent: "center",
                                        display: "flex",
                                    }}
                                >
                                    {otp.map((digit, index) => (
                                        <Input
                                            key={index}
                                            size="large"
                                            ref={(el) => (otpInputRefs.current[index] = el)}
                                            maxLength={1}
                                            type="tel"
                                            inputMode="numeric"
                                            autoFocus={index === 0}
                                            style={{
                                                width: "3rem",
                                                height: "3.5rem",
                                                fontSize: "1.5rem",
                                                textAlign: "center",
                                            }}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(e, index)}
                                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                            onPaste={handleOtpPaste}  // Attach the onPaste handler here
                                        />
                                    ))}
                                </Space>
                                <Button
                                    size="large"
                                    type="primary"
                                    block
                                    onClick={() => handleVerifyOtp()}
                                    loading={otpLoading}
                                >
                                    Verify OTP
                                </Button>
                            </div>
                        )}

                        {step === "name" && (
                            <Form layout="vertical">
                                <Form.Item label="Full Name">
                                    <Input
                                        size="large"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Button
                                        size="large"
                                        type="primary"
                                        block
                                        onClick={handleSubmitName}
                                        loading={nameLoading}
                                    >
                                        Submit Name
                                    </Button>
                                </Form.Item>
                            </Form>
                        )}

                        {message && (
                            <Text
                                style={{
                                    display: "block",
                                    textAlign: "center",
                                    marginTop: "1rem",
                                    marginBottom: '1rem',
                                    color: messageType === "error" ? "red" : "green",
                                }}
                            >
                                {message}
                            </Text>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Auth;
