const ne = require("./ne");

module.exports.getBrokerAgreement = async (user, username) => {
  if (!user || user.role != "broker") {
    return false;
  }
  const currentUsername = user.username;
  const agreements = await ne.brokerGetActiveAgreementsBetween(
    currentUsername,
    username
  );

  let agreement = undefined;
  let latestDate = new Date();
  for (let currAgreement of agreements) {
    const d = new Date(currAgreement.end_date);
    if (d > latestDate) {
      latestdate = d;
      agreement = currAgreement;
    }
  }

  return agreement;
};
