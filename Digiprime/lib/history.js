const axios = require("axios");


const GET_CID_URL = "http://localhost:105/getCIDfromID";
const IPFS_URL = "http://172.19.0.2:3009/get-content"


const { decrypt } = require("../lib/encrypt");

const cidCache = {};

async function getCid(id) {

    // dont make unnecessary calls
    if (cidCache[id]) {
        return cidCache[id];
    }

    try {
        const response = await axios.post(GET_CID_URL, { digiprimeID: id });
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.data.CID;

    } catch (error) {
        console.error("Error: ", error);
    }
}

async function getFromIPFS(cid) {
    try {

        const response = await axios.post(IPFS_URL, { cid });
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.data.responseData;

    } catch (error) {
        console.error("Error: ", error);
    }
}


module.exports.getIPFSData = async (id) => {
    try {
        // get newest IPFS Cid for this digiprimeId
        const getCidFromDb = await getCid(id);
        // get IPFS data
        const ipfsData = await getFromIPFS(getCidFromDb);

        // Take out the encrypted part
        const encryptedData = ipfsData.Data;

        // Decrypt & return it
        const decryptedData = await decrypt(encryptedData);
        return decryptedData;

    } catch (error) {
        console.error("Error: ", error);
    }
}

async function getAllhistory(cid, combinedData = {}, count) {
    try {
        const response = await axios.post(IPFS_URL, { cid });

        console.log("response.data.responseData.Data:", response.data.responseData.Data);
        if (response.status !== 200) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const encryptedData = response.data.responseData.Data; // this is wacky, my bad.
        console.log("encrypted data: ", encryptedData);


        // Decrypt the content on IPFS
        const decryptedData = await decrypt(encryptedData);
        console.log("decrypted data: ", decryptedData);

        // Add to combinedData
        combinedData[count++] = decryptedData;
        if (decryptedData.parent === 'null') {
            console.log('Reached the root parent. Recursion terminated.');
            return combinedData;
        }

        // Otherwise, recursively fetch data from the parent
        return await getAllhistory(decryptedData.parent, combinedData, count);
    } catch (error) {
        console.error('Error fetching data:', error);
        return combinedData;
    }
}


module.exports.getEntireHistory = async (id) => {
    try {
        console.log("getEntireHistory in lib ID: ", id);
        const getCidFromDb = await getCid(id);
        console.log("cid from DB: ", getCidFromDb);
        const allData = await getAllhistory(getCidFromDb, combinedData = {}, 0);

        return allData;

    } catch (error) {
        console.error("Error: ", error);
    }
}