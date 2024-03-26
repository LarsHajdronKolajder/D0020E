const axios = require("axios");
const FormData = require("form-data");
const { encrypt, decrypt } = require("../lib/encrypt");
const config = require('../config');

//const IPFS_ADD_API_URL = "http://172.19.0.3:3009/add";
//const DB_URL = "http://localhost:105/updateCID";
//const GET_CID_URL = "http://localhost:105/getCID";
const IPFS_ADD_API_URL = config.IPFS_URL + "/add";
const DB_URL = config.MONGO_DB_PY_API + "/updateCID";
const GET_CID_URL = config.MONGO_DB_PY_API + "/getCID";

async function uploadToIPFS(updatedOffer) {
    try {
        const response = await axios.post(IPFS_ADD_API_URL, updatedOffer);

        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Re-throw the error to propagate it further
    }
}

async function updateOfferIdInDb(BatteryID, digiprimeId, newCid) {
    try {
        const response = await axios.post(DB_URL, {
            batteryID: BatteryID,
            digiprimeID: digiprimeId,
            newCID: newCid
        });
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error('Error', error);
        throw error; // Re-throw the error to propagate it further
    }
}

async function getData(apiCode) {
    try {
        const response = await axios.post(GET_CID_URL, { "BatteryID": apiCode });
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error('login:', error);
        throw error; // Re-throw the error to propagate
    }
}

module.exports.EncryptAndUploadToIPFS = async (updatedNewOffer) => {
    try {
        const getDataFromDB = await getData(updatedNewOffer.api_code);
        const currentOwner = getDataFromDB.CurOwner;
        const oldCid = getDataFromDB.CID;

        updatedNewOffer.parent = oldCid;
        updatedNewOffer.current_owner = currentOwner;
    
        // Encrypt the data
        const encryptedData = await encrypt(updatedNewOffer);

        // Upload to IPFS, base64 encoding
        const uploadIPFS = await uploadToIPFS({ Data: encryptedData.toString('base64')});

        const batteryId = updatedNewOffer.api_code;
        const digiprimeId = updatedNewOffer.id;

        const newCid = uploadIPFS.fileResponse.Hash;

        const response = await updateOfferIdInDb(batteryId, digiprimeId, newCid);
        return response;
    } catch (error) {
        console.error("Error:", error);
        throw error; // Re-throw the error to propagate
    }
}