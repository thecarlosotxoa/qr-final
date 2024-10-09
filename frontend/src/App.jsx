import React, { useState } from "react";
import LoginPopup from "./components/LoginPopup"; 
import SignupPopup from "./components/SignupPopup";

function App() {
  const [inputValue, setInputValue] = useState(""); // State to hold user input
  const [imgSrc, setImgSrc] = useState(null); // State to hold the generated QR code image
  const [error, setError] = useState(null); // State to hold any error messages

   // States for controlling popup visibility
   const [showLoginPopup, setShowLoginPopup] = useState(false);
   const [showSignupPopup, setShowSignupPopup] = useState(false);

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    console.log("Sending request to backend...");
    
    try {
      // config for local testing      
      const response = await fetch("http://127.0.0.1:5000/generate-qr", {
      // config for ec2 deployment  
      // const response = await fetch("http://18.222.30.194:5000/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ data: inputValue }), // Send the input value as JSON data
      });      

      if (!response.ok) {
        throw new Error("Failed to generate QR code. Please try again.");
      }

      const data = await response.json();
      if (data.qr_code) {
        setImgSrc(`data:image/png;base64,${data.qr_code}`);
        console.log("QR code generated successfully:", data.qr_code);
      } else {
        throw new Error(data.error || "Failed to generate QR code.");
      }
    } catch (err) {
      setError(err.message);
    }
  };     

  return (
    <div className="w-full min-h-screen grid place-content-center bg-[#181818]">
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
          <div>
            <input
              type="text"
              className="bg-[#252525] rounded w-full p-2 focus:outline outline-neutral-300"
              placeholder="Enter text to generate QR code"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)} // Update state when the user types
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 flex justify-center bg-[#252525] hover:bg-neutral-600 duration-200 rounded"
          >
            Generate
          </button>
        </form>

        {/* Login link below the Generate button */}
        <div className="text-center mt-4">
          <span
            className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
            onClick={() => setShowLoginPopup(true)}
          >
            Log in
          </span>
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
        />
      )}
      {showSignupPopup && (
        <SignupPopup
          onClose={() => setShowSignupPopup(false)}
          onSwitchToLogin={() => {
            setShowSignupPopup(false);
            setShowLoginPopup(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
