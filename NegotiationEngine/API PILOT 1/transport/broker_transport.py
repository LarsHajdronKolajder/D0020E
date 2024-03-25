from __main__ import app
from flask import g, request
from flask_expects_json import expects_json
from dateutil import parser

from lib.util import JSONEncoder, int_or_default, get_username
from service.broker_service import (
    get_agreement,
    get_agreements,
    get_pending_agreements,
    get_active_agreements,
    get_active_agreements_between,
    get_active_or_pending_agreements_between,
    get_represented_user_agreements,
    create_agreement,
    accept_agreement,
    reject_agreement,
)


@app.route("/broker/<agreement_id>", methods=["GET"])
def route_broker_get_agreement(agreement_id):
    username = get_username(request)
    agreement = get_agreement(agreement_id, username)

    return JSONEncoder().encode(agreement), 200


@app.route("/broker/representing", methods=["GET"])
def route_broker_list_representing():
    username = get_username(request)

    agreements = get_represented_user_agreements(username)
    return JSONEncoder().encode(agreements), 200


@app.route("/broker/between", methods=["GET"])
def route_broker_list_agreements_between():
    username = get_username(request)
    other = request.args.get("other")

    if request.args.get("active"):
        agreements = get_active_agreements_between(username, other)
    else:
        agreements = get_active_or_pending_agreements_between(username, other)

    return JSONEncoder().encode(agreements), 200


@app.route("/broker/list", methods=["GET"])
def route_broker_list_agreements():
    username = get_username(request)
    skip = int_or_default(request.args.get("skip"), 0)
    limit = int_or_default(request.args.get("limit"), 20)

    if request.args.get("pending"):
        (agreements, total) = get_pending_agreements(username, skip, limit)
    elif request.args.get("active"):
        (agreements, total) = get_active_agreements(username, skip, limit)
    else:
        (agreements, total) = get_agreements(username, skip, limit)

    response = {
        "broker_agreements": agreements,
        "total": total,
    }
    return JSONEncoder().encode(response), 200


create_agreement_schema = {
    "type": "object",
    "required": ["representant", "represented", "end_date"],
    "additionalProperties": False,
    "properties": {
        "representant": {"type": "string"},
        "represented": {"type": "string"},
        "end_date": {"type": "string"},
        "template_id": {"type": "string"},
    },
}


@app.route("/broker", methods=["POST"])
@expects_json(create_agreement_schema)
def route_broken_create_agreement():
    """
    Create new agreement between the broker and the represented. This will be set as a pending
    agreement. And the represented has to accept the agreement.
    """
    username = get_username(request)
    data = g.data

    if username not in (data["represented"], data["representant"]):
        return {"message": "user must be either representant or represented"}, 400

    data["end_date"] = parser.isoparse(data["end_date"])
    agreement_id = create_agreement(username=username, **data)

    response = {
        "message": "Successfully created broker agreement",
        "id": str(agreement_id),
    }
    return JSONEncoder().encode(response), 200


@app.route("/broker/<agreement_id>/accept", methods=["POST"])
def route_broker_accept_agreement(agreement_id):
    username = get_username(request)
    accept_agreement(agreement_id, username)

    response = {"message": "Successfully accepted broker agreement"}
    return JSONEncoder().encode(response), 200


@app.route("/broker/<agreement_id>/reject", methods=["POST"])
def route_broker_reject_agreement(agreement_id):
    username = get_username(request)
    reject_agreement(agreement_id, username)

    response = {"message": "Successfully rejected broker agreement"}
    return JSONEncoder().encode(response), 200
