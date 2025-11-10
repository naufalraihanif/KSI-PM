import React, { useState, useEffect, useRef } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import Search from './components/Search';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import LoadingScreen from './components/LoadingScreen';
import { logout } from './services/strapi';

const STRAPI_URL = 'http://localhost:1337/api';
const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

function App() {
  const [view, setView] = useState('map');
  const [jwt, setJwt] = useState(localStorage.getItem('strapi_jwt'));
  const [allBuildings, setAllBuildings] = useState({ type: 'FeatureCollection', features: [] });
  const [kawasanPolinela, setKawasanPolinela] = useState(null);
  const [jalan, setJalan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
  
  const eventListenersAdded = useRef(false);

  // Efek 1: Hanya untuk mengambil data sekali
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!STRAPI_API_TOKEN) {
          throw new Error("Token API Strapi (VITE_STRAPI_API_TOKEN) tidak ditemukan di file .env Anda.");
        }
        const fetchOptions = { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } };
        const buildingsUrl = `${STRAPI_URL}/gedungs?populate=*&pagination[limit]=200`;
        const [buildingsRes, kawasanRes, jalanRes] = await Promise.all([
          fetch(buildingsUrl, fetchOptions),
          fetch('/src/data/polinela.geojson'),
          fetch('/src/data/jalan.geojson')
        ]);
        if (!buildingsRes.ok) throw new Error(`Gagal mengambil data gedung dari Strapi: ${buildingsRes.statusText}`);
        const buildingsResponse = await buildingsRes.json();
        const buildingsData = Array.isArray(buildingsResponse) ? buildingsResponse : buildingsResponse.data;
        const kawasanData = await kawasanRes.json();
        const jalanData = await jalanRes.json();
        const validBuildings = buildingsData.filter(b => b?.koordinat); 
        const geoJsonFeatures = validBuildings.map(b => {
          const { koordinat, ...otherProperties } = b; 
          return { type: 'Feature', geometry: koordinat, properties: otherProperties };
        });
        setAllBuildings({ type: 'FeatureCollection', features: geoJsonFeatures });
        setKawasanPolinela(kawasanData);
        setJalan(jalanData);
      } catch (error) {
        console.error("❌ Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBuildingFeatures = allBuildings.features.filter(
    b => b.properties.nama && b.properties.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredBuildingsGeoJSON = { type: 'FeatureCollection', features: filteredBuildingFeatures };

  // --- PERBAIKAN UTAMA DI SINI ---
  // Efek 2: Satu useEffect untuk mengelola semua logika peta
  useEffect(() => {
    if (!mapInstance || !kawasanPolinela || !jalan) return;

    const setupLayers = () => {
      console.log("🗺️ Menyiapkan atau menggambar ulang layer...");
      
      // Setup sources jika belum ada
      if (!mapInstance.getSource('kawasan-source')) {
        mapInstance.addSource('kawasan-source', { type: 'geojson', data: kawasanPolinela });
      }
      if (!mapInstance.getSource('jalan-source')) {
        mapInstance.addSource('jalan-source', { type: 'geojson', data: jalan });
      }
      if (!mapInstance.getSource('buildings-source')) {
        mapInstance.addSource('buildings-source', { type: 'geojson', data: filteredBuildingsGeoJSON });
      } else {
        // Jika sudah ada, cukup update data (untuk filtering)
        mapInstance.getSource('buildings-source').setData(filteredBuildingsGeoJSON);
      }

      // Setup layers jika belum ada
      if (!mapInstance.getLayer('kawasan-layer')) {
        mapInstance.addLayer({ id: 'kawasan-layer', type: 'fill', source: 'kawasan-source', paint: { 'fill-color': '#fffcae', 'fill-opacity': 0.1 }});
      }
      if (!mapInstance.getLayer('jalan-layer')) {
        mapInstance.addLayer({ id: 'jalan-layer', type: 'line', source: 'jalan-source', paint: { 'line-color': 'black', 'line-width': 1 } });
      }
      if (!mapInstance.getLayer('buildings-layer')) {
        mapInstance.addLayer({ id: 'buildings-layer', type: 'fill', source: 'buildings-source', paint: { 'fill-color': '#007cbf', 'fill-opacity': 0.4 } });
      }
      if (!mapInstance.getLayer('buildings-outline')) {
        mapInstance.addLayer({ id: 'buildings-outline', type: 'line', source: 'buildings-source', paint: { 'line-color': '#007cbf', 'line-width': 2 } });
      }

      // Setup event listeners hanya sekali
      if (!eventListenersAdded.current) {
        mapInstance.on('click', 'buildings-layer', e => setSelectedBuilding(e.features[0]));
        mapInstance.on('mouseenter', 'buildings-layer', () => mapInstance.getCanvas().style.cursor = 'pointer');
        mapInstance.on('mouseleave', 'buildings-layer', () => mapInstance.getCanvas().style.cursor = '');
        eventListenersAdded.current = true;
      }
    };

    const handleStyleLoad = () => {
        // Hapus referensi lama agar layer dibuat ulang
        eventListenersAdded.current = false; 
        setupLayers();
    }

    // Panggil setup jika style sudah dimuat (untuk refresh)
    if (mapInstance.isStyleLoaded()) {
      setupLayers();
    }
    
    // Tambahkan listener untuk menangani perubahan style
    mapInstance.on('style.load', handleStyleLoad);
    
    // Cleanup
    return () => {
        mapInstance.off('style.load', handleStyleLoad);
    };

  }, [mapInstance, kawasanPolinela, jalan, filteredBuildingsGeoJSON]); // Bergantung pada data yang difilter

  // Efek terpisah hanya untuk mengubah style
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setStyle(mapStyle);
    }
  }, [mapStyle]);


  const handleAdminClick = () => jwt ? setView('dashboard') : setView('login');
  const handleLoginSuccess = (token) => { setJwt(token); setView('dashboard'); };
  const handleLogout = () => { logout(); setJwt(null); setView('map'); };
  const handleCloseSidebar = () => setSelectedBuilding(null);

  if (isLoading) return <LoadingScreen />;
  if (view === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  if (view === 'dashboard') return <AdminDashboard jwt={jwt} onLogout={handleLogout} onBackToMap={() => setView('map')} buildings={allBuildings.features} />;

  return (
    <div className="app-container">
      <Navbar currentStyle={mapStyle} setMapStyle={setMapStyle}>
        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </Navbar>
      <Sidebar building={selectedBuilding} onClose={handleCloseSidebar} />
      <Map initialStyle={mapStyle} selectedBuilding={selectedBuilding} onMapLoad={setMapInstance} />
      <button onClick={handleAdminClick} style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, padding: '10px', cursor: 'pointer' }}>
        Admin
      </button>
    </div>
  );
}

export default App;

