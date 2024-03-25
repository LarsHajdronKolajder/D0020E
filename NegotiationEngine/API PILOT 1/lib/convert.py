def convert_auction(d):
    ret = dict()

    skip = ["payload", "bids", "members"]
    for key in d:
        if key not in skip:
            ret[key] = d[key]

    skip = ["sellersign", "buyersign"]
    for key in d["payload"]:
        if key not in skip:
            ret[key] = d["payload"][key]["val"][0]

    if "members" in d:
        ret["members"] = []
        for member in d["members"]:
            mem = dict()
            mem["username"] = member["_id"]["username"]
            mem["added_by"] = member["added_by"]
            mem["added_at"] = member["added_at"]
            mem["location"] = member["location"]
            if "represented_by" in member:
                mem["represented_by"] = member["represented_by"]
            mem["is_room_admin"] = member["is_room_admin"]
            mem["offer_id"] = member["offer_id"]
            ret["members"].append(mem)

    if "bids" in d:
        skip = ["sign"]
        ret["bids"] = []
        for bid in d["bids"]:
            b = dict()
            for key in bid:
                if key in skip:
                    continue
                b[key] = bid[key]
            ret["bids"].append(b)

    return ret


def convert_negotiation(d):
    ret = dict()

    for key in d:
        if key not in ["payload", "members"]:
            ret[key] = d[key]

    for key in d["payload"]:
        ret[key] = d["payload"][key]["val"][0]

    if "members" in d:
        ret["members"] = []
        for member in d["members"]:
            mem = dict()
            mem["username"] = member["_id"]["username"]
            mem["added_by"] = member["added_by"]
            mem["added_at"] = member["added_at"]
            mem["location"] = member["location"]
            if "represented_by" in member:
                mem["represented_by"] = member["represented_by"]
            mem["is_room_admin"] = member["is_room_admin"]
            mem["offer_id"] = member["offer_id"]
            ret["members"].append(mem)

    return ret
