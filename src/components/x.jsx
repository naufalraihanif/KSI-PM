import React, { useState, useEffect } from 'react';

// --- KONFIGURASI ---
const STRAPI_URL = 'http://localhost:1337';
// GANTI DENGAN TOKEN YANG ANDA BUAT UNTUK SKRIP MIGRASI
const API_TOKEN = 'GANTI_DENGAN_TOKEN_ANDA';
// -----------------

// --- STYLES ---
const dashboardStyle = { position: 'absolute', top: '60px', left: 0, width: '100vw', height: 'calc(100vh - 60px)', backgroundColor: '#f0f2f5', zIndex: 20, display: 'flex' };
const listStyle = { width: '300px', borderRight: '1px solid #ddd', overflowY: 'auto', backgroundColor: 'white' };
const detailStyle = { flexGrow: 1, padding: '20px', overflowY: 'auto' };
const buildingItemStyle = { padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' };
const activeBuildingItemStyle = { ...buildingItemStyle, backgroundColor: '#e0e0e0' };
const uploadSectionStyle = { marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' };
// --- END STYLES ---

function AdminDashboard({ onBack }) {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ambil daftar gedung saat komponen dimuat
  useEffect(() => {
    fetch(`${STRAPI_URL}/api/gedungs`)
      .then(res => res.json())
      .then(apiResponse => {
        // PERBAIKAN 1: Filter data untuk memastikan hanya entri valid yang disimpan
        const validBuildings = apiResponse.data.filter(b => b && b.attributes);
        setBuildings(validBuildings);
      })
      .catch(error => console.error("Gagal mengambil daftar gedung:", error));
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedBuilding) {
      alert("Silakan pilih gedung dan file gambar terlebih dahulu.");
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('files', selectedFile);
      
      const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_TOKEN}` },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Gagal mengunggah file.");
      
      const uploadedFiles = await uploadResponse.json();
      const fileId = uploadedFiles[0].id;

      const existingGalleryIds = selectedBuilding.attributes.galeri_ruangan?.data?.map(img => img.id) || [];

      const updateResponse = await fetch(`${STRAPI_URL}/api/gedungs/${selectedBuilding.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            galeri_ruangan: [...existingGalleryIds, fileId]
          }
        }),
      });

      if (!updateResponse.ok) throw new Error("Gagal memperbarui data gedung.");

      alert("Gambar berhasil diunggah!");
      setSelectedFile(null);
      // Anda bisa menambahkan logika untuk memuat ulang data gedung yang dipilih di sini
    } catch (error) {
      console.error("Error saat mengunggah:", error);
      alert("Terjadi kesalahan. Cek console untuk detail.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={dashboardStyle}>
      <div style={listStyle}>
        <h2 style={{padding: '0 15px'}}>Daftar Gedung</h2>
        {buildings.map(building => (
          <div 
            key={building.id} 
            style={selectedBuilding?.id === building.id ? activeBuildingItemStyle : buildingItemStyle}
            onClick={() => setSelectedBuilding(building)}
          >
            {/* PERBAIKAN 2: Gunakan optional chaining (?.) sebagai pengaman */}
            {building.attributes?.nama || 'Nama tidak tersedia'}
          </div>
        ))}
      </div>
      <div style={detailStyle}>
        <button onClick={onBack}>&larr; Kembali ke Peta</button>
        {selectedBuilding ? (
          <div>
            <h1>{selectedBuilding.attributes?.nama}</h1>
            <p>{selectedBuilding.attributes?.deskripsi}</p>
            
            <div style={uploadSectionStyle}>
              <h3>Unggah Gambar Ruangan</h3>
              <input type="file" onChange={handleFileChange} />
              <button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? 'Mengunggah...' : 'Unggah Gambar'}
              </button>
            </div>
            {/* Di sini Anda bisa menambahkan galeri untuk menampilkan gambar yang ada */}
          </div>
        ) : (
          <h2>Pilih sebuah gedung untuk dikelola</h2>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;