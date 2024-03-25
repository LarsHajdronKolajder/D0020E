const History = require("../models/history");
const User = require("../models/user");
const mapboxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mapboxGeocoding({ accessToken: mapboxToken });
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const { getIPFSData, getEntireHistory } = require("../lib/history");

const ExpressError = require("../utils/ExpressError");



module.exports.show = async (req, res) => {
    const { id } = req.params;

    try {
        const data = await getIPFSData(id);
        res.render("offers/history", { data });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).send("Internal server error");
    }
};

module.exports.entireHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await getEntireHistory(id);
        res.render("offers/entireHistory", { data });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).send("Internal server error");
    }
};