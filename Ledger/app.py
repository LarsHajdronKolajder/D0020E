#!/usr/bin/env python
#encoding: utf-8
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from bson.objectid import ObjectId
from pymongo.errors import DuplicateKeyError
from bson.json_util import dumps


connection_string = "mongodb+srv://LedgerSuperSecretUsername97187:Jdl7WM2E23aAxSPN@ledgerhistorydb.aeueeyi.mongodb.net/"

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})



cluster = MongoClient(connection_string, server_api = ServerApi('1'))

db = cluster['SignatureID']  # Database ID
col = db.Signature      # Collection ID


db_user = cluster['Users']
col_user = db_user.ID #LinkedList example

@app.route('/')
def home():
    response_data = {'default': '105'}
    return jsonify(response_data)

@app.route("/get", methods=['POST'])
def get_sig():
    BatteryID = request.json['BatteryID']
    signatures =  col.find_one({
        "BatteryID": BatteryID
    })
    
    sig_list = [signatures["CID"],signatures["CurOwner"]]

    return jsonify(sig_list)

@app.route("/batteryID", methods=['POST'])
def batteryID():
    
    # Retrieve BatteryID and UserName from the request's JSON data
    BatteryID = request.json['BatteryID']
    UserName = request.json['UserName']
    
    try:
        # Check if BatteryID already exists in the collection
        if col.find_one({"BatteryID": BatteryID}) == None:
            raise DuplicateKeyError("BatteryID already exists")
        return jsonify({"Good":"Exists"})
    except:
        # Create a new battery document with BatteryID, CurOwner, and CID
        newBattery = {
            "BatteryID": BatteryID,
            "CurOwner": UserName,
            "CID": "null"
        }     
        col.insert_one(newBattery)
        return jsonify({"Good":"NEW"})

@app.route("/update", methods=['POST'])
def update_sig():
    BatteryID = request.json['BatteryID']
    newOwner = request.json['NewOwner']

    col.update_one({"BatteryID": BatteryID}, {"$set": {"CurOwner": newOwner}})

    return jsonify({"Battery": "Updated"})
   
# This route handles the "/find" endpoint and expects a POST request
@app.route("/find", methods=['GET', 'POST'])
def get_data_from_database():
    #print(request.json)  # Print the JSON data received in the request
    JsonBattery = request.json['BatteryID']  # Extract the value of "BatteryID" from the JSON data
    #print(JsonBattery)  # Print the extracted "BatteryID"
    JsonCurOwner = request.json['CurOwner']  # Extract the value of "CurOwner" from the JSON data
    #print(JsonCurOwner)  # Print the extracted "CurOwner"

    # Find a document in the collection where "BatteryID" matches the extracted "JsonBattery"
    BatteryID = col.find_one({
        "BatteryID": JsonBattery
    })

    tempBrokers = []
    
    BrokerRole = col_user.find_one({
        "username": JsonCurOwner
    })

    if BrokerRole["role"] == "bro":
        try:
            tempBrokers = BrokerRole["seller"].split(",")
        except:
            tempBrokers = BrokerRole["seller"]


    #print(tempBrokers,"BrokerRole")
    # Check if the "CurOwner" in the found document matches the extracted "JsonCurOwner"
    if BatteryID["CurOwner"] == JsonCurOwner:
        return jsonify({"response": "Correct Owner"}), 200  # Return a JSON response with "Correct Owner" message and 200 status code
    elif BrokerRole["role"] == "bro" and BatteryID["CurOwner"] in tempBrokers:
        return jsonify({"response": "Correct Owner"}), 200  # Return a JSON response with "Correct Owner" message and 200 status code
    else:
        return jsonify({"error": "Signature not found"}), 404  # Return a JSON response with "Signature not found" error and 404 status code

    

    


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=105)
