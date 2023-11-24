mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/light-v10', // style URL
	center: offer.geometry.coordinates, // starting position [lng, lat]
	zoom: 10 // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

const marker = new mapboxgl.Marker()
	.setLngLat(offer.geometry.coordinates)
	.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${offer.title}</h3><p>${offer.location}</p>`))
	.addTo(map);
