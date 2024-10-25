// src/components/EditProfilePopup.jsx
import React, { useState } from "react";
import { updateProfile, deleteAccount } from "../services/userService";
import { AiOutlineClose } from "react-icons/ai";

const EditProfilePopup = ({ user, onClose, setUser, showToast }) => { // Add showToast prop
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletionPassword, setDeletionPassword] = useState(""); // State for password confirmation for deletion
  const [error, setError] = useState(null);
  const [deletionMode, setDeletionMode] = useState(false); // State to toggle deletion mode

  // Function to validate profile form inputs
  const validateProfileForm = () => {
    if (!name || !email || !currentPassword) {
      setError("Name, email, and current password are required.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) { // Check for valid email format
      setError("Please enter a valid email address.");
      return false;
    }
    if (newPassword && newPassword.length < 6) { // Validate new password length if provided
      setError("New password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  // Save profile changes and display toast notification if successful
  const handleSave = async () => {
    setError(null);

    // Run validation before saving changes
    if (!validateProfileForm()) return;

    try {
      await updateProfile(name, email, currentPassword, newPassword);
      setUser({ ...user, name, email }); // Update the user state with the new info
      
      // Display a toast notification for successful profile update
      if (showToast) showToast("Profile updated successfully!");

      onClose(); // Close the popup after saving
    } catch (err) {
      setError(err.message); // Display error message if something goes wrong
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletionPassword) {
      setError("Password is required to delete your account.");
      return;
    }

    try {
      await deleteAccount(deletionPassword); // Pass the password for confirmation
      setUser(null); // Clear user state after account deletion
      onClose();
      window.location.href = "/"; // Redirect to the homepage after deletion
    } catch (err) {
      setError("Failed to delete account. Please check your password.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-[#252525] rounded-lg p-6 w-[20rem] text-slate-300 relative">
        {/* Close button */}
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>
          <AiOutlineClose className="text-white hover:text-red-400" />
        </button>

        <h2 className="text-center text-2xl font-semibold text-slate-100">
          {deletionMode ? "Confirm Account Deletion" : "Edit Profile"}
        </h2>

        {error && (
          <div className="w-full p-2 text-center text-red-500 border border-red-500 rounded mt-2">
            {error}
          </div>
        )}

        {!deletionMode ? (
          <div className="mt-4 space-y-4">
            {/* Name Input */}
            <div>
              <input
                type="text"
                className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {/* Email Input */}
            <div>
              <input
                type="email"
                className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Current Password Input */}
            <div>
              <input
                type="password"
                className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
                placeholder="Password (required for any changes)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            {/* New Password Input */}
            <div>
              <input
                type="password"
                className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full py-3 bg-neutral-600 hover:bg-neutral-500 duration-200 rounded text-white"
            >
              Save Changes
            </button>

            {/* Delete Account Button */}
            <button
              onClick={() => setDeletionMode(true)} // Switch to deletion mode
              className="w-full py-3 bg-red-600 hover:bg-red-500 duration-200 rounded text-white mt-4"
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-neutral-400">
              Are you sure you want to delete your account? This action is permanent, and all your
              data will be lost.
            </p>
            {/* Password Confirmation Input */}
            <div>
              <input
                type="password"
                className="bg-[#202020] w-full p-2 rounded focus:outline outline-neutral-300"
                placeholder="Enter your password to confirm"
                value={deletionPassword}
                onChange={(e) => setDeletionPassword(e.target.value)}
              />
            </div>
            {/* Confirm Deletion Button */}
            <button
              onClick={handleDeleteAccount}
              className="w-full py-3 bg-red-600 hover:bg-red-500 duration-200 rounded text-white"
            >
              I understand. Delete my account.
            </button>
            {/* Cancel Button */}
            <button
              onClick={() => setDeletionMode(false)} // Cancel deletion and go back to profile editing
              className="w-full py-3 bg-neutral-600 hover:bg-neutral-500 duration-200 rounded text-white mt-4"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfilePopup;
