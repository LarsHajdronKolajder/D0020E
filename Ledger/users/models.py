from flask import Flask, jsonify, request, session, redirect
from flask_session import Session
from users import col_users
from passlib.hash import pbkdf2_sha256
import uuid

class User:

    def start_session(self, user):

        del user['password']
        session['logged_in'] = True
        session['user'] = user

        return jsonify(user), 200
    
    def signup(self):
        print(request.form)

        uname = request.json['username']
        pword = request.json['password']

        user = {
            "_id": uuid.uuid4().hex,
            "username": uname,
            "password": pword,
            "role": 'dev'
        }

        user['password'] = pbkdf2_sha256.encrypt(user['password'])

        if col_users.find_one({"username": user['username']}):
            return jsonify({"error": "Username already exists"}), 400

        if col_users.insert_one(user):
            self.start_session(user)
            return jsonify({"signup": "Success"}), 200

        return jsonify({"error": "Signup failed"}), 400
    
    def logout(self):
        
        session.clear()
        
        return redirect('/')

    def login(self):

        uname = request.json['username']
        pword = request.json['password']

        user = col_users.find_one({
            "username": uname
        })

        if user and pbkdf2_sha256.verify(pword, user['password']):
            return self.start_session(user)

        return jsonify({"error": "invalid login credentials"}), 401