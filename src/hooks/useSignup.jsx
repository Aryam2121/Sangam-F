import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { message } from "antd";
import { registerUser as apiRegisterUser } from "../services/sangamApi";
import { completeAuthSession } from "../utils/completeAuthSession";

const useSignup = () => {
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const registerUser = async (values) => {
    setError(null);

    if (values.password !== values.passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRegisterUser(values);
      message.success(data?.message || "Registration successful");
      await completeAuthSession({ login, user: data?.user || data?.data?.user });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    registerUser,
    clearError: () => setError(null),
  };
};

export default useSignup;
