import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Approximation for Indian States centers for visualization
const STATE_COORDS = {
    'Maharashtra': { lat: 19.7515, lon: 75.7139 },
    'Delhi': { lat: 28.7041, lon: 77.1025 },
    'Karnataka': { lat: 15.3173, lon: 75.7139 },
    'Gujarat': { lat: 22.2587, lon: 71.1924 },
    'Telangana': { lat: 18.1124, lon: 79.0193 },
    'Tamil Nadu': { lat: 11.1271, lon: 78.6569 },
    'West Bengal': { lat: 22.9868, lon: 87.8550 },
    'Uttar Pradesh': { lat: 26.8467, lon: 80.9462 },
    'Rajasthan': { lat: 27.0238, lon: 74.2179 },
    'Madhya Pradesh': { lat: 22.9734, lon: 78.6569 },
    'Bihar': { lat: 25.0961, lon: 85.3131 },
    'Andhra Pradesh': { lat: 15.9129, lon: 79.7400 },
    'Odisha': { lat: 20.9517, lon: 85.0985 },
    'Kerala': { lat: 10.8505, lon: 76.2711 },
    'Assam': { lat: 26.2006, lon: 92.9376 },
    'Punjab': { lat: 31.1471, lon: 75.3412 },
    'Haryana': { lat: 29.0588, lon: 76.0856 },
    'Chhattisgarh': { lat: 21.2787, lon: 81.8661 },
    'Jharkhand': { lat: 23.6102, lon: 85.2799 },
    'Uttarakhand': { lat: 30.0668, lon: 79.0193 },
    'Himachal Pradesh': { lat: 31.1048, lon: 77.1734 },
    'Goa': { lat: 15.2993, lon: 74.1240 }
};

function lerpColor(t) {
    if (t < 0.5) {
        const tt = t * 2;
        return `rgb(${Math.round(216 - tt * 105)}, 236, ${Math.round(248 - tt * 248)})`; // Light Blue to Dark Blue
    }
    const tt = (t - 0.5) * 2;
    return `rgb(${Math.round(11 + tt * 0)}, ${Math.round(79 + tt * 30)}, ${Math.round(148 - tt * 48)})`;
}

const COUNTRY_PALETTE = ['#D8ECF8', '#D4EDDA', '#E8E8EA', '#CBE5F5', '#C8E6C9', '#DEDEDE'];

function mercatorXY(lon, lat, scale = 150, containerW = 800, containerH = 400) {
    const centerLon = 10, centerLat = 20;
    const x = (lon - centerLon) * (scale * Math.PI / 180) + containerW / 2;
    const latR = lat * Math.PI / 180;
    const cLatR = centerLat * Math.PI / 180;
    const y = -(Math.log(Math.tan(Math.PI / 4 + latR / 2)) -
        Math.log(Math.tan(Math.PI / 4 + cLatR / 2))) * scale + containerH / 2;
    return [x, y];
}

const PROXIMITY_PX = 30;

const SplittingCasesByRegionMap = ({ data }) => {
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [transform, setTransform] = useState(zoomIdentity);

    const wrapRef = useRef(null);
    const svgRef = useRef(null);

    const locationData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const map = new Map();
        data.forEach(item => {
            const state = item['State'] || item['Region'] || 'Unknown';
            map.set(state, (map.get(state) || 0) + 1);
        });

        return Array.from(map, ([state, cases]) => {
            let coords = STATE_COORDS[state];
            if (!coords) {
                const checkKey = Object.keys(STATE_COORDS).find(k => k.toLowerCase() === state.toLowerCase() || state.toLowerCase().includes(k.toLowerCase()));
                if (checkKey) coords = STATE_COORDS[checkKey];
            }
            return coords ? { state, cases, coordinates: [coords.lon, coords.lat] } : null;
        }).filter(Boolean);
    }, [data]);

    const maxCases = Math.max(...locationData.map(d => d.cases), 1);
    const minCases = Math.min(...locationData.map(d => d.cases), 0);

    useEffect(() => {
        if (!svgRef.current) return;
        const zoomBehavior = d3Zoom()
            .scaleExtent([1, 20])
            .translateExtent([[-300, -200], [1100, 700]])
            .on('zoom', (event) => setTransform(event.transform));

        const sel = select(svgRef.current);
        sel.call(zoomBehavior);
        sel.on('dblclick.zoom', () =>
            sel.transition().duration(500).call(zoomBehavior.transform, zoomIdentity)
        );
        return () => sel.on('.zoom', null);
    }, []);

    const handleMouseMove = (e) => {
        if (!wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const W = rect.width, H = rect.height;

        let best = null, bestDist = PROXIMITY_PX;
        locationData.forEach(loc => {
            const [bx, by] = mercatorXY(loc.coordinates[0], loc.coordinates[1], 150, W, H);
            const sx = transform.x + bx * transform.k;
            const sy = transform.y + by * transform.k;
            const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
            if (dist < bestDist) { bestDist = dist; best = { ...loc, sx, sy }; }
        });
        setTooltip(best);
    };

    const handleMouseLeave = () => {
        setTooltip(null);
        setHoveredCountry(null);
    };

    return (
        <div className="chart-card chart-animate equal-height-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Splitting Cases by Region</h3>
            </div>

            <div
                ref={wrapRef}
                style={{ width: '100%', height: 300, position: 'relative' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div ref={svgRef} style={{ width: '100%', height: '100%', cursor: 'grab', overflow: 'hidden' }}>
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 150, center: [10, 20] }}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                    >
                        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies
                                        .filter(g => g.id !== '010' && g.properties?.name !== 'Antarctica')
                                        .map((geo, i) => {
                                            const name = geo.properties.name || geo.properties.NAME || '';
                                            const isHov = hoveredCountry === name;
                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    onMouseEnter={() => setHoveredCountry(name)}
                                                    onMouseLeave={() => setHoveredCountry(null)}
                                                    fill={isHov ? '#0B4F94' : COUNTRY_PALETTE[i % COUNTRY_PALETTE.length]}
                                                    stroke="#FFF"
                                                    strokeWidth={0.5 / transform.k}
                                                    style={{
                                                        default: { outline: 'none' },
                                                        hover: { fill: '#0B4F94', outline: 'none' },
                                                        pressed: { outline: 'none' },
                                                    }}
                                                />
                                            );
                                        })
                                }
                            </Geographies>

                            {locationData.map((loc) => {
                                const t = maxCases === minCases ? 1 : (loc.cases - minCases) / (maxCases - minCases);
                                const isActive = tooltip?.state === loc.state;
                                const r = ((isActive ? 9 : 5) + t * 9) / transform.k;
                                return (
                                    <Marker key={loc.state} coordinates={loc.coordinates}>
                                        {isActive && (
                                            <circle
                                                r={(r + 5 / transform.k)}
                                                fill={lerpColor(t)}
                                                opacity={0.25}
                                                style={{ pointerEvents: 'none', transition: 'r 0.15s' }}
                                            />
                                        )}
                                        <circle
                                            r={r}
                                            fill={lerpColor(t)}
                                            stroke="white"
                                            strokeWidth={1.5 / transform.k}
                                            opacity={0.9}
                                            style={{ cursor: 'pointer', transition: 'r 0.15s ease, opacity 0.15s' }}
                                        />
                                    </Marker>
                                );
                            })}
                        </g>
                    </ComposableMap>
                </div>

                {tooltip && (
                    <div
                        style={{
                            position: 'absolute',
                            left: tooltip.sx,
                            top: tooltip.sy,
                            transform: 'translate(-50%, calc(-100% - 14px))',
                            background: 'white',
                            border: '1.5px solid #e0e0e0',
                            borderRadius: 10,
                            padding: '8px 14px',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            zIndex: 100,
                            transition: 'left 0.05s, top 0.05s',
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#333', marginBottom: 3 }}>
                            📍 {tooltip.state}
                        </div>
                        <div style={{ fontSize: 13, color: '#0B4F94', fontWeight: 600 }}>
                            {tooltip.cases} Cases
                        </div>
                        <div style={{
                            position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
                            width: 0, height: 0,
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderTop: '7px solid white',
                            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
                        }} />
                    </div>
                )}

                <div className="map-zoom-hint">Scroll to zoom &middot; Drag to pan &middot; Dbl-click to reset</div>
            </div>
        </div>
    );
};

export default SplittingCasesByRegionMap;
