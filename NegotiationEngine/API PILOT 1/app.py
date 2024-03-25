from flask import Flask, render_template, request, jsonify, make_response
from flask_cors import CORS
import logging

from db import (
    neg_info,
    save_param2,
    sign_contract,
    change_status,
    get_neg,
    find_rooms,
    distance_calc,
    add_room_members,
    save_room2,
    get_sign,
    get_room,
    get_room_members,
    is_room_admin,
    remove_room_members,
    save_bid,
    update_room,
    get_negotiations_by_username,
    get_negotiation,
    sign_negotiation_contract,
    represented_cont,
    detect_broker,
)
from db import JSONEncoder
from lib.errors import NEError
from jsonschema import ValidationError

app = Flask(__name__)

from transport.user_transport import *
from transport.broker_transport import *
from transport.contract_transport import *
from transport.auction_transport import *
from transport.negotiate_transport import *

cors = CORS(app)
app.secret_key = "sfdjkafnk"

logging.basicConfig(level=logging.DEBUG)


@app.errorhandler(NEError)
def ne_errors(error):
    return make_response(jsonify({"message": error.message, "code": error.code}), error.status_code)


@app.errorhandler(400)
def bad_request(error):
    if isinstance(error.description, ValidationError):
        original_error = error.description
        return make_response(jsonify({"error": original_error.message}), 400)
    return error


# Edit room also is not enabled but should work with little effort if needed


@app.route("/rooms/<room_id>/edit", methods=["GET", "POST"])
def edit_room(room_id):
    username = request.authorization.username
    room = get_room(room_id)
    if room and is_room_admin(room_id, username):
        existing_room_members = [member["_id"]["username"] for member in get_room_members(room_id)]
        room_members_str = ",".join(existing_room_members)
        message = ""
        if request.method == "POST":
            room_name = request.json.get("room_name")
            room["name"] = room_name
            update_room(room_id, room_name)

            new_members = [username.strip() for username in request.json.get("members").split(",")]
            members_to_add = list(set(new_members) - set(existing_room_members))
            members_to_remove = list(set(existing_room_members) - set(new_members))
            if len(members_to_add):
                add_room_members(room_id, room_name, members_to_add, username)
            if len(members_to_remove):
                remove_room_members(room_id, members_to_remove)
            message = "Room edited successfully"
            room_members_str = ",".join(new_members)
        return render_template(
            "edit_room.html", room=room, room_members_str=room_members_str, message=message
        )
    else:
        return "Room not found", 404


# A GET request to this route is used to query auction based in the parameters listed below
@app.route("/rooms", methods=["GET"])
# @login_required
def query():

    if request.method == "GET":
        user = request.authorization.username
        room_type = request.json.get("room_type")
        room_name = request.json.get("room_name")
        reference_sector = request.json.get("reference_sector")
        reference_type = request.json.get("reference_type")
        ongoing = request.json.get("ongoing")
        distance = request.json.get("distance")
        location = request.json.get("location")  ##Needed
        is_broker = request.json.get("is_broker")
        broker_id = request.json.get("broker_id")
        if is_broker:
            broker_contract = represented_cont(broker_id)
            user = broker_contract["represented"]
        auctions = find_rooms(
            room_name, reference_sector, reference_type, ongoing, user, distance, location
        )
        return auctions, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
