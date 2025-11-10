import React, { useState, useEffect } from 'react';

// --- STYLES ---

const sidebarStyle = {
  position: 'absolute',
  top: 60, // Menempel di bawah navbar
  left: 0,
  width: '320px',
  height: 'calc(100vh - 60px)', // Tinggi penuh dikurangi navbar
  backgroundColor: 'white',
  zIndex: 2,
  boxShadow: '2px 0 5px rgba(56, 56, 56, 0.1)',
  transform: 'translateX(-100%)',
  transition: 'transform 0.3s ease-in-out',
  boxSizing: 'border-box',
  overflow: 'hidden', // Mencegah konten meluber
};

const sidebarActiveStyle = {
  ...sidebarStyle,
  transform: 'translateX(0)', // Tampilkan sidebar
};

// Tombol "X" sekarang di-styling ulang agar lebih baik
const closeButtonStyle = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  background: 'rgba(255, 255, 255, 0.8)', // Latar belakang semi-transparan
  border: 'none',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  cursor: 'pointer',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
  zIndex: 10, // zIndex tinggi agar selalu di atas
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
};

// --- STYLE SLIDER ---
const imageContainerStyle = {
  position: 'relative', // Diperlukan untuk tombol slider
  width: '100%',
  height: '200px', // Sedikit lebih tinggi
  backgroundColor: '#f0f0f0', // Warna placeholder jika gambar gagal dimuat
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const sliderButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  zIndex: 5, // Di atas gambar, di bawah tombol close
};

const prevButtonStyle = {
  ...sliderButtonStyle,
  left: '10px',
};

const nextButtonStyle = {
  ...sliderButtonStyle,
  right: '10px',
};

// --- STYLE KONTEN (BARU) ---
const contentContainerStyle = {
  padding: '20px',
  height: 'calc(100% - 200px)', // Tinggi sisa sidebar dikurangi gambar
  overflowY: 'auto', // Hanya konten teks yang bisa di-scroll
};

const titleStyle = {
  marginTop: '0',
  marginBottom: '10px',
  fontSize: '22px',
  fontWeight: 700,
  color: '#111',
};

const kategoriStyle = {
  backgroundColor: '#eef2f5',
  padding: '6px 12px',
  borderRadius: '16px',
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#2d3748',
};

const deskripsiStyle = {
  marginTop: '16px',
  lineHeight: '1.6',
  fontSize: '15px',
  color: '#4a5568',
};

// --- KOMPONEN UTAMA ---

function Sidebar({ building, onClose }) {
  if (!building) {
    return null;
  }

  const { properties } = building;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset slider setiap kali gedung baru dipilih
  useEffect(() => {
    setCurrentIndex(0);
  }, [building]);

  const hasImages = properties.foto_urls && properties.foto_urls.length > 0;
  const canSlide = hasImages && properties.foto_urls.length > 1;

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % properties.foto_urls.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + properties.foto_urls.length) % properties.foto_urls.length);
  };

  return (
    <div style={sidebarActiveStyle}>
      {/* Tombol Close diletakkan di paling atas (level div) */}
      <button onClick={onClose} style={closeButtonStyle}>X</button>

      {/* 1. IMAGE CONTAINER (Slider) */}
      {hasImages ? (
        <div style={imageContainerStyle}>
          {canSlide && (
            <button onClick={handlePrev} style={prevButtonStyle}>&lt;</button>
          )}
          <img
            src={properties.foto_urls[currentIndex]}
            alt={`${properties.nama} ${currentIndex + 1}`}
            style={imageStyle}
          />
          {canSlide && (
            <button onClick={handleNext} style={nextButtonStyle}>&gt;</button>
          )}
        </div>
      ) : (
        // Tampilkan placeholder jika tidak ada gambar
        <div style={{...imageContainerStyle, backgroundColor: '#e2e8f0'}}></div>
      )}

      {/* 2. CONTENT CONTAINER (Info Teks) */}
      <div style={contentContainerStyle}>
        <h2 style={titleStyle}>{properties.nama}</h2>

        {properties.kategori && (
          <p style={kategoriStyle}>
            {properties.kategori}
          </p>
        )}

        {properties.deskripsi && properties.deskripsi.trim() !== "" && (
          <p style={deskripsiStyle}>
            {properties.deskripsi}
          </p>
        )}
      </div>
    </div>
  );
}

export default Sidebar;