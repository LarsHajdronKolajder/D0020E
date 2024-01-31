#!/usr/bin/env python
#encoding: utf-8
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from bson.objectid import ObjectId
from pymongo.errors import DuplicateKeyError
from bson.json_util import dumps


import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

#os.environ.get('LEDGER_URL')

#connection_string =  os.environ.get('LEDGER_URL')

connection_string = "mongodb+srv://LedgerSuperSecretUsername97187:Jdl7WM2E23aAxSPN@ledgerhistorydb.aeueeyi.mongodb.net/" #os.environ.get('LEDGER_URL')


cluster = MongoClient(connection_string, server_api = ServerApi('1'))

db = cluster['SignatureID']  # Database ID
col = db.Signature      # Collection ID


db_link = cluster['LinkedTest']
col_link = db_link.LinkedList #LinkedList example


@app.route("/get", methods=['POST'])
def get_sig():
    BatteryID = request.json['BatteryID']
    signatures = col.find("BatteryID" == BatteryID)
    sig_list = []
    for item in signatures:
        sig_dict = {
            "_id": str(item['_id']),
            "CID": item.get('CID', ''),
            "CurOwner": item.get('CurOwner', ''),
            "BatteryID": item.get('BatteryID', ''),
        }
        sig_list.append(sig_dict)

    return jsonify(sig_list)


# This route handles the "/find" endpoint and expects a POST request
@app.route("/find", methods=['POST'])
def get_data_from_database():
    print(request.json)  # Print the JSON data received in the request
    JsonBattery = request.json['BatteryID']  # Extract the value of "BatteryID" from the JSON data
    print(JsonBattery)  # Print the extracted "BatteryID"
    JsonCurOwner = request.json['CurOwner']  # Extract the value of "CurOwner" from the JSON data

    # Find a document in the collection where "BatteryID" matches the extracted "JsonBattery"
    BatteryID = col.find_one({
        "BatteryID": JsonBattery
    })

    # Check if the "CurOwner" in the found document matches the extracted "JsonCurOwner"
    if BatteryID["CurOwner"] == JsonCurOwner:
        return jsonify({"respone": "Correct Owner"}), 200  # Return a JSON response with "Correct Owner" message and 200 status code
    else:
        return jsonify({"error": "Signature not found"}), 404  # Return a JSON response with "Signature not found" error and 404 status code

    
    
    


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=105)
