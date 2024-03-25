from flask import Flask, jsonify
from flask_cors import CORS
from models import User

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Create secret key
app.secret_key = 'TEST_SECRET_KEY'

# Routes
@app.route('/')
def home():
    response_data = {'default': '107'}
    return jsonify(response_data)

@app.route('/hello')
def query():
    response_data = {'message': 'Hello World'}
    return jsonify(response_data)

@app.route('/ledger/signup', methods=['GET', 'POST'])
def signup():
    return User().signup()

@app.route('/ledger/login', methods=['GET', 'POST'])
def login():
    return User().login()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=107)