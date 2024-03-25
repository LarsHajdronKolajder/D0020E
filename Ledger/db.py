
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from flask import jsonify
import asyncio

connection_string = os.environ.get('LEDGER_URL') # Connection string from MongoDB Atlas

cluster = MongoClient(connection_string, server_api = ServerApi('1'))

db = cluster['TestAnton']  # Database ID
col = db.TestAnton     # Collection ID

def add(event,id,meta,head,tail):
    ledger_dict = {
        "id" : id,
        "meta" : meta,
        "head" : head,
        "tail" : tail
    }
    col.insert_one(ledger_dict)
    return "/add success"

def get_data(api_code):
    signature = col.find_one({"id": api_code})
    print(signature)
    
    if signature:
        sig_dict = {
            "id": signature['id'],
            "date": signature['date'],
            "sig": signature['sig'],
            "payload": signature['payload']
        }
        return jsonify(sig_dict)
    else:
        return jsonify({"error": "Signature not found"}), 404
from pymongo import MongoClient

# Define a new Linked List class
class LinkedList:
    def __init__(self):
        pass

    # Since the constructor cannot be an asynchronous function,
    # we are going to create an async `init` function that connects to our MongoDB
    # database.
    # Note: You will need to replace the URI here with the one
    # you get from your MongoDB Cluster. This is the same URI
    # that you used to connect the MongoDB VS Code plugin to our cluster.
    async def init(self):
        uri = connection_string
        self.client = MongoClient(uri, connect=True)
        try:
            # await is not needed in Python for MongoClient connection
            self.client.server_info()
            print("Connected correctly to server")
            self.col = self.client["TestAnton"]["TestAnton"]
        except Exception as e:
            print(e)






    # This function will be responsible for cleaning up our metadata
    # function every time we reinitialize our app.
    async def reset_meta(self):
        self.col.update_one(
            {"meta": True},
            {"$set": {"head": None, "tail": None}},
            upsert=True
        )

    # Function to clean up all our Linked List data
    async def reset_data(self):
        self.col.delete_many({"value": {"$exists": True}})

    # This function will query our collection for our single
    # meta data document. This document will be responsible
    # for tracking the location of the head and tail documents
    # in our Linked List.
    async def get_meta(self):
        meta = self.col.find_one({"meta": True})
        return meta

    # points to our head
    async def get_head_id(self):
        meta = await self.get_meta()
        return meta["head"]

    # Function allows us to update our head in the
    # event that the head is changed
    async def set_head(self, node_id):
        result = self.col.update_one(
            {"meta": True},
            {"$set": {"head": node_id}}
        )
        return result

    # points to our tail
    async def get_tail(self):
        meta = await self.get_meta()
        return meta["tail"]

    # Function allows us to update our tail in the
    # event that the tail is changed
    async def set_tail(self, node_id):
        result = self.col.update_one(
            {"meta": True},
            {"$set": {"tail": node_id}}
        )
        return result

    # Create a brand new linked list node
    async def new_node(self, value):
        new_node = self.col.insert_one({"value": value, "next": None})
        return new_node


    # Takes a new node and adds it to our linked list
    async def add(self, value):
        result = await self.new_node(value)
        inserted_id = result.inserted_id

        # If the linked list is empty, we need to initialize an empty linked list
        head = await self.get_head_id()
        if head is None:
            await self.set_head(inserted_id)
        else:
            # if it's not empty, update the current tail's next to the new node
            tail_id = await self.get_tail()
            self.col.update_one({"_id": tail_id}, {"$set": {"next": inserted_id}})

        # Update your linked list to point tail to the new node
        await self.set_tail(inserted_id)
        return result

    # Reads through our list and returns the node we are looking for
    async def get(self, index):
        # If index is less than 0, return False
        if index <= -1:
            return False

        head_id = await self.get_head_id()
        position = 0
        curr_node = await self.col.find_one({"_id": head_id})

        # Loop through the nodes starting from the head
        while position < index:
            # Check if we hit the end of the linked list
            if curr_node["next"] is None:
                return False

            # If another node exists, go to the next node
            curr_node = await self.col.find_one({"_id": curr_node["next"]})
            position += 1

        return curr_node

# We are going to create an immediately invoked function expression (IFEE)
# in order for us to immediately test and run the linked list class defined above.
async def main():
    try:
        linkedList = LinkedList()
        await linkedList.init()
        await linkedList.reset_meta()
        await linkedList.reset_data()
        await linkedList.add("Hello")
        await linkedList.add("hello2")
        await linkedList.add("hello3")
    except Exception as e:
        # Good programmers always handle their errors
        print(e)

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())