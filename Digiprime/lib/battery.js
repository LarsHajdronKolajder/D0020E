
const axios = require('axios');
const helper = require("../utils/constants");

const BAT_URL = process.env.BATTERY_URL;
function priceBM(Xco, Xli, size, chemistry, electrolyte){

  const Vco = helper.cobalt.V;
  const Kco = helper.cobalt.K;    
  const Vli = helper.lithium.V;
  const Kli = helper.lithium.K;  
  const electrolyteValue = helper.electrolyte[electrolyte];
  const chemistryValue = helper.chemistry[chemistry];
  const sizeValue = helper.getKeyForValue(size); 
  
/*   console.log('Vco:', Vco);
  console.log('Kco:', Kco);
  console.log('Xco:', Xco);
  console.log('Vli:', Vli);
  console.log('Kli:', Kli);
  console.log('Xli:', Xli);
  console.log('Electrolyte Value:', electrolyteValue);
  console.log('Chemistry Value:', chemistryValue);
  console.log('Size Value:', sizeValue); */

  const VBM = ((Vco*Kco*(Xco[0]/100))+(Vli*Kli*(Xli[0]/100)))*sizeValue*chemistryValue*electrolyteValue;

  return VBM
}



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


module.exports.getBattery = async (jwtToken, manCode) => {
  const url = `${BAT_URL}`;
  const params = { edmEntityName: 'blackmass' };
  const headers = {
    'accept': '*/*',
    'APIKEY': process.env.APIKEY,
    'Authorization': 'Bearer ' + jwtToken
  }

  const response = await axios.get(url, { params, headers });
  const filteredData = response.data.filter(obj => {
    return obj._id.includes(manCode);
  });

  // Ensure that filteredData is not empty before accessing properties
  if (filteredData.length > 0) {
    const firstItem = filteredData[0]; // Assuming you want to access properties of the first item
    const VBM = priceBM(firstItem.payload.cobm.val, firstItem.payload.libm.val, firstItem.payload.sizebm.val, firstItem.payload.chemistrybm.val,firstItem.payload.electrolytebm.val);
    return {filteredData, VBM}; // Return the first filtered item
  } else {
    console.log('No matching data found');
    return null; // Or handle the case when no data matches your criteria
  }
}



module.exports.getBatteryold = async (jwtToken, manCode)=>{
  const url = '';
  const params = { edmEntityName: 'blackmass' };
  const headers = {
    'accept': '*/*',
    'APIKEY': '',
    'Authorization': 'Bearer ' + jwtToken
  }

  const response = await axios.get(url, { params, headers });
  const filteredData = response.data.filter(obj => {
    return obj._id.includes(manCode);
  });
  const filterJSON=  JSON.stringify(filteredData, null, 2)
  console.log(1 + filterJSON.payload)
  console.log(2 + filterJSON.payload.locationdsm.val)
  return filteredData;
    
} 
