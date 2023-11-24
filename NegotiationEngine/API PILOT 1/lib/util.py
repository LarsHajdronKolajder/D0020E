import json
from datetime import datetime, date
from bson import ObjectId
from geopy.distance import geodesic


from lib.errors import NotAuthenticated


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, (datetime, date)):
            return o.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        return json.JSONEncoder.default(self, o)


def get_username(request):
    if request.authorization is None:
        raise NotAuthenticated

    username = request.authorization.username
    if username is None:
        raise NotAuthenticated
    return username


def int_or_default(s, default):
    try:
        return int(s)
    except:
        return default


def get_distance(source, target):
    return geodesic(tuple(source), tuple(target)).km
