import express from 'express';

const router = express.Router();
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

router.post('/', async (req, res) => {
  try {
    if (!MAPBOX_ACCESS_TOKEN) return res.status(503).json({ error: 'Mapbox not configured' });

    const { restaurant_lat, restaurant_lng, client_lat, client_lng } = req.body;
    const coords = [
      { lat: restaurant_lat, lng: restaurant_lng, name: 'restaurant' },
      { lat: client_lat, lng: client_lng, name: 'client' },
    ];
    for (const c of coords) {
      const lat = Number(c.lat), lng = Number(c.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
        return res.status(400).json({ error: `Invalid ${c.name} coordinates` });
    }

    const coordinates = `${restaurant_lng},${restaurant_lat};${client_lng},${client_lat}`;
    const url = `${DIRECTIONS_URL}/${coordinates}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return res.status(response.status >= 500 ? 502 : 400).json({ error: 'Route calculation failed', message: data?.message });

    const route = data?.routes?.[0];
    if (!route) return res.status(404).json({ error: 'No route found' });

    const distanceKm = (route.distance / 1000).toFixed(2);
    const durationMin = Math.round(route.duration / 60);
    const eta = new Date(Date.now() + route.duration * 1000);

    return res.json({ distance_km: parseFloat(distanceKm), duration_min: durationMin, geometry_geojson: route.geometry, eta_iso: eta.toISOString() });
  } catch (err) {
    console.error('Route API error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

export default router;
