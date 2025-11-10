import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibmF1ZmFsaGFuaWYiLCJhIjoiY21mbmcwYXBiMDJwNDJrcXd2ZHptMzZweSJ9.IRU6Db4BxzYXBF-ER66vxg';

function Map({ onDrawUpdate, onSelectBuilding, selectedBuilding }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [105.23314, -5.35820],
      zoom: 17,
      pitch: 0,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true }
    });
    map.current.addControl(draw.current);

    map.current.on('click', (e) => {
      if (draw.current.getMode() === 'draw_polygon') return;

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['gl-draw-polygon-fill-inactive.cold']
      });

      if (features.length > 0) {
        const featureId = features[0].properties.id;
        const clickedFeature = draw.current.get(featureId);
        onSelectBuilding(clickedFeature);
      }
    });
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    const updateFeatures = (e) => {
      const data = draw.current.getAll().features;
      const featuresWithProps = data.map(f => ({
        ...f,
        properties: {
          id: f.id,
          nama: "Gedung Baru",
          ...f.properties,
        }
      }));
      onDrawUpdate(featuresWithProps);
    };
    
    mapInstance.on('draw.create', updateFeatures);
    mapInstance.on('draw.update', updateFeatures);
    mapInstance.on('draw.delete', updateFeatures);

    return () => {
      mapInstance.off('draw.create', updateFeatures);
      mapInstance.off('draw.update', updateFeatures);
      mapInstance.off('draw.delete', updateFeatures);
    };
  }, [onDrawUpdate]);

  useEffect(() => {
    if (!map.current || !selectedBuilding) return;
    
    const firstCoordinate = selectedBuilding.geometry.coordinates[0][0];
    map.current.flyTo({
      center: firstCoordinate,
      zoom: 18.5,
      essential: true,
    });
  }, [selectedBuilding]);

  return <div ref={mapContainer} className="map-container" />;
}

export default Map;