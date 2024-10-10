# app.py
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import qrcode
import io
import base64
import traceback
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.secret_key = "your_secret_key"  # Replace with a secure secret key

# CORS configuration
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/generate-qr": {"origins": "http://localhost:5173"},
        r"/register": {"origins": "http://localhost:5173"},
        r"/login": {"origins": "http://localhost:5173"},
        r"/user/*": {"origins": "http://localhost:5173"},
    },
)

# Database configuration
DATABASE_CONFIG = {
    'dbname': 'qr_final',
    'user': 'postgres',
    'password': 'admin0',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    conn = psycopg2.connect(**DATABASE_CONFIG, cursor_factory=RealDictCursor)
    return conn

# Generate QR code
@app.route("/generate-qr", methods=["POST"])
def generate_qr():
    try:
        data = request.json.get("data")
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Generate QR code
        img = qrcode.make(data)
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        img_str = base64.b64encode(img_buffer.getvalue()).decode("utf-8")

        # Save QR code if user is logged in
        user_id = session.get("user_id")
        if user_id:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO qr_codes (user_id, qr_text, qr_image, timestamp)
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, data, img_str, datetime.utcnow()),
            )
            conn.commit()
            cur.close()
            conn.close()

        return jsonify({"qr_code": img_str}), 200
    except Exception as e:
        error_message = f"An error occurred: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_message)
        return jsonify({"error": "An internal server error occurred. Please check the server logs."}), 500

# Register a new user
@app.route('/register', methods=['POST'])
def register_user():
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

        # Set user session
        session['user_id'] = user_id

        return jsonify({'message': 'User registered successfully!', 'user': {'id': user_id, 'name': name, 'email': email}}), 201
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'An error occurred during registration.'}), 500

# User login
@app.route('/login', methods=['POST'])
def login_user():
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
            return jsonify({'message': 'Login successful!', 'user': {'id': user['id'], 'name': user['name'], 'email': user['email']}}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        return jsonify({'error': 'An error occurred during login.'}), 500

# User logout
@app.route('/user/logout', methods=['POST'])
def logout_user():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully.'}), 200

# Get user profile
@app.route('/user/profile', methods=['GET'])
def get_user_profile():
    user_id = session.get("user_id")
    if not user_id:
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
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 403

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, qr_text, qr_image, timestamp FROM qr_codes WHERE user_id = %s ORDER BY timestamp DESC",
            (user_id,)
        )
        qr_codes = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify(qr_codes), 200
    except Exception as e:
        logging.error(f"Fetching QR codes error: {str(e)}")
        return jsonify({"error": "An error occurred while fetching QR codes."}), 500

if __name__ == "__main__":
    logging.basicConfig(level=logging.ERROR)
    # Run the app
    app.run(debug=True)
