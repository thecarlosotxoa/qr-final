// src/components/LoginPopup.jsx
import React, { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { loginUser } from "../services/userService";

const LoginPopup = ({ onClose, onSwitchToSignup, setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Attempt to login the user
      await loginUser(email, password);
      // Fetch the user's profile after successful login
      const profile = await fetchUserProfile();
      setUser(profile);
      onClose(); // Close the login popup after successful login
      // Redirect to the user's profile
      window.location.href = "/profile";
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch user profile after login
  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/user/profile", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch user profile");
      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-[#252525] rounded-lg p-6 w-[20rem] text-slate-300 relative">
        {/* Close button */}
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>
          <AiOutlineClose className="text-white hover:text-red-400" />
        </button>

        <h2 className="text-center text-2xl font-semibold text-slate-100">Login</h2>

        {error && (
          <div className="w-full p-2 text-center text-red-500 border border-red-500 rounded mt-2">
            {error}
          </div>
        )}

        <form className="space-y-4 mt-4" onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-neutral-600 hover:bg-neutral-500 duration-200 rounded text-white"
          >
            Login
          </button>
        </form>

        {/* Link to switch to signup */}
        <div className="mt-4 text-center">
          <span
            className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
            onClick={onSwitchToSignup}
          >
            Don't have an account? Sign Up
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
