from flask import Flask, jsonify, request
from passlib.hash import pbkdf2_sha256
import uuid
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# MongoDB
connection_string = "mongodb+srv://LedgerSuperSecretUsername97187:Jdl7WM2E23aAxSPN@ledgerhistorydb.aeueeyi.mongodb.net/" #os.environ.get('LEDGER_URL')
cluster = MongoClient(connection_string, server_api = ServerApi('1'))
db_users = cluster['Users']  # Database ID
col_users = db_users.ID      # Collection ID

# User class for route functions
class User:

    def signup(self):

        uname = request.json['username']
        pword = request.json['password']

        user = {
            "_id": uuid.uuid4().hex,
            "username": uname,
            "password": pword,
            "role": 'dev'
        }

        user['password'] = pbkdf2_sha256.encrypt(user['password'])

        # Check if username already exists
        if col_users.find_one({"username": user['username']}):
            return jsonify({"error": "Username already exists"}), 400

        # If username does not exist
        if col_users.insert_one(user):
            return jsonify({"signup": "Success"}), 200

        return jsonify({"error": "Signup failed"}), 400

    def login(self):
        # Extract username and password from the request's JSON body
        uname = request.json['username']
        pword = request.json['password']

        # Query the 'col_users' collection for a user with the provided username
        user = col_users.find_one({
            "username": uname
        })

        # If a user is found and the provided password matches the user's password
        # and the user's role is 'sel', return a success response
        if user and pbkdf2_sha256.verify(pword, user['password']) and (user['role'] == 'sel' or user['role'] == 'bro'):
           return jsonify({"login": "Success"}), 200

        # If no user is found, or the password doesn't match, or the user's role is not 'sel',
        # return an error response
        return jsonify({"error": "invalid login credentials"}), 401