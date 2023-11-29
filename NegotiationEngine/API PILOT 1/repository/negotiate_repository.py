from bson import ObjectId

from lib.mongo import (
    negotiation_collection,
)


def update_negotiation_with_bid(negotiation_id, username, bid, is_creator, signature):
    status = "offer" if is_creator else "counter_offer"
    my_signature = "payload.buyersign.val.0" if is_creator else "payload.sellersign.val.0"
    other_signature = "payload.sellersign.val.0" if is_creator else "payload.buyersign.val.0"

    filter_by = {"_id": ObjectId(negotiation_id)}
    update = {
        "$set": {
            "payload.status.val.0": status,
            "payload.offer_user.val.0": username,
            "payload.current_offer.val.0": bid,
            my_signature: signature,
            other_signature: "",
        }
    }

    negotiation_collection.update_one(filter_by, update)


def update_negotiation_status(negotiation_id, status, is_creator, signature):
    filter_by = {"_id": ObjectId(negotiation_id)}
    my_signature = "buyersign" if is_creator else "sellersign"

    update = {"$set": {"payload.status.val.0": status, my_signature: signature}}
    negotiation_collection.update_one(filter_by, update)
