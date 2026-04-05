import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const smallIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [18, 30],
    iconAnchor: [9, 30],
    shadowSize: [30, 30],
    shadowAnchor: [9, 30],
});

export default function MiniMap({ latitude, longitude, onClick }) {
    if (!latitude || !longitude) return null;

    return (
        <div
            onClick={onClick}
            title="Clica para abrir o mapa"
            style={{
                width: 120,
                height: 80,
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid var(--border)",
                cursor: "pointer",
                flexShrink: 0,
                position: "relative",
            }}
        >
            <MapContainer
                center={[latitude, longitude]}
                zoom={14}
                style={{ width: "100%", height: "100%" }}
                zoomControl={false}
                attributionControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                keyboard={false}
                boxZoom={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[latitude, longitude]} icon={smallIcon} />
            </MapContainer>
            {/* Overlay to capture clicks and prevent map interaction */}
            <div style={{
                position: "absolute", inset: 0, zIndex: 400,
                background: "transparent",
            }} />
        </div>
    );
}
