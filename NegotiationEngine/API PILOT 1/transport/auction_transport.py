from __main__ import app
from flask import g, request
from flask_expects_json import expects_json

from lib.util import JSONEncoder, int_or_default, get_username
from lib.convert import convert_auction

from service.auction_service import (
    create_auction,
    get_auction,
    get_auctions,
    get_auction_representations,
    get_auctions_ended,
    get_public_auctions,
    join_auction,
    place_bid,
    represent_as_broker,
    invite_to_auction,
)


@app.route("/rooms/<auction_id>", methods=["GET"])
def route_get_auction(auction_id):
    """
    Returns the complete information about the auction. Combines the result of the
    room, room_details, room_members, and messages (bids) collections.

    Errors:
    - If the privacy is not set to public it checks that the user is a part of the auction,
      if not a 400 Bad Request is returned.
    """
    username = get_username(request)
    app.logger.info("%s requesting auction %s information", username, auction_id)

    if request.args.get("is_broker"):
        auction = get_auction(auction_id, username, is_broker=True)
    else:
        auction = get_auction(auction_id, username)

    auction = convert_auction(auction)
    return JSONEncoder().encode(auction), 200


@app.route("/rooms/all", methods=["GET"])
def route_list_auctions():
    """
    Returns all the rooms the user is a part of. Return room and room details with bids.
    """
    username = request.authorization.username
    broker_id = request.args.get("broker_id")
    broker_id = "" if broker_id is None else broker_id

    skip = int_or_default(request.args.get("skip"), 0)
    limit = int_or_default(request.args.get("limit"), 20)
    app.logger.info("%s requesting auctions", username)

    if request.args.get("representations"):
        (auctions, total) = get_auction_representations(username, skip, limit)
    else:
        (auctions, total) = get_auctions(username, broker_id, skip, limit)

    response = {
        "auctions": [convert_auction(a) for a in auctions],
        "total": total,
    }
    return JSONEncoder().encode(response), 200


@app.route("/rooms/history", methods=["GET"])
def route_list_auction_history():
    """
    Returns historical auctions the user has been part of.
    """
    username = request.authorization.username
    broker_id = request.args.get("broker_id")
    broker_id = "" if broker_id is None else broker_id

    skip = int_or_default(request.args.get("skip"), 0)
    limit = int_or_default(request.args.get("limit"), 20)
    app.logger.info("%s requesting auctions", username)

    (auctions, total) = get_auctions_ended(username, broker_id, skip, limit)

    response = {
        "auctions": [convert_auction(a) for a in auctions],
        "total": total,
    }
    return JSONEncoder().encode(response), 200


@app.route("/rooms/public", methods=["GET"])
def route_list_public_auctions():
    """
    Returns list of public auctions
    """
    skip = int_or_default(request.args.get("skip"), 0)
    limit = int_or_default(request.args.get("limit"), 20)

    (auctions, total) = get_public_auctions(skip, limit)

    response = {
        "auctions": [convert_auction(a) for a in auctions],
        "total": total,
    }
    return JSONEncoder().encode(response), 200


create_auction_schema = {
    "type": "object",
    "required": [
        "room_name",
        "privacy",
        "auction_type",
        "closing_time",
        "reference_sector",
        "reference_type",
        "quantity",
        "unit",
        "offer_id",
        "templatetype",
        "location",
        "members",
        "broker_id",
    ],
    "additionalProperties": False,
    "properties": {
        "room_name": {"type": "string"},
        "privacy": {"type": "string", "pattern": "^(public|private)$"},
        "auction_type": {"type": "string", "pattern": "^(ascending|descending)$"},
        "closing_time": {"type": "string"},
        "reference_sector": {"type": "string"},
        "reference_type": {"type": "string"},
        "quantity": {"type": "number"},
        "unit": {"type":"string"},
        "offer_id": {"type": "string"},
        "templatetype": {"type": "string"},
        "location": {
            "type": "array",
            "prefixItems": [
                {"type": "number"},
                {"type": "number"},
            ],
            "items": False,
        },
        "members": {
            "type": "array",
            "uniqueItems": True,
            "items": {
                "type": "object",
                "required": ["username", "location", "offer_id"],
                "properties": {
                    "username": {"type": "string"},
                    "location": {
                        "type": "array",
                        "prefixItems": [
                            {"type": "number"},
                            {"type": "number"},
                        ],
                        "items": False,
                    },
                    "offer_id": {"type": "string"},
                },
            },
        },
        "broker_id": {"type": "string"},
    },
}


@app.route("/create-room", methods=["POST"])
@expects_json(create_auction_schema)
def route_create_room():
    """
    Create new auction
    """
    username = get_username(request)
    auction_id = create_auction(username, g.data)

    response = {
        "message": "Auction {} has been created".format(g.data["room_name"]),
        "id": str(auction_id),
    }
    return JSONEncoder().encode(response), 200


join_auction_schema = {
    "type": "object",
    "required": ["location", "broker_id"],
    "additionalProperties": False,
    "properties": {
        "location": {
            "type": "array",
            "prefixItems": [
                {"type": "number"},
                {"type": "number"},
            ],
            "items": False,
        },
        "broker_id": {"type": "string"},
    },
}


@app.route("/rooms/<auction_id>/join", methods=["POST"])
@expects_json(join_auction_schema)
def route_join_auction(auction_id):
    username = get_username(request)
    join_auction(auction_id, username, g.data["location"], g.data["broker_id"])

    response = {
        "message": "You have joined the room {}".format(auction_id),
        "id": auction_id,
    }
    return JSONEncoder().encode(response), 200


represent_schema = {
    "type": "object",
    "required": ["broker_id"],
    "additionalProperties": False,
    "properties": {
        "broker_id": {"type": "string"},
    },
}


@app.route("/rooms/<auction_id>/represent", methods=["POST"])
@expects_json(represent_schema)
def route_represent_in_auction(auction_id):
    username = get_username(request)
    represented = represent_as_broker(auction_id, username, g.data["broker_id"])

    response = {
        "message": "You are now representing {} in auction {}".format(represented, auction_id),
        "id": auction_id,
    }
    return JSONEncoder().encode(response), 200


auction_place_bid_schema = {
    "type": "object",
    "required": ["bid"],
    "additionalProperties": False,
    "properties": {
        "bid": {"type": "number"},
    },
}


@app.route("/rooms/<auction_id>", methods=["POST"])
@expects_json(auction_place_bid_schema)
def route_auction_place_bid(auction_id):
    username = get_username(request)
    bid = g.data["bid"]
    app.logger.info("{} submits bid {} to auction {}".format(username, bid, auction_id))

    place_bid(auction_id, username, bid)

    return {"message": "You have issued the bid {} to auction {}".format(bid, auction_id)}, 200


auction_invite_schema = {
    "type": "object",
    "required": ["username", "location", "offer_id"],
    "properties": {
        "username": {"type": "string"},
        "location": {
            "type": "array",
            "prefixItems": [
                {"type": "number"},
                {"type": "number"},
            ],
            "items": False,
        },
        "offer_id": {"type": "string"},
    },
}


@app.route("/rooms/<auction_id>/invite", methods=["POST"])
@expects_json(auction_invite_schema)
def route_auction_invite(auction_id):
    username = get_username(request)
    app.logger.info("{} invites {} to auction {}".format(username, g.data["username"], auction_id))
    invite_to_auction(auction_id, username, g.data)


    response = {
        "message": "You have invited user {} to auction {}".format(g.data["username"], auction_id),
        "id": auction_id,
    }
    return JSONEncoder().encode(response), 200
