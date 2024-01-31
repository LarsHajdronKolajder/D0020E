const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data
const port = 3000;


app.get('/getPeers', async (req, res) => {
  try {
    const response = await axios.post('http://127.0.0.1:5001/api/v0/swarm/peers/ls');

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
        formData.append('file', fileContent)
        // Using add ( https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-add )
        const addFile = await axios.post('http://127.0.0.1:5001/api/v0/add', formData)

        const { Hash } = addFile.data; // this is the CID
        console.log(`http://ipfs.io/ipfs/${Hash}`); // quick-visit to check if online, can take minutes.

        // Pin the content with ( https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-pin-add )
        const pinResponse = await axios.post(`http://127.0.0.1:5001/api/v0/pin/add?arg=${Hash}`)
        return { status: 'success', fileResponse: addFile.data, pinResponse: pinResponse.data };
        } catch (error) {
            console.error('Error adding/pinning file:', error.message);
            return { status: 'error', message: 'Internal Server Error' };
        }
};


app.get('/add', async (req, res) => {
    const fileContent = "This is for testing, but also pin it online";

    const result = await addAndPin(fileContent);

    res.json(result);
})


//First add2, this don't PIN (make it online) like /add does
app.get('/add2', async (req, res) => {
    try {
        const fileContent = "This is for testing";
        const formData = new FormData();
        formData.append('file', fileContent)
        const addFile = await axios.post('http://127.0.0.1:5001/api/v0/add', formData)

        const fileResponse = addFile.data;
        res.json( { status: 'success', fileResponse})
        

    } catch (error) {
        console.error('Error adding file, error code:', error.message)
    }
})

//Should be app.get('/download/:cid) in reality, this is for testing
app.get('/download', async (req, res) => {
    try {
        // here we wanna fetch the CID from the MongoDB
        // dummy CID below response should be "meow" 
        // from ( https://ipfs.io/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH )
        // Using RPC cat ( https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-cat )
        const cid = "QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH"
        const response = await axios.post(`http://127.0.0.1:5001/api/v0/cat?arg=${cid}`);

        const responseData = response.data;
        
        res.json( {status: 'success', responseData} );

    } catch (error) {
        console.error('Error downloading file: ', error.message)
        res.status(500).json({status: 'error', message: 'Internval server error'});
    }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

