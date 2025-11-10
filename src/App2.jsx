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
        const buildingsData = buildingsResponse.data
          .filter(item => item && item.attributes)
          .map(item => ({
            id: item.id,
            ...item.attributes,
            foto_utama: item.attributes.foto_utama?.data?.attributes || null,
            galeri_ruangan: item.attributes.galeri_ruangan?.data?.map(img => img.attributes) || []
          }));
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
  // Efek 2: Bertanggung jawab untuk setup peta dan menggambar ulang layer.
  useEffect(() => {
    if (!mapInstance || !kawasanPolinela || !jalan) return;

    const setupAndReloadLayers = () => {
      console.log("🗺️ Menyiapkan atau menggambar ulang layer...");
      
      const layers = ['buildings-outline', 'buildings-layer', 'jalan-layer', 'kawasan-layer'];
      const sources = ['buildings-source', 'jalan-source', 'kawasan-source'];
      layers.forEach(id => { if (mapInstance.getLayer(id)) mapInstance.removeLayer(id); });
      sources.forEach(id => { if (mapInstance.getSource(id)) mapInstance.removeSource(id); });

      mapInstance.addSource('kawasan-source', { type: 'geojson', data: kawasanPolinela });
      mapInstance.addSource('jalan-source', { type: 'geojson', data: jalan });
      mapInstance.addSource('buildings-source', { type: 'geojson', data: allBuildings });

      mapInstance.addLayer({ id: 'kawasan-layer', type: 'fill', source: 'kawasan-source', paint: { 'fill-color': '#fffcae', 'fill-opacity': 0.1 }});
      mapInstance.addLayer({ id: 'jalan-layer', type: 'line', source: 'jalan-source', paint: { 'line-color': 'black', 'line-width': 1 } });
      mapInstance.addLayer({ id: 'buildings-layer', type: 'fill', source: 'buildings-source', paint: { 'fill-color': '#007cbf', 'fill-opacity': 0.4 } });
      mapInstance.addLayer({ id: 'buildings-outline', type: 'line', source: 'buildings-source', paint: { 'line-color': '#007cbf', 'line-width': 2 } });

      if (!eventListenersAdded.current) {
        mapInstance.on('click', 'buildings-layer', e => setSelectedBuilding(e.features[0]));
        mapInstance.on('mouseenter', 'buildings-layer', () => mapInstance.getCanvas().style.cursor = 'pointer');
        mapInstance.on('mouseleave', 'buildings-layer', () => mapInstance.getCanvas().style.cursor = '');
        eventListenersAdded.current = true;
      }
    };

    // Logika baru untuk menangani race condition
    if (mapInstance.isStyleLoaded()) {
      // Jika peta sudah siap (kasus refresh), langsung setup
      setupAndReloadLayers();
    } else {
      // Jika belum (kasus ganti style), tunggu event 'style.load'
      mapInstance.once('style.load', setupAndReloadLayers);
    }

  }, [mapInstance, kawasanPolinela, jalan, allBuildings]);

  // Efek 3: Terpisah, hanya untuk menangani perubahan style
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setStyle(mapStyle);
    }
  }, [mapStyle]);

  // Efek 4: Terpisah dan efisien, hanya untuk memperbarui data gedung saat filtering
  useEffect(() => {
    if (!mapInstance || !mapInstance.getSource('buildings-source') || !mapInstance.isStyleLoaded()) return;
    
    mapInstance.getSource('buildings-source').setData(filteredBuildingsGeoJSON);
  }, [filteredBuildingsGeoJSON, mapInstance]);


  const handleAdminClick = () => jwt ? setView('dashboard') : setView('login');
  const handleLoginSuccess = (token) => { setJwt(token); setView('dashboard'); };
  const handleLogout = () => { logout(); setJwt(null); setView('map'); };
  const handleCloseSidebar = () => setSelectedBuilding(null);

  if (isLoading) return <LoadingScreen />;
  if (view === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  // Perhatikan: fetchData tidak lagi dikirim sebagai prop di sini karena sudah ditangani
  if (view === 'dashboard') return <AdminDashboard jwt={jwt} onLogout={handleLogout} onBackToMap={() => setView('map')} buildings={allBuildings.features} onDataUpdate={() => { /* Logika refresh bisa ditambahkan di sini jika perlu */ }} />;

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