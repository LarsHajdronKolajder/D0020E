from bson import ObjectId

from lib.mongo import (
    negotiation_collection,
)


def auction_set_closed(auction_id):
    filter_by = {"_id": ObjectId(auction_id)}
    update = {
        "$set": {
            "status": "closed",
        }
    }
    negotiation_collection.update_one(filter_by, update)


def update_highest_bidder(auction_id, bidder, bid, signature):
    filter_by = {"_id": ObjectId(auction_id)}
    update = {
        "$set": {
            "payload.highest_bidder.val.0": bidder,
            "payload.highest_bid.val.0": bid,
            "payload.buyersign.val.0": signature,
        }
    }
    negotiation_collection.update_one(filter_by, update)
