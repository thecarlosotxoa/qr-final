// src/components/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { getGeneratedQRCodes, deleteQRCode, logoutUser } from "../services/userService"; // Import the necessary service functions
import { Link, useNavigate } from "react-router-dom";
import EditProfilePopup from "./EditProfilePopup"; // Import the Edit Profile popup

const ProfilePage = ({ user, userLoading, setUser }) => {
  const [qrCodes, setQRCodes] = useState([]); // State to store fetched QR codes
  const [error, setError] = useState(null); // State for any error messages
  const [loading, setLoading] = useState(true); // State to show loading indicator
  const [showEditProfilePopup, setShowEditProfilePopup] = useState(false); // State to control Edit Profile popup visibility
  const navigate = useNavigate(); // For programmatic navigation

  // Fetch QR codes after the component mounts
  useEffect(() => {
    if (userLoading) return; // If user is still loading, do nothing

    if (!user) {
      setError("You must be logged in to view this page.");
      setLoading(false);
      return;
    }

    // Fetch QR codes associated with the logged-in user
    async function fetchQRCodes() {
      try {
        const codes = await getGeneratedQRCodes();
        setQRCodes(codes); // Update state with the fetched QR codes
      } catch (err) {
        setError("Failed to fetch QR codes.");
      } finally {
        setLoading(false); // Stop showing the loading indicator
      }
    }

    fetchQRCodes();
  }, [user, userLoading]); // Fetch data only after user and userLoading states are resolved

  // Handle the deletion of a QR code
  const handleDelete = async (id) => {
    // Ask for confirmation before deletion
    if (window.confirm("Are you sure you want to delete this QR code?")) {
      try {
        await deleteQRCode(id); // Call backend to delete the QR code
        setQRCodes(qrCodes.filter((code) => code.id !== id)); // Remove the deleted QR code from the state
      } catch (err) {
        setError("Failed to delete QR code.");
      }
    }
  };

  // Handle logout action
  const handleLogout = async () => {
    await logoutUser(() => {}); // Perform the logout
    setUser(null); // Clear the user state
    navigate("/"); // Redirect to the main page
  };

  // Render a loading state while data is being fetched
  if (userLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#181818] text-slate-300">
        <p>Loading...</p>
      </div>
    );
  }

  // Render an error state if something went wrong
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#181818] text-slate-300">
        <p className="text-red-500">{error}</p>
        <Link to="/" className="mt-4 text-neutral-400 hover:text-neutral-300">
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#181818] text-slate-300">
      <div className="w-[23rem] p-7 space-y-4">
        <h1 className="text-2xl font-semibold text-center text-slate-100">
          {user ? `${user.name}'s Generated QR Codes` : "Your Generated QR Codes"}
        </h1>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
          >
            Log out
          </button>
        </div>

        {/* Display the QR Codes if available */}
        {qrCodes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {qrCodes.map((code) => (
              <div key={code.id} className="p-4 border border-neutral-200 rounded-lg bg-[#202020]">
                <img
                  src={`data:image/png;base64,${code.qr_image}`}
                  alt="QR Code"
                  className="w-full h-auto mb-2 border border-neutral-300 rounded-lg"
                />
                <p className="text-sm text-neutral-400">Input: {code.qr_text}</p>
                <p className="text-sm text-neutral-400">
                  Generated on: {new Date(code.timestamp).toLocaleString()}
                </p>

                {/* Delete Button for each QR code */}
                <div className="text-center mt-2">
                  <button
                    onClick={() => handleDelete(code.id)} // Handle QR code deletion
                    className="text-red-500 hover:text-red-400 cursor-pointer border border-red-500 rounded-md px-4 py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-neutral-400">No QR codes generated yet.</div>
        )}

        {/* Go Back and Edit Profile Buttons */}
        <div className="text-center mt-6 space-x-4">
          <Link to="/" className="text-neutral-400 hover:text-neutral-300">
            Go Back
          </Link>
          <button
            onClick={() => setShowEditProfilePopup(true)} // Show the edit profile popup
            className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Edit Profile Popup */}
      {showEditProfilePopup && (
        <EditProfilePopup 
          user={user} 
          onClose={() => setShowEditProfilePopup(false)} // Close the popup
          setUser={setUser} // Update user state after editing
        />
      )}
    </div>
  );
};

export default ProfilePage;

