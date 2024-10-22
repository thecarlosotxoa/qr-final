# app.py
from flask import Flask, request, jsonify, session
from flask_session import Session  # Import Flask-Session
from flask_cors import CORS
import qrcode
import io
import base64
import traceback
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone


# Create Flask app
app = Flask(__name__)

# Secret key for sessions, should be set to something more secure in production
app.secret_key = "your_secret_key"  # Replace with a secure secret key

'''
flask-session alternative config
'''
# Configure session to use filesystem (server-side session)
app.config['SESSION_TYPE'] = 'filesystem'

# Initialize the extension
Session(app)

# Update CORS configuration to allow credentials
CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": "http://localhost:5173"}},
)

app.config.update(
    SESSION_COOKIE_SECURE=False,    # False for HTTP, True for HTTPS
    SESSION_COOKIE_HTTPONLY=False,  # Set to False to allow JavaScript access (if needed)
    SESSION_COOKIE_SAMESITE=None,   # Allow cross-origin requests
    SESSION_COOKIE_DOMAIN='localhost',  # Set domain to 'localhost'
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
)

'''
app.config.update(
    # SESSION_COOKIE_DOMAIN=None,  # No longer needed
    SESSION_COOKIE_SECURE=False,    # Keep False for HTTP
    SESSION_COOKIE_HTTPONLY=True,   # This is fine
    SESSION_COOKIE_SAMESITE="Lax",  # Lax is acceptable
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
)


# CORS configuration
CORS(
    app,
    supports_credentials=True,
    resources={     
        r"/*": {"origins": "http://localhost:5173"},  
        r"/generate-qr": {"origins": "http://localhost:5173"},
        r"/register": {"origins": "http://localhost:5173"},
        r"/login": {"origins": "http://localhost:5173"},
        r"/user/*": {"origins": "http://localhost:5173"},
    },
)

# Session configuration for local development
app.config.update(
    # SESSION_COOKIE_DOMAIN='localhost',
    SESSION_COOKIE_DOMAIN=None,      # Let Flask set the cookie for the correct domain
    SESSION_COOKIE_SECURE=False,  # False for development, True for production (HTTPS)
    # SESSION_COOKIE_HTTPONLY=True,  # Protect against cross-site scripting (XSS)
    SESSION_COOKIE_SAMESITE="Lax",  # Allow sending cookies with cross-origin requests from the same site
    # SESSION_COOKIE_SAMESITE="None",  # Allows cross-site cookies
    # SESSION_COOKIE_SAMESITE="Strict",
)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)  # Extend session life to 30 minutes
'''

# Database configuration
DATABASE_CONFIG = {
    'dbname': 'qr_final',
    'user': 'postgres',
    'password': 'admin0',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    """Function to establish a database connection."""
    conn = psycopg2.connect(**DATABASE_CONFIG, cursor_factory=RealDictCursor)
    return conn

# Generate QR code
@app.route("/generate-qr", methods=["POST"])
def generate_qr():
    """Endpoint to generate a QR code and optionally save it for logged-in users."""
    try:
        data = request.json.get("data")
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Generate QR code
        img = qrcode.make(data)
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        img_str = base64.b64encode(img_buffer.getvalue()).decode("utf-8")

        return jsonify({"qr_code": img_str}), 200
    except Exception as e:
        error_message = f"An error occurred: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_message)
        return jsonify({"error": "An internal server error occurred. Please check the server logs."}), 500

# Register a new user
@app.route('/register', methods=['POST'])
def register_user():
    """Endpoint for user registration."""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    hashed_password = generate_password_hash(password)  # Encrypt the password

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already exists
        cur.execute('SELECT * FROM users WHERE email = %s', (email,))
        existing_user = cur.fetchone()
        if existing_user:
            return jsonify({'error': 'User with this email already exists.'}), 400

        cur.execute(
            'INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id',
            (name, email, hashed_password)
        )
        user_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        conn.close()

        # Set user session after registration
        session['user_id'] = user_id
        print(f"Session set: {session}")  # Debug print to ensure session is set

        # Return user data
        return jsonify({
            'message': 'User registered successfully!',
            'user': {'id': user_id, 'name': name, 'email': email}
        }), 201
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'An error occurred during registration.'}), 500

# User login
@app.route('/login', methods=['POST'])
def login_user():
    """Endpoint for user login."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            print(f"Session after login: {session}")  # Debug print to check session
            session.permanent = True  # Ensure the session persists
            session.modified = True   # Mark the session as modified
            return jsonify({'message': 'Login successful!', 'user': {'id': user['id'], 'name': user['name'], 'email': user['email']}}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        return jsonify({'error': 'An error occurred during login.'}), 500

# User logout
@app.route('/user/logout', methods=['POST'])
def logout_user():
    """Endpoint for user logout."""
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully.'}), 200

# Get user profile
@app.route('/user/profile', methods=['GET'])
def get_user_profile():
    print(f"Session data on /user/profile request: {session}")  # Debugging: Check the session
    """Endpoint to get the logged-in user's profile."""
    user_id = session.get("user_id")
    if not user_id:
        print(f"failed to get user_id")
        return jsonify({"error": "User not logged in"}), 403

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT id, name, email FROM users WHERE id = %s', (user_id,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user:
            return jsonify(user), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logging.error(f"Profile fetch error: {str(e)}")
        return jsonify({"error": "An error occurred while fetching profile."}), 500

# Get QR codes for the logged-in user
@app.route("/user/qr-codes", methods=["GET"])
def get_user_qr_codes():
    """Endpoint to get all QR codes generated by the logged-in user."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 403

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, qr_text, qr_image, timestamp FROM qr_codes WHERE user_id = %s ORDER BY timestamp DESC",
            (user_id,)
        )
        qr_codes = cur.fetchall()
        cur.close()
        conn.close()

        # Process qr_codes to convert 'qr_image' from memoryview to string
        for qr_code in qr_codes:
            # Convert 'qr_image' from memoryview to string
            qr_image_memoryview = qr_code['qr_image']
            if isinstance(qr_image_memoryview, memoryview):
                qr_image_bytes = qr_image_memoryview.tobytes()
                qr_image_str = qr_image_bytes.decode('utf-8')
                qr_code['qr_image'] = qr_image_str

            # Convert 'timestamp' to ISO format string with timezone info
            timestamp = qr_code['timestamp']
            if isinstance(timestamp, datetime):
                # Ensure the timestamp is timezone-aware
                if timestamp.tzinfo is None:
                    timestamp = timestamp.replace(tzinfo=timezone.utc)
                qr_code['timestamp'] = timestamp.isoformat()

        return jsonify(qr_codes), 200
    except Exception as e:
        logging.error(f"Fetching QR codes error: {str(e)}")
        return jsonify({"error": "An error occurred while fetching QR codes."}), 500
    
# Save QR code
@app.route('/user/save-qr', methods=['POST'])
def save_qr_code():
    """Endpoint to save a QR code for a logged-in user."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 403

    data = request.get_json()
    inputText = data.get('inputText')
    qrImage = data.get('qrImage')
    if not inputText or not qrImage:
        return jsonify({"error": "Missing inputText or qrImage"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO qr_codes (user_id, qr_text, qr_image, timestamp)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, inputText, qrImage, datetime.now(timezone.utc).replace(tzinfo=None)),
        )
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "QR code saved successfully."}), 201
    except Exception as e:
        logging.error(f"Error saving QR code: {str(e)}")
        return jsonify({"error": "An error occurred while saving the QR code."}), 500

# Delete a QR code
@app.route('/user/delete-qr/<int:id>', methods=['DELETE'])
def delete_qr_code(id):
    """Endpoint to delete a QR code by its ID."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 403

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Ensure the QR code belongs to the logged-in user before deleting
        cur.execute('DELETE FROM qr_codes WHERE id = %s AND user_id = %s RETURNING id', (id, user_id))
        deleted_id = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if deleted_id:
            return jsonify({"message": "QR code deleted successfully"}), 200
        else:
            return jsonify({"error": "QR code not found or does not belong to the user"}), 404
    except Exception as e:
        logging.error(f"Deletion error: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the QR code"}), 500

'''
@app.after_request
def after_request(response):
    print(response.headers)  # This will print headers, including 'Set-Cookie'
    return response
'''

# if __name__ == "__main__":
    # logging.basicConfig(level=logging.ERROR)
    # app.run(debug=True)
    # app.run(host="127.0.0.1", port=5000)  # Ensure the correct host and port

if __name__ == "__main__":
    logging.basicConfig(level=logging.ERROR)
    app.run(debug=True, host='localhost', port=5000)