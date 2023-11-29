# Dockerfile for Digiprime with Auctions.
#
# The image is based on Ubuntu 20.04 and contains Digiprime with auctions, Negotiation Engine and a MongoDB
# database they both share.
FROM        ubuntu:20.04
RUN         apt-get update

# 1. Install MongoDB
# https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
# -----------------------------------------------------------------------------
RUN         apt-get install -y curl gnupg
RUN         curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
RUN         echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list
RUN         apt-get update
RUN         apt-get install -y mongodb-org
RUN         mkdir -p /data/db

# 3. Ledger dependencies
# -----------------------------------------------------------------------------
WORKDIR     /ledger
RUN         apt-get update
RUN         apt-get install -y python3 python3-pip
ARG         requirements="./Ledger/requirements.txt"
COPY        ${requirements} .
RUN         pip3 install -r requirements.txt

# 4. Negotiation Engine dependencies
# -----------------------------------------------------------------------------
WORKDIR     /ne
RUN         apt-get install -y python3 python3-pip
ARG         requirements="./NegotiationEngine/API PILOT 1/requirements.txt"
COPY        ${requirements} .
RUN         pip3 install -r requirements.txt

# 5. Digiprime dependencies
# -----------------------------------------------------------------------------
WORKDIR     /digiprime

# Use Node v16
RUN         curl -fsSL https://deb.nodesource.com/setup_16.x | bash -

RUN         apt-get install -y nodejs
COPY        ./Digiprime/package.json .
COPY        ./Digiprime/package-lock.json .
RUN         npm install

# 6. Negotiation Engine
# -----------------------------------------------------------------------------
WORKDIR     /ne
ARG         ne_path="./NegotiationEngine/API PILOT 1/"
COPY        ${ne_path} .

# 7. Digiprime source
# -----------------------------------------------------------------------------
WORKDIR     /digiprime
COPY        ./Digiprime .
EXPOSE      3000

# 8. Ledger source
# -----------------------------------------------------------------------------
WORKDIR     /ledger
COPY        ./Ledger .
EXPOSE      105

# 10. Setting up required environment variables.
# -----------------------------------------------------------------------------
# General
ENV         SITE_ADDRESS="localhost"
ENV         USE_TLS="false"
ENV         BASE_URL=""

# Digiprime
ENV         DB_URL="mongodb://localhost:27017/offer-test"
ENV         SECRET="thisshouldbeabettersecret"
ENV         PORT="3000"
ENV         CLOUDINARY_CLOUD_NAME=""
ENV         CLOUDINARY_KEY=""
ENV         CLOUDINARY_SECRET=""
ENV         MAPBOX_TOKEN=""
ENV         APIKEY=""
ENV         NODE_ENV="development"
ENV         AUTH_BASE_URL="https://digiprime-mvp.red.extrasys.it/orc/"
ENV         DISMITTED_OBJECT="https://automotive.digiprime-mvp.red.extrasys.it/orc/data/edm?edmEntityName=dismittedObject"
ENV         AUTO_URL='https://automotive.digiprime-mvp.red.extrasys.it/orc/data/edm'
ENV         BATTERY_URL='https://battery.digiprime-mvp.red.extrasys.it/orc/data/edm'

# Negotiation Engine
ENV         DATABASE_URL="mongodb://localhost:27017/"

# Ledger Engine
ENV         LEDGER_URL=""

# 11. Copy & Run start script
# -----------------------------------------------------------------------------
# Copy start script.
WORKDIR     /
COPY        ./run.sh .
RUN         chmod +x ./run.sh
CMD         ./run.sh
