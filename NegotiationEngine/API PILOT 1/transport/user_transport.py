from __main__ import app
from flask import g
from flask_expects_json import expects_json

from lib.util import JSONEncoder
from service.user_service import create_user

signup_schema = {
    "type": "object",
    "required": ["username", "email", "password"],
    "additionalProperties": False,
    "properties": {
        "username": {"type": "string"},
        "email": {"type": "string"},
        "password": {"type": "string"},
    },
}


@app.route("/signup", methods=["POST"])
@expects_json(signup_schema)
def route_signup():
    create_user(g.data["username"], g.data["email"], g.data["password"])
    return JSONEncoder().encode({"message": "User created"}), 200
