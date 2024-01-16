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
CORS(app)

os.environ.get('LEDGER_URL')

connection_string =  os.environ.get('LEDGER_URL')

cluster = MongoClient(connection_string, server_api = ServerApi('1'))

db = cluster['SignatureID']  # Database ID
col = db.Signature      # Collection ID


db_link = cluster['LinkedTest']
col_link = db_link.LinkedList #LinkedList example


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

@app.route("/getLink", methods=["GET"])
def get_link():
    signatures = col_link.find()
    sig_list = []
    for item in signatures:
        sig_dict = {
            "_id": str(item['_id']),
            "batteryId": item.get('batteryId', ''),
            "child": item.get('child', '')
        }
    sig_list.append(sig_dict)
    return jsonify(sig_list)


@app.route("/link2", methods=["POST"])
def test2():
    col_link.insert_one({"batteryId": 2, "child":None})
    return "/link2 added"


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
    
    
    
@app.route("/link", methods=["POST"])
def link_batteries():
    try:
        data = request.json
        batteryId = data.get('batteryId')

        existing_parent = col_link.find_one({"batteryId": batteryId})

        if existing_parent: # if found we find the last child of that entry 
            last_child = find_last(existing_parent)
            child_document = {
                "batteryId": batteryId,
                "child": None,
                "parent": last_child["_id"]
            }
            ##
            col_link.insert_one(child_document)
            ## Update the lastchild with the new info  
            col_link.update_one({"_id": last_child["_id"]}, {"$set": {"child": child_document["_id"]}})
        else:  # First entry of the batteryId
            parent_document = {
                "batteryId": batteryId,
                "child": None,
                "parent": None
            }
            col_link.insert_one(parent_document).inserted_id

        return jsonify({"message": "Link added successfully"})

    except DuplicateKeyError:
        return jsonify({"error": "Duplicate link"}), 400
    
@app.route("/getLink/<string:batteryId>", methods=["GET"])
def get_linked_batteries(batteryId):
    result = col_link.aggregate([
        {
            "$match": {"batteryId": batteryId}
        },
        {
            "$graphLookup": {
                "from": "LinkedList",
                "startWith": "$child",
                "connectFromField": "child",
                "connectToField": "batteryId",
                "as": "linkedBatteries"
            }
        }
    ])
    return jsonify(result)

def find_last(existing_parent):
    if not existing_parent.get('child'):
        return existing_parent
    else:
        child_id = existing_parent['child']
        last_child = col_link.find_one({"_id": child_id})
        return find_last(last_child)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=105)
