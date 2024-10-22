// src/App.jsx
import React, { useState, useEffect } from "react";
import SignupPopup from "./components/SignupPopup";
import LoginPopup from "./components/LoginPopup";
import ProfilePage from "./components/ProfilePage"; // Profile component
import { getUserProfile, saveQRCode, logoutUser } from "./services/userService";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function App() {
  const [inputValue, setInputValue] = useState(""); // State to hold user input
  const [imgSrc, setImgSrc] = useState(null); // State to hold the generated QR code image
  const [error, setError] = useState(null); // State to hold any error messages

  // States for controlling popup visibility
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [user, setUser] = useState(null); // To track logged-in user  
  const [userLoading, setUserLoading] = useState(true); // New state for user loading to avoid race conditions

  // Fetch profile if logged in
  useEffect(() => {
    async function fetchProfile() {
      const profile = await getUserProfile();
      if (profile) setUser(profile);
      setUserLoading(false); // Set loading to false after fetching
    }
    fetchProfile();
  }, []);

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: inputValue }), // Send the input value as JSON data
      });

      const data = await response.json();
      if (data.qr_code) {
        setImgSrc(`data:image/png;base64,${data.qr_code}`);
        console.log("QR code generated successfully:", data.qr_code);

        // If the user is logged in, save the QR code in the database
        if (user) {
          await saveQRCode(inputValue, data.qr_code);
        }
      } else {
        throw new Error(data.error || "Failed to generate QR code.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Router>
      <div className="w-full min-h-screen bg-[#181818]">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="w-[23rem] p-7 space-y-4 text-slate-300">
                  <h1 className="text-2xl font-semibold text-center text-slate-100">
                    QR Code Generator
                  </h1>

                  {/* Display the generated QR code image or a placeholder */}
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt="Generated QR Code"
                      className="w-full h-auto max-w-full cursor-pointer border border-neutral-200 rounded-3xl bg-white p-4"
                    />
                  ) : (
                    <div className="w-full h-[18rem] border border-neutral-200 rounded-3xl grid place-content-center bg-[#202020]">
                      <span className="text-neutral-400">No QR code generated</span>
                    </div>
                  )}

                  {/* Display an error message if any */}
                  {error && (
                    <div className="w-full p-2 text-center text-red-500 border border-red-500 rounded">
                      {error}
                    </div>
                  )}

                  {/* Form for entering text to generate a QR code */}
                  <form className="space-y-1" onSubmit={handleSubmit}>
                    <input
                      type="text"
                      className="bg-[#252525] rounded w-full p-2 focus:outline outline-neutral-300"
                      placeholder="Enter text to generate QR code"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)} // Update state when the user types
                    />
                    <button
                      type="submit"
                      className="w-full py-3 flex justify-center bg-[#252525] hover:bg-neutral-600 duration-200 rounded"
                    >
                      Generate
                    </button>
                  </form>

                  {/* Login/Logout/Profile Links */}
                  <div className="text-center mt-4">
                    {user ? (
                      <>
                        <span
                          className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
                          onClick={() => logoutUser(setUser)}
                        >
                          Log out
                        </span>
                        <Link
                          to="/profile"
                          className="text-neutral-400 hover:text-neutral-300 cursor-pointer ml-4"
                        >
                          View Profile
                        </Link>
                      </>
                    ) : (
                      <span
                        className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
                        onClick={() => setShowLoginPopup(true)}
                      >
                        Log in
                      </span>
                    )}
                  </div>
                </div>

                {/* Show Login or Signup Popup */}
                {showLoginPopup && (
                  <LoginPopup
                    onClose={() => setShowLoginPopup(false)}
                    onSwitchToSignup={() => {
                      setShowLoginPopup(false);
                      setShowSignupPopup(true);
                    }}
                    setUser={setUser} // Pass setUser to handle user state after login
                  />
                )}
                {showSignupPopup && (
                  <SignupPopup
                    onClose={() => setShowSignupPopup(false)}
                    onSwitchToLogin={() => {
                      setShowSignupPopup(false);
                      setShowLoginPopup(true);
                    }}
                    setUser={setUser} // Pass setUser to handle user state after signup
                  />
                )}
              </div>
            }
          />
          <Route
            path="/profile"
            element={<ProfilePage user={user} userLoading={userLoading} setUser={setUser} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
