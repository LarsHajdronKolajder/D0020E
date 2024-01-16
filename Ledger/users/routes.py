from flask import Flask, jsonify
from users import app
from users.models import User

@app.route('/user/signup', methods=['POST'])
def signup():
    return User().signup()

@app.route('/user/login', methods=['POST'])
def login():
    return User().login()

@app.route('/user/logout')
def logout():
    return User().logout()

@app.route('/hello')
def hello():
    response_data = {'message': 'Hello World'}
    return jsonify(response_data)