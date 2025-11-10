import React, { useState, useEffect } from 'react';
import { updateBuilding, uploadFiles } from '../services/strapi';

const STRAPI_URL = 'http://localhost:1337';

function AdminDashboard({ jwt, onLogout, onBackToMap, buildings, onDataUpdate }) {
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [formData, setFormData] = useState({ deskripsi: '' });
  const [status, setStatus] = useState({ message: '', type: 'idle' }); // idle, loading, success, error
  const [fotoUtamaFile, setFotoUtamaFile] = useState(null);
  const [galeriRuanganFiles, setGaleriRuanganFiles] = useState([]);

  useEffect(() => {
    if (editingBuilding) {
      setFormData({
        deskripsi: editingBuilding.properties.deskripsi || '',
      });
    }
  }, [editingBuilding]);

  const handleSelectBuilding = (building) => {
    setEditingBuilding(building);
    setStatus({ message: '', type: 'idle' });
    setFotoUtamaFile(null);
    setGaleriRuanganFiles([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, setter) => {
    setter(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingBuilding) return;

    setStatus({ message: 'Menyimpan perubahan...', type: 'loading' });

    try {
      const updateData = { ...formData };

      // Unggah foto utama jika ada file baru
      if (fotoUtamaFile && fotoUtamaFile.length > 0) {
        const [uploadedFoto] = await uploadFiles(fotoUtamaFile, jwt);
        updateData.foto_utama = uploadedFoto.id;
      }

      // Unggah galeri ruangan jika ada file baru
      if (galeriRuanganFiles && galeriRuanganFiles.length > 0) {
        const uploadedFiles = await uploadFiles(galeriRuanganFiles, jwt);
        const existingGalleryIds = editingBuilding.properties.galeri_ruangan?.map(img => img.id) || [];
        updateData.galeri_ruangan = [...existingGalleryIds, ...uploadedFiles.map(f => f.id)];
      }

      await updateBuilding(editingBuilding.properties.id, updateData, jwt);
      
      setStatus({ message: 'Data berhasil diperbarui!', type: 'success' });
      onDataUpdate(); // Memicu refresh data di App.jsx
      
      setTimeout(() => {
        setEditingBuilding(null);
        setStatus({ message: '', type: 'idle' });
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus({ message: `Gagal menyimpan: ${error.message}`, type: 'error' });
    }
  };

  const getImageUrl = (imgData) => `${STRAPI_URL}${imgData.url}`;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ width: '30%', borderRight: '1px solid #ccc', overflowY: 'auto', padding: '10px' }}>
        <h2>Daftar Gedung</h2>
        <button onClick={onBackToMap}>Kembali ke Peta</button>
        <button onClick={onLogout} style={{ marginLeft: '10px' }}>Logout</button>
        <hr />
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {buildings.map(building => (
            <li 
              key={building.properties.id} 
              onClick={() => handleSelectBuilding(building)}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', background: editingBuilding?.properties.id === building.properties.id ? '#e0f7ff' : 'transparent' }}
            >
              {building.properties.nama}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ width: '70%', padding: '20px', overflowY: 'auto' }}>
        {editingBuilding ? (
          <div>
            <h3>Edit: {editingBuilding.properties.nama}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="deskripsi">Deskripsi</label><br />
                <textarea
                  id="deskripsi"
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  rows="5"
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div style={{ marginTop: '15px' }}>
                <label>Foto Utama</label><br />
                {editingBuilding.properties.foto_utama && (
                  <img src={getImageUrl(editingBuilding.properties.foto_utama)} alt="Foto Utama" width="150" style={{ marginBottom: '10px' }}/>
                )}
                <input type="file" onChange={(e) => handleFileChange(e, setFotoUtamaFile)} accept="image/*" />
              </div>
              <div style={{ marginTop: '15px' }}>
                <label>Galeri Ruangan</label><br />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {editingBuilding.properties.galeri_ruangan?.map(img => (
                    <img key={img.id} src={getImageUrl(img)} alt="Galeri" width="100" />
                  ))}
                </div>
                <input type="file" onChange={(e) => handleFileChange(e, setGaleriRuanganFiles)} accept="image/*" multiple />
              </div>

              <button type="submit" style={{ marginTop: '20px', padding: '10px 20px' }} disabled={status.type === 'loading'}>
                {status.type === 'loading' ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
            {status.message && <p style={{ color: status.type === 'error' ? 'red' : 'green' }}>{status.message}</p>}
          </div>
        ) : (
          <p>Pilih gedung dari daftar di sebelah kiri untuk mulai mengedit.</p>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;