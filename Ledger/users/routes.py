from flask import Flask
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