import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibmF1ZmFsaGFuaWYiLCJhIjoiY21nNnBveG9zMGY1MzJtcGJvM3VicDFiYyJ9.msUyx3mhMphBQQ4IonuO7Q';

function Map({ initialStyle, onMapLoad, selectedBuilding }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Efek HANYA untuk membuat peta sekali dan tidak pernah menghancurkannya
  useEffect(() => {
    if (map.current) return; // Mencegah peta dibuat ulang

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: [105.2309, -5.3566],
      zoom: 14.5,
      pitch: 0,
      maxBounds: [ [105.2166, -5.3627], [105.2423, -5.3466] ] 
    });

    // Laporkan bahwa peta sudah siap setelah event 'load' selesai
    map.current.on('load', () => {
      onMapLoad(map.current);
    });
    
    // Tidak ada fungsi cleanup agar peta tidak dihancurkan
  }, []); // <-- Array dependensi KOSONG, memastikan ini hanya berjalan sekali

  // Efek untuk 'flyTo' saat gedung dipilih
  useEffect(() => {
    if (!map.current || !selectedBuilding) return;
    try {
      const firstCoordinate = selectedBuilding.geometry.coordinates[0][0];
      map.current.flyTo({ center: firstCoordinate, essential: true, padding: { left: 340 } });
    } catch (e) {
      console.error("Gagal melakukan flyTo, koordinat tidak valid:", selectedBuilding);
    }
  }, [selectedBuilding]);

  return <div ref={mapContainer} className="map-container" />;
}

export default Map;

