const History = require("../models/history");
const User = require("../models/user");


const ne = require("../lib/ne");
const mapboxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mapboxGeocoding({ accessToken: mapboxToken });
const { cloudinary } = require("../cloudinary");
const dis = require("../lib/dismitted");
const bat = require("../lib/battery");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const cookie = require('cookie');

const util = require('util');
const { getPage, createPagination } = require("../lib/paginate");
const {
    interests: costumers,
    referenceSectors,
    referenceTypes,
} = require("../utils/constants");
const { getBrokerAgreement } = require("../lib/broker");
const ExpressError = require("../utils/ExpressError");

const removeFalsyValues = (object) => {
    Object.keys(object).forEach((key) => {
        if (!object[key]) {
            delete object[key];
        } else {
            object[key] =
                object[key].charAt(0).toUpperCase() +
                object[key].slice(1).toLowerCase();
        }
    });
    return object;
};

module.exports.newForm = async (req, res) => {
    const { username, role } = req.user;

    let agreements = [];

    if (role === "broker") {
        agreements = await ne.getRepresenting(username);
    }


    res.render("history", {
        costumers,
        referenceSectors,
        referenceTypes,
        agreements,
        //dismitted,
    });
};



