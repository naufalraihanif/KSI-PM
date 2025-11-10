import React, { useState, useEffect, useRef } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import Search from './components/Search';
import Navbar from './components/Navbar';

function App() {
  // State untuk data yang digambar di peta
  const [allBuildings, setAllBuildings] = useState([]);
  
  // State untuk interaksi UI
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
  
  // State untuk menyimpan instance peta dan alat gambar saat sudah siap
  const [mapInstance, setMapInstance] = useState(null);
  const [drawInstance, setDrawInstance] = useState(null);
  const currentMapStyle = useRef(mapStyle);

  // Hitung hasil filter secara langsung dari data yang ada
  const filteredBuildings = allBuildings.filter(b => 
    b.properties.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Efek "MASTER" untuk mengontrol PETA dan alat gambar
  useEffect(() => {
    // Jangan lakukan apa-apa jika peta atau alat gambar belum siap
    if (!mapInstance || !drawInstance) return;

    // Fungsi untuk memperbarui state React dengan data dari peta
    const updateFeatures = () => {
      const data = drawInstance.getAll();
      // Tambahkan properti default ke fitur baru
      const featuresWithProps = data.features.map(f => ({
        ...f,
        properties: {
          id: f.id,
          nama: "Gedung Baru",
          ...f.properties,
        }
      }));
      setAllBuildings(featuresWithProps);
    };

    // Pasang listener ke alat gambar
    mapInstance.on('draw.create', updateFeatures);
    mapInstance.on('draw.update', updateFeatures);
    mapInstance.on('draw.delete', updateFeatures);
    
    // Pasang listener untuk klik (memilih gedung yang sudah digambar)
    mapInstance.on('click', (e) => {
      if (drawInstance.getMode() === 'draw_polygon') return;
      const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['gl-draw-polygon-fill-inactive.cold'] });
      if (features.length > 0) {
        const featureId = features[0].properties.id;
        const clickedFeature = drawInstance.get(featureId);
        handleSelectBuilding(clickedFeature);
      }
    });

    // Cleanup listeners saat komponen tidak lagi digunakan
    return () => {
      if(mapInstance.getStyle()){
        mapInstance.off('draw.create', updateFeatures);
        mapInstance.off('draw.update', updateFeatures);
        mapInstance.off('draw.delete', updateFeatures);
      }
    };

  }, [mapInstance, drawInstance]);

  // Efek untuk mengganti style peta
  useEffect(() => {
    if (!mapInstance || currentMapStyle.current === mapStyle) return;
    currentMapStyle.current = mapStyle;
    mapInstance.setStyle(mapStyle);
  }, [mapStyle, mapInstance]);

  
  const handleSelectBuilding = (building) => setSelectedBuilding(building);
  const handleCloseSidebar = () => setSelectedBuilding(null);

  // Fungsi untuk mengunduh data yang sudah digambar
  const handleDownload = () => {
    if (allBuildings.length === 0) {
      alert("Tidak ada data untuk diunduh. Silakan gambar beberapa gedung terlebih dahulu.");
      return;
    }
    const data = {
      type: 'FeatureCollection',
      features: allBuildings,
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'data.geojson');
    linkElement.click();
  };

  return (
    <div className="app-container">
      <Navbar currentStyle={mapStyle} setMapStyle={setMapStyle}>
        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </Navbar>
      
      <Sidebar building={selectedBuilding} onClose={handleCloseSidebar} />
      <Map 
        initialStyle={mapStyle}
        selectedBuilding={selectedBuilding}
        onMapLoad={(map, draw) => {
          setMapInstance(map);
          setDrawInstance(draw);
        }}
      />
       <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 2 }}>
        <button onClick={handleDownload} style={{ padding: '10px 15px', fontSize: '16px', backgroundColor: '#007cbf', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          💾 Simpan & Download GeoJSON
        </button>
      </div>
    </div>
  );
}

export default App;