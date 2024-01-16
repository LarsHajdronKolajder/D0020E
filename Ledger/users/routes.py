from flask import Flask, jsonify
from users import app
from users.models import User
from flask_cors import cross_origin

@app.route('/user/signup', methods=['POST'])
@cross_origin(supports_credentials=True)
def signup():
    return User().signup()

@app.route('/user/login', methods=['POST'])
@cross_origin(supports_credentials=True)
def login():
    return User().login()

@app.route('/user/logout')
@cross_origin(supports_credentials=True)
def logout():
    return User().logout()

@app.route('/hello')
def hello():
    response_data = {'message': 'Hello World'}
    return jsonify(response_data)