from datetime import datetime

from lib.errors import (
    NegotiateNotAuthorized,
    NegotiateAlreadyConcluded,
    NegotiateWaitForCounterOffer,
)
from lib.util import get_distance

import service.negotiation_service as negotiation_service
from service.broker_service import (
    get_valid_agreement,
)
from service.user_service import get_signature
from service.contract_service import get_contract
from db import sign_negotiation_contract2

from repository.negotiation_repository import (
    save_negotiation,
    save_details,
    save_member,
    get_member_in_negotiation,
    save_bid,
)
from repository.negotiate_repository import update_negotiation_with_bid, update_negotiation_status


def get_negotiation(negotiation_id, username, is_broker=False):
    negotiation = negotiation_service.get_negotiaton_check_broker(
        username,
        negotiation_id,
        is_broker,
        include_details=True,
        include_bids=False,
        include_members=True,
    )

    if negotiation["payload"]["status"]["val"][0] == "accepted":
        # Auction has ended
        template_title = negotiation["payload"]["templatetype"]["val"][0]
        template = get_contract(template_title)
        negotiation["contract"] = sign_negotiation_contract2(negotiation, template)["body"]

    return negotiation


def get_negotiations(username, broker_id, skip, limit):
    if broker_id != "":
        agreement = get_valid_agreement(broker_id)
        username = agreement["represented"]

    return negotiation_service.get_negotiations(
        username, "negotiation", include_details=True, skip=skip, limit=limit
    )


def get_negotiations_representations(username, skip, limit):
    return negotiation_service.get_negotiations_representing(
        username,
        "negotiation",
        include_details=True,
        skip=skip,
        limit=limit,
    )


def create_negotiation(username, data):
    represented_by = ""
    if data["broker_id"] != "":
        agreement = get_valid_agreement(data["broker_id"], username)
        (username, represented_by) = (agreement["represented"], username)

    user_signature = get_signature(username)
    negotiation_id = save_negotiation(
        "negotiation",
        "private",
        {
            "name": data["name"],
            "created_by": username,
            "created_at": datetime.utcnow(),
            "seller": data["member"]["username"],
            "end_date": 0,
            "current_offer": data["bid"],
            "offer_user": username,
            "buyersign": user_signature,
            "sellersign": "",
            "templatetype": data["templatetype"],
            "status": "submitted",
            "location": data["member"]["location"],
        },
    )

    save_details(
        negotiation_id,
        "details",
        {
            "room_name": data["name"],
            "created_by": username,
            "reference_sector": data["reference_sector"],
            "reference_type": data["reference_type"],
            "quantity": data["quantity"],
            "unit": data["unit"],
            "articleno": data["member"]["offer_id"],
        },
    )

    save_member(
        negotiation_id=negotiation_id,
        username=username,
        added_by=username,
        location=data["location"],
        offer_id=data["offer_id"],
        represented_by=represented_by,
        is_admin=True,
    )

    save_member(
        negotiation_id=negotiation_id,
        username=data["member"]["username"],
        added_by=username,
        location=data["member"]["location"],
        offer_id=data["member"]["offer_id"],
        represented_by="",
        is_admin=False,
    )
    return negotiation_id


def validate_negotiate(negotiation_id, username, new_status):
    member = get_member_in_negotiation(negotiation_id, username, include_brokers=True)
    if member is None:
        raise NegotiateNotAuthorized

    negotiation = negotiation_service.get_negotiation(negotiation_id, include_members=True)

    status = negotiation["payload"]["status"]["val"][0]
    if status in ("accepted", "rejected"):
        raise NegotiateAlreadyConcluded(negotiation_id)

    if new_status != "rejected":
        offer_user = negotiation["payload"]["offer_user"]["val"][0]
        if username == offer_user:
            raise NegotiateWaitForCounterOffer(negotiation_id)

    # Return username of participant, in-case the passed username is a broker.
    return (negotiation, member["_id"]["username"])


def place_bid(negotiation_id, username, bid):
    (negotiation, username) = validate_negotiate(negotiation_id, username, "test")

    locations = []
    for member in negotiation["members"]:
        locations.append(member["location"])
    distance = get_distance(locations[0], locations[1])
    user_signature = get_signature(username)
    save_bid(
        negotiation_type="negotiation",
        negotiation_id=negotiation_id,
        bid=bid,
        sender=username,
        sign=user_signature,
        distance=distance,
    )

    negotiation_creator = negotiation["payload"]["created_by"]["val"][0]
    is_creator = negotiation_creator == username
    update_negotiation_with_bid(negotiation_id, username, bid, is_creator, user_signature)


def handle_accept_reject(negotiation_id, username, new_status):
    (negotiation, username) = validate_negotiate(negotiation_id, username, new_status)
    negotiation_creator = negotiation["payload"]["created_by"]["val"][0]
    is_creator = negotiation_creator == username

    user_signature = get_signature(username)
    update_negotiation_status(
        negotiation_id=negotiation_id,
        status=new_status,
        is_creator=is_creator,
        signature=user_signature,
    )
