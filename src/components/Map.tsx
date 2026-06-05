'use client';

import React, { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  coordinates: [number, number]; // [lat, lng]
  title: string;
  address: string;
}

export default function Map({ coordinates, title, address }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    // Leaflet can only be imported on the client side
    const container = mapContainerRef.current;
    if (typeof window === 'undefined' || !container) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix icon issues in Next.js builds by loading assets from CDN
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      // Clean up previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create map centered on coordinate
      const map = L.map(container).setView(coordinates, 15);
      mapInstanceRef.current = map;

      // Load dark mode tile layer (OpenStreetMap CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Add a marker for the venue
      L.marker(coordinates)
        .addTo(map)
        .bindPopup(`
          <div style="color: black; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <strong style="font-size: 14px;">${title}</strong><br/>
            <span style="color: #666;">${address}</span>
          </div>
        `)
        .openPopup();
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, title, address]);

  return (
    <div className="relative w-full h-[250px] md:h-[350px] rounded-2xl overflow-hidden border border-white/10 shadow-lg">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
