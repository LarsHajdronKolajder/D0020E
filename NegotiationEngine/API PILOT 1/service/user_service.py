import hashlib
import uuid
from werkzeug.security import generate_password_hash
from pymongo.errors import DuplicateKeyError

from lib.errors import UserNotFound, UserAlreadyExists
import repository.user_repository as user_repository


def create_user(username, email, password):
    hashed_password = generate_password_hash(password)
    salt = uuid.uuid4().hex
    signature = hashlib.sha256(salt.encode() + password.encode()).hexdigest() + ":" + salt

    try:
        user_repository.save_user(username, email, hashed_password, signature)
    except DuplicateKeyError:
        raise UserAlreadyExists


def get_signature(username):
    user = user_repository.get_user_by_username(username)
    if user is None:
        raise UserNotFound(username)

    return user["sign"]
