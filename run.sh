#!/bin/bash

# Start mongo
echo "Starting MongoDB"
nohup mongod &

# Start Negotiation Engine
echo "Starting Negotiation Engine..."
cd /ne
nohup python3 app.py &

# Start Ledger
echo "Starting Ledger..."
cd /ledger
nohup python3 app.py &

# Start Digiprime
echo "Starting Digiprime..."
cd /digiprime
node app.js 