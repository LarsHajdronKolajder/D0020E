const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const FormData = require('form-data')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 3009;

/*

Not used anymore, but saving if needing later
// API for MongoDB
const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// Modify here what             database       and    collection
//                           <"          ">            <"  ">                        
const collection = client.db("CIDDataBase").collection("cid");

*/

// Naming convention for "http://ipfs_host" this ipfs_host is the Docker service name that you
// specify when running the container, with --name ipfs_host for example
app.get('/getPeers', async (req, res) => {
    try {
        const response = await axios.post('http://ipfs_host:5001/api/v0/swarm/peers/ls');

        const peers = response.data.Peers;

        res.json({ status: 'success', peers });
    } catch (error) {
        console.error('Error getting peers from IPFS:', error.message);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});


const addAndPin = async (fileContent) => {
    try {

        const formData = new FormData();
        formData.append('file', fileContent);
        // Using add ( https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-add )
        const addFile = await axios.post('http://ipfs_host:5001/api/v0/add', formData)


        // Check addFile response
        if (addFile.status !== 200) {
            console.error('Error adding file:', addFile.statusText);
            return { status: 'error', message: 'Error adding file' };
        } else if (!addFile.data || !addFile.data.Hash) {
            console.error('Invalid response from adding file:', addFile.data);
            return { status: 'error', message: 'Invalid response from adding file' };
        }

        const { Hash } = addFile.data; // this is the CID

        console.log(`http://ipfs.io/ipfs/${Hash}`); // quick-visit to check if online, can take minutes.

        // Pin the content with ( https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-pin-add )
        const pinResponse = await axios.post(`http://ipfs_host:5001/api/v0/pin/add?arg=${Hash}`)

        // Check pinResponse
        if (pinResponse.status !== 200) {
            console.error('Error pinning file:', pinResponse.statusText);
            return { status: 'error', message: 'Error pinning file' };
        } else if (!pinResponse.data) {
            console.error('Invalid response from pinning file:', pinResponse.data);
            return { status: 'error', message: 'Invalid response from pinning file' };
        }

        return { status: 'success', fileResponse: addFile.data, pinResponse: pinResponse.data };
    } catch (error) {
        console.error('Error adding/pinning file:', error.message);
        return { status: 'error', message: 'Internal Server Error' };
    }
};

app.post('/add', async (req, res) => {
    try {
      const formData = req.body;

      const fileContent = JSON.stringify(formData);
  
      const result = await addAndPin(fileContent);
  
      res.json(result);
    } catch (error) {
      console.error('Error adding/pinning file:', error.message);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});


app.post('/getContent', async (req, res) => {
    try {
        const cid = req.body.cid;
        const response = await axios.post(`http://ipfs_host:5001/api/v0/cat?arg=${cid}`);
        const responseData = response.data;

        res.json({ status: 'success', responseData })

    } catch (error) {
        console.error('Error downloading file: ', error.message)
        res.status(500).json({ status: 'error', message: 'Internval server error' });
    }
})

//Should be app.get('/download/:cid) in reality, this is for testing
app.get('/download', async (req, res) => {
    try {
        const cidContent = req.body;
        // here we wanna fetch the CID from the MongoDB
        // dummy CID below response should be "meow" 
        // from ( https://ipfs.io/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH )
        // Using RPC cat ( https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-cat )
        const cid = "QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH"
        const cid2 = "QmYVsrHPnhHvyGwvdnD6BkH8PS3DcM4RA6hayqV3wyshqy"
        const response = await axios.post(`http://ipfs_host:5001/api/v0/cat?arg=${cidContent}`);

        const responseData = response.data;

        res.json({ status: 'success', responseData });

    } catch (error) {
        console.error('Error downloading file: ', error.message)
        res.status(500).json({ status: 'error', message: 'Internval server error' });
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});