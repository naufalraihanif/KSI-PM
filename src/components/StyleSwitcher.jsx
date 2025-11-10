import React from 'react';

const styles = [
  { id: 'satellite-streets-v12', name: 'Satelit' },
  { id: 'streets-v12', name: 'Jalan' },
];

const switcherContainerStyle = {
  backgroundColor: '#4a5157',
  padding: '10px',
  borderRadius: '5px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const buttonStyle = {
  backgroundColor: '#333a40',
  color: 'white',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#555',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontSize: '14px'
};

const activeButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#007cbf',
  borderColor: '#007cbf'
};

function StyleSwitcher({ currentStyle, setMapStyle }) {
  return (
    <div style={switcherContainerStyle}>
      {styles.map(style => (
        <button
          key={style.id}
          // PERBAIKAN: Gunakan .endsWith() untuk pengecekan yang akurat
          style={currentStyle.endsWith(style.id) ? activeButtonStyle : buttonStyle}
          onClick={() => setMapStyle(`mapbox://styles/mapbox/${style.id}`)}
        >
          {style.name}
        </button>
      ))}
    </div>
  );
}

export default StyleSwitcher;