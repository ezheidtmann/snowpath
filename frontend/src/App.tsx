import React from 'react';
import logo from './logo.svg';
import './App.css';
import Map from './Map';

function App() {
  return (
    <div className="App">
      <Map style={{
        position: 'absolute',
        top: '0',
        left: '0',
        height: '100%',
        width: '100%',
      }}
        initialLng={-122} initialLat={45} initialZoom={8}></Map>
    </div>
  );
}

export default App;
