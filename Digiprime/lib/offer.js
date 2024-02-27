const axios = require("axios");

const IPFS_ADD_API_URL = "http://172.19.0.2:3009/add3"
const DB_URL = "http://localhost:105/updateCID"
const GET_CID_URL = "http://localhost:105/getCID"


// IPFS
async function uploadToIPFS( updatedOffer ) {
  try {
    const response = await axios.post(IPFS_ADD_API_URL, updatedOffer)

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function updateOfferIdInDb( BatteryID, digiprimeId, newCid ) {
    try {
        const response = await axios.post(DB_URL, {
            batteryID: BatteryID,
            digiprimeID: digiprimeId,
            newCID: newCid
        });
        if(response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

    } catch (error) {
        console.error('Error', error);
    }
}

async function getData(apiCode){
  
  try {
    const response = await axios.post(GET_CID_URL, { "BatteryID" : apiCode} );
    // If the response status is not OK (200), throw an error
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.data;
  // If there's an error in the try block, catch it
  } catch (error) {
    console.error('login:', error);
    
  }
}

module.exports.uploadToIPFS = async (updatedNewOffer) => {

    try {
        // get old cid & currentOwner from MongoDB
        const getDataFromDB = await getData(updatedNewOffer.api_code);
        const currentOwner = getDataFromDB.CurOwner;
        const oldCid = getDataFromDB.CID;

        // insert into updatedNewOffer json
        updatedNewOffer.parent = oldCid;
        updatedNewOffer.current_owner = currentOwner;

        // upload json content to IPFS
        const uploadIPFS = await uploadToIPFS(updatedNewOffer);

        // Get batteryId, digiprimeId & newCid (from IPFS)
        const batteryId = updatedNewOffer.api_code;
        const digiprimeId = updatedNewOffer.id;
        const newCid = uploadIPFS.data.fileResponse.Hash;
        
        // Update everything inside MongoDB
        const response = await updateOfferIdInDb(batteryId, digiprimeId, newCid);
        if(response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}
