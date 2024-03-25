from datetime import datetime
from bson import ObjectId

from lib.mongo import (
    negotiation_collection,
    details_collection,
    bids_collection,
    members_collection,
)


NEGOTIATION_ASCENDING = "ascending"
NEGOTIATION_DESCENDING = "descending"


def get_negotiation(negotiation_id):
    negotiation_id = ObjectId(negotiation_id)
    negotiation = negotiation_collection.find_one({"_id": negotiation_id})
    return negotiation


def get_negotiations(
    negotiation_ids, negotiation_type, sort_by="_id", filters={}, skip=0, limit=20
):
    filter_by = {
        "_id": {"$in": negotiation_ids},
        "type": negotiation_type,
        **filters,
    }
    negotiations = negotiation_collection.find(filter_by).sort(sort_by, 1).skip(skip).limit(limit)
    total = negotiation_collection.count_documents(filter_by)
    return (list(negotiations), total)


def get_public_negotiations(negotiation_type, skip, limit):
    filter_by = {
        "type": negotiation_type,
        "privacy": "public",
    }
    negotiations = negotiation_collection.find(filter_by).sort("_id", 1).skip(skip).limit(limit)
    total = negotiation_collection.count_documents(filter_by)
    print("total", total)
    return (list(negotiations), total)


def get_negotiation_membership_ids(username):
    """
    Returns all rooms the user is apart of
    """
    negotiations = members_collection.find({"_id.username": username})
    return [n["_id"]["room_id"] for n in list(negotiations)]


def get_negotiation_representations_ids(username):
    """
    Returns all rooms the user is apart of
    """
    negotiations = members_collection.find({"represented_by": username})
    return [n["_id"]["room_id"] for n in list(negotiations)]


def get_details(negotiation_id):
    negotiation_id = ObjectId(negotiation_id)
    return details_collection.find_one({"_id": negotiation_id})


def get_member_in_negotiation(negotiation_id, username, include_brokers=True):
    negotiation_id = ObjectId(negotiation_id)
    if include_brokers:
        filter_by = {
            "$or": [
                {"_id": {"room_id": negotiation_id, "username": username}},
                {"_id.room_id": negotiation_id, "represented_by": username},
            ]
        }
    else:
        filter_by = {"_id": {"room_id": negotiation_id, "username": username}}

    return members_collection.find_one(filter_by)


def get_members_in_negotiation(negotiation_id):
    negotiation_id = ObjectId(negotiation_id)
    return list(members_collection.find({"_id.room_id": negotiation_id}))


def get_member_by_represented(negotiation_id, represented_by):
    negotiation_id = ObjectId(negotiation_id)
    return members_collection.find_one(
        {"_id.room_id": negotiation_id, "represented_by": represented_by}
    )


def get_bids(negotation_id, auction_type):
    negotation_id = ObjectId(negotation_id)

    max_or_min = "$max" if auction_type == NEGOTIATION_ASCENDING else "$min"
    bids = bids_collection.aggregate(
        [
            {"$match": {"room_id": str(negotation_id)}},
            {
                "$group": {
                    "_id": "$payload.sender.val",
                    "doc": {
                        max_or_min: {
                            "text": "$payload.text.val",
                            "sender": "$payload.sender.val",
                            "created_at": "$payload.created_at.val",
                            "distance": "$payload.distance.val",
                            "sign": "$payload.sign.val",
                        },
                    },
                }
            },
        ]
    )

    def flatten_bids(d):
        return {
            "text": d["doc"]["text"][0],
            "sender": d["doc"]["sender"][0],
            "created_at": d["doc"]["created_at"][0],
            "distance": d["doc"]["distance"][0],
            "sign": d["doc"]["sign"][0],
        }

    return [flatten_bids(bid) for bid in list(bids)]


def map_payload(payload):
    data = dict()
    for key in payload:
        data[key] = {"val": [payload[key]]}
    return data


def save_negotiation(negotiation_type, privacy, payload):
    return negotiation_collection.insert_one(
        {
            "_id": ObjectId(),
            "type": negotiation_type,
            "privacy": privacy,
            "status": "active",
            "payload": map_payload(payload),
        }
    ).inserted_id


def save_details(negotiation_id, negotiation_type, payload):
    return details_collection.insert_one(
        {
            "_id": negotiation_id,
            "type": negotiation_type,
            "payload": map_payload(payload),
        }
    ).inserted_id


def save_member(
    negotiation_id,
    username,
    added_by,
    location,
    offer_id,
    represented_by="",
    is_admin=False,
):
    members_collection.insert_one(
        {
            "_id": {"room_id": ObjectId(negotiation_id), "username": username},
            "added_by": added_by,
            "added_at": datetime.utcnow(),
            "location": location,
            "offer_id": offer_id,
            "is_room_admin": is_admin,
            "represented_by": represented_by,
        }
    )
    pass


def save_members(negotiation_id, added_by, members):
    members = [
        {
            "_id": {"room_id": ObjectId(negotiation_id), "username": member["username"]},
            "added_by": added_by,
            "added_at": datetime.utcnow(),
            "location": member["location"],
            "offer_id": member["offer_id"],
            "is_room_admin": False,
            "represented_by": "",
        }
        for member in members
    ]

    members_collection.insert_many(members)


def update_broker_for_member(negotiation_id, username, represented_by):
    filter_by = {"_id": {"room_id": ObjectId(negotiation_id), "username": username}}
    update = {"$set": {"represented_by": represented_by}}
    members_collection.update_one(filter_by, update)


def save_bid(
    negotiation_type,
    negotiation_id,
    bid,
    sender,
    sign,
    distance,
):
    created_at = datetime.utcnow()
    bids_collection.insert_one(
        {
            "_id": ObjectId(),
            "type": negotiation_type,
            "room_id": negotiation_id,
            "payload": {
                "text": {"val": [bid]},
                "sender": {"val": [sender]},
                "created_at": {"val": [created_at]},
                "sign": {"val": [sign]},
                "distance": {"val": [distance]},
            },
        }
    )
