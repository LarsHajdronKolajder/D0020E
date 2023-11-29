#!/usr/bin/env python
# encoding: utf-8

from pymongo import MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin

import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

os.environ.get('LEDGER_URL')

connection_string = os.environ.get('LEDGER_URL')

cluster = MongoClient(connection_string, server_api = ServerApi('1'))

db = cluster['SignatureID']  # Database ID
col = db.Signature      # Collection ID


@app.route("/get", methods=['GET'])
def get_sig():
    signatures = col.find()
    sig_list = []
    for item in signatures:
        sig_dict = {
            "_id": str(item['_id']),
            "event": item.get('Event', ''),
            "id": item.get('id', ''),
            "date": item.get('date', ''),
            "sig": item.get('sig', ''),
            "payload": item.get('payload', '')
        }
        sig_list.append(sig_dict)
    
    return jsonify(sig_list)


@app.route('/hello', methods=['GET'])
def query():
    response_data = {'message': 'Hello World'}
    return jsonify(response_data)

@app.route("/test", methods=['POST'])
def testAPI():
    col.insert_one({'test_digiprime_martin': 'successful'})
    return "/test success"

@app.route("/add", methods=['POST']) # Fixa så att man kan skicka från form input
def startpy():
    event = request.json['event']
    id = request.json['id']
    ledger_dict = {
        "event": event,
        "id": id
    }
    col.insert_one(ledger_dict)
    return "/add success"



@app.route("/find/<string:api_code>", methods=['GET'])
def get_data_from_database(api_code):
    signature = col.find_one({"id": api_code})
    print(signature)
    
    if signature:
        sig_dict = {
            "id": signature['id'],
            "date": signature['date'],
            "sig": signature['sig'],
            "payload": signature['payload']
        }
        return jsonify(sig_dict)
    else:
        return jsonify({"error": "Signature not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=105)