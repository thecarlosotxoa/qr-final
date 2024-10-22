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

// Function to delete a QR code by its ID
export async function deleteQRCode(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/delete-qr/${id}`, {
      method: "DELETE",
      credentials: "include", // Important for session-based auth
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to delete QR code");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
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
// src/services/userService.js
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to log in");
    }

    return data; // This should contain { message, user }
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sign up");
    }

    return data; // This should contain { message, user }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Update user profile
export async function updateProfile(name, email, currentPassword, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/update-profile`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, current_password: currentPassword, new_password: newPassword }),
    });

    if (!response.ok) throw new Error("Failed to update profile");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Delete user account with password confirmation
export async function deleteAccount(password) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/delete-account`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }), // Send the password
    });

    if (!response.ok) throw new Error("Failed to delete account");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
