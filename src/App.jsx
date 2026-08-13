import React, { useState, useEffect, useRef } from 'react';
import { Viewer, Entity, PointGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';
import { fetchSpecies, fetchPapers, fetchMicrobialSamples, searchLocation } from './services/spatialData';

function App() {
  const viewerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('Amazon Basin');
  const [currentLocation, setCurrentLocation] = useState({ lat: -3.46, lng: -62.21, name: 'Amazon Basin' });
  const [speciesList, setSpeciesList] = useState([]);
  const [papersList, setPapersList] = useState([]);
  const [microbesList, setMicrobesList] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [activeTab, setActiveTab] = useState('species'); // 'species' | 'papers' | 'microbes'

  // Load all environmental and research data
  const loadDataForLocation = async (lat, lng, locationName) => {
    const species = await fetchSpecies(lat, lng);
    const papers = await fetchPapers(locationName);
    const microbes = await fetchMicrobialSamples(lat, lng);
    
    setSpeciesList(species);
    setPapersList(papers);
    setMicrobesList(microbes);
  };

  useEffect(() => {
    loadDataForLocation(currentLocation.lat, currentLocation.lng, currentLocation.name);
  }, []);

  // Handle Location Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const result = await searchLocation(searchQuery);
    if (result) {
      setCurrentLocation({ lat: result.lat, lng: result.lng, name: searchQuery });
      
      if (viewerRef.current && viewerRef.current.cesiumElement) {
        const viewer = viewerRef.current.cesiumElement;
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(result.lng, result.lat, 1500000),
          duration: 2.5
        });
      }

      loadDataForLocation(result.lat, result.lng, searchQuery);
    } else {
      alert("Location not found. Please try another place name.");
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Top Floating Search Bar */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        padding: '10px 16px',
        borderRadius: '30px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location (e.g., Umea, Amazon, Baltic Sea)..."
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              padding: '6px 12px',
              outline: 'none',
              width: '280px',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            Explore
          </button>
        </form>
      </div>

      {/* 3D Cesium Globe Viewer */}
      <Viewer full ref={viewerRef}>
        {/* Green markers: Species */}
        {speciesList.map((item) => (
          <Entity
            key={`species-${item.id}`}
            position={Cartesian3.fromDegrees(item.lng, item.lat, 2000)}
            onClick={() => setSelectedEntity(item)}
          >
            <PointGraphics pixelSize={12} color={Color.GREENYELLOW} outlineColor={Color.BLACK} outlineWidth={2} />
          </Entity>
        ))}

        {/* Cyan markers: Metagenomics / Microbes */}
        {microbesList.map((item) => (
          <Entity
            key={`microbe-${item.id}`}
            position={Cartesian3.fromDegrees(item.lng, item.lat, 3000)}
            onClick={() => setSelectedEntity({ ...item, type: 'microbe' })}
          >
            <PointGraphics pixelSize={10} color={Color.CYAN} outlineColor={Color.DARKBLUE} outlineWidth={2} />
          </Entity>
        ))}
      </Viewer>

      {/* Right Drawer Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '360px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        color: '#fff',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', color: '#60a5fa' }}>📍 {currentLocation.name}</h2>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('species')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'species' ? '#2563eb' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            🌿 Species ({speciesList.length})
          </button>
          <button
            onClick={() => setActiveTab('microbes')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'microbes' ? '#06b6d4' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            🦠 Microbes ({microbesList.length})
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'papers' ? '#2563eb' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            📚 Papers ({papersList.length})
          </button>
        </div>

        {/* Tab 1: Species */}
        {activeTab === 'species' && (
          <div>
            {selectedEntity && selectedEntity.type === 'species' ? (
              <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
                <button
                  onClick={() => setSelectedEntity(null)}
                  style={{ float: 'right', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  ✕
                </button>
                <h4 style={{ color: '#4ade80', margin: '0 0 6px 0' }}>{selectedEntity.species}</h4>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Scientific:</strong> {selectedEntity.name}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Coordinates:</strong> {selectedEntity.lat?.toFixed(3)}, {selectedEntity.lng?.toFixed(3)}</p>
                {selectedEntity.media && (
                  <img src={selectedEntity.media} alt={selectedEntity.species} style={{ width: '100%', borderRadius: '8px', marginTop: '8px' }} />
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Click any green point on the globe to inspect species details.</p>
            )}
          </div>
        )}

        {/* Tab 2: Metagenomics & Microbes */}
        {activeTab === 'microbes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {microbesList.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>No metagenomics samples available in this immediate region.</p>
            ) : (
              microbesList.map((sample) => (
                <div key={sample.id} style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #06b6d4' }}>
                  <h4 style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#22d3ee' }}>🦠 {sample.sampleName}</h4>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0' }}><strong>Biome:</strong> {sample.biome}</p>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0' }}><strong>Material:</strong> {sample.material}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Papers */}
        {activeTab === 'papers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {papersList.map((paper) => (
              <div key={paper.id} style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#f8fafc' }}>{paper.title}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0' }}>Author: {paper.author}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0' }}>Year: {paper.year}</p>
                {paper.doi && (
                  <a
                    href={paper.doi}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}
                  >
                    View DOI Publication ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

export default App;