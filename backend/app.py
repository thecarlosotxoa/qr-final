from flask import Flask, request, jsonify
from flask_cors import CORS
import qrcode
import io
import base64
import traceback
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from PIL import Image


app = Flask(__name__)
# configuration for local testing
CORS(app, resources={r"/generate-qr": {"origins": "http://localhost:5173"}}, supports_credentials=True)

#configuration for ec2 testing
# CORS(app, resources={r"/generate-qr": {"origins": "*"}}, supports_credentials=True)
# origins: "*" means that requests to this route are permitted from any origin (* represents all domains). 
# This is generally fine for testing, but in production, you might want to restrict it to your frontend's 
# domain for security reasons.


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

        return jsonify({"qr_code": img_str}), 200
    except Exception as e:
        error_message = f"An error occurred: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_message)
        return jsonify({"error": "An internal server error occurred. Please check the server logs."}), 500


    # Database configuration (adjust as necessary)
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


# Register a new user
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    name = data['name']
    email = data['email']
    password = generate_password_hash(data['password'])  # Encrypt the password

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO users (name, email, password) VALUES (%s, %s, %s)',
            (name, email, password)
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'User registered successfully!'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# User login
@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data['email']
    password = data['password']

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            return jsonify({'message': 'Login successful!'}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == "__main__":
    logging.basicConfig(level=logging.ERROR)
    # app.run config for local testing
    app.run(debug=True)
    # app.run for ec2 testing
    # app.run(host="0.0.0.0", port=5000, debug=True)
    # By default, Flask only listens on 127.0.0.1 (localhost), which means it can only accept 
    # requests from the same machine. Setting it to 0.0.0.0 allows external devices 
    # (e.g., your frontend running on another IP or domain) to connect to the Flask server.
