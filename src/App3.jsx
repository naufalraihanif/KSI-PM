import React, { useState, useEffect, useCallback } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import Search from './components/Search';

function App() {
  const [allBuildings, setAllBuildings] = useState([]);
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!searchTerm) {
      setFilteredBuildings(allBuildings);
    } else {
      const results = allBuildings.filter(building =>
        building.properties.nama?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBuildings(results);
    }
  }, [searchTerm, allBuildings]);

  const handleDrawUpdate = useCallback((features) => {
    console.log("Data diperbarui di App.jsx:", features);
    setAllBuildings(features);
  }, []);

  const handleDownload = () => {
    if (allBuildings.length === 0) {
      alert("Tidak ada data untuk diunduh. Silakan gambar beberapa gedung terlebih dahulu.");
      return;
    }
    
    const geojsonData = {
      type: 'FeatureCollection',
      features: allBuildings,
    };

    const dataStr = JSON.stringify(geojsonData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'data.geojson');
    linkElement.click();
  };

  const handleSelectBuilding = (building) => {
    setSelectedBuilding(building);
  };

  return (
    <div>
      <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Sidebar building={selectedBuilding} />
      <Map
        onDrawUpdate={handleDrawUpdate}
        onSelectBuilding={handleSelectBuilding}
        selectedBuilding={selectedBuilding}
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