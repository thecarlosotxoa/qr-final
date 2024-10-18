// src/services/userService.js

// const API_BASE_URL = "http://127.0.0.1:5000"; // Update this if your backend is hosted elsewhere
const API_BASE_URL = "http://localhost:5000"; // Update this if your backend is hosted elsewhere

// Function to fetch user profile
export async function getUserProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "GET",
      credentials: "include", // Important for session-based auth
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
}

// Function to save a QR code
export async function saveQRCode(inputText, qrImage) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/save-qr`, {
      method: "POST",
      credentials: "include", // Important for session-based auth
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputText, qrImage }),
    });

    if (!response.ok) throw new Error("Failed to save QR code");
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

// Function to log out a user
export async function logoutUser(setUser) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/logout`, {
      method: "POST",
      credentials: "include", // Important for session-based auth
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      setUser(null); // Reset user state in App after logging out
    } else {
      console.error("Failed to log out");
    }
  } catch (error) {
    console.error(error);
  }
}

// Function to get generated QR codes for the logged-in user
export async function getGeneratedQRCodes() {
  try {
    const response = await fetch(`${API_BASE_URL}/user/qr-codes`, {
      method: "GET",
      credentials: "include", // Important for session-based auth
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch QR codes");
    const qrCodes = await response.json();
    return qrCodes;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Function to handle user login
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      credentials: "include", // Important for session-based auth
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to log in");
    }

    const data = await response.json();
    return data; // This will return the whole response, including user info if needed
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Function to handle user signup
export async function signupUser(name, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      credentials: "include", // Important for session-based auth
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to sign up");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
