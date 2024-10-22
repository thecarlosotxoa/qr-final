// src/components/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { getGeneratedQRCodes, deleteQRCode, logoutUser } from "../services/userService"; // Import deleteQRCode
import { Link, useNavigate } from "react-router-dom";

const ProfilePage = ({ user, userLoading, setUser }) => {  // Accept setUser as a prop
  const [qrCodes, setQRCodes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setError("You must be logged in to view this page.");
      setLoading(false);
      return;
    }

    async function fetchQRCodes() {
      try {
        const codes = await getGeneratedQRCodes();
        setQRCodes(codes);
      } catch (err) {
        setError("Failed to fetch QR codes.");
      } finally {
        setLoading(false);
      }
    }
    fetchQRCodes();
  }, [user, userLoading]);

  const handleDelete = async (id) => {
    // Ask for confirmation before deletion
    if (window.confirm("Are you sure you want to delete this QR code?")) {
      try {
        await deleteQRCode(id); // Call backend to delete the QR code
        setQRCodes(qrCodes.filter((code) => code.id !== id)); // Remove the deleted QR code from state
      } catch (err) {
        setError("Failed to delete QR code.");
      }
    }
  };

  const handleLogout = async () => {
    await logoutUser(() => {}); // Perform the logout
    setUser(null);               // Clear the user state
    navigate("/");               // Redirect to the main page
  };

  if (userLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#181818] text-slate-300">
        <p>Loading...</p>
      </div>
    );
  }

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

                {/* Delete Button */}
                <div className="text-center mt-2">
                  <button
                    onClick={() => handleDelete(code.id)}
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
        <div className="text-center mt-6">
          <Link to="/" className="text-neutral-400 hover:text-neutral-300">
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
