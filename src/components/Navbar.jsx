import React from 'react';
import { FaHome, FaInfoCircle, FaSatellite, FaMapMarkedAlt } from 'react-icons/fa';

// --- STYLES ---
const navStyle = { backgroundColor: '#1b5eaa', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'relative', zIndex: 10 };
const leftSectionStyle = { display: 'flex', alignItems: 'center', gap: '25px' };
const logoStyle = { height: '40px' };
const linkStyle = { color: 'white', textDecoration: 'none', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, transition: 'opacity 0.2s', cursor: 'pointer' };
const rightSectionStyle = { display: 'flex', alignItems: 'center', gap: '25px' };
// --- END STYLES ---

function Navbar({ children, currentStyle, setMapStyle }) {
  const isSatellite = currentStyle.includes('satellite');
  const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
  const STREET_STYLE = 'mapbox://styles/mapbox/streets-v12';

  const handleModeToggle = () => {
    setMapStyle(isSatellite ? STREET_STYLE : SATELLITE_STYLE);
  };

  const handleMouseOver = (e) => e.currentTarget.style.opacity = 1;
  const handleMouseOut = (e) => e.currentTarget.style.opacity = 0.8;

  return (
    <nav style={navStyle}>
      {/* Bagian Kiri Navbar */}
      <div style={leftSectionStyle}>
        <img src="src/img/logo.png" alt="Logo" style={logoStyle} />
        <a style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}><FaHome /> Beranda</a>
        {/* Tombol Mode sudah dipindahkan dari sini */}
        <a style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}><FaInfoCircle /> Tentang</a>
      </div>

      {/* Bagian Kanan Navbar */}
      <div style={rightSectionStyle}>
        {/* Tombol Mode SEKARANG DI SINI */}
        <a style={linkStyle} onClick={handleModeToggle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          {isSatellite ? <FaSatellite /> : <FaMapMarkedAlt />}
          {isSatellite ? 'Satelit' : 'Jalan'}
        </a>

        {/* Search bar akan muncul di sini (dari children) */}
        {children}
      </div>
    </nav>
  );
}

export default Navbar;