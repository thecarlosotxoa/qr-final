import React, { useEffect, useState } from 'react';

const Profile = () => {
    const [qrCodes, setQrCodes] = useState([]);

    useEffect(() => {
        // Fetch QR codes created by the logged-in user
        fetch('/api/user/qrcodes', { credentials: 'include' })
            .then(response => response.json())
            .then(data => setQrCodes(data))
            .catch(error => console.error('Failed to load QR codes:', error));
    }, []);

    return (
        <div className="profile-container">
            <h1>Your QR Codes</h1>
            {qrCodes.map(qr => (
                <div key={qr.id} className="qr-item">
                    <img src={`data:image/png;base64,${btoa(new Uint8Array(qr.qr_image).reduce((data, byte) => data + String.fromCharCode(byte), ''))}`} alt="QR code" />
                    <p>{qr.qr_text}</p>
                    <span>{new Date(qr.timestamp).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

export default Profile;
