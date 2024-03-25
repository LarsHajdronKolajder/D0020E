
const axios = require('axios');

const AUTOMOTIVE_URL=process.env.AUTO_URL
/**
 * Creates a new contract in NE.
 *
 * In the contract certain template parameters (`$key`) kan be used. We have
 * to settle on which ones to support.
 *
 * @param {string} jwtToken the title of the contract.
 * @param {string} manCode
 * @returns {Promise<object[]>} list of all available contracts.
 */
module.exports.getDismitted = async (jwtToken, manCode)=>{
  const url = `${AUTOMOTIVE_URL}`;
  //console.log(url)
  const params = { edmEntityName: 'dismittedObject' };
  const headers = {
    'accept': '*/*',
    'APIKEY': process.env.APIKEY,
    'Authorization': 'Bearer ' + jwtToken
  }

  const response = await axios.get(url, { params, headers });
  const filteredData = response.data.filter(obj => {
    return obj.payload.manufacturerCode.val.includes(manCode);
  });
  return filteredData;
    
} 