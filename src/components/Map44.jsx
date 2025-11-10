import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'; // CSS untuk alat gambar

mapboxgl.accessToken = 'pk.eyJ1IjoibmF1ZmFsaGFuaWYiLCJhIjoiY21mbmcwYXBiMDJwNDJrcXd2ZHptMzZweSJ9.IRU6Db4BxzYXBF-ER66vxg';

function Map({ initialStyle, onMapLoad, selectedBuilding }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null); // Ref untuk menyimpan instance MapboxDraw

  // Efek HANYA untuk membuat peta dan alat gambar sekali
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: [105.2309, -5.3566],
      zoom: 14.5,
      pitch: 0,
      maxBounds: [ [105.2273, -5.3603], [105.2374, -5.3484] ]
    });

    // Inisialisasi alat gambar
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true, // Tampilkan tombol gambar poligon
        trash: true    // Tampilkan tombol hapus
      }
    });
    map.current.addControl(draw.current);

    // Laporkan bahwa peta dan alat gambar sudah siap setelah event 'load' selesai
    map.current.on('load', () => {
      onMapLoad(map.current, draw.current);
    });

    // Cleanup function: hapus peta saat komponen tidak lagi digunakan
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // <-- Array dependensi KOSONG, hanya berjalan sekali

  // Efek untuk 'flyTo' saat gedung dipilih
  useEffect(() => {
    if (!map.current || !selectedBuilding) return;
    // Ambil koordinat pertama dari poligon yang dipilih
    const firstCoordinate = selectedBuilding.geometry.coordinates[0][0];
    map.current.flyTo({ 
      center: firstCoordinate, 
      zoom: 18.5, 
      essential: true, 
      padding: { left: 340 } 
    });
  }, [selectedBuilding]);

  return <div ref={mapContainer} className="map-container" />;
}

// PASTIKAN BARIS INI ADA
export default Map;