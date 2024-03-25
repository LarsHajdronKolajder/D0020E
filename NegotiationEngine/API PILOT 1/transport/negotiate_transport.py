from __main__ import app
from flask import g, request
from flask_expects_json import expects_json

from lib.util import JSONEncoder, int_or_default, get_username
from lib.convert import convert_negotiation
import service.negotiate_service as negotiate_service


@app.route("/negotiate/<negotiation_id>", methods=["GET"])
def route_negotiatiate_get(negotiation_id):
    username = get_username(request)

    if request.args.get("is_broker"):
        negotiation = negotiate_service.get_negotiation(negotiation_id, username, is_broker=True)
    else:
        negotiation = negotiate_service.get_negotiation(negotiation_id, username)

    negotiation = convert_negotiation(negotiation)
    return JSONEncoder().encode(negotiation), 200


@app.route("/negotiate/list", methods=["GET"])
def route_negotiate_list():
    """
    Gets a list of all the negotiations a user is part of.
    """
    username = get_username(request)
    broker_id = request.args.get("broker_id")
    broker_id = "" if broker_id is None else broker_id

    skip = int_or_default(request.args.get("skip"), 0)
    limit = int_or_default(request.args.get("limit"), 20)
    app.logger.info("%s requesting negotiation list, skip=%s, limit=%s", username, skip, limit)

    if request.args.get("representations"):
        (negotiations, total) = negotiate_service.get_negotiations_representations(
            username, skip, limit
        )
    else:
        (negotiations, total) = negotiate_service.get_negotiations(username, broker_id, skip, limit)

    negotiations = [convert_negotiation(n) for n in negotiations]
    response = {
        "negotiations": negotiations,
        "total": total,
    }
    return JSONEncoder().encode(response), 200


create_negotiation_schema = {
    "type": "object",
    "required": [
        "name",
        "location",
        "offer_id",
        "bid",
        "quantity",
        "unit",
        "member",
        "templatetype",
        "reference_sector",
        "reference_type",
        "broker_id",
    ],
    "additionalProperties": False,
    "properties": {
        "name": {"type": "string"},
        "location": {
            "type": "array",
            "prefixItems": [
                {"type": "number"},
                {"type": "number"},
            ],
            "items": False,
        },
        "offer_id": {"type": "string"},
        "bid": {"type": "number"},
        "quantity": {"type": "number"},
        "unit": {"type": "string"},
        "member": {
            "type": "object",
            "required": ["username", "location", "offer_id"],
            "additionalProperties": False,
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
        "templatetype": {"type": "string"},
        "reference_sector": {"type": "string"},
        "reference_type": {"type": "string"},
        "broker_id": {"type": "string"},
    },
}


@app.route("/negotiate", methods=["POST"])
@expects_json(create_negotiation_schema)
def route_create_negotiation():
    username = get_username(request)
    negotiation_id = negotiate_service.create_negotiation(username, g.data)

    response = {
        "message": "The negotiation with id {} has been created".format(str(negotiation_id)),
        "id": str(negotiation_id),
    }
    return JSONEncoder().encode(response), 200


negotiate_bid_schema = {
    "type": "object",
    "required": ["bid"],
    "additionalProperties": False,
    "properties": {"bid": {"type": "string"}},
}


@app.route("/negotiate/<negotiation_id>", methods=["POST"])
@expects_json(negotiate_bid_schema)
def route_negotiation_bid(negotiation_id):
    username = get_username(request)
    negotiate_service.place_bid(negotiation_id, username, g.data["bid"])

    response = {
        "message": "New offer submited for request with id {}".format(negotiation_id),
    }
    return JSONEncoder().encode(response), 200


@app.route("/negotiate/<negotiation_id>/accept", methods=["POST"])
def route_negotiation_accept(negotiation_id):
    username = get_username(request)

    negotiate_service.handle_accept_reject(negotiation_id, username, "accepted")

    response = {
        "message": "The negotiation with id {} has been accepted.".format(negotiation_id),
    }
    return JSONEncoder().encode(response), 200


@app.route("/negotiate/<negotiation_id>/cancel", methods=["POST"])
def route_negotiation_cancel(negotiation_id):
    username = get_username(request)

    negotiate_service.handle_accept_reject(negotiation_id, username, "rejected")

    response = {
        "message": "The negotiation with id {} has been rejected.".format(negotiation_id),
    }
    return JSONEncoder().encode(response), 200
