/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { AntPath } from 'leaflet-ant-path';
import 'leaflet.heat';
import { Search, Plus, User, FileText, Thermometer, Moon, Trash2, Save, Map as MapIcon, Edit3, LogOut, X } from 'lucide-react';

// --- Types ---
interface Client {
  odp_port: string;
  name: string;
  status: 'ON' | 'OFF';
  signal: number;
  location: [number, number];
  pppoe: string;
  address: string;
  onuMac: string;
  whatsappNumber: string;
  olt: string;
  pon: string;
  isHidden: boolean;
  password?: string;
}

interface ODP {
  id: string;
  location: [number, number];
  clients: Client[];
  isLocked?: boolean;
}

interface DeletedItem {
  type: 'odp' | 'client' | 'path' | 'potential';
  data: any;
  parentOdpId?: string;
  deletedAt: string;
}

// --- Constants ---
const INITIAL_ODP_DATA: ODP[] = [
  {
    id: "04/02/03/01",
    location: [24.305546, 91.719060],
    clients: [
      { odp_port: "P:01", name: "Lina Daniyanti", status: "ON", signal: -22.5, location: [24.305624, 91.719100], pppoe: "sb00", address: "Sreemangal", onuMac: "HG85", whatsappNumber: "01700000001", olt: 'OLT-1', pon: 'PON-1', isHidden: false },
      { odp_port: "P:02", name: "Eti Handayani", status: "ON", signal: -18.4, location: [24.305601, 91.718863], pppoe: "sb715", address: "Menteng Wadas", onuMac: "EG14", whatsappNumber: "01700000002", olt: 'OLT-1', pon: 'PON-2', isHidden: false },
      { odp_port: "P:03", name: "Sri Hartati", status: "ON", signal: -25.8, location: [24.305608, 91.718731], pppoe: "sb54", address: "Pasar Rumput", onuMac: "ZNF6", whatsappNumber: "01700000003", olt: 'OLT-2', pon: 'PON-1', isHidden: false },
      { odp_port: "P:04", name: "Mohamad Marzudi", status: "OFF", signal: -28.1, location: [24.305624, 91.718628], pppoe: "sb70", address: "Menteng Atas", onuMac: "HG82", whatsappNumber: "01700000004", olt: 'OLT-2', pon: 'PON-2', isHidden: false },
      { odp_port: "P:05", name: "Tk Pertiwi", status: "ON", signal: -26.9, location: [24.305400, 91.719300], pppoe: "sb05", address: "Sreemangal", onuMac: "EG81", whatsappNumber: "01700000005", olt: 'OLT-3', pon: 'PON-3', isHidden: false },
      { odp_port: "P:06", name: "Istriarti", status: "OFF", signal: -29.0, location: [24.305200, 91.718900], pppoe: "sb06", address: "Menteng Wadas", onuMac: "ZNTF", whatsappNumber: "01700000006", olt: 'OLT-3', pon: 'PON-4', isHidden: false },
      { odp_port: "P:07", name: "Fany Pribadi", status: "ON", signal: -20.5, location: [24.305800, 91.718500], pppoe: "sb07", address: "Pasar Rumput", onuMac: "EG14", whatsappNumber: "01700000007", olt: 'OLT-4', pon: 'PON-5', isHidden: false },
      { odp_port: "P:08", name: "Dwi Supriyatin", status: "OFF", signal: -35.0, location: [24.305950, 91.719500], pppoe: "sb08", address: "Menteng Atas", onuMac: "ZNF6", whatsappNumber: "01700000008", olt: 'OLT-4', pon: 'PON-6', isHidden: true }
    ]
  }
];

const ODP_ICON = L.icon({
  iconUrl: 'https://img.icons8.com/?size=100&id=9935&format=png&color=000000',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const POTENTIAL_CLIENT_ICON = L.icon({
  iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%233498db" stroke="white" stroke-width="1.5"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cpath d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" fill="none"/%3E%3Cline x1="12" y1="17" x2="12.01" y2="17" stroke="white" stroke-linecap="round"/%3E%3C/svg%3E',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export default function App() {
  // --- State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [allOdpData, setAllOdpData] = useState<ODP[]>(INITIAL_ODP_DATA);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashSearch, setTrashSearch] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showPotentialModal, setShowPotentialModal] = useState(false);
  const [showPathPanel, setShowPathPanel] = useState(false);
  
  const [showBaseLayers, setShowBaseLayers] = useState(false);
  const [showMorePathSettings, setShowMorePathSettings] = useState(false);
  const [showOdpModal, setShowOdpModal] = useState(false);
  const [odpModalMode, setOdpModalMode] = useState<'add' | 'edit'>('add');
  const [odpModalIdInput, setOdpModalIdInput] = useState('');
  const [odpModalTargetCoords, setOdpModalTargetCoords] = useState<L.LatLng | null>(null);
  const [odpModalOriginalId, setOdpModalOriginalId] = useState('');
  
  // Custom confirm modal state for handles/iframe environment stability
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Form States
  const [clientForm, setClientForm] = useState({
    odpId: '',
    pppoe: '',
    name: '',
    location: '',
    olt: 'OLT-1',
    pon: 'PON-1',
    number: '',
    mac: '',
    address: '',
    password: '',
    isEdit: false,
    originalPppoe: ''
  });
  
  const [pathForm, setPathForm] = useState({
    title: 'Untitled path',
    description: '',
    cableType: '',
    totalCores: 12,
    usedCores: 0,
    width: 4,
    color: '#ff00ff',
    view: { lat: 0, lng: 0, zoom: 0 }
  });

  const [potentialForm, setPotentialForm] = useState({
    latlng: '',
    name: '',
    phone: '',
    notes: ''
  });

  // --- Refs ---
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const potentialClientsLayerRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const heatLayerRef = useRef<any>(null);
  const clientLayersRef = useRef<{ [key: string]: { marker: L.Marker, line: L.Layer } }>({});
  const odpMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const drawControlRef = useRef<any>(null);
  const currentlyEditingLayerRef = useRef<L.Polyline | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const placingPotentialClientRef = useRef(false);
  const placingOdpRef = useRef(false);
  const ghostOdpMarkerRef = useRef<L.Marker | null>(null);

  const actionsRef = useRef({
    openClientForm: (odpId: string, pppoe: string = '') => {},
    deleteClient: (odpId: string, pppoe: string) => {},
    toggleClientVisibility: (odpId: string, pppoe: string) => {},
    editOdpId: (odpId: string) => {},
    deleteOdp: (odpId: string) => {}
  });

  // --- Effects ---
  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && mapContainerRef.current && !mapRef.current) {
      initMap();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (mapRef.current) {
      updateHealthDashboard();
      updateHeatmap();
    }
  }, [allOdpData]);

  // --- Map Initialization ---
  const initMap = () => {
    const map = L.map(mapContainerRef.current!, { }).setView([24.305546, 91.719060], 18);
    mapRef.current = map;
    map.zoomControl.setPosition('topright');

    const disableActiveOdpDraw = () => {
      placingOdpRef.current = false;
      document.body.classList.remove('crosshair-cursor');
      if (ghostOdpMarkerRef.current) {
        map.removeLayer(ghostOdpMarkerRef.current);
        ghostOdpMarkerRef.current = null;
      }
      // @ts-ignore
      if (map._activeOdpDraw) {
        try {
          // @ts-ignore
          map._activeOdpDraw.disable();
        } catch (err) {
          // Ignore
        }
        // @ts-ignore
        delete map._activeOdpDraw;
      }
    };

    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 });
    const streetsDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
    
    if (isDarkMode) {
      streetsDark.addTo(map);
    } else {
      streets.addTo(map);
    }

    map.addLayer(drawnItemsRef.current);
    map.addLayer(potentialClientsLayerRef.current);

    // Heat layer
    // @ts-ignore
    heatLayerRef.current = L.heatLayer([], { radius: 25 });

    // Draw Control
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItemsRef.current, edit: false, remove: false },
      draw: {
        polygon: false,
        circlemarker: false,
        rectangle: false,
        circle: false,
        polyline: { shapeOptions: { color: '#ff00ff', weight: 4 } },
        marker: { icon: ODP_ICON }
      }
    });
    drawControlRef.current = drawControl;

    map.on('draw:created', (event: any) => {
      const layer = event.layer;
      const type = event.layerType;
      if (type === 'polyline') {
        drawnItemsRef.current.addLayer(layer);
        layer.options.title = 'Untitled path';
        layer.options.description = '';
        layer.options.view = {};
        openPathPanel(layer);
      } else if (type === 'marker') {
        const latlng = layer.getLatLng();
        setOdpModalMode('add');
        setOdpModalIdInput(`ODP-${allOdpData.length + 1}`);
        setOdpModalTargetCoords(latlng);
        setShowOdpModal(true);
        map.removeLayer(layer);
        disableActiveOdpDraw();
      }
    });

    drawnItemsRef.current.on('click', (e: any) => {
      if (e.layer instanceof L.Polyline) {
        openPathPanel(e.layer);
      }
    });

    // Context Menu
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();

      if (placingOdpRef.current) {
        disableActiveOdpDraw();
        return;
      }

      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      const coordsText = `${lat}, ${lng}`;
      
      const menu = document.getElementById('context-menu');
      if (menu) {
        menu.style.display = 'block';
        menu.style.left = `${e.containerPoint.x}px`;
        menu.style.top = `${e.containerPoint.y}px`;
        menu.innerHTML = `
          <div class="context-menu-item" id="context-address">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E">
            <span id="address-text">Loading address...</span>
          </div>
          <div class="context-menu-separator"></div>
          <div class="context-menu-item" id="context-measure">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2 8.2a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0L15.3 21.3'%3E%3C/path%3E%3C/svg%3E">
            <span>Measure distance</span>
          </div>
          <div class="context-menu-item" id="context-coords" title="Click to copy">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E">
            <span>${coordsText}</span>
          </div>
        `;
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            const addrSpan = document.getElementById('address-text');
            if (addrSpan) addrSpan.textContent = data.display_name ? `Near ${data.display_name.split(',')[0]}` : 'Address not found';
          })
          .catch(() => {
            const addrSpan = document.getElementById('address-text');
            if (addrSpan) addrSpan.textContent = 'Could not fetch address';
          });

        const measureBtn = document.getElementById('context-measure');
        if (measureBtn) {
          measureBtn.onclick = () => {
            // @ts-ignore
            new L.Draw.Polyline(map, drawControlRef.current.options.draw.polyline).enable();
            menu.style.display = 'none';
          };
        }
        
        const coordsBtn = document.getElementById('context-coords');
        if (coordsBtn) {
          coordsBtn.onclick = () => {
            navigator.clipboard.writeText(coordsText).then(() => {
              alert('Coordinates copied to clipboard!');
              menu.style.display = 'none';
            });
          };
        }
      }
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const menu = document.getElementById('context-menu');
      if (menu) menu.style.display = 'none';

      if (placingOdpRef.current) {
        const latlng = e.latlng;
        setOdpModalMode('add');
        setOdpModalIdInput(`ODP-${allOdpData.length + 1}`);
        setOdpModalTargetCoords(latlng);
        setShowOdpModal(true);
        disableActiveOdpDraw();
        return;
      }

      if (placingPotentialClientRef.current) {
        placingPotentialClientRef.current = false;
        document.body.classList.remove('crosshair-cursor');
        const latlng = e.latlng;
        const marker = L.marker(latlng, { icon: POTENTIAL_CLIENT_ICON }).addTo(potentialClientsLayerRef.current);
        tempMarkerRef.current = marker;
        setPotentialForm({
          latlng: `${latlng.lat},${latlng.lng}`,
          name: '',
          phone: '',
          notes: ''
        });
        setShowPotentialModal(true);
      }
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (placingOdpRef.current) {
        if (!ghostOdpMarkerRef.current) {
          ghostOdpMarkerRef.current = L.marker(e.latlng, {
            icon: ODP_ICON,
            opacity: 0.7,
            interactive: false
          }).addTo(map);
        } else {
          ghostOdpMarkerRef.current.setLatLng(e.latlng);
        }
      } else {
        if (ghostOdpMarkerRef.current) {
          map.removeLayer(ghostOdpMarkerRef.current);
          ghostOdpMarkerRef.current = null;
        }
      }
    });

    map.on('mouseout', () => {
      if (ghostOdpMarkerRef.current) {
        map.removeLayer(ghostOdpMarkerRef.current);
        ghostOdpMarkerRef.current = null;
      }
    });

    // Initial Render
    allOdpData.forEach(odp => renderOdpAndClients(odp, map));
    loadFromLocalStorage(map);
  };

  // --- Render Functions ---
  const renderSingleClient = (client: Client, odpData: ODP, map: L.Map) => {
    if (clientLayersRef.current[client.pppoe]) {
      map.removeLayer(clientLayersRef.current[client.pppoe].line);
      map.removeLayer(clientLayersRef.current[client.pppoe].marker);
    }

    const greenClientIcon = L.icon({
      iconUrl: 'https://img.icons8.com/?size=100&id=85509&format=png&color=00ff0c',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
      popupAnchor: [0, -20]
    });
    const redClientIcon = L.icon({
      iconUrl: 'https://img.icons8.com/?size=100&id=85509&format=png&color=e74c3c',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
      popupAnchor: [0, -20]
    });

    const lineCoordinates: [L.LatLngExpression, L.LatLngExpression] = [odpData.location, client.location];
    let selectedIcon, lineLayer;

    if (client.status === 'ON') {
      // @ts-ignore
      lineLayer = new AntPath(lineCoordinates, { delay: 2500, dashArray: [8, 15], weight: 2, color: "transparent", pulseColor: "#00ff0c" }).addTo(map);
      selectedIcon = greenClientIcon;
    } else {
      lineLayer = L.polyline(lineCoordinates, { color: 'red', weight: 2, dashArray: '5, 10', className: 'blinking-line' }).addTo(map);
      selectedIcon = redClientIcon;
    }

    const clientMarker = L.marker(client.location, { icon: selectedIcon, draggable: true }).addTo(map);
    const statusText = client.status === 'ON' ? 'ONLINE' : 'OFFLINE';
    const statusClass = client.status === 'ON' ? 'status-online' : 'status-offline';
    
    let onuRxHtml;
    if (client.status === 'ON') {
      const signal = client.signal;
      let signalClass = '', signalMeaning = '', signalIcon = '';
      if (signal >= -24) { signalClass = 'signal-good'; signalMeaning = 'ভালো সিগনাল'; signalIcon = '✅'; }
      else if (signal >= -27) { signalClass = 'signal-warning'; signalMeaning = 'সতর্কতা'; signalIcon = '⚠️'; }
      else { signalClass = 'signal-bad'; signalMeaning = 'খারাপ/বিচ্ছিন্ন'; signalIcon = '❌'; }
      onuRxHtml = `<span class="${signalClass}">${signal} dBm ${signalIcon}</span>`;
    } else {
      onuRxHtml = `<span class="blinking-los font-bold">Los</span>`;
    }

    const passwordValue = client.password ? client.password : 'N/A';

    const clientPopupContent = `
      <div class="popup-container">
        <div class="popup-info-grid">
          <div class="label">TJ:</div><div class="value">${odpData.id} - ${client.odp_port}</div>
          <div class="label">Name:</div><div class="value">${client.name}</div>
          <div class="label">Number:</div><div class="value">${client.whatsappNumber}</div>
          <div class="label">Address:</div><div class="value">${client.address}</div>
          <div class="label">PPPoE:</div><div class="value">${client.pppoe}</div>
          <div class="label">Password:</div><div class="value">${passwordValue}</div>
          <div class="label">Onu Mac:</div><div class="value">${client.onuMac}</div>
          <div class="label">Onu RX:</div><div class="value">${onuRxHtml}</div>
          <div class="label">Olt:</div><div class="value">${client.olt || 'N/A'}</div>
          <div class="label">Pon:</div><div class="value">${client.pon || 'N/A'}</div>
          <div class="label">Status:</div>
          <div class="value ${statusClass}" style="display: flex; align-items: center; gap: 8px;">
            <span>${statusText}</span>
            <button class="check-btn" onclick="window.open('https://sreemangal.sscuit.com/user_module/login.php', '_blank')">CHECK</button>
          </div>
        </div>
      </div>
      <div class="popup-footer">
        <a href="https://wa.me/${client.whatsappNumber}" target="_blank" title="WhatsApp"><img src="https://img.icons8.com/color/48/whatsapp--v1.png" alt="WhatsApp"/></a>
        <button class="open-ticket-btn" data-pppoe="${client.pppoe}" title="Create Trouble Ticket"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23e74c3c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/%3E%3Cline x1='12' y1='9' x2='12' y2='13'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E" alt="Create Ticket"/></button>
        <button class="view-history-btn" data-pppoe="${client.pppoe}" title="View Downtime History"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%233498db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 4v6h6'/%3E%3Cpath d='M3.51 15a9 9 0 1 0 2.13-9.36L1 10'/%3E%3C/svg%3E" alt="History"/></button>
      </div>
    `;
    clientMarker.bindPopup(clientPopupContent, { className: 'custom-detailed-popup', minWidth: 320 });
    
    clientMarker.on('popupopen', () => {
      const ticketBtn = document.querySelector(`.open-ticket-btn[data-pppoe="${client.pppoe}"]`) as HTMLButtonElement;
      if (ticketBtn) {
        L.DomEvent.disableClickPropagation(ticketBtn);
        ticketBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowTicketModal(true);
        };
      }
      
      const historyBtn = document.querySelector(`.view-history-btn[data-pppoe="${client.pppoe}"]`) as HTMLButtonElement;
      if (historyBtn) {
        L.DomEvent.disableClickPropagation(historyBtn);
        historyBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowHistoryModal(true);
        };
      }
    });

    clientMarker.on('dragend', (event: any) => {
      const pos = event.target.getLatLng();
      const newLoc: [number, number] = [pos.lat, pos.lng];
      
      // Keep state in sync
      client.location = newLoc;
      setAllOdpData(prev => {
        return prev.map(odp => {
          if (odp.id === odpData.id) {
            return {
              ...odp,
              clients: odp.clients.map(c => {
                if (c.pppoe === client.pppoe) {
                  return { ...c, location: newLoc };
                }
                return c;
              })
            };
          }
          return odp;
        });
      });

      if (lineLayer) {
        lineLayer.setLatLngs([odpData.location, newLoc]);
      }
    });

    clientMarker.bindTooltip(client.pppoe, { permanent: true, direction: 'top', className: 'client-label-tooltip', offset: [0, -20] });
    clientLayersRef.current[client.pppoe] = { marker: clientMarker, line: lineLayer };
  };

  const renderOdpAndClients = (odpData: ODP, map: L.Map) => {
    if (odpMarkersRef.current[odpData.id]) {
      map.removeLayer(odpMarkersRef.current[odpData.id]);
    }

    const odpMarker = L.marker(odpData.location, { icon: ODP_ICON, draggable: !odpData.isLocked }).addTo(map);
    odpMarkersRef.current[odpData.id] = odpMarker;
    
    const updatePopup = () => {
      const content = generateOdpPopupContent(odpData);
      odpMarker.bindPopup(content, { className: 'custom-odp-popup', minWidth: 300 });
    };
    
    updatePopup();

    odpMarker.on('dragend', (event: any) => {
      const pos = event.target.getLatLng();
      const newLoc: [number, number] = [pos.lat, pos.lng];

      // Update state
      odpData.location = newLoc;
      setAllOdpData(prev => {
        return prev.map(odp => {
          if (odp.id === odpData.id) {
            return { ...odp, location: newLoc };
          }
          return odp;
        });
      });

      // Update client connectors dynamically
      odpData.clients.forEach(c => {
        if (!c.isHidden) {
          const cLayers = clientLayersRef.current[c.pppoe];
          if (cLayers && cLayers.line) {
            cLayers.line.setLatLngs([newLoc, c.location]);
          }
        }
      });
    });

    odpMarker.on('popupopen', (event: any) => {
      const popupNode = event.popup.getElement();
      if (!popupNode) return;

      const addBtn = popupNode.querySelector('.add-client-btn') as HTMLButtonElement;
      if (addBtn) {
        L.DomEvent.disableClickPropagation(addBtn);
        addBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          actionsRef.current.openClientForm(odpData.id);
        };
      }
      
      popupNode.querySelectorAll('.delete-client-btn').forEach((btn: any) => {
        L.DomEvent.disableClickPropagation(btn);
        btn.onclick = (e: any) => {
          e.preventDefault();
          e.stopPropagation();
          actionsRef.current.deleteClient(btn.dataset.odpId || odpData.id, btn.dataset.clientPppoe);
        };
      });
      
      popupNode.querySelectorAll('.edit-client-btn').forEach((btn: any) => {
        L.DomEvent.disableClickPropagation(btn);
        btn.onclick = (e: any) => {
          e.preventDefault();
          e.stopPropagation();
          actionsRef.current.openClientForm(btn.dataset.odpId || odpData.id, btn.dataset.clientPppoe);
        };
      });
      
      popupNode.querySelectorAll('.hide-client-btn').forEach((btn: any) => {
        L.DomEvent.disableClickPropagation(btn);
        btn.onclick = (e: any) => {
          e.preventDefault();
          e.stopPropagation();
          actionsRef.current.toggleClientVisibility(btn.dataset.odpId || odpData.id, btn.dataset.clientPppoe);
        };
      });
      
      const editOdpBtn = popupNode.querySelector('.edit-odp-btn') as HTMLButtonElement;
      if (editOdpBtn) {
        L.DomEvent.disableClickPropagation(editOdpBtn);
        editOdpBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          actionsRef.current.editOdpId(odpData.id);
        };
      }
      
      const deleteOdpBtn = popupNode.querySelector('.delete-odp-btn') as HTMLButtonElement;
      if (deleteOdpBtn) {
        L.DomEvent.disableClickPropagation(deleteOdpBtn);
        deleteOdpBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          actionsRef.current.deleteOdp(odpData.id);
        };
      }

      const toggleLockBtn = popupNode.querySelector('.toggle-lock-btn') as HTMLButtonElement;
      if (toggleLockBtn) {
        L.DomEvent.disableClickPropagation(toggleLockBtn);
        toggleLockBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          setAllOdpData(prev => {
            return prev.map(o => {
              if (o.id === odpData.id) {
                const newLocked = !o.isLocked;
                
                if (newLocked) {
                  odpMarker.dragging?.disable();
                } else {
                  odpMarker.dragging?.enable();
                }
                
                // Set lock status directly on object for fast local update before rendering
                o.isLocked = newLocked;
                
                // Update leaflet content and refresh
                setTimeout(() => {
                  const content = generateOdpPopupContent(o);
                  odpMarker.setPopupContent(content);
                  
                  // This is already inside popupopen, so we just run a minor toggle
                  odpMarker.closePopup();
                  odpMarker.openPopup();
                }, 10);

                return { ...o, isLocked: newLocked };
              }
              return o;
            });
          });
        };
      }
    });

    odpData.clients.forEach(client => {
      if (!client.isHidden) {
        renderSingleClient(client, odpData, map);
      }
    });
  };

  const generateOdpPopupContent = (data: ODP) => {
    let clientListHtml = '';
    const visibleClientsCount = data.clients.filter(c => !c.isHidden).length;
    data.clients.forEach(client => {
      const statusClass = client.status === 'ON' ? 'status-on' : 'status-off';
      const hiddenClass = client.isHidden ? 'hidden-client' : '';
      const hideTitle = client.isHidden ? 'Show Client' : 'Hide Client';
      
      const editIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      `;

      const deleteIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      `;

      const hideIconSvg = client.isHidden ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
      ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      `;

      clientListHtml += `
        <div class="odp-client-item ${hiddenClass}">
          <span class="status-dot ${statusClass}"></span>
          <span class="client-port">${client.odp_port}</span>
          <span class="client-name">${client.pppoe}</span>
          <div class="client-actions">
            <button class="client-action-btn edit-client-btn" title="Edit Client" data-odp-id="${data.id}" data-client-pppoe="${client.pppoe}">${editIconSvg}</button>
            <button class="client-action-btn hide-client-btn" title="${hideTitle}" data-odp-id="${data.id}" data-client-pppoe="${client.pppoe}">${hideIconSvg}</button>
            <button class="client-action-btn delete-client-btn" title="Delete Client" data-odp-id="${data.id}" data-client-pppoe="${client.pppoe}">${deleteIconSvg}</button>
          </div>
        </div>`;
    });

    const lockTitle = data.isLocked ? 'Unlock TJ' : 'Lock TJ';
    const lockIconSvg = data.isLocked ? `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    ` : `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
    `;

    const editHeaderIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
    `;

    const deleteHeaderIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    `;

    return `
      <div class="odp-popup-container">
        <div class="odp-header-line" style="display: flex; align-items: center; width: 100%;">
          <span class="status-dot status-odp" style="margin-right: 4px;"></span>
          <span style="font-weight: 600;">TJ:</span>&nbsp;<span class="odp-id">${data.id}</span>
          <div style="margin-left: auto; display: flex; gap: 4px; align-items: center;">
            <button class="toggle-lock-btn" data-odp-id="${data.id}" title="${lockTitle}">${lockIconSvg}</button>
            <button class="edit-odp-btn" data-odp-id="${data.id}" title="Edit TJ ID">${editHeaderIconSvg}</button>
            <button class="delete-odp-btn" data-odp-id="${data.id}" title="Delete TJ">${deleteHeaderIconSvg}</button>
            <span class="client-count">(${visibleClientsCount} Clients)</span>
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 4px 0;">
        ${clientListHtml}
        <button class="add-client-btn" data-odp-id="${data.id}">+ Add Client</button>
      </div>`;
  };

  // --- Logic Functions ---
  const generateCSVReport = (statusFilter: 'ON' | 'OFF' | 'ALL') => {
    let clientsToReport: any[] = [];
    allOdpData.forEach(odp => {
      odp.clients.forEach(client => {
        if (!client.isHidden && (statusFilter === 'ALL' || client.status === statusFilter)) {
          clientsToReport.push({ 
            name: client.name, 
            pppoe: client.pppoe, 
            address: client.address, 
            phone: client.whatsappNumber, 
            status: client.status, 
            signal: client.status === 'ON' ? client.signal : 'N/A', 
            odpId: odp.id, 
            odpPort: client.odp_port, 
            olt: client.olt, 
            pon: client.pon, 
            mac: client.onuMac 
          });
        }
      });
    });
    
    if (clientsToReport.length === 0) {
      alert('No clients found for this report.');
      return;
    }
    
    const headers = ['Name', 'PPPoE', 'Address', 'Phone', 'Status', 'Signal (dBm)', 'ODP ID', 'ODP Port', 'OLT', 'PON', 'MAC Address'];
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n';
    
    clientsToReport.forEach(client => {
      const row = [
        `"${client.name}"`, 
        `"${client.pppoe}"`, 
        `"${client.address}"`, 
        `"${client.phone}"`, 
        `"${client.status}"`, 
        `"${client.signal}"`, 
        `"${client.odpId}"`, 
        `"${client.odpPort}"`, 
        `"${client.olt}"`, 
        `"${client.pon}"`, 
        `"${client.mac}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${statusFilter.toLowerCase()}_clients_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowReportModal(false);
  };

  const handleLogin = () => {
    if (!loginEmail.includes('@')) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    localStorage.setItem('loggedInUser', loginEmail);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setIsLoggedIn(false);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };

  const updateHealthDashboard = () => {
    let count = 0;
    allOdpData.forEach(odp => {
      odp.clients.forEach(c => { if (!c.isHidden) count++; });
    });
    setTotalClients(count);
  };

  const updateHeatmap = () => {
    if (!heatLayerRef.current) return;
    const heatPoints: any[] = [];
    allOdpData.forEach(odp => {
      odp.clients.forEach(client => {
        if (client.status === 'ON' && !client.isHidden) {
          const intensity = Math.max(0, Math.min(1, 1 - ((-client.signal - 18) / 12)));
          heatPoints.push([...client.location, intensity]);
        }
      });
    });
    heatLayerRef.current.setLatLngs(heatPoints);
  };

  const performSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    
    let foundClient: Client | null = null;
    let foundOdp: ODP | null = null;
    
    for (const odp of allOdpData) {
      for (const client of odp.clients) {
        if (client.name.toLowerCase().includes(term) || client.pppoe.toLowerCase().includes(term)) {
          foundClient = client;
          foundOdp = odp;
          break;
        }
      }
      if (foundClient) break;
    }

    if (foundClient && foundOdp && mapRef.current) {
      if (foundClient.isHidden) {
        const targetOdp = foundOdp;
        const targetClient = foundClient;
        setConfirmModal({
          isOpen: true,
          title: 'Hidden Client',
          message: 'This client is hidden. Do you want to show it?',
          onConfirm: () => {
            toggleClientVisibility(targetOdp.id, targetClient.pppoe);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setTimeout(() => {
              const layer = clientLayersRef.current[targetClient.pppoe];
              if (layer && mapRef.current) {
                mapRef.current.flyTo(layer.marker.getLatLng(), 19);
                setTimeout(() => { layer.marker.openPopup(); }, 1000);
              }
            }, 300);
          }
        });
        return;
      }
      const layer = clientLayersRef.current[foundClient.pppoe];
      if (layer) {
        mapRef.current.flyTo(layer.marker.getLatLng(), 19);
        setTimeout(() => { layer.marker.openPopup(); }, 1000);
      }
    } else {
      // Create a nice transient visual message instead of blocking alert
      const alertDiv = document.createElement('div');
      alertDiv.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#ef4444; color:white; padding:12px 24px; border-radius:8px; z-index:10000; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.3s;';
      alertDiv.innerText = 'Client not found!';
      document.body.appendChild(alertDiv);
      setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => { alertDiv.remove(); }, 300);
      }, 2000);
    }
  };

  const toggleClientVisibility = (odpId: string, pppoe: string) => {
    setAllOdpData(prev => {
      const updated = [...prev];
      const odp = updated.find(o => o.id === odpId);
      if (odp) {
        const client = odp.clients.find(c => c.pppoe === pppoe);
        if (client) {
          client.isHidden = !client.isHidden;
          if (client.isHidden) {
            if (clientLayersRef.current[pppoe]) {
              mapRef.current?.removeLayer(clientLayersRef.current[pppoe].marker);
              mapRef.current?.removeLayer(clientLayersRef.current[pppoe].line);
              delete clientLayersRef.current[pppoe];
            }
          } else {
            if (mapRef.current) renderSingleClient(client, odp, mapRef.current);
          }
          // Update ODP popup
          const marker = odpMarkersRef.current[odpId];
          if (marker) {
            marker.setPopupContent(generateOdpPopupContent(odp));
            if (marker.isPopupOpen()) {
              marker.closePopup();
              marker.openPopup();
            }
          }
        }
      }
      return updated;
    });
  };

  const editOdpId = (odpId: string) => {
    setOdpModalMode('edit');
    setOdpModalIdInput(odpId);
    setOdpModalOriginalId(odpId);
    setShowOdpModal(true);
  };

  const deleteOdp = (odpId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete ODP',
      message: `Are you sure you want to delete ODP ${odpId} and all its clients?`,
      onConfirm: () => {
        const odp = allOdpData.find(o => o.id === odpId);
        if (!odp) return;

        setDeletedItems(prev => [...prev, {
          type: 'odp',
          data: JSON.parse(JSON.stringify(odp)),
          deletedAt: new Date().toISOString()
        }]);

        setAllOdpData(prev => prev.filter(o => o.id !== odpId));
        
        // Cleanup layers
        odp.clients.forEach(c => {
          if (clientLayersRef.current[c.pppoe]) {
            mapRef.current?.removeLayer(clientLayersRef.current[c.pppoe].marker);
            mapRef.current?.removeLayer(clientLayersRef.current[c.pppoe].line);
            delete clientLayersRef.current[c.pppoe];
          }
        });
        
        if (odpMarkersRef.current[odpId]) {
          mapRef.current?.removeLayer(odpMarkersRef.current[odpId]);
          delete odpMarkersRef.current[odpId];
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteClient = (odpId: string, pppoe: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Client',
      message: `Are you sure you want to delete client ${pppoe}?`,
      onConfirm: () => {
        const odp = allOdpData.find(o => o.id === odpId);
        if (!odp) return;
        
        const client = odp.clients.find(c => c.pppoe === pppoe);
        if (!client) return;

        setDeletedItems(prev => [...prev, {
          type: 'client',
          data: JSON.parse(JSON.stringify(client)),
          parentOdpId: odpId,
          deletedAt: new Date().toISOString()
        }]);

        setAllOdpData(prev => {
          const updated = [...prev];
          const targetOdp = updated.find(o => o.id === odpId);
          if (targetOdp) {
            targetOdp.clients = targetOdp.clients.filter(c => c.pppoe !== pppoe);
            const marker = odpMarkersRef.current[odpId];
            if (marker) {
              marker.setPopupContent(generateOdpPopupContent(targetOdp));
              if (marker.isPopupOpen()) {
                marker.closePopup();
                marker.openPopup();
              }
            }
          }
          return updated;
        });

        if (clientLayersRef.current[pppoe]) {
          mapRef.current?.removeLayer(clientLayersRef.current[pppoe].marker);
          mapRef.current?.removeLayer(clientLayersRef.current[pppoe].line);
          delete clientLayersRef.current[pppoe];
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const openClientForm = (odpId: string, pppoe: string = '') => {
    if (pppoe) {
      const odp = allOdpData.find(o => o.id === odpId);
      const client = odp?.clients.find(c => c.pppoe === pppoe);
      if (client) {
        setClientForm({
          odpId,
          pppoe: client.pppoe,
          name: client.name,
          location: client.location.join(', '),
          olt: client.olt || 'OLT-1',
          pon: client.pon || 'PON-1',
          number: client.whatsappNumber,
          mac: client.onuMac,
          address: client.address,
          password: client.password || '',
          isEdit: true,
          originalPppoe: pppoe
        });
      }
    } else {
      setClientForm({
        odpId,
        pppoe: '',
        name: '',
        location: '',
        olt: 'OLT-1',
        pon: 'PON-1',
        number: '',
        mac: '',
        address: '',
        password: '',
        isEdit: false,
        originalPppoe: ''
      });
    }
    setShowClientModal(true);
  };

  useEffect(() => {
    actionsRef.current = {
      openClientForm,
      deleteClient,
      toggleClientVisibility,
      editOdpId,
      deleteOdp
    };
  }, [openClientForm, deleteClient, toggleClientVisibility, editOdpId, deleteOdp]);

  const handleOdpModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = odpModalIdInput.trim();
    if (!cleanId) return;

    if (odpModalMode === 'add') {
      if (allOdpData.some(o => o.id === cleanId)) {
        alert("This ODP ID already exists.");
        return;
      }
      if (odpModalTargetCoords && mapRef.current) {
        const newOdpData: ODP = { id: cleanId, location: [odpModalTargetCoords.lat, odpModalTargetCoords.lng], clients: [] };
        setAllOdpData(prev => {
          const updated = [...prev, newOdpData];
          renderOdpAndClients(newOdpData, mapRef.current!);
          return updated;
        });
      }
    } else {
      // Edit mode
      if (cleanId !== odpModalOriginalId) {
        if (allOdpData.some(o => o.id === cleanId)) {
          alert("ODP ID already exists.");
          return;
        }
        setAllOdpData(prev => {
          const updated = [...prev];
          const odp = updated.find(o => o.id === odpModalOriginalId);
          if (odp) {
            odp.id = cleanId;
            const marker = odpMarkersRef.current[odpModalOriginalId];
            if (marker) {
              delete odpMarkersRef.current[odpModalOriginalId];
              odpMarkersRef.current[cleanId] = marker;
              marker.setPopupContent(generateOdpPopupContent(odp));
              if (marker.isPopupOpen()) {
                marker.closePopup();
                marker.openPopup();
              }
            }
          }
          return updated;
        });
      }
    }
    setShowOdpModal(false);
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const locArr = clientForm.location.split(',').map(c => parseFloat(c.trim()));
    if (locArr.length !== 2 || isNaN(locArr[0]) || isNaN(locArr[1])) {
      alert("Invalid location format. Use 'lat, lng'.");
      return;
    }

    let pppoeAlreadyExists = false;

    setAllOdpData(prev => {
      const updated = [...prev];
      const odp = updated.find(o => o.id === clientForm.odpId);
      if (odp) {
        if (clientForm.isEdit) {
          const client = odp.clients.find(c => c.pppoe === clientForm.originalPppoe);
          if (client) {
            if (clientForm.originalPppoe !== clientForm.pppoe) {
              const exists = odp.clients.some(c => c.pppoe === clientForm.pppoe);
              if (exists) {
                pppoeAlreadyExists = true;
                return prev;
              }
              if (mapRef.current) {
                const oldLayer = clientLayersRef.current[clientForm.originalPppoe];
                if (oldLayer) {
                  mapRef.current.removeLayer(oldLayer.marker);
                  mapRef.current.removeLayer(oldLayer.line);
                  delete clientLayersRef.current[clientForm.originalPppoe];
                }
              }
              client.pppoe = clientForm.pppoe;
            }
            client.name = clientForm.name;
            client.location = [locArr[0], locArr[1]];
            client.olt = clientForm.olt;
            client.pon = clientForm.pon;
            client.whatsappNumber = clientForm.number;
            client.onuMac = clientForm.mac;
            client.address = clientForm.address;
            client.password = clientForm.password;
            if (mapRef.current) renderSingleClient(client, odp, mapRef.current);
          }
        } else {
          const exists = odp.clients.some(c => c.pppoe === clientForm.pppoe);
          if (exists) {
            pppoeAlreadyExists = true;
            return prev;
          }
          const newClient: Client = {
            odp_port: `P:${odp.clients.length + 1}`,
            name: clientForm.name,
            status: 'ON',
            signal: -20.0,
            location: [locArr[0], locArr[1]],
            pppoe: clientForm.pppoe,
            address: clientForm.address,
            onuMac: clientForm.mac,
            olt: clientForm.olt,
            pon: clientForm.pon,
            whatsappNumber: clientForm.number,
            isHidden: false,
            password: clientForm.password
          };
          odp.clients.push(newClient);
          if (mapRef.current) renderSingleClient(newClient, odp, mapRef.current);
        }
        const marker = odpMarkersRef.current[odp.id];
        if (marker) {
          marker.setPopupContent(generateOdpPopupContent(odp));
          if (marker.isPopupOpen()) {
            marker.closePopup();
            marker.openPopup();
          }
        }
      }
      return updated;
    });

    if (pppoeAlreadyExists) {
      alert("PPPoE already exists in this TJ. Please choose a different one.");
      return;
    }

    setShowClientModal(false);
  };

  const openPathPanel = (layer: L.Polyline) => {
    currentlyEditingLayerRef.current = layer;
    const options = layer.options as any;
    setPathForm({
      title: options.title || 'Untitled path',
      description: options.description || '',
      cableType: options.cableType || '',
      totalCores: options.totalCores || 12,
      usedCores: options.usedCores || 0,
      width: options.weight || 4,
      color: options.color || '#ff00ff',
      view: options.view || { lat: 0, lng: 0, zoom: 0 }
    });
    setShowPathPanel(true);
  };

  const handlePathSave = () => {
    const layer = currentlyEditingLayerRef.current as any;
    if (layer) {
      layer.setStyle({ color: pathForm.color, weight: pathForm.width });
      layer.options.title = pathForm.title;
      layer.options.description = pathForm.description;
      layer.options.cableType = pathForm.cableType;
      layer.options.totalCores = pathForm.totalCores;
      layer.options.usedCores = pathForm.usedCores;
      layer.options.view = pathForm.view;
      
      if (layer.getTooltip()) layer.unbindTooltip();
      layer.bindTooltip(`${pathForm.title}<br>Cores: ${pathForm.usedCores}/${pathForm.totalCores}`, { sticky: true });
      
      setShowPathPanel(false);
      currentlyEditingLayerRef.current = null;
    }
  };

  const deletePath = () => {
    const layer = currentlyEditingLayerRef.current;
    if (layer) {
      const geoJson = layer.toGeoJSON() as any;
      geoJson.properties = { ...pathForm };
      setDeletedItems(prev => [...prev, {
        type: 'path',
        data: geoJson,
        deletedAt: new Date().toISOString()
      }]);
      drawnItemsRef.current.removeLayer(layer);
      setShowPathPanel(false);
      currentlyEditingLayerRef.current = null;
    }
  };

  const handlePotentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const marker = tempMarkerRef.current;
    if (marker) {
      const content = `<b>Potential Client</b><br><b>Name:</b> ${potentialForm.name}<br><b>Phone:</b> ${potentialForm.phone}<br><b>Notes:</b> ${potentialForm.notes}`;
      marker.bindPopup(content).openPopup();
      
      // Add delete button logic to popup
      marker.on('popupopen', () => {
        const delBtn = document.createElement('button');
        delBtn.innerHTML = 'Delete';
        delBtn.className = 'delete-potential-btn';
        delBtn.style.cssText = 'margin-top:8px; background:#dc3545; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; width:100%;';
        delBtn.onclick = () => {
          setDeletedItems(prev => [...prev, {
            type: 'potential',
            data: { latlng: marker.getLatLng(), content },
            deletedAt: new Date().toISOString()
          }]);
          potentialClientsLayerRef.current.removeLayer(marker);
        };
        document.querySelector('.leaflet-popup-content')?.appendChild(delBtn);
      });
    }
    setShowPotentialModal(false);
    tempMarkerRef.current = null;
  };

  const restoreItem = (index: number) => {
    const item = deletedItems[index];
    if (!item) return;

    if (item.type === 'client') {
      setAllOdpData(prev => {
        return prev.map(o => {
          if (o.id === item.parentOdpId) {
            // Check if client already exists to prevent duplicate
            if (o.clients.some(c => c.pppoe === item.data.pppoe)) return o;
            const updatedClients = [...o.clients, item.data];
            const updatedOdp = { ...o, clients: updatedClients };
            
            // Re-render map layers
            if (mapRef.current) renderSingleClient(item.data, updatedOdp, mapRef.current);
            const marker = odpMarkersRef.current[o.id];
            if (marker) {
              marker.setPopupContent(generateOdpPopupContent(updatedOdp));
              if (marker.isPopupOpen()) {
                marker.closePopup();
                marker.openPopup();
              }
            }
            return updatedOdp;
          }
          return o;
        });
      });
    } else if (item.type === 'odp') {
      setAllOdpData(prev => [...prev, item.data]);
      if (mapRef.current) renderOdpAndClients(item.data, mapRef.current);
    } else if (item.type === 'path') {
      L.geoJSON(item.data, {
        onEachFeature: (feature, layer: any) => {
          drawnItemsRef.current.addLayer(layer);
          const props = feature.properties;
          layer.options = { ...layer.options, ...props };
          layer.setStyle({ color: props.color, weight: props.width });
          layer.bindTooltip(`${props.title}<br>Cores: ${props.usedCores}/${props.totalCores}`, { sticky: true });
        }
      });
    } else if (item.type === 'potential') {
      const marker = L.marker(item.data.latlng, { icon: POTENTIAL_CLIENT_ICON }).addTo(potentialClientsLayerRef.current);
      marker.bindPopup(item.data.content);
    }

    setDeletedItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveToLocalStorage = () => {
    const pathsGeoJSON = drawnItemsRef.current.toGeoJSON() as any;
    pathsGeoJSON.features = pathsGeoJSON.features.map((f: any) => {
      const layer = drawnItemsRef.current.getLayers().find((l: any) => l._leaflet_id === f.id);
      if (layer) f.properties = { ...layer.options };
      return f;
    });
    
    const state = {
      odpData: allOdpData,
      paths: pathsGeoJSON,
      potential: potentialClientsLayerRef.current.toGeoJSON(),
      deletedItems
    };
    localStorage.setItem('mapState', JSON.stringify(state));
    alert('Saved successfully!');
  };

  const loadFromLocalStorage = (map: L.Map) => {
    const saved = localStorage.getItem('mapState');
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      
      // Clear initial pre-populated map ODP markers and client layers to prevent duplicate graphics
      Object.keys(clientLayersRef.current).forEach(pppoe => {
        const layers = clientLayersRef.current[pppoe];
        if (layers) {
          map.removeLayer(layers.marker);
          map.removeLayer(layers.line);
        }
      });
      clientLayersRef.current = {};

      Object.keys(odpMarkersRef.current).forEach(id => {
        const marker = odpMarkersRef.current[id];
        if (marker) {
          map.removeLayer(marker);
        }
      });
      odpMarkersRef.current = {};

      drawnItemsRef.current.clearLayers();
      potentialClientsLayerRef.current.clearLayers();

      // Render the loaded ODP content
      if (state.odpData && Array.isArray(state.odpData)) {
        setAllOdpData(state.odpData);
        state.odpData.forEach((odp: ODP) => {
          renderOdpAndClients(odp, map);
        });
      } else {
        setAllOdpData(state.odpData || []);
      }
      
      setDeletedItems(state.deletedItems || []);
      
      L.geoJSON(state.paths, {
        onEachFeature: (feature, layer: any) => {
          drawnItemsRef.current.addLayer(layer);
          const props = feature.properties;
          layer.options = { ...layer.options, ...props };
          layer.setStyle({ color: props.color, weight: props.width });
          layer.bindTooltip(`${props.title}<br>Cores: ${props.usedCores}/${props.totalCores}`, { sticky: true });
        }
      });

      L.geoJSON(state.potential, {
        pointToLayer: (feature, latlng) => {
          const marker = L.marker(latlng, { icon: POTENTIAL_CLIENT_ICON });
          if (feature.properties?.content) marker.bindPopup(feature.properties.content);
          return marker;
        }
      }).eachLayer(l => potentialClientsLayerRef.current.addLayer(l));
    } catch (e) {
      console.error('Load failed', e);
    }
  };

  // --- UI Handlers ---
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-theme');
    if (mapRef.current) {
      mapRef.current.eachLayer(l => {
        if (l instanceof L.TileLayer) mapRef.current?.removeLayer(l);
      });
      const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 });
      const streetsDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
      if (!isDarkMode) streetsDark.addTo(mapRef.current);
      else streets.addTo(mapRef.current);
    }
  };

  if (!isLoggedIn) {
    return (
      <div id="login-overlay">
        <div className="login-card">
          <h2>🔐 Welcome</h2>
          <p>Sign in with your email to access the network map</p>
          <input 
            type="email" 
            placeholder="your@email.com" 
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin}>Continue with Email</button>
          {loginError && <div className="error-message">{loginError}</div>}
          <div className="demo-hint">
            ⚡ No password required – just enter any valid email.<br />
            New emails will create an account automatically.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mapContainerRef} id="map" className="w-full h-full" />

      {/* Search Bar */}
      <div 
        id="search-container"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Search Client..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && performSearch()}
        />
        <button id="searchButton" onClick={performSearch}>
          <Search size={14} strokeWidth={3} />
        </button>
      </div>

      {/* Context Menu Placeholder */}
      <div id="context-menu" className="custom-context-menu" />

      {/* Control Panel (Hamburger) */}
      <div 
        className="absolute top-5 left-5 z-[2000]"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <button 
          className="w-10 h-10 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          onClick={() => setShowControlPanel(!showControlPanel)}
        >
          <span className="text-xl">☰</span>
        </button>
        {showControlPanel && (
          <div className="absolute top-12 left-0 w-56 bg-white rounded shadow-lg py-2 border border-gray-200 dark:bg-[#3e4749] dark:border-[#7f8c8d]">
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { 
              setShowControlPanel(false); 
              if (mapRef.current) {
                // @ts-ignore
                const markerDraw = new L.Draw.Marker(mapRef.current, { icon: ODP_ICON });
                markerDraw.enable();
                // @ts-ignore
                mapRef.current._activeOdpDraw = markerDraw;
              }
            }}>
              <Plus size={16} /> Add ODP
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { setShowControlPanel(false); placingPotentialClientRef.current = true; document.body.classList.add('crosshair-cursor'); }}>
              <User size={16} /> Potential Client
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { setShowControlPanel(false); setShowReportModal(true); }}>
              <FileText size={16} /> Reports
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { setShowControlPanel(false); if (mapRef.current && heatLayerRef.current) { if (mapRef.current.hasLayer(heatLayerRef.current)) mapRef.current.removeLayer(heatLayerRef.current); else { heatLayerRef.current.addTo(mapRef.current); updateHeatmap(); } } }}>
              <Thermometer size={16} /> Toggle Heatmap
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { setShowControlPanel(false); toggleDarkMode(); }}>
              <Moon size={16} /> Toggle Dark Mode
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { setShowControlPanel(false); setShowTrashModal(true); }}>
              <Trash2 size={16} /> Recycle Bin
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { setShowControlPanel(false); saveToLocalStorage(); }}>
              <Save size={16} /> Update (Save)
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { setShowControlPanel(false); setShowBaseLayers(true); }}>
              <MapIcon size={16} /> Base Layers
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-[#636e72]" onClick={() => { 
              setShowControlPanel(false); 
              if (mapRef.current) { 
                // @ts-ignore
                new L.Draw.Polyline(mapRef.current, { shapeOptions: { color: '#ff00ff', weight: 4 } }).enable(); 
              } 
            }}>
              <Edit3 size={16} /> Draw Polyline
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 text-red-500 dark:hover:bg-[#636e72]" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>

      {/* Health Dashboard */}
      <div 
        id="network-health-dashboard"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="dashboard-title">Network Health</div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Total Clients:</span>
          <span id="total-clients-value" className="dashboard-stat-value">{totalClients}</span>
        </div>
      </div>

      {showBaseLayers && (
        <div className="modal-overlay flex">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowBaseLayers(false)}>×</button>
            <h3>Select Base Layer</h3>
            <div className="flex flex-col gap-3 mt-4">
              <button className="p-3 border rounded hover:bg-gray-100 text-left" onClick={() => {
                if (mapRef.current) {
                  mapRef.current.eachLayer(l => { if (l instanceof L.TileLayer) mapRef.current?.removeLayer(l); });
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(mapRef.current);
                }
                setShowBaseLayers(false);
              }}>Streets</button>
              <button className="p-3 border rounded hover:bg-gray-100 text-left" onClick={() => {
                if (mapRef.current) {
                  mapRef.current.eachLayer(l => { if (l instanceof L.TileLayer) mapRef.current?.removeLayer(l); });
                  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(mapRef.current);
                }
                setShowBaseLayers(false);
              }}>Streets Dark</button>
              <button className="p-3 border rounded hover:bg-gray-100 text-left" onClick={() => {
                if (mapRef.current) {
                  mapRef.current.eachLayer(l => { if (l instanceof L.TileLayer) mapRef.current?.removeLayer(l); });
                  L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{ maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'] }).addTo(mapRef.current);
                }
                setShowBaseLayers(false);
              }}>Satellite</button>
              <button className="p-3 border rounded hover:bg-gray-100 text-left" onClick={() => {
                if (mapRef.current) {
                  mapRef.current.eachLayer(l => { if (l instanceof L.TileLayer) mapRef.current?.removeLayer(l); });
                  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20 }).addTo(mapRef.current);
                  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { pane: 'shadowPane' }).addTo(mapRef.current);
                }
                setShowBaseLayers(false);
              }}>Satellite Dark</button>
              <button className="p-3 border rounded hover:bg-gray-100 text-left" onClick={() => {
                if (mapRef.current) {
                  mapRef.current.eachLayer(l => { if (l instanceof L.TileLayer) mapRef.current?.removeLayer(l); });
                  L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{ maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'] }).addTo(mapRef.current);
                }
                setShowBaseLayers(false);
              }}>Hybrid</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showClientModal && (
        <div className="modal-overlay flex">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowClientModal(false)}>×</button>
            <h3>{clientForm.isEdit ? 'Edit Client' : 'Add New Client'}</h3>
            <form onSubmit={handleClientSubmit} className="generic-form">
              <label>Name <span className="text-red-500">*</span></label>
              <input type="text" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} required />
              <div className="flex gap-4">
                <div className="flex-1">
                  <label>PPPoE / User ID <span className="text-red-500">*</span></label>
                  <input type="text" value={clientForm.pppoe} onChange={e => setClientForm({...clientForm, pppoe: e.target.value})} required />
                </div>
                <div className="flex-1">
                  <label>Password</label>
                  <input type="text" value={clientForm.password} onChange={e => setClientForm({...clientForm, password: e.target.value})} />
                </div>
              </div>
              <label>Location (Lat, Lng) <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g., 24.305, 91.719" value={clientForm.location} onChange={e => setClientForm({...clientForm, location: e.target.value})} required />
              <div className="flex gap-4">
                <div className="flex-1">
                  <label>OLT</label>
                  <select value={clientForm.olt} onChange={e => setClientForm({...clientForm, olt: e.target.value})}>
                    {Array.from({length: 60}, (_, i) => `OLT-${i+1}`).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label>PON</label>
                  <select value={clientForm.pon} onChange={e => setClientForm({...clientForm, pon: e.target.value})}>
                    {Array.from({length: 60}, (_, i) => `PON-${i+1}`).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <label>Phone</label>
              <input type="text" value={clientForm.number} onChange={e => setClientForm({...clientForm, number: e.target.value})} />
              <label>MAC Address <span className="text-red-500">*</span></label>
              <input type="text" value={clientForm.mac} onChange={e => setClientForm({...clientForm, mac: e.target.value})} required />
              <label>Address</label>
              <input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} />
              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      )}

      {showPotentialModal && (
        <div className="modal-overlay flex">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => { setShowPotentialModal(false); if (tempMarkerRef.current) potentialClientsLayerRef.current.removeLayer(tempMarkerRef.current); }}>×</button>
            <h3>Potential Client Information</h3>
            <form onSubmit={handlePotentialSubmit} className="generic-form">
              <label>Name</label>
              <input type="text" value={potentialForm.name} onChange={e => setPotentialForm({...potentialForm, name: e.target.value})} />
              <label>Phone</label>
              <input type="text" value={potentialForm.phone} onChange={e => setPotentialForm({...potentialForm, phone: e.target.value})} />
              <label>Notes</label>
              <textarea rows={3} value={potentialForm.notes} onChange={e => setPotentialForm({...potentialForm, notes: e.target.value})} />
              <button type="submit">Save Information</button>
            </form>
          </div>
        </div>
      )}

      {showTrashModal && (
        <div className="modal-overlay flex">
          <div className="modal-content max-w-2xl">
            <button className="modal-close-btn" onClick={() => setShowTrashModal(false)}>×</button>
            <h3>Recycle Bin</h3>
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search deleted items..." 
                className="w-full p-2 border border-gray-300 rounded"
                value={trashSearch}
                onChange={e => setTrashSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {deletedItems.length === 0 ? (
                <p className="text-center text-gray-500">No deleted items.</p>
              ) : (
                deletedItems
                  .filter(item => {
                    const term = trashSearch.toLowerCase();
                    if (item.type === 'client') {
                      return item.data.name.toLowerCase().includes(term) || 
                             item.data.pppoe.toLowerCase().includes(term) ||
                             (item.parentOdpId && item.parentOdpId.toLowerCase().includes(term));
                    }
                    if (item.type === 'odp') return item.data.id.toLowerCase().includes(term);
                    if (item.type === 'path') return item.data.properties.title.toLowerCase().includes(term);
                    if (item.type === 'potential') return item.data.popupContent?.toLowerCase().includes(term);
                    return true;
                  })
                  .map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-bottom border-gray-100 dark:border-gray-700">
                      <div className="flex flex-col text-sm">
                        <div className="font-bold">
                          {item.type === 'client' && `👤 ${item.data.name} (${item.data.pppoe})`}
                          {item.type === 'odp' && `📦 ODP ${item.data.id}`}
                          {item.type === 'path' && `📏 ${item.data.properties.title}`}
                          {item.type === 'potential' && `👥 Potential Client`}
                        </div>
                        <small className="text-gray-400">Deleted: {new Date(item.deletedAt).toLocaleString()}</small>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-xs" onClick={() => restoreItem(idx)}>Restore</button>
                        <button className="px-3 py-1 bg-red-600 text-white rounded text-xs" onClick={() => setDeletedItems(prev => prev.filter((_, i) => i !== idx))}>Delete</button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay flex">
          <div className="modal-content text-center">
            <button className="modal-close-btn" onClick={() => setShowReportModal(false)}>×</button>
            <h3>Download Report</h3>
            <div className="flex flex-col gap-2 mt-4">
              <button className="bg-blue-500 text-white p-2 rounded" onClick={() => generateCSVReport('ON')}>Online Clients</button>
              <button className="bg-blue-500 text-white p-2 rounded" onClick={() => generateCSVReport('OFF')}>Offline Clients</button>
              <button className="bg-blue-500 text-white p-2 rounded" onClick={() => generateCSVReport('ALL')}>All Clients</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal-overlay flex">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
            <h3>Downtime History</h3>
            <table className="history-table mt-4">
              <thead>
                <tr><th>Event</th><th>Timestamp</th><th>Duration</th></tr>
              </thead>
              <tbody>
                <tr><td>Offline</td><td>2025-07-30 10:15:21 AM</td><td rowSpan={2}>45 min</td></tr>
                <tr><td>Online</td><td>2025-07-30 11:00:55 AM</td></tr>
              </tbody>
            </table>
            <p className="demo-notice mt-4 text-center text-red-500 font-bold">This is a demonstration. Historical data is not being saved.</p>
          </div>
        </div>
      )}

      {showTicketModal && (
        <div className="modal-overlay flex">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowTicketModal(false)}>×</button>
            <h3>Create New Ticket</h3>
            <form className="generic-form mt-4" onSubmit={(e) => { e.preventDefault(); alert('DEMO: Ticket has been submitted successfully!'); setShowTicketModal(false); }}>
              <label>Problem Category</label>
              <select className="p-2 border rounded"><option>No Connection</option><option>Slow Speed</option><option>Frequent Disconnection</option><option>Other</option></select>
              <label>Priority</label>
              <select className="p-2 border rounded"><option>Low</option><option selected>Medium</option><option>High</option></select>
              <label>Description</label>
              <textarea className="p-2 border rounded" rows={4}></textarea>
              <button type="submit" className="bg-green-600 text-white p-2 rounded">Submit Ticket</button>
            </form>
            <p className="demo-notice mt-4 text-center text-red-500 font-bold">This is a demonstration. Ticket data will not be submitted.</p>
          </div>
        </div>
      )}

      {showOdpModal && (
        <div className="modal-overlay flex">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowOdpModal(false)}>×</button>
            <h3>{odpModalMode === 'add' ? 'Add New ODP' : 'Edit ODP ID'}</h3>
            <form className="generic-form mt-4" onSubmit={handleOdpModalSubmit}>
              <label>ODP ID / Name</label>
              <input 
                type="text" 
                className="p-2 border rounded" 
                placeholder="e.g. ODP-01" 
                value={odpModalIdInput} 
                onChange={e => setOdpModalIdInput(e.target.value)} 
                required 
                autoFocus
              />
              {odpModalMode === 'add' && odpModalTargetCoords && (
                <div className="text-xs text-gray-500 mt-2 font-semibold">
                  Location: {odpModalTargetCoords.lat.toFixed(6)}, {odpModalTargetCoords.lng.toFixed(6)}
                </div>
              )}
              <button type="submit" className="bg-green-600 text-white p-2 rounded mt-4">
                {odpModalMode === 'add' ? 'Add ODP' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Path Edit Panel */}
      <div id="path-edit-panel" className={showPathPanel ? 'show' : ''}>
        <div className="panel-header">
          <h3>Edit Path</h3>
          <div className="flex gap-2">
            <button onClick={handlePathSave} title="Save Changes">✔️</button>
            <button onClick={deletePath} title="Delete Path"><Trash2 size={20} /></button>
            <button onClick={() => setShowPathPanel(false)} title="Close"><X size={20} /></button>
          </div>
        </div>
        <div className="panel-body">
          <label>Title</label>
          <input type="text" value={pathForm.title} onChange={e => setPathForm({...pathForm, title: e.target.value})} />
          <label>Description</label>
          <textarea rows={3} value={pathForm.description} onChange={e => setPathForm({...pathForm, description: e.target.value})} />
          <h4 className="panel-section-title">Cable Properties</h4>
          <div className="panel-section">
            <label>Cable Type</label>
            <input type="text" value={pathForm.cableType} onChange={e => setPathForm({...pathForm, cableType: e.target.value})} />
            <div className="flex gap-2">
              <div className="flex-1">
                <label>Total Cores</label>
                <input type="number" value={pathForm.totalCores} onChange={e => setPathForm({...pathForm, totalCores: parseInt(e.target.value)})} />
              </div>
              <div className="flex-1">
                <label>Used Cores</label>
                <input type="number" value={pathForm.usedCores} onChange={e => setPathForm({...pathForm, usedCores: parseInt(e.target.value)})} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1">
              <label>Width</label>
              <select value={pathForm.width} onChange={e => setPathForm({...pathForm, width: parseInt(e.target.value)})}>
                {[1, 2, 4, 6, 8, 10].map(w => <option key={w} value={w}>{w} px</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label>Color</label>
              <input type="color" className="h-9" value={pathForm.color} onChange={e => setPathForm({...pathForm, color: e.target.value})} />
            </div>
          </div>
          <button 
            className="panel-section-title w-full text-left mt-4" 
            onClick={() => setShowMorePathSettings(!showMorePathSettings)}
          >
            More settings {showMorePathSettings ? '▼' : '▶'}
          </button>
          {showMorePathSettings && (
            <div className="panel-section mt-2">
              <h5 className="text-sm font-bold mb-2">Camera view</h5>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px]">Latitude</label>
                  <input type="text" value={pathForm.view.lat.toFixed(6)} readOnly className="text-xs" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px]">Longitude</label>
                  <input type="text" value={pathForm.view.lng.toFixed(6)} readOnly className="text-xs" />
                </div>
              </div>
              <label className="text-[10px] mt-2">Zoom Level</label>
              <input type="text" value={pathForm.view.zoom} readOnly className="text-xs" />
              <button 
                className="panel-button mt-3" 
                onClick={() => {
                  if (mapRef.current) {
                    const center = mapRef.current.getCenter();
                    const zoom = mapRef.current.getZoom();
                    setPathForm(prev => ({
                      ...prev,
                      view: { lat: center.lat, lng: center.lng, zoom }
                    }));
                  }
                }}
              >
                Capture this view
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="modal-overlay flex" style={{ zIndex: 11000 }}>
          <div className="modal-content text-center max-w-sm">
            <h3 className="font-bold text-lg mb-2">{confirmModal.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{confirmModal.message}</p>
            <div className="flex justify-center gap-4">
              <button 
                type="button"
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded cursor-pointer"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded cursor-pointer"
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
