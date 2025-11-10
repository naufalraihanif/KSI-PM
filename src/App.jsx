// src/App.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import Search from './components/Search';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';

function App() {
  // State baru untuk memisahkan data gedung dan lahan
  const [gedungData, setGedungData] = useState(null);
  const [lahanData, setLahanData] = useState(null);
  const [kawasanPolinela, setKawasanPolinela] = useState(null);
  const [jalan, setJalan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
  
  const listenersAdded = useRef(false);
  const isInitialLoad = useRef(true);

  // Efek untuk mengambil DUA file data baru
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gedungRes, lahanRes, kawasanRes, jalanRes] = await Promise.all([
          fetch('/data/gedung.geojson'),
          fetch('/data/lahan.geojson'),
          fetch('/data/polinela.geojson'),
          fetch('/data/jalan.geojson')
        ]);
        const gedungJson = await gedungRes.json();
        const lahanJson = await lahanRes.json();
        const kawasanJson = await kawasanRes.json();
        const jalanJson = await jalanRes.json();

        setGedungData(gedungJson);
        setLahanData(lahanJson);
        setKawasanPolinela(kawasanJson);
        setJalan(jalanJson);
      } catch (error) {
        console.error("❌ Gagal memuat data lokal:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Gabungkan semua fitur (gedung dan lahan) untuk keperluan pencarian
  const allFeatures = useMemo(() => {
    if (!gedungData || !lahanData) return [];
    return [...gedungData.features, ...lahanData.features];
  }, [gedungData, lahanData]);

  // Filter dari data yang sudah digabung
  const filteredFeatures = useMemo(() => allFeatures.filter(
    b => b.properties.nama && b.properties.nama.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allFeatures, searchTerm]);

  // Efek untuk menggambar layer dan memasang event listener
  useEffect(() => {
    if (!mapInstance || !gedungData || !lahanData || !kawasanPolinela || !jalan) return;

    const setupLayers = () => {
      console.log("🗺️ Menggambar layer...");
      
      const layersToRemove = ['gedung-layer', 'gedung-outline', 'lahan-layer', 'lahan-outline', 'jalan-layer', 'kawasan-layer', 'kawasan-outline'];
      const sourcesToRemove = ['gedung-source', 'lahan-source', 'jalan-source', 'kawasan-source'];
      layersToRemove.forEach(id => { if (mapInstance.getLayer(id)) mapInstance.removeLayer(id); });
      sourcesToRemove.forEach(id => { if (mapInstance.getSource(id)) mapInstance.removeSource(id); });

      mapInstance.addSource('kawasan-source', { type: 'geojson', data: kawasanPolinela });
      mapInstance.addLayer({ id: 'kawasan-layer', type: 'fill', source: 'kawasan-source', paint: { 'fill-color': '#997243', 'fill-opacity': 0.3 }});
      mapInstance.addLayer({ id: 'kawasan-outline', type: 'line', source: 'kawasan-source', paint: { 'line-color': '#002b57', 'line-width': 1 } });

      mapInstance.addSource('jalan-source', { type: 'geojson', data: jalan });
      mapInstance.addLayer({ id: 'jalan-layer', type: 'line', source: 'jalan-source', paint: { 'line-color': 'black', 'line-width': 1 } });
      
      // Buat source dan layer terpisah untuk gedung
      mapInstance.addSource('gedung-source', { type: 'geojson', data: gedungData });
      mapInstance.addLayer({ id: 'gedung-layer', type: 'fill', source: 'gedung-source', paint: { 'fill-color': '#007cf9', 'fill-opacity': 0.6 }});
      mapInstance.addLayer({ id: 'gedung-outline', type: 'line', source: 'gedung-source', paint: { 'line-color': '#002b57', 'line-width': 1 }});
      
      // Buat source dan layer terpisah untuk lahan
      mapInstance.addSource('lahan-source', { type: 'geojson', data: lahanData });
      mapInstance.addLayer({ id: 'lahan-layer', type: 'fill', source: 'lahan-source', paint: { 'fill-color': '#008329', 'fill-opacity': 0.6 }});
      mapInstance.addLayer({ id: 'lahan-outline', type: 'line', source: 'lahan-source', paint: { 'line-color': '#00470f', 'line-width': 1 }});
      if (!listenersAdded.current) {
        const clickableLayers = ['gedung-layer', 'lahan-layer'];
        
        clickableLayers.forEach(layerId => {
          // --- PERUBAHAN DI SINI ---
          mapInstance.on('click', layerId, (e) => {
            if (e.features && e.features.length > 0) {
              // 1. Dapatkan ID dari fitur yang diklik Mapbox
              const clickedFeatureId = e.features[0].properties.id;

              // 2. Cari fitur ASLI dari state 'allFeatures' Anda
              //    (allFeatures adalah data "bersih" Anda )
              const originalFeature = allFeatures.find(
                f => f.properties.id === clickedFeatureId
              );

              // 3. Set state menggunakan data asli yang tidak rusak
              if (originalFeature) {
                setSelectedBuilding(originalFeature);
              }
            }
          });
          // --- AKHIR PERUBAHAN ---

          mapInstance.on('mouseenter', layerId, () => mapInstance.getCanvas().style.cursor = 'pointer');
          mapInstance.on('mouseleave', layerId, () => mapInstance.getCanvas().style.cursor = '');
        });
        
        listenersAdded.current = true;
      }
    };
    
    // Pasang listener. 'style.load' akan menggambar ulang layer SETELAH style berubah.
    mapInstance.on('style.load', setupLayers);
    
    // Panggil sekali untuk menggambar layer di pemuatan awal, ini aman karena onMapLoad menunggu 'load'.
    setupLayers();

    return () => {
      if (mapInstance) {
        mapInstance.off('style.load', setupLayers);
      }
    };
  }, [mapInstance, gedungData, lahanData, kawasanPolinela, jalan]);

  // Efek TERPISAH untuk mengubah style peta.
  useEffect(() => {
    // Jangan jalankan saat pemuatan awal untuk menghindari race condition.
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    if (mapInstance) {
      mapInstance.setStyle(mapStyle);
    }
  }, [mapStyle]);
  
  // Efek untuk memfilter data
  useEffect(() => {
    if (!mapInstance) return;
    
    const gedungSource = mapInstance.getSource('gedung-source');
    if (gedungSource && gedungData) {
      const filteredGedung = gedungData.features.filter(f => filteredFeatures.some(ff => ff.properties.id === f.properties.id));
      gedungSource.setData({ type: 'FeatureCollection', features: filteredGedung });
    }

    const lahanSource = mapInstance.getSource('lahan-source');
    if (lahanSource && lahanData) {
      const filteredLahan = lahanData.features.filter(f => filteredFeatures.some(ff => ff.properties.id === f.properties.id));
      lahanSource.setData({ type: 'FeatureCollection', features: filteredLahan });
    }
  }, [filteredFeatures, mapInstance]);

  // Efek untuk flyTo
  useEffect(() => {
    if (!mapInstance || !selectedBuilding) return;
    try {
      const firstCoordinate = selectedBuilding.geometry.coordinates[0][0];
      mapInstance.flyTo({ center: firstCoordinate, essential: true, padding: { left: 340 } });
    } catch (e) {
      console.error("Gagal melakukan flyTo:", e);
    }
  }, [selectedBuilding, mapInstance]);

  const handleCloseSidebar = () => setSelectedBuilding(null);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="app-container">
      <Navbar currentStyle={mapStyle} setMapStyle={setMapStyle}>
        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </Navbar>
      <Sidebar building={selectedBuilding} onClose={handleCloseSidebar} />
      <Map initialStyle={mapStyle} onMapLoad={setMapInstance} />
    </div>
  );
}

export default App;