from flask import Flask
from pymongo import MongoClient
from pymongo.server_api import ServerApi

#import os
#connection_string =  os.environ.get('LEDGER_URL')

connection_string = "mongodb+srv://LedgerSuperSecretUsername97187:Jdl7WM2E23aAxSPN@ledgerhistorydb.aeueeyi.mongodb.net/" #os.environ.get('LEDGER_URL')

cluster = MongoClient(connection_string, server_api = ServerApi('1'))

app = Flask(__name__)

db_users = cluster['Users']  # Database ID
col_users = db_users.ID      # Collection ID