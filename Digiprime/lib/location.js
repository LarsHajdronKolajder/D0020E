const mapboxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mapboxGeocoding({ accessToken: mapboxToken });

/**
 * Get coordinates from a string location.
 *
 * @param {string} location
 * @returns {Promise<[number,number]>} the location in long/lat.
 */
module.exports.getCoordinatesFromLocation = async (location) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: location,
      limit: 1,
    })
    .send();

  return geoData.body.features[0].geometry.coordinates;
};
