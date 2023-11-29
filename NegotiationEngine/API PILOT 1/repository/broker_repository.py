from datetime import datetime
from bson import ObjectId

from lib.mongo import broker_collection
from lib.errors import BrokerAgreementNotFound


def count_valid_agreements_between(username, usernames):
    filter_by = {
        "status": "accepted",
        "end_date": {"$gte": datetime.utcnow()},
        "representant": username,
        "represented": {"$in": usernames},
    }
    return broker_collection.count_documents(filter_by)


def get_agreement(agreement_id):
    result = broker_collection.find_one({"_id": ObjectId(agreement_id)})
    if result is None:
        raise BrokerAgreementNotFound(agreement_id)
    return result


def get_agreements(username, skip, limit):
    filter_by = {
        "$or": [
            {"representant": username},
            {"represented": username},
        ]
    }
    agreements = broker_collection.find(filter_by).sort("_id", 1).skip(skip).limit(limit)
    total = broker_collection.count_documents(filter_by)
    return (list(agreements), total)


def get_active_agreements(username, skip, limit):
    filter_by = {
        "$or": [
            {"representant": username},
            {"represented": username},
        ],
        "end_date": {"$gte": datetime.utcnow()},
        "status": "accepted",
    }
    agreements = broker_collection.find(filter_by).sort("_id", 1).skip(skip).limit(limit)
    total = broker_collection.count_documents(filter_by)
    return (list(agreements), total)


def get_pending_agreements(username, skip, limit):
    filter_by = {
        "status": "pending",
        "$or": [
            {"representant": username},
            {"represented": username},
        ],
    }
    agreements = broker_collection.find(filter_by).sort("_id", 1).skip(skip).limit(limit)
    total = broker_collection.count_documents(filter_by)
    return (list(agreements), total)


def get_active_or_pending_agreements_between(username, other):
    filter_by = {
        "$or": [
            {"status": "accepted", "end_date": {"$gte": datetime.utcnow()}},
            {"status": "pending"},
        ],
        "$or": [
            {
                "representant": username,
                "represented": other,
            },
            {
                "represented": other,
                "represented": username,
            },
        ],
    }
    agreements = broker_collection.find(filter_by).sort("_id", 1)
    return list(agreements)


def get_active_agreements_between(username, other):
    filter_by = {
        "$or": [
            {"representant": username, "represented": other},
            {"representant": other, "represented": username},
        ],
        "end_date": {"$gte": datetime.utcnow()},
        "status": "accepted",
    }
    agreements = broker_collection.find(filter_by).sort("_id", 1)
    return list(agreements)


def get_last_agreement_for_each_represented(username):
    agreements = broker_collection.aggregate(
        [
            {
                "$match": {
                    "representant": username,
                    "status": "accepted",
                    "end_date": {"$gte": datetime.utcnow()},
                }
            },
            {
                "$group": {
                    "_id": "$represented",
                    "doc": {
                        "$max": {
                            "end_date": "$end_date",
                            "representant": "$representant",
                            "represented": "$represented",
                            "status": "$status",
                            "_id": "$_id",
                        }
                    },
                }
            },
        ]
    )

    def flatten_agreements(d):
        return {
            "_id": d["doc"]["_id"],
            "representant": d["doc"]["representant"],
            "represented": d["doc"]["represented"],
            "end_date": d["doc"]["end_date"],
            "status": d["doc"]["status"],
        }

    return [flatten_agreements(agreement) for agreement in list(agreements)]


def create_agreement(
    title,
    representant,
    represented,
    end_date,
    template_id,
    representant_signature,
    represented_signature,
):
    data = {
        "title": title,
        "status": "pending",
        "representant": representant,
        "represented": represented,
        "start_date": datetime.utcnow(),
        "end_date": end_date,
        "representant_signature": representant_signature,
        "represented_signature": represented_signature,
        "template_id": template_id,
        "contract_content": "",
    }
    return broker_collection.insert_one(data).inserted_id


def accept_agreement(agreement, contract, representant_signature, represented_signature):
    filter_by = {"_id": agreement["_id"]}
    update = {
        "status": "accepted",
        "representant_signature": representant_signature,
        "represented_signature": represented_signature,
        "contract_content": contract,
    }
    broker_collection.update_one(filter_by, {"$set": update})


def reject_agreement(agreement):
    filter_by = {"_id": agreement["_id"]}
    update = {"status": "rejected"}
    broker_collection.update_one(filter_by, {"$set": update})
