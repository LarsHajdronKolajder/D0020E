from flask import Flask, jsonify
from flask_cors import CORS, cross_origin
from models import User

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Session configs 
app.config["SESSION_PERMANENT"] = False

# Create secret key
app.secret_key = 'TEST_SECRET_KEY'

# Routes
@app.route('/')
def home():
    response_data = {'default': 'page'}
    return jsonify(response_data)

@app.route('/hello')
def hello():
    response_data = {'message': 'Hello World'}
    return jsonify(response_data)

@app.route('/user/signup', methods=['POST'])
def signup():
    return User().signup()

@app.route('/user/login', methods=['POST'])
def login():
    return User().login()

@app.route('/user/logout')
def logout():
    return User().logout()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=107)