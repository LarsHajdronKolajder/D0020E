const axios = require("axios");
const ExpressError = require("../utils/ExpressError");


const NE_BASE_URL =
  process.env.NEGOTIATION_ENGINE_BASE_URL || "http://localhost:5000";

// -------------------------------------------------------------------------------------------------
// User
// -------------------------------------------------------------------------------------------------

/**
 * Create a new user in NE.
 *
 * @param {string} username
 * @param {string} email
 * @param {string} password
 */
module.exports.signup = async (username, email, password) => {
  const url = `${NE_BASE_URL}/signup`;
  const data = { username, email, password };
  await axios.post(url, data);
};

// -------------------------------------------------------------------------------------------------
// Auction
// -------------------------------------------------------------------------------------------------

const fixAuction = (auction) => {
  closingTime = new Date(auction.closing_time);

  auction.closed = closingTime <= Date.now();
  auction.ended =
    auction.buyersign !== "" || (auction.bids == 0 && auction.closed);
  auction.closingTime = closingTime;
  return auction;
};

module.exports.createAuction = async (username, data) => {
  const url = `${NE_BASE_URL}/create-room`;
  const auth = { username };
  const response = await axios.post(url, data, { auth });

  return response.data.id;
};

module.exports.getAuction = async (username, auctionId, isBroker) => {
  let url = `${NE_BASE_URL}/rooms/${auctionId}`;
  if (isBroker) {
    url += "?is_broker=true";
  }
  const auth = { username };
  const response = await axios.get(url, { auth });

  return fixAuction(response.data);
};

module.exports.getActiveAuctions = async (
  username,
  skip,
  limit,
  representations = false
) => {
  let url = `${NE_BASE_URL}/rooms/all?skip=${skip}&limit=${limit}`;
  if (representations) {
    url += "&representations=true";
  }
  const auth = { username };
  const response = await axios.get(url, { auth });

  const { auctions, total } = response.data;
  return [auctions.map(fixAuction), total];
};

module.exports.getAuctionHistory = async (username, skip, limit) => {
  const url = `${NE_BASE_URL}/rooms/history?skip=${skip}&limit=${limit}`;
  const auth = { username };
  const response = await axios.get(url, { auth });

  const { auctions, total } = response.data;
  return [auctions.map(fixAuction), total];
};

/**
 * Fetches the list of public auctions in descending order of creation.
 *
 * @param {string} username username to authorize as.
 * @param {number} page which page of auctions to fetch.
 * @param {number} perPage number of auctions per page.
 * @returns {Promise<[Object[]; number]>} One page of public auctions and the
 *          total count.
 */
module.exports.getPublicAuctions = async (username, skip, limit) => {
  const url = `${NE_BASE_URL}/rooms/public?skip=${skip}&limit=${limit}`;
  const auth = { username };
  const response = await axios.get(url, { auth });

  const { auctions, total } = response.data;
  return [auctions.map(fixAuction), total];
};

module.exports.placeBid = async (username, auctionId, bid) => {
  const url = `${NE_BASE_URL}/rooms/${auctionId}`;
  const auth = { username };
  await axios.post(url, { bid: parseInt(bid) }, { auth });
};

module.exports.joinAuction = async (
  username,
  auctionId,
  location,
  brokerId
) => {
  const url = `${NE_BASE_URL}/rooms/${auctionId}/join`;
  const auth = { username };
  const data = { location, broker_id: brokerId };
  await axios.post(url, data, { auth });
};

module.exports.representInAuction = async (username, auctionId, brokerId) => {
  const url = `${NE_BASE_URL}/rooms/${auctionId}/represent`;
  const auth = { username };
  await axios.post(url, { broker_id: brokerId }, { auth });
};

module.exports.auctionInvite = async (
  auctionId,
  username,
  newUsername,
  location,
  offerId
) => {
  const url = `${NE_BASE_URL}/rooms/${auctionId}/invite`;
  const auth = { username };
  const data = {
    username: newUsername,
    location,
    offer_id: offerId,
  };
  await axios.post(url, data, { auth });
};

// const getContractDetails = (contract, offerId, offerTitle) => {
//   const text = contract.split("Buyer signature")[0];
//   const [textPreOfferId, textPostOfferId] = text.split(offerId);
//   const buyerSig = contract
//     .split("Seller signature")[0]
//     .split("Buyer signature")[1];
//   const sellerSig = contract.split("Seller signature")[1];
//   const offerText = `${offerTitle} (${offerId})`;

//   return {
//     text: `${textPreOfferId}${offerText}${textPostOfferId}`,
//     sellerSignature: sellerSig,
//     buyerSignature: buyerSig,
//   };
// };

// module.exports.getWinner = async (username, auctionId, offerId, offerTitle) => {
//   const url = `${NE_BASE_URL}/rooms/${auctionId}/end`;
//   const auth = { username };

//   const { data } = await axios.get(url, { auth });
//   const contract = getContractDetails(data.contract, offerId, offerTitle);
//   return contract;
// };

// -------------------------------------------------------------------------------------------------
// Negotiation
// -------------------------------------------------------------------------------------------------

/**
 * Starts a negotiation.
 */
module.exports.createNegotiation = async (
  username,
  name,
  location,
  bid,
  quantity,
  unit,
  member,
  contract_id,
  reference_sector,
  reference_type,
  broker_id
) => {
  const url = `${NE_BASE_URL}/negotiate`;
  const auth = { username };
  const body = {
    name,
    location,
    offer_id: "",
    bid,
    quantity,
    unit,
    member,
    templatetype: contract_id,
    reference_sector,
    reference_type,
    broker_id,
  };

  const { data } = await axios.post(url, body, { auth });
  return data.id;
};

/**
 * Retreives a list of all the negotations the user is part of.
 *
 * ## Returns
 *
 * Returns a list of negotiations. See `getNegotiation` for more details.
 *
 * ```json
 * [
 *   {
 *     "_id": "",
 *     "name": "",
 *     "created_by": "",
 *     "seller": "",
 *     "created_at": "",
 *     "end_date": null,
 *     "current_offer": "",
 *     "offer_user": "",
 *     "status": ""
 *   }
 * ]
 *```
 *
 * @param {string} username user to authorize as.
 * @returns list of all negotations the user is part of.
 */
module.exports.listNegotiations = async (
  username,
  skip,
  limit,
  representations = false
) => {
  let url = `${NE_BASE_URL}/negotiate/list?skip=${skip}&limit=${limit}`;
  if (representations) {
    url += "&representations=true";
  }

  const auth = { username };
  const response = await axios.get(url, { auth });
  const { negotiations, total } = response.data;
  return [negotiations, total];
};

/**
 * Retrieves information about the negotiation.
 *
 * ## Errors
 * - `404` if the negotiation cannot be found.
 *
 * ## Status
 * Status can be either
 * - `submitted`: no bids have been placed
 * - `offer`: the creator placed the last bid.
 * - `counter-offer`: the other party placed the last bid.
 * - `accepted`: if the negotiation has been accepted.
 * - `rejected`: if the negotiation has been rejected.
 *
 * ## Returns
 *
 * ### Example response for a newly created negotiation
 *
 * ```json
 * {
 *   "_id": "",
 *   "name": "",
 *   "created_by": "",
 *   "seller": "",
 *   "created_at": "",
 *   "end_date": null,
 *   "current_offer": "",
 *   "offer_user": "",
 *   "status": "submitted",
 *   "reference_sector": "",
 *   "reference_type": "",
 *   "quantity": "",
 *   "articleno": "",
 *   "contract": "",
 * }
 * ```
 *
 * @param {string} username user to authorize as.
 * @param {string} negotiationId Id of the negotiation.
 * @returns either a contract or negotiation info.
 */
module.exports.getNegotiation = async (username, negotiationId, isBroker) => {
  let url = `${NE_BASE_URL}/negotiate/${negotiationId}`;
  if (isBroker) {
    url += "?is_broker=true";
  }

  const auth = { username };
  const response = await axios.get(url, { auth });

  return response.data;
};

/**
 * Places a bid in the negotiation.
 *
 * ## Errors
 * - If the user is not part of the negotation a 403 is returned.
 * - If the negotation has finished a 403 is returned.
 *
 * @param {string} username user to authorize as.
 * @param {string} negotiationId Id of the negotiation.
 * @param {number} bid the amount to bid.
 */
module.exports.negotiationBid = async (username, negotiationId, bid) => {
  const url = `${NE_BASE_URL}/negotiate/${negotiationId}`;
  const auth = { username };
  await axios.post(url, { bid }, { auth });
};

/**
 * Accepts the last bid. This is only a valid if the `username` is not the one
 * who has placed the latest bid.
 *
 * ## Errors
 * - If the `username` placed the last bid a `403` is returned.
 * - If `username` is not part of the negotiation a `403` is returned.
 * - If the negotiation is over, or rejected a `403` is returned.
 *
 * @param {string} username user to authorize as.
 * @param {string} negotiationId Id the the negotiation.
 */
module.exports.negotiationAccept = async (username, negotiationId) => {
  const url = `${NE_BASE_URL}/negotiate/${negotiationId}/accept`;
  const auth = { username };

  // This is correct, for some reason this is a GET request.
  await axios.post(url, {}, { auth });
};

/**
 * Cancels the negotation. This is only valid if the `username` did not place the
 * last bid.
 *
 * ## Errors
 * - If the `username` placed the last bid a `403` is returned.
 * - If `username` is not part of the negotiation a `403` is returned.
 * - If the negotiation is over, or rejected a `403` is returned.
 *
 * @param {string} username user to authorize as.
 * @param {string} negotiationId Id the the negotiation.
 */
module.exports.negotiationCancel = async (username, negotiationId) => {
  const url = `${NE_BASE_URL}/negotiate/${negotiationId}/cancel`;
  const auth = { username };

  // This is correct, for some reason this is a GET request.
  await axios.post(url, {}, { auth });
};

// -------------------------------------------------------------------------------------------------
// Contract
// -------------------------------------------------------------------------------------------------

/**
 * Creates a new contract in NE.
 *
 * In the contract certain template parameters (`$key`) kan be used. We have
 * to settle on which ones to support.
 *
 * @param {string} title the title of the contract.
 * @param {string} body the body of the contract.
 * @returns {Promise<string>} the created negotiation's id.
 */
module.exports.contractCreate = async (title, usedFor, body) => {
  const url = `${NE_BASE_URL}/contracts`;
  const { data } = await axios.post(url, { title, used_for: usedFor, body });

  return data.id;
};

/**
 * Fetches information about a single contract.
 *
 * ## Errors
 * - `404` if the given contract id is not a valid id.
 *
 * ## Returns
 * ```json
 * {
 *   "_id": "",
 *   "title": "",
 *   "body": ""
 * }
 * ```
 * @param {string} id
 * @returns {Promise<object>} the requested contract.
 */
module.exports.contractGet = async (id) => {
  const url = `${NE_BASE_URL}/contracts/${id}`;
  const { data } = await axios.get(url);
  return data;
};


/**
 * Creates a new contract in NE.
 *
 * In the contract certain template parameters (`$key`) kan be used. We have
 * to settle on which ones to support.
 *
 * @param {string} jwtToken the title of the contract.
 * @returns {Promise<object[]>} list of all available contracts.
 */
module.exports.getDismitted = async (jwtToken)=>{
  const url = `${NE_BASE_URL}/dismitted/${jwtToken}`;
  //const url = `${NE_BASE_URL}/dismitted`;
  const { data } = await axios.get(url);
  console.log(data);
  return data; 
}

/**
 * Returns a list of all available contracts. Contains only the `id` and `title`
 *
 * ## Returns
 * ```json
 * [
 *   {
 *     "_id": "",
 *     "title": "",
 *     "body": ""
 *   },
 *   {
 *     "_id": "",
 *     "title": "",
 *     "body": ""
 *   },
 * ]
 * ```
 * @param {string} purpose the purpose of the contract, e.g. auction, broker, or negotiate.
 * @returns {Promise<object[]>} list of all available contracts.
 */
module.exports.contractList = async (purpose) => {
  const url = `${NE_BASE_URL}/contracts/list?purpose=${purpose}`;
  const { data } = await axios.get(url);
  return data;
};

// -------------------------------------------------------------------------------------------------
// Broker
// -------------------------------------------------------------------------------------------------

/**
 * Get a single agreement.
 *
 * @param {string} broker_agreement_id
 * @returns {Promise<Object>}
 */
module.exports.brokerGetAgreement = async (username, broker_agreement_id) => {
  const url = `${NE_BASE_URL}/broker/${broker_agreement_id}`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });
  return data;
};

/**
 * Returns a list of agreements one for each user, that the user is representing.
 *
 * @param {string} username
 */
module.exports.getRepresenting = async (username) => {
  const url = `${NE_BASE_URL}/broker/representing`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });
  return data;
};

/**
 * Gets all broker agreements for the user.
 *
 * This includes pending, active, and expired agreements.
 *
 * @param {string} username
 * @returns {Promise<{broker_agreements: Object[], total: number}>}
 */
module.exports.brokerGetAgreements = async (username, skip, limit) => {
  const url = `${NE_BASE_URL}/broker/list?skip=${skip}&limit=${limit}`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });
  return {
    agreements: data.broker_agreements,
    total: data.total,
  };
};

/**
 * Get all active broker agreements.
 *
 * @param {string} username
 * @returns {Promise<{broker_agreements: Object[], total: number}>}
 */
module.exports.brokerGetActiveAgreements = async (username, skip, limit) => {
  const url = `${NE_BASE_URL}/broker/list?skip=${skip}&limit=${limit}&active=true`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });
  return data;
};

/**
 * Get all pending broker agreements.
 *
 * @param {string} username
 * @returns {Promise<{broker_agreements: Object[], total: number}>}
 */
module.exports.brokerGetPendingAgreements = async (username, skip, limit) => {
  const url = `${NE_BASE_URL}/broker/list?skip=${skip}&limit=${limit}&pending=true`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });
  return data;
};

/**
 * Gets active agreements between two users.
 *
 * @param {string} username
 * @param {string} otherUsername
 * @returns {Promise<Object>}
 */
module.exports.brokerGetActiveAgreementsBetween = async (
  username,
  otherUsername
) => {
  const url = `${NE_BASE_URL}/broker/between?other=${otherUsername}&active=true`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });
  return data;
};

/**
 * Gets the latest active agreement between two users.
 *
 * @param {string} username
 * @param {string} otherUsername
 * @returns {Promise<Object>}
 */
module.exports.brokerGetActiveAgreementBetween = async (
  username,
  otherUsername
) => {
  const url = `${NE_BASE_URL}/broker/between?other=${otherUsername}&active=true`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });

  let agreement = undefined;
  let d = new Date();
  for (let currentAgreement of data) {
    let endDate = new Date(currentAgreement.end_date);
    if (endDate > d) {
      agreement = currentAgreement;
      d = endDate;
    }
  }

  return agreement;
};

/**
 * Gets active and pending agreements between two users.
 *
 * @param {string} username
 * @param {string} otherUsername
 * @returns {Promise<Object>}
 */
module.exports.brokerGetAgreementsBetween = async (username, otherUsername) => {
  const url = `${NE_BASE_URL}/broker/between?other=${otherUsername}`;
  const auth = { username };
  const { data } = await axios.get(url, { auth });
  return data;
};

/**
 * Initiate a broker agreement between `representant` and `represented`.
 *
 * @param {string} username
 * @param {string} representant
 * @param {string} represented
 * @param {Date} end_date
 * @param {string} template_id
 */
module.exports.brokerCreateAgeement = async (
  username,
  representant,
  represented,
  endDate,
  template_id
) => {
  const url = `${NE_BASE_URL}/broker`;
  const auth = { username };
  const data = {
    representant,
    represented,
    end_date: new Date(endDate).toISOString(),
    template_id,
  };
  await axios.post(url, data, { auth });
};

/**
 * Accept a broker agreement.
 *
 * @param {string} username
 * @param {string} agreementId
 */
module.exports.brokerAcceptAgreement = async (username, agreementId) => {
  const url = `${NE_BASE_URL}/broker/${agreementId}/accept`;
  const auth = { username };
  await axios.post(url, {}, { auth });
};

/**
 * Reject a broker agreement.
 *
 * @param {string} username
 * @param {string} agreementId
 */
module.exports.brokerRejectAgreement = async (username, agreementId) => {
  const url = `${NE_BASE_URL}/broker/${agreementId}/reject`;
  const auth = { username };
  await axios.post(url, {}, { auth });
};
