// src/components/LoginPopup.jsx
import React from "react";
import { AiOutlineClose } from "react-icons/ai"; // Import close icon from react-icons

const LoginPopup = ({ onClose, onSwitchToSignup }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-[#252525] rounded-lg p-6 w-[20rem] text-slate-300 relative">
        {/* Close button */}
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>
          <AiOutlineClose className="text-white hover:text-red-400" />
        </button>

        <h2 className="text-center text-2xl font-semibold text-slate-100">Log In</h2>
        
        <form className="space-y-4 mt-4">
          <div>
            <input
              type="email"
              className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
              placeholder="Email address"
            />
          </div>
          <div>
            <input
              type="password"
              className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-neutral-600 hover:bg-neutral-500 duration-200 rounded text-white"
          >
            Log In
          </button>
        </form>

        {/* Link to switch to signup */}
        <div className="mt-4 text-center">
          <span
            className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
            onClick={onSwitchToSignup}
          >
            New User? Create an account
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
