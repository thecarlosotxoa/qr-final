// src/components/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { getGeneratedQRCodes } from "../services/userService";
import { Link } from "react-router-dom";

const ProfilePage = ({ user }) => {
  const [qrCodes, setQRCodes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [user]);

  if (loading) {
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
    <div className="p-4 bg-[#181818] min-h-screen text-slate-300">
      <h1 className="text-2xl font-semibold text-center text-slate-100 mb-6">
        {user ? `${user.name}'s Generated QR Codes` : "Your Generated QR Codes"}
      </h1>
      {qrCodes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {qrCodes.map((code) => (
            <div key={code.id} className="p-4 border border-neutral-200 rounded-lg bg-[#202020]">
              <img
                src={`data:image/png;base64,${code.qr_image}`}
                alt="QR Code"
                className="w-full h-auto mb-2"
              />
              <p className="text-sm text-neutral-400">Input: {code.qr_text}</p>
              <p className="text-sm text-neutral-400">
                Generated on: {new Date(code.timestamp).toLocaleString()}
              </p>
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
  );
};

export default ProfilePage;
