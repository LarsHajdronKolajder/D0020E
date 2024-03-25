from __main__ import app
from flask import g, request
from flask_expects_json import expects_json

from lib.util import JSONEncoder

from service.contract_service import (
    get_contract,
    get_contracts,
    create_contract,
)


@app.route("/contracts/<contract_id>", methods=["GET"])
def route_get_contract(contract_id):
    """
    Returns the complete information about a single contract.
    """
    app.logger.info("get contract %s", contract_id)

    contract = get_contract(contract_id)
    return JSONEncoder().encode(contract), 200


@app.route("/contracts/list", methods=["GET"])
def route_list_contracts():
    """
    Returns a list of all contracts, containing only the id and the title.
    """
    purpose = request.args.get("purpose")
    if purpose is None:
        return {"message": "purpose must be passed as a parameter "}, 400
    app.logger.info("list all contracts for purpose: %s", purpose)

    contracts = get_contracts(purpose)
    return JSONEncoder().encode(contracts), 200


create_contract_schema = {
    "type": "object",
    "required": [
        "title",
        "used_for",
        "body",
    ],
    "additionalProperties": False,
    "properties": {
        "title": {"type": "string"},
        "used_for": {"type": "string"},
        "body": {"type": "string"},
    },
}


@app.route("/contracts", methods=["POST"])
@expects_json(create_contract_schema)
def route_create_contract():
    """
    Create a new contract.

    This is expected to be used by site administrators only.
    """
    app.logger.info("creating contract %s: %s", g.data["title"], g.data["body"])

    contract_id = create_contract(**g.data)
    response = {
        "message": "successfully created contract",
        "id": str(contract_id),
    }
    return JSONEncoder().encode(response), 200
