import React from "react";
import { FcGoogle } from "react-icons/fc";

const GoogleSignInButton = ({ onClick, disabled, label = "Continue with Google" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="auth-btn-secondary flex w-full items-center justify-center gap-3 !py-3.5"
  >
    <FcGoogle className="text-2xl" />
    <span>{label}</span>
  </button>
);

export default GoogleSignInButton;
