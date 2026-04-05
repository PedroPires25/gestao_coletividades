import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon (Leaflet + bundlers issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function ClickHandler({ onClick }) {
    useMapEvents({ click: (e) => onClick(e.latlng) });
    return null;
}

function FlyTo({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat != null && lng != null) {
            map.flyTo([lat, lng], 16, { duration: 0.8 });
        }
    }, [lat, lng, map]);
    return null;
}

export default function MapPicker({ latitude, longitude, onLocationChange, readOnly = false }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    const center = latitude && longitude ? [latitude, longitude] : [39.5, -8.0];
    const zoom = latitude && longitude ? 15 : 7;

    // Close results dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchNominatim = useCallback(async (query) => {
        if (!query || query.length < 3) { setResults([]); return; }
        setSearching(true);
        try {
            const params = new URLSearchParams({
                q: query,
                format: "json",
                addressdetails: "1",
                limit: "5",
                countrycodes: "pt",
            });
            const res = await fetch(`${NOMINATIM_URL}?${params}`, {
                headers: { "Accept-Language": "pt" },
            });
            const data = await res.json();
            setResults(data);
            setShowResults(true);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchNominatim(val), 400);
    };

    const selectResult = (item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        onLocationChange(lat, lng, item.display_name);
        setSearchQuery(item.display_name);
        setShowResults(false);
    };

    const handleMapClick = (latlng) => {
        if (readOnly) return;
        onLocationChange(latlng.lat, latlng.lng, null);
    };

    return (
        <div style={{ marginTop: "0.5rem" }}>
            {!readOnly && (
                <div ref={wrapperRef} style={{ position: "relative", marginBottom: "0.75rem" }}>
                    <input
                        className="input"
                        placeholder="🔍 Pesquisar morada..."
                        value={searchQuery}
                        onChange={handleSearchInput}
                        onFocus={() => results.length > 0 && setShowResults(true)}
                    />
                    {searching && (
                        <span style={{
                            position: "absolute", right: 14, top: "50%",
                            transform: "translateY(-50%)", fontSize: "0.85em", opacity: 0.6,
                        }}>
                            A pesquisar...
                        </span>
                    )}
                    {showResults && results.length > 0 && (
                        <ul style={{
                            position: "absolute", top: "100%", left: 0, right: 0,
                            background: "var(--bg-card-strong, #1a1e2e)", border: "1px solid var(--border)",
                            borderRadius: 12, listStyle: "none", margin: 0, padding: "0.4rem 0",
                            zIndex: 1000, maxHeight: 220, overflowY: "auto",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        }}>
                            {results.map((item, i) => (
                                <li
                                    key={i}
                                    onClick={() => selectResult(item)}
                                    style={{
                                        padding: "0.6rem 1rem", cursor: "pointer",
                                        fontSize: "0.9em", borderBottom: "1px solid var(--border)",
                                        transition: "background 150ms",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-row-hover, rgba(255,255,255,0.1))"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    📍 {item.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
                <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: readOnly ? 220 : 300, width: "100%" }}
                    scrollWheelZoom={!readOnly}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {latitude && longitude && (
                        <Marker position={[latitude, longitude]} />
                    )}
                    {!readOnly && <ClickHandler onClick={handleMapClick} />}
                    <FlyTo lat={latitude} lng={longitude} />
                </MapContainer>
            </div>

            {latitude && longitude && (
                <p style={{ fontSize: "0.8em", opacity: 0.6, marginTop: "0.4rem" }}>
                    📌 {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
            )}
        </div>
    );
}
