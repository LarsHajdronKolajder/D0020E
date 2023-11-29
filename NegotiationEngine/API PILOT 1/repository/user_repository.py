from bson import ObjectId
from lib.mongo import user_collection


def save_user(username, email, hashed_password, signature):
    user_collection.insert_one(
        {
            "_id": ObjectId(),
            "type": "user",
            "username": username,
            "email": email,
            "password": hashed_password,
            "sign": signature,
        }
    )


def get_user_by_username(username):
    return user_collection.find_one({"username": username})
