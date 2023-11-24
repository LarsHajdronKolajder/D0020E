from pymongo import MongoClient
import os

# Mongo Client
client = MongoClient(os.environ.get("DATABASE_URL"))

# Negotiation Engine Database
negengine_db = client.get_database("NegotiationEngine")

# Collections used
user_collection = negengine_db.get_collection("users")

negotiation_collection = negengine_db.get_collection("negotiations")
details_collection = negengine_db.get_collection("negotiation_details")
members_collection = negengine_db.get_collection("room_members")
bids_collection = negengine_db.get_collection("bids")

templates_collection = negengine_db.get_collection("templates")
broker_collection = negengine_db.get_collection("brokers")

# Create required indexes
user_collection.create_index("username", unique=True)
templates_collection.create_index("title", unique=True)
