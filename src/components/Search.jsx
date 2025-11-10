import React from 'react';
import { FaSearch } from 'react-icons/fa'; // Impor ikon search

const searchContainerStyle = {
  position: 'relative',
  width: '280px',
};

const inputStyle = {
  width: '100%',
  padding: '8px 15px 8px 15px', // Padding kiri ditambah untuk ikon
  fontSize: '14px',
  border: '3px solid #aaa',
  borderRadius: '20px',
  backgroundColor: '#dfdfdfff',
  color: 'black',
  boxSizing: 'border-box'
};

const iconStyle = {
  position: 'absolute',
  right: '15px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#aaa',
};

function Search({ searchTerm, setSearchTerm }) {
  return (
    <div style={searchContainerStyle}>
      <input
        style={inputStyle}
        type="text"
        placeholder="Pencarian..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <FaSearch style={iconStyle} />
    </div>
  );
}

export default Search;