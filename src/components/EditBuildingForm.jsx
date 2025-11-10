import React, { useState, useEffect } from 'react';
import { updateBuildingDetails, uploadImage } from '../services/strapi';

const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputStyle = { padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' };
const buttonStyle = { padding: '10px', cursor: 'pointer', backgroundColor: '#007cbf', color: 'white', border: 'none', borderRadius: '4px' };
const galleryStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' };
const imageStyle = { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' };

// Add STRAPI_URL constant for images
const STRAPI_URL = 'http://localhost:1337';

function EditBuildingForm({ building, jwt, onUpdateSuccess }) {
  // PERBAIKAN: "Penjaga" untuk data yang tidak valid
  if (!building || !building.attributes) {
    return <p>Data gedung tidak valid atau tidak ditemukan.</p>;
  }
  
  const [nama, setNama] = useState(building.attributes.nama);
  const [deskripsi, setDeskripsi] = useState(building.attributes.deskripsi || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setNama(building.attributes.nama);
    setDeskripsi(building.attributes.deskripsi || '');
    setMessage('');
  }, [building]);

  const handleDetailsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Menyimpan detail...');
    try {
      await updateBuildingDetails(building.id, { nama, deskripsi }, jwt);
      setMessage('Detail berhasil diperbarui!');
      setTimeout(() => onUpdateSuccess(), 1500);
    } catch (error) {
      setMessage(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      setMessage('Pilih file gambar terlebih dahulu.');
      return;
    }
    setLoading(true);
    setMessage('Mengunggah gambar...');
    try {
      const uploadedImageData = await uploadImage(selectedFile, jwt);
      const imageId = uploadedImageData[0].id;
      
      const currentImageIds = building.attributes.galeri_ruangan.data?.map(img => img.id) || [];
      
      await updateBuildingDetails(building.id, {
        galeri_ruangan: [...currentImageIds, imageId]
      }, jwt);

      setMessage('Gambar berhasil diunggah!');
      setSelectedFile(null);
      document.getElementById('file-input').value = null;
      setTimeout(() => onUpdateSuccess(), 1500);
    } catch (error) {
      setMessage(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Edit: {building.attributes.nama}</h2>
      <form onSubmit={handleDetailsUpdate} style={formStyle}>
        <label>
          Nama Gedung:
          <input
            type="text"
            style={inputStyle}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </label>
        <label>
          Deskripsi:
          <textarea
            style={{ ...inputStyle, height: '100px' }}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
          />
        </label>
        <button type="submit" style={buttonStyle} disabled={loading}>Simpan Perubahan Teks</button>
      </form>

      <hr style={{ margin: '30px 0' }} />

      <h3>Galeri Gambar</h3>
      <div style={galleryStyle}>
        {building.attributes.galeri_ruangan.data?.map(img => (
          <img key={img.id} src={`${STRAPI_URL}${img.attributes.url}`} style={imageStyle} alt={img.attributes.name} />
        ))}
      </div>
      <div style={{...formStyle, marginTop: '20px'}}>
        <label>
          Tambah Gambar Baru:
          <input id="file-input" type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
        </label>
        <button onClick={handleImageUpload} style={buttonStyle} disabled={loading}>Unggah Gambar</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}

export default EditBuildingForm;
