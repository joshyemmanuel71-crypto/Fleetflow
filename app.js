/* FleetFlow Logistics Management System - Core Application JS */

// State Management
const state = {
  activeView: 'dashboard', // dashboard, trips, tracking, financials, driver, design-system
  simSpeed: 1, // 0 (paused), 1 (normal), 3 (fast)
  zoomLevel: 1,
  mapCenter: { x: 0, y: 0 },
  selectedVehicleId: 'V-102', // Currently tracked vehicle
  driverMode: 'dashboard', // driver home (dashboard), logs, trips
  
  // KPI Metrics
  kpis: {
    activeVehicles: 8,
    idleVehicles: 2,
    tripsRunning: 5,
    tripsCompleted: 14,
    revenueToday: 18450,
    fuelExpenseToday: 3240,
    tollExpenseToday: 950,
    profitToday: 14260
  },

  // Map Locations & Nodes (SVG dimensions: 800x500)
  nodes: {
    'Depot A': { x: 400, y: 250, name: 'Central Depot A' },
    'City Hub': { x: 200, y: 150, name: 'Metro City Hub' },
    'Harbor Terminal': { x: 100, y: 350, name: 'Coastal Harbor Terminal' },
    'Airport Cargo': { x: 650, y: 120, name: 'International Airport Cargo' },
    'South Warehouse': { x: 500, y: 400, name: 'Southern Distribution Hub' },
    'North Industrial': { x: 350, y: 80, name: 'Northern Industrial Zone' }
  },

  // Vehicles Telemetry & Info
  vehicles: [
    { id: 'V-101', type: 'Container Truck', status: 'running', speed: 65, driver: 'Arjun Singh', phone: '+91 98765 43210', lat: 0, lng: 0, currentRoute: ['Depot A', 'City Hub', 'Harbor Terminal'], routeIdx: 0, routeProgress: 0.3, fuelEfficiency: '3.8 km/l', fuelLevel: 75 },
    { id: 'V-102', type: 'Box Van', status: 'delayed', speed: 12, driver: 'Priya Sharma', phone: '+91 87654 32109', lat: 0, lng: 0, currentRoute: ['Airport Cargo', 'Depot A'], routeIdx: 0, routeProgress: 0.65, fuelEfficiency: '6.2 km/l', fuelLevel: 42 },
    { id: 'V-103', type: 'Flatbed Trailer', status: 'running', speed: 55, driver: 'Rajesh Kumar', phone: '+91 76543 21098', lat: 0, lng: 0, currentRoute: ['North Industrial', 'South Warehouse'], routeIdx: 0, routeProgress: 0.15, fuelEfficiency: '2.9 km/l', fuelLevel: 88 },
    { id: 'V-104', type: 'Box Van', status: 'delivered', speed: 0, driver: 'Vikram Patel', phone: '+91 65432 10987', lat: 0, lng: 0, currentRoute: ['Harbor Terminal', 'South Warehouse'], routeIdx: 0, routeProgress: 1.0, fuelEfficiency: '5.9 km/l', fuelLevel: 95 },
    { id: 'V-105', type: 'Container Truck', status: 'assigned', speed: 0, driver: 'Amit Verma', phone: '+91 54321 09876', lat: 0, lng: 0, currentRoute: ['Depot A', 'Airport Cargo'], routeIdx: 0, routeProgress: 0.0, fuelEfficiency: '4.1 km/l', fuelLevel: 100 },
    { id: 'V-106', type: 'Mini Van', status: 'issue', speed: 0, driver: 'Sanjay Dutt', phone: '+91 43210 98765', lat: 0, lng: 0, currentRoute: ['City Hub', 'North Industrial'], routeIdx: 0, routeProgress: 0.45, fuelEfficiency: '8.5 km/l', fuelLevel: 15 },
    { id: 'V-107', type: 'Container Truck', status: 'running', speed: 72, driver: 'Rohan Sen', phone: '+91 32109 87654', lat: 0, lng: 0, currentRoute: ['Harbor Terminal', 'Depot A'], routeIdx: 0, routeProgress: 0.82, fuelEfficiency: '4.0 km/l', fuelLevel: 60 },
    { id: 'V-108', type: 'Box Van', status: 'running', speed: 48, driver: 'Neha Gupta', phone: '+91 21098 76543', lat: 0, lng: 0, currentRoute: ['South Warehouse', 'City Hub'], routeIdx: 0, routeProgress: 0.5, fuelEfficiency: '6.0 km/l', fuelLevel: 55 },
    { id: 'V-109', type: 'Flatbed Trailer', status: 'idle', speed: 0, driver: 'Deepak Roy', phone: '+91 10987 65432', lat: 0, lng: 0, currentRoute: [], routeIdx: 0, routeProgress: 0.0, fuelEfficiency: '3.1 km/l', fuelLevel: 90 },
    { id: 'V-110', type: 'Mini Van', status: 'idle', speed: 0, driver: 'Karan Malhotra', phone: '+91 90123 45678', lat: 0, lng: 0, currentRoute: [], routeIdx: 0, routeProgress: 0.0, fuelEfficiency: '8.2 km/l', fuelLevel: 35 }
  ],

  // Trip Information
  trips: [
    { tripNo: 'TR-3012', customer: 'Samsung India', driver: 'Arjun Singh', vehicle: 'V-101', origin: 'Depot A', destination: 'Harbor Terminal', distance: '120 km', status: 'running', revenue: 2400, progress: 30 },
    { tripNo: 'TR-3013', customer: 'Amazon Logistics', driver: 'Priya Sharma', vehicle: 'V-102', origin: 'Airport Cargo', destination: 'Depot A', distance: '85 km', status: 'delayed', revenue: 1950, progress: 65 },
    { tripNo: 'TR-3014', customer: 'Tata Steel', driver: 'Rajesh Kumar', vehicle: 'V-103', origin: 'North Industrial', destination: 'South Warehouse', distance: '240 km', status: 'running', revenue: 6200, progress: 15 },
    { tripNo: 'TR-3015', customer: 'Reliance Retail', driver: 'Vikram Patel', vehicle: 'V-104', origin: 'Harbor Terminal', destination: 'South Warehouse', distance: '190 km', status: 'delivered', revenue: 4500, progress: 100 },
    { tripNo: 'TR-3016', customer: 'Flipkart Online', driver: 'Amit Verma', vehicle: 'V-105', origin: 'Depot A', destination: 'Airport Cargo', distance: '95 km', status: 'assigned', revenue: 2100, progress: 0 },
    { tripNo: 'TR-3017', customer: 'Xiaomi Care', driver: 'Sanjay Dutt', vehicle: 'V-106', origin: 'City Hub', destination: 'North Industrial', distance: '70 km', status: 'issue', revenue: 1300, progress: 45 },
    { tripNo: 'TR-3018', customer: 'DHL Global', driver: 'Rohan Sen', vehicle: 'V-107', origin: 'Harbor Terminal', destination: 'Depot A', distance: '160 km', status: 'running', revenue: 3800, progress: 82 },
    { tripNo: 'TR-3019', customer: 'BlueDart Air', driver: 'Neha Gupta', vehicle: 'V-108', origin: 'South Warehouse', destination: 'City Hub', distance: '140 km', status: 'running', revenue: 3100, progress: 50 }
  ],

  // Live Activity Feed Log
  activityFeed: [
    { time: '15:38', type: 'trip-started', msg: 'Trip <strong>TR-3012</strong> started by driver <strong>Arjun Singh</strong> (V-101)' },
    { time: '15:35', type: 'fuel-added', msg: 'Fuel invoice submitted by driver <strong>Priya Sharma</strong> (V-102): ₹1,800' },
    { time: '15:28', type: 'issue-reported', msg: 'Vehicle <strong>V-106</strong> reported Engine Overheating at Metro City Hub' },
    { time: '15:10', type: 'delivered', msg: 'Trip <strong>TR-3015</strong> completed. Delivered to South Warehouse' },
    { time: '14:55', type: 'toll-added', msg: 'Toll plaza receipt logged for <strong>V-108</strong>: ₹380' }
  ],

  // Financial History Analytics
  financials: {
    monthlyRevenue: 285400,
    monthlyExpenses: 94250,
    monthlyProfit: 191150,
    avgFuelEff: '4.8 km/l',
    bestVehicle: 'V-101 (Container Truck)',
    bestRoute: 'North Industrial -> South Warehouse',
    weeklyData: [
      { day: 'Mon', revenue: 14500, expenses: 4200 },
      { day: 'Tue', revenue: 16800, expenses: 5100 },
      { day: 'Wed', revenue: 15200, expenses: 3900 },
      { day: 'Thu', revenue: 18900, expenses: 4800 },
      { day: 'Fri', revenue: 17300, expenses: 4600 },
      { day: 'Sat', revenue: 19500, expenses: 5200 },
      { day: 'Sun', revenue: 13200, expenses: 3100 }
    ],
    expenseBreakdown: [
      { name: 'Fuel', value: 58000, color: 'var(--color-delayed)' },
      { name: 'Driver Salaries', value: 24000, color: 'var(--accent-primary)' },
      { name: 'Tolls & Taxes', value: 8250, color: 'var(--accent-secondary)' },
      { name: 'Maintenance & Spares', value: 4000, color: 'var(--color-issue)' }
    ]
  },

  // Driver Interface Mock Session state
  driverSession: {
    tripNo: 'TR-3012',
    customer: 'Samsung India',
    vehicleId: 'V-101',
    status: 'running', // idle, running
    location: 'Highway NH-8, Near Gurgaon Toll',
    startLocationName: 'Depot A',
    endLocationName: 'Harbor Terminal',
    earningsToday: 2400,
    distanceTraveled: '36 km',
    elapsedTime: '1 hr 12 mins',
    route: ['Depot A', 'City Hub', 'Harbor Terminal'],
    fuelLogs: [
      { date: 'Today, 10:30 AM', amount: '₹2,500', qty: '26 L' }
    ],
    tollLogs: [
      { date: 'Today, 11:15 AM', amount: '₹350', location: 'Kherki Daula Plaza' }
    ],
    documents: [
      { name: 'driver_license.pdf', status: 'verified' },
      { name: 'rc_book.pdf', status: 'verified' }
    ]
  }
};

// Initialize Application UI
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadFleetDataFromSupabase(); // pull real vehicles & trips from Supabase before rendering
  initSimulation();
  renderAllViews();
  setupEventListeners();
  triggerNotification('Welcome to FleetFlow Command Center. Connected to live database.', 'info');
});

// View Navigation Router
function setupNavigation() {
  // Desktop Sidebar Links
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  // Mobile Bottom Navigation Tabs (Driver screen shell)
  document.querySelectorAll('.phone-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.phone-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const subView = btn.getAttribute('data-subview');
      switchDriverSubView(subView);
    });
  });
}

function switchView(view) {
  state.activeView = view;
  
  // Update sidebar active link state
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    if (item.getAttribute('data-view') === view) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle view elements visibility
  document.querySelectorAll('.view-container').forEach(container => {
    if (container.id === `${view}-view`) {
      container.classList.add('active');
    } else {
      container.classList.remove('active');
    }
  });

  // Re-render specific dynamic UI components upon viewing
  if (view === 'dashboard') {
    renderDashboardMap();
    renderActivityFeed();
  } else if (view === 'trips') {
    renderTripsList();
  } else if (view === 'tracking') {
    renderTrackingView();
  } else if (view === 'financials') {
    renderFinancialsView();
  }
}

// Switching subviews inside Driver Interface (mobile mock shell)
function switchDriverSubView(subView) {
  state.driverMode = subView;
  
  // Hide all screens
  document.querySelectorAll('.driver-sub-view').forEach(screen => {
    screen.style.display = 'none';
  });
  
  // Show target screen
  const target = document.getElementById(`driver-${subView}-screen`);
  if (target) {
    target.style.display = 'flex';
    target.style.flexDirection = 'column';
    target.style.gap = '16px';
  }

  // Populate dynamic elements
  if (subView === 'dashboard') {
    renderDriverDashboard();
  } else if (subView === 'logs') {
    renderDriverLogs();
  } else if (subView === 'trips') {
    renderDriverTrips();
  }
}

// ----------------------------------------------------
// Global Notification System
// ----------------------------------------------------
function triggerNotification(message, type = 'info') {
  const container = document.getElementById('notification-area');
  if (!container) return;

  const notif = document.createElement('div');
  notif.className = `app-notification ${type}`;
  notif.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${message}`;

  container.appendChild(notif);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notif.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => notif.remove(), 300);
  }, 4000);
}

// ----------------------------------------------------
// Simulation and Telemetry Thread
// ----------------------------------------------------
function initSimulation() {
  // Update loop
  setInterval(() => {
    if (state.simSpeed === 0) return; // Paused

    const step = 0.005 * state.simSpeed;

    state.vehicles.forEach(vehicle => {
      // If vehicle is in status running or delayed, move it along the route coordinates
      if ((vehicle.status === 'running' || vehicle.status === 'delayed') && vehicle.currentRoute.length > 0) {
        vehicle.routeProgress += step;
        
        // Random speed variance
        if (vehicle.status === 'delayed') {
          vehicle.speed = Math.floor(10 + Math.random() * 8);
        } else {
          vehicle.speed = Math.floor(45 + Math.random() * 25);
        }

        // If completed current leg of journey
        if (vehicle.routeProgress >= 1) {
          vehicle.routeProgress = 0;
          vehicle.routeIdx++;

          // If reached final node
          if (vehicle.routeIdx >= vehicle.currentRoute.length - 1) {
            vehicle.status = 'delivered';
            vehicle.speed = 0;
            vehicle.routeProgress = 1.0;
            
            // Trigger delivery event
            const trip = state.trips.find(t => t.vehicle === vehicle.id && t.status !== 'delivered');
            if (trip) {
              trip.status = 'delivered';
              trip.progress = 100;
              state.kpis.tripsRunning--;
              state.kpis.tripsCompleted++;
              state.kpis.revenueToday += trip.revenue;
              state.kpis.profitToday += Math.floor(trip.revenue * 0.7);

              // Add activity feed
              addActivityItem('delivered', `Delivery completed: Trip <strong>${trip.tripNo}</strong> reached destination <strong>${trip.destination}</strong>`);
              triggerNotification(`Trip ${trip.tripNo} delivered successfully!`, 'success');
              
              // Update Driver Session if it matches
              if (state.driverSession.vehicleId === vehicle.id) {
                state.driverSession.status = 'idle';
                state.driverSession.earningsToday += trip.revenue;
                renderDriverDashboard();
              }
            }
          } else {
            // Log leg completed
            addActivityItem('trip-started', `Vehicle <strong>${vehicle.id}</strong> passed checkpoint: <strong>${vehicle.currentRoute[vehicle.routeIdx]}</strong>`);
          }
        }

        // Update matching active Trip Progress %
        const trip = state.trips.find(t => t.vehicle === vehicle.id && t.status !== 'delivered');
        if (trip) {
          const totalLegs = vehicle.currentRoute.length - 1;
          const currentPercentage = Math.floor(((vehicle.routeIdx + vehicle.routeProgress) / totalLegs) * 100);
          trip.progress = Math.min(currentPercentage, 99);
          trip.status = vehicle.status;
        }
      }
    });

    // Re-render components that show live telemetry data
    if (state.activeView === 'dashboard') {
      updateLiveTelemetryOnMap();
      renderKPIs();
    } else if (state.activeView === 'trips') {
      renderTripsList();
    } else if (state.activeView === 'tracking') {
      updateTrackingMap();
      renderTrackingStatsPanel();
    }
    
    // Simulate driver movement on driver screen if running
    if (state.driverSession.status === 'running') {
      const activeVehicle = state.vehicles.find(v => v.id === state.driverSession.vehicleId);
      if (activeVehicle) {
        state.driverSession.distanceTraveled = Math.floor(40 + activeVehicle.routeProgress * 60) + ' km';
        if (state.activeView === 'driver' && state.driverMode === 'dashboard') {
          document.getElementById('driver-dist-val').innerText = state.driverSession.distanceTraveled;
        }
      }
    }

  }, 1000); // 1-second ticks
}

function addActivityItem(type, msg) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  state.activityFeed.unshift({ time, type, msg });
  if (state.activityFeed.length > 20) state.activityFeed.pop();
  
  if (state.activeView === 'dashboard') {
    renderActivityFeed();
  }
}

// ----------------------------------------------------
// UI Render Functions
// ----------------------------------------------------
function renderAllViews() {
  renderKPIs();
  renderDashboardMap();
  renderActivityFeed();
  renderTripsList();
  renderTrackingView();
  renderFinancialsView();
  
  // Driver UI Render
  renderDriverDashboard();
}

function renderKPIs() {
  // Update values
  document.getElementById('kpi-active-val').innerText = state.vehicles.filter(v => v.status !== 'idle').length;
  document.getElementById('kpi-idle-val').innerText = state.vehicles.filter(v => v.status === 'idle').length;
  document.getElementById('kpi-running-val').innerText = state.vehicles.filter(v => v.status === 'running' || v.status === 'delayed').length;
  document.getElementById('kpi-completed-val').innerText = state.kpis.tripsCompleted;
  
  document.getElementById('kpi-revenue-val').innerText = `₹${state.kpis.revenueToday.toLocaleString()}`;
  document.getElementById('kpi-fuel-val').innerText = `₹${state.kpis.fuelExpenseToday.toLocaleString()}`;
  document.getElementById('kpi-toll-val').innerText = `₹${state.kpis.tollExpenseToday.toLocaleString()}`;
  document.getElementById('kpi-profit-val').innerText = `₹${(state.kpis.revenueToday - state.kpis.fuelExpenseToday - state.kpis.tollExpenseToday).toLocaleString()}`;
}

// Render SVGs onto the interactive map
function renderDashboardMap() {
  const mapSvg = document.getElementById('dashboard-map-svg');
  if (!mapSvg) return;

  // Clear existing nodes, routes, vehicle dots, text labels
  mapSvg.innerHTML = '';

  // Draw background water grid
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1"/>
    </pattern>
  `;
  mapSvg.appendChild(defs);
  
  const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  gridRect.setAttribute('width', '100%');
  gridRect.setAttribute('height', '100%');
  gridRect.setAttribute('fill', 'url(#grid)');
  mapSvg.appendChild(gridRect);

  // Draw stylized hub-to-hub roads (background connections)
  const nodeNames = Object.keys(state.nodes);
  for (let i = 0; i < nodeNames.length; i++) {
    for (let j = i + 1; j < nodeNames.length; j++) {
      const n1 = state.nodes[nodeNames[i]];
      const n2 = state.nodes[nodeNames[j]];
      
      const road = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      road.setAttribute('d', `M ${n1.x} ${n1.y} L ${n2.x} ${n2.y}`);
      road.setAttribute('class', 'map-roads');
      mapSvg.appendChild(road);
    }
  }

  // Draw routes for running vehicles
  state.vehicles.forEach(vehicle => {
    if ((vehicle.status === 'running' || vehicle.status === 'delayed' || vehicle.status === 'issue') && vehicle.currentRoute.length > 1) {
      const pathPoints = vehicle.currentRoute.map(n => state.nodes[n]);
      let dPath = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
      for (let i = 1; i < pathPoints.length; i++) {
        dPath += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
      }
      
      const routeLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      routeLine.setAttribute('d', dPath);
      routeLine.setAttribute('class', `map-route-line ${vehicle.status}`);
      routeLine.setAttribute('id', `route-path-${vehicle.id}`);
      mapSvg.appendChild(routeLine);
    }
  });

  // Draw Depots / Nodes
  for (const [key, node] of Object.entries(state.nodes)) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Outer glow ring
    const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerRing.setAttribute('cx', node.x);
    outerRing.setAttribute('cy', node.y);
    outerRing.setAttribute('r', '14');
    outerRing.setAttribute('fill', 'rgba(79, 70, 229, 0.12)');
    outerRing.setAttribute('stroke', 'rgba(79, 70, 229, 0.2)');
    outerRing.setAttribute('stroke-width', '1');
    group.appendChild(outerRing);

    // Inner node dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', node.x);
    dot.setAttribute('cy', node.y);
    dot.setAttribute('r', '6');
    dot.setAttribute('class', 'map-depot');
    group.appendChild(dot);

    // Label Text
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', node.x);
    label.setAttribute('y', node.y - 18);
    label.setAttribute('fill', 'var(--text-secondary)');
    label.setAttribute('font-size', '10px');
    label.setAttribute('font-weight', '500');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = key;
    group.appendChild(label);

    mapSvg.appendChild(group);
  }

  // Draw Vehicles
  state.vehicles.forEach(vehicle => {
    // Calculate initial vehicle position based on route progress
    const pos = getVehicleCoordinate(vehicle);
    vehicle.lat = pos.x;
    vehicle.lng = pos.y;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', `marker-${vehicle.id}`);
    group.setAttribute('class', 'map-marker');
    group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    
    // Tooltip trigger
    group.addEventListener('mouseenter', (e) => showMapTooltip(e, vehicle));
    group.addEventListener('mousemove', (e) => moveMapTooltip(e));
    group.addEventListener('mouseleave', () => hideMapTooltip());
    group.addEventListener('click', () => {
      state.selectedVehicleId = vehicle.id;
      switchView('tracking');
    });

    // Outer pulse animation ring (only for moving/active trucks)
    if (vehicle.status === 'running' || vehicle.status === 'delayed' || vehicle.status === 'issue') {
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('cx', '0');
      pulse.setAttribute('cy', '0');
      pulse.setAttribute('r', '10');
      pulse.setAttribute('class', `map-marker-pulse ${vehicle.status}`);
      group.appendChild(pulse);
    }

    // Inner solid marker dot
    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pin.setAttribute('cx', '0');
    pin.setAttribute('cy', '0');
    pin.setAttribute('r', '9');
    pin.setAttribute('class', `map-marker-pin ${vehicle.status}`);
    group.appendChild(pin);

    // Short label (e.g. V1, V2...) inside the pin
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', '3');
    label.setAttribute('class', 'map-marker-label');
    label.textContent = vehicle.id.split('-')[1];
    group.appendChild(label);

    mapSvg.appendChild(group);
  });
}

function updateLiveTelemetryOnMap() {
  state.vehicles.forEach(vehicle => {
    const pos = getVehicleCoordinate(vehicle);
    vehicle.lat = pos.x;
    vehicle.lng = pos.y;

    const marker = document.getElementById(`marker-${vehicle.id}`);
    if (marker) {
      marker.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      
      // Update pulse class if status changes in sim
      const pulse = marker.querySelector('.map-marker-pulse');
      const pin = marker.querySelector('.map-marker-pin');
      
      if (pin) {
        pin.className.baseVal = `map-marker-pin ${vehicle.status}`;
      }
      
      if (pulse) {
        pulse.className.baseVal = `map-marker-pulse ${vehicle.status}`;
      } else if (vehicle.status === 'running' || vehicle.status === 'delayed' || vehicle.status === 'issue') {
        // Create pulse if it was idle and now running
        const newPulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        newPulse.setAttribute('cx', '0');
        newPulse.setAttribute('cy', '0');
        newPulse.setAttribute('r', '10');
        newPulse.setAttribute('class', `map-marker-pulse ${vehicle.status}`);
        marker.insertBefore(newPulse, pin);
      }
    }
  });
}

// Calculate interpolated coordinate along straight route segments
function getVehicleCoordinate(vehicle) {
  if (vehicle.status === 'idle' || vehicle.currentRoute.length === 0) {
    // Place idle vehicles at Depot A or their last location
    return state.nodes['Depot A'];
  }
  if (vehicle.status === 'delivered') {
    const lastNodeName = vehicle.currentRoute[vehicle.currentRoute.length - 1];
    return state.nodes[lastNodeName];
  }

  const startNodeName = vehicle.currentRoute[vehicle.routeIdx];
  const endNodeName = vehicle.currentRoute[vehicle.routeIdx + 1];

  if (!startNodeName || !endNodeName) {
    return state.nodes['Depot A'];
  }

  const startNode = state.nodes[startNodeName];
  const endNode = state.nodes[endNodeName];
  const progress = vehicle.routeProgress;

  const x = startNode.x + (endNode.x - startNode.x) * progress;
  const y = startNode.y + (endNode.y - startNode.y) * progress;

  return { x, y };
}

// Map Tooltip UI Control
function showMapTooltip(event, vehicle) {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;

  const activeTrip = state.trips.find(t => t.vehicle === vehicle.id && t.status !== 'delivered');
  const routeString = vehicle.currentRoute.join(' → ');

  tooltip.innerHTML = `
    <h4>
      <span>${vehicle.id} (${vehicle.type})</span>
      <span class="status-badge ${vehicle.status}" style="padding: 2px 6px; font-size: 0.6rem;">${vehicle.status}</span>
    </h4>
    <p><strong>Driver:</strong> ${vehicle.driver}</p>
    <p><strong>Speed:</strong> ${vehicle.speed} km/h</p>
    <p><strong>Route:</strong> ${routeString || 'None (Idle)'}</p>
    ${activeTrip ? `<p><strong>Destination:</strong> ${activeTrip.destination} (${activeTrip.progress}% done)</p>` : '<p>No active trip</p>'}
    <p><strong>Fuel efficiency:</strong> ${vehicle.fuelEfficiency}</p>
    <div style="margin-top: 6px; font-size: 0.65rem; color: var(--text-muted);">Click to track vehicle</div>
  `;

  tooltip.style.display = 'block';
  moveMapTooltip(event);
}

function moveMapTooltip(event) {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;

  const mapCard = document.getElementById('dashboard-map-card');
  if (!mapCard) return;

  const rect = mapCard.getBoundingClientRect();
  const x = event.clientX - rect.left + 15;
  const y = event.clientY - rect.top + 15;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideMapTooltip() {
  const tooltip = document.getElementById('map-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

// Live Activity Feed Rendering
function renderActivityFeed() {
  const feedList = document.getElementById('feed-list');
  if (!feedList) return;

  feedList.innerHTML = '';
  state.activityFeed.forEach(item => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `
      <div class="feed-icon ${item.type}">
        ${getFeedIconSvg(item.type)}
      </div>
      <div class="feed-content">
        <div class="feed-msg">${item.msg}</div>
        <div class="feed-time">${item.time}</div>
      </div>
    `;
    feedList.appendChild(div);
  });
}

function getFeedIconSvg(type) {
  switch (type) {
    case 'trip-started':
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699-2.7c-.1.3-.21.61-.33.92m-.13 3.49c-.21.3-.43.6-.66.9" /></svg>`;
    case 'fuel-added':
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5M3 9.75h18M3 14.25h18" /></svg>`;
    case 'toll-added':
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m-1.5-11.25h3" /></svg>`;
    case 'issue-reported':
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;
    case 'delivered':
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>`;
  }
}

// ----------------------------------------------------
// Trip Management view
// ----------------------------------------------------
let activeTripFilter = 'all';
let tripSearchQuery = '';

function renderTripsList() {
  const container = document.getElementById('trips-grid-container');
  if (!container) return;

  container.innerHTML = '';

  const filteredTrips = state.trips.filter(trip => {
    // Filter by status
    const statusMatch = activeTripFilter === 'all' || trip.status === activeTripFilter;
    
    // Filter by search query
    const query = tripSearchQuery.toLowerCase();
    const queryMatch = trip.tripNo.toLowerCase().includes(query) ||
                       trip.customer.toLowerCase().includes(query) ||
                       trip.driver.toLowerCase().includes(query) ||
                       trip.vehicle.toLowerCase().includes(query);
    
    return statusMatch && queryMatch;
  });

  if (filteredTrips.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No trips found matching filter criteria.</div>`;
    return;
  }

  filteredTrips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'glass-card trip-card';
    card.innerHTML = `
      <div class="trip-card-header">
        <div>
          <span class="trip-id">${trip.tripNo}</span>
          <div class="trip-customer">${trip.customer}</div>
        </div>
        <span class="status-badge ${trip.status}">${trip.status}</span>
      </div>

      <div class="trip-route">
        <div class="route-dot start"></div>
        <div style="font-size: 0.8rem; font-weight: 500;">${trip.origin}</div>
        <div class="route-arrow"></div>
        <div class="route-dot end"></div>
        <div style="font-size: 0.8rem; font-weight: 500;">${trip.destination}</div>
      </div>

      <div class="trip-details">
        <div class="trip-detail-item">
          <span class="trip-detail-label">Driver</span>
          <span class="trip-detail-value">${trip.driver}</span>
        </div>
        <div class="trip-detail-item">
          <span class="trip-detail-label">Vehicle</span>
          <span class="trip-detail-value">${trip.vehicle}</span>
        </div>
        <div class="trip-detail-item">
          <span class="trip-detail-label">Distance</span>
          <span class="trip-detail-value">${trip.distance}</span>
        </div>
        <div class="trip-detail-item">
          <span class="trip-detail-label">${trip.startKm ? 'Odometer' : 'ETA'}</span>
          <span class="trip-detail-value">${trip.startKm ? `${trip.startKm.toLocaleString()} → ${trip.endKm ? trip.endKm.toLocaleString() : '...'}` : (trip.status === 'delivered' ? 'Completed' : (trip.status === 'issue' ? 'Suspended' : 'Live'))}</span>
        </div>
      </div>

      <div class="trip-progress-container">
        <div class="trip-progress-meta">
          <span>Delivery Progress</span>
          <span>${trip.progress}%</span>
        </div>
        <div class="trip-progress-bar-bg">
          <div class="trip-progress-bar-fill ${trip.status}" style="width: ${trip.progress}%"></div>
        </div>
      </div>

      <div class="trip-card-footer">
        <span class="trip-rev">₹${trip.revenue.toLocaleString()}</span>
        <button class="track-btn" onclick="startTrackingVehicle('${trip.vehicle}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          Track GPS
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function startTrackingVehicle(vehicleId) {
  state.selectedVehicleId = vehicleId;
  switchView('tracking');
}

// ----------------------------------------------------
// Vehicle Tracking View
// ----------------------------------------------------
let trackingFilterStatus = 'all';
let trackingSearchQuery = '';

function renderTrackingView() {
  const listContainer = document.getElementById('tracking-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  const filteredVehicles = state.vehicles.filter(v => {
    const statusMatch = trackingFilterStatus === 'all' || v.status === trackingFilterStatus;
    const query = trackingSearchQuery.toLowerCase();
    const queryMatch = v.id.toLowerCase().includes(query) || v.driver.toLowerCase().includes(query);
    return statusMatch && queryMatch;
  });

  filteredVehicles.forEach(vehicle => {
    const card = document.createElement('div');
    card.className = `tracking-vehicle-card ${state.selectedVehicleId === vehicle.id ? 'active' : ''}`;
    card.addEventListener('click', () => {
      state.selectedVehicleId = vehicle.id;
      // Re-render map and list highlights
      document.querySelectorAll('.tracking-vehicle-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      updateTrackingMap();
      renderTrackingStatsPanel();
    });

    const activeTrip = state.trips.find(t => t.vehicle === vehicle.id && t.status !== 'delivered');

    card.innerHTML = `
      <div class="tracking-vehicle-header">
        <span class="tracking-vehicle-id">${vehicle.id} - ${vehicle.type}</span>
        <span class="tracking-vehicle-status ${vehicle.status}"></span>
      </div>
      <div class="tracking-vehicle-meta">
        <span>Driver: <strong>${vehicle.driver}</strong></span>
        <span>${vehicle.speed} km/h</span>
      </div>
      <div style="font-size: 0.7rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
        Route: ${vehicle.currentRoute.join(' → ') || 'Unassigned (Depot A)'}
      </div>
    `;
    listContainer.appendChild(card);
  });

  updateTrackingMap();
  renderTrackingStatsPanel();
}

function updateTrackingMap() {
  const mapSvg = document.getElementById('tracking-map-svg');
  if (!mapSvg) return;

  // Clear map
  mapSvg.innerHTML = '';

  // Draw background water grid
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <pattern id="grid-track" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1"/>
    </pattern>
  `;
  mapSvg.appendChild(defs);
  
  const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  gridRect.setAttribute('width', '100%');
  gridRect.setAttribute('height', '100%');
  gridRect.setAttribute('fill', 'url(#grid-track)');
  mapSvg.appendChild(gridRect);

  // Re-draw background road vectors
  const nodeNames = Object.keys(state.nodes);
  for (let i = 0; i < nodeNames.length; i++) {
    for (let j = i + 1; j < nodeNames.length; j++) {
      const n1 = state.nodes[nodeNames[i]];
      const n2 = state.nodes[nodeNames[j]];
      
      const road = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      road.setAttribute('d', `M ${n1.x} ${n1.y} L ${n2.x} ${n2.y}`);
      road.setAttribute('class', 'map-roads');
      mapSvg.appendChild(road);
    }
  }

  // Draw Route History Line for selected vehicle
  const selectedVehicle = state.vehicles.find(v => v.id === state.selectedVehicleId);
  if (selectedVehicle && selectedVehicle.currentRoute.length > 0) {
    const pathPoints = selectedVehicle.currentRoute.map(n => state.nodes[n]);
    let dPath = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      dPath += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
    }

    const pathLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathLine.setAttribute('d', dPath);
    pathLine.setAttribute('class', `map-route-line ${selectedVehicle.status}`);
    pathLine.setAttribute('stroke-width', '4px');
    mapSvg.appendChild(pathLine);
  }

  // Draw all vehicle markers as smaller circles
  state.vehicles.forEach(vehicle => {
    const pos = getVehicleCoordinate(vehicle);
    const isSelected = vehicle.id === state.selectedVehicleId;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    group.style.cursor = 'pointer';

    group.addEventListener('click', () => {
      state.selectedVehicleId = vehicle.id;
      renderTrackingView();
    });

    if (isSelected) {
      // Draw highlighted tracking circle
      const trackingRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      trackingRing.setAttribute('r', '18');
      trackingRing.setAttribute('fill', 'none');
      trackingRing.setAttribute('stroke', 'var(--accent-secondary)');
      trackingRing.setAttribute('stroke-width', '2px');
      trackingRing.setAttribute('stroke-dasharray', '4 2');
      trackingRing.innerHTML = `<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite"/>`;
      group.appendChild(trackingRing);
    }

    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pin.setAttribute('r', isSelected ? '10' : '6');
    pin.setAttribute('class', `map-marker-pin ${vehicle.status}`);
    group.appendChild(pin);

    // Label on tracking view
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('y', isSelected ? '-14' : '-10');
    label.setAttribute('fill', isSelected ? 'var(--accent-secondary)' : 'var(--text-secondary)');
    label.setAttribute('font-size', isSelected ? '10px' : '8px');
    label.setAttribute('font-weight', '600');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = vehicle.id;
    group.appendChild(label);

    mapSvg.appendChild(group);
  });

  // Re-draw depot nodes
  for (const [key, node] of Object.entries(state.nodes)) {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', node.x);
    dot.setAttribute('cy', node.y);
    dot.setAttribute('r', '5');
    dot.setAttribute('class', 'map-depot');
    mapSvg.appendChild(dot);
  }
}

function renderTrackingStatsPanel() {
  const panel = document.getElementById('tracking-stats-panel');
  if (!panel) return;

  const vehicle = state.vehicles.find(v => v.id === state.selectedVehicleId);
  if (!vehicle) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  const activeTrip = state.trips.find(t => t.vehicle === vehicle.id && t.status !== 'delivered');

  panel.innerHTML = `
    <h3>Tracking Live Telemetry</h3>
    <div style="font-size:0.85rem; font-weight: 700; color:var(--accent-secondary); margin-top:4px;">${vehicle.id} [${vehicle.type}]</div>
    
    <div class="telemetry-grid">
      <div class="telemetry-item">
        <span class="telemetry-label">Driver Name</span>
        <span class="telemetry-value" style="font-size:0.75rem;">${vehicle.driver}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">Status</span>
        <span class="telemetry-value" style="color:var(--color-${vehicle.status}); text-transform:uppercase; font-size:0.75rem;">${vehicle.status}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">Current Speed</span>
        <span class="telemetry-value">${vehicle.speed} km/h</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">Fuel Level</span>
        <span class="telemetry-value">${vehicle.fuelLevel}%</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">Fuel Efficiency</span>
        <span class="telemetry-value" style="font-size:0.75rem;">${vehicle.fuelEfficiency}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">Progress</span>
        <span class="telemetry-value">${activeTrip ? activeTrip.progress : (vehicle.status === 'delivered' ? '100' : '0')}%</span>
      </div>
    </div>

    <div style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 10px;">
      <div class="telemetry-label">Active Route Coordinates</div>
      <div style="font-size: 0.75rem; margin-top: 4px; color: var(--text-primary);">
        ${vehicle.currentRoute.join(' → ') || 'No route coordinates available'}
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// Financial Dashboard & Chart Generator
// ----------------------------------------------------
function renderFinancialsView() {
  // Update totals
  document.getElementById('fin-rev-val').innerText = `₹${state.financials.monthlyRevenue.toLocaleString()}`;
  document.getElementById('fin-exp-val').innerText = `₹${state.financials.monthlyExpenses.toLocaleString()}`;
  document.getElementById('fin-profit-val').innerText = `₹${(state.financials.monthlyRevenue - state.financials.monthlyExpenses).toLocaleString()}`;
  document.getElementById('fin-fuel-val').innerText = state.financials.avgFuelEff;
  document.getElementById('fin-best-v-val').innerText = state.financials.bestVehicle;
  document.getElementById('fin-best-r-val').innerText = state.financials.bestRoute;

  // Generate SVG Line Chart (Revenue vs Expenses)
  generateSvgLineChart();

  // Generate SVG Pie/Donut Chart (Expense Distribution)
  generateSvgDonutChart();
}

function generateSvgLineChart() {
  const wrapper = document.getElementById('line-chart-wrapper');
  if (!wrapper) return;

  const data = state.financials.weeklyData;
  const padding = 35;
  const width = 450;
  const height = 180;
  
  const maxVal = 22000;
  
  // Grid lines
  let gridLines = '';
  for (let i = 0; i <= 4; i++) {
    const yVal = padding + ((height - 2 * padding) * i) / 4;
    const gridAmt = maxVal - (maxVal * i) / 4;
    gridLines += `
      <line x1="${padding}" y1="${yVal}" x2="${width - padding}" y2="${yVal}" class="chart-gridline" />
      <text x="${padding - 5}" y="${yVal + 3}" class="chart-text y-axis">${Math.floor(gridAmt / 1000)}k</text>
    `;
  }

  // Draw X axis labels
  let xLabels = '';
  const xStep = (width - 2 * padding) / (data.length - 1);
  data.forEach((d, idx) => {
    const xVal = padding + idx * xStep;
    xLabels += `<text x="${xVal}" y="${height - padding + 15}" class="chart-text">${d.day}</text>`;
  });

  // Calculate coordinates for lines
  let revPoints = [];
  let expPoints = [];
  data.forEach((d, idx) => {
    const x = padding + idx * xStep;
    const yRev = height - padding - ((d.revenue / maxVal) * (height - 2 * padding));
    const yExp = height - padding - ((d.expenses / maxVal) * (height - 2 * padding));
    
    revPoints.push(`${x},${yRev}`);
    expPoints.push(`${x},${yExp}`);
  });

  // Draw paths
  const revPath = `<path d="M ${revPoints.join(' L ')}" fill="none" stroke="var(--accent-secondary)" stroke-width="3" stroke-linecap="round" />`;
  const expPath = `<path d="M ${expPoints.join(' L ')}" fill="none" stroke="var(--color-issue)" stroke-width="3" stroke-linecap="round" />`;

  // Plot circular node points
  let dataPoints = '';
  data.forEach((d, idx) => {
    const [revX, revY] = revPoints[idx].split(',');
    const [expX, expY] = expPoints[idx].split(',');

    dataPoints += `
      <circle cx="${revX}" cy="${revY}" r="4" fill="var(--bg-secondary)" stroke="var(--accent-secondary)" stroke-width="2"/>
      <circle cx="${expX}" cy="${expY}" r="4" fill="var(--bg-secondary)" stroke="var(--color-issue)" stroke-width="2"/>
    `;
  });

  wrapper.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}">
      ${gridLines}
      ${xLabels}
      ${revPath}
      ${expPath}
      ${dataPoints}
      <!-- Border lines -->
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="chart-axis" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-axis" />
    </svg>
  `;
}

function generateSvgDonutChart() {
  const wrapper = document.getElementById('donut-chart-wrapper');
  if (!wrapper) return;

  const data = state.financials.expenseBreakdown;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const cx = 90;
  const cy = 90;
  const r = 50;
  const strokeWidth = 14;
  const circ = 2 * Math.PI * r;

  let currentAngle = -90; // Start at top
  let svgPaths = '';
  let legendHtml = '<div style="display:flex; flex-direction:column; gap:10px; flex:1; justify-content:center;">';

  data.forEach(item => {
    const percent = item.value / total;
    const dashArray = `${percent * circ} ${circ}`;
    const dashOffset = circ - (percent * circ);

    // Calculate arc segment using stroke-dashoffset
    svgPaths += `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${item.color}" 
              stroke-width="${strokeWidth}" 
              stroke-dasharray="${circ}" 
              stroke-dashoffset="${(1 - percent) * circ}" 
              transform="rotate(${currentAngle} ${cx} ${cy})"
              style="transition: stroke-dashoffset 0.5s ease; cursor:pointer;" />
    `;

    currentAngle += percent * 360;

    legendHtml += `
      <div style="display:flex; align-items:center; gap:8px; font-size:0.8rem;">
        <span style="width:12px; height:12px; border-radius:3px; background:${item.color}; display:inline-block;"></span>
        <span style="color:var(--text-secondary); flex:1;">${item.name}</span>
        <strong style="color:#fff;">₹${item.value.toLocaleString()}</strong>
      </div>
    `;
  });

  legendHtml += '</div>';

  wrapper.innerHTML = `
    <div style="display:flex; width:100%; gap:20px; align-items:center;">
      <svg width="180" height="180" viewBox="0 0 180 180" style="flex-shrink:0;">
        <circle cx="${cx}" cy="${cy}" r="${r - strokeWidth/2}" fill="var(--bg-secondary)" />
        ${svgPaths}
        <!-- Center label -->
        <text x="${cx}" y="${cy - 2}" fill="var(--text-muted)" font-size="8px" font-weight="600" text-anchor="middle" text-transform="uppercase">Total Expenses</text>
        <text x="${cx}" y="${cy + 12}" fill="#fff" font-size="12px" font-weight="700" text-anchor="middle">₹${(total / 1000).toFixed(1)}k</text>
      </svg>
      ${legendHtml}
    </div>
  `;
}

// ----------------------------------------------------
// Driver Interface Dashboard
// ----------------------------------------------------
function renderDriverDashboard() {
  const driverStatusText = document.getElementById('driver-status-text');
  const driverActionBtn = document.getElementById('driver-primary-action-btn');
  const activeTripCard = document.getElementById('driver-active-trip-card');
  const nextTripCard = document.getElementById('driver-next-trip-card');

  if (!driverStatusText) return;

  // Set header stats
  document.getElementById('driver-earnings-val').innerText = `₹${state.driverSession.earningsToday.toLocaleString()}`;
  document.getElementById('driver-trips-val').innerText = state.driverSession.status === 'running' ? '1' : '0';

  if (state.driverSession.status === 'running') {
    driverStatusText.innerHTML = `Running Trip: <strong>${state.driverSession.tripNo}</strong>`;
    driverActionBtn.className = 'driver-btn primary-action running';
    driverActionBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
      Complete & End Trip
    `;

    // Populate active trip card details
    activeTripCard.style.display = 'flex';
    nextTripCard.style.display = 'none';

    document.getElementById('driver-active-customer').innerText = state.driverSession.customer;
    document.getElementById('driver-active-trip-no').innerText = state.driverSession.tripNo;
    document.getElementById('driver-route-start').innerText = state.driverSession.startLocationName;
    document.getElementById('driver-route-end').innerText = state.driverSession.endLocationName;
    document.getElementById('driver-dist-val').innerText = state.driverSession.distanceTraveled;
    document.getElementById('driver-time-val').innerText = state.driverSession.elapsedTime;
  } else {
    driverStatusText.innerHTML = `Status: <strong>Available / Idle</strong>`;
    driverActionBtn.className = 'driver-btn primary-action';
    driverActionBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699-2.7c-.1.3-.21.61-.33.92m-.13 3.49c-.21.3-.43.6-.66.9" /></svg>
      Start Assigned Trip
    `;

    // Show unassigned next available trip container
    activeTripCard.style.display = 'none';
    nextTripCard.style.display = 'flex';
  }
}

function renderDriverLogs() {
  const container = document.getElementById('driver-logs-container');
  if (!container) return;

  container.innerHTML = `
    <div class="driver-card">
      <div class="driver-card-title">Fuel Expenses Submitted</div>
      <div id="driver-fuel-log-list" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>
    <div class="driver-card">
      <div class="driver-card-title">Toll Plaza Logging</div>
      <div id="driver-toll-log-list" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>
  `;

  // Populate fuel logs
  const fuelList = document.getElementById('driver-fuel-log-list');
  state.driverSession.fuelLogs.forEach(log => {
    const div = document.createElement('div');
    div.style = 'display:flex; justify-content:space-between; font-size:0.8rem; border-bottom: 1px solid #f1f5f9; padding-bottom:6px;';
    div.innerHTML = `
      <div>
        <div style="font-weight:600; color:var(--driver-text-title);">${log.amount}</div>
        <div style="font-size:0.7rem; color:var(--driver-text-body);">${log.date}</div>
      </div>
      <span style="font-size:0.75rem; font-weight:500; color:#4f46e5;">Qty: ${log.qty}</span>
    `;
    fuelList.appendChild(div);
  });

  // Populate toll logs
  const tollList = document.getElementById('driver-toll-log-list');
  state.driverSession.tollLogs.forEach(log => {
    const div = document.createElement('div');
    div.style = 'display:flex; justify-content:space-between; font-size:0.8rem; border-bottom: 1px solid #f1f5f9; padding-bottom:6px;';
    div.innerHTML = `
      <div>
        <div style="font-weight:600; color:var(--driver-text-title);">${log.amount}</div>
        <div style="font-size:0.7rem; color:var(--driver-text-body);">${log.location}</div>
      </div>
      <span style="font-size:0.7rem; color:var(--driver-text-body);">${log.date}</span>
    `;
    tollList.appendChild(div);
  });
}

function renderDriverTrips() {
  const list = document.getElementById('driver-trips-list');
  if (!list) return;

  list.innerHTML = '';
  // Show historical + upcoming driver assignments
  const dummyHistory = [
    { id: 'TR-3012', start: 'Depot A', end: 'Harbor Terminal', date: 'Today, 2:30 PM', rev: '₹2,400', status: 'Active' },
    { id: 'TR-2988', start: 'Airport Cargo', end: 'South Warehouse', date: 'Yesterday, 10:15 AM', rev: '₹3,200', status: 'Completed' },
    { id: 'TR-2954', start: 'Harbor Terminal', end: 'City Hub', date: '28 Jun 2026', rev: '₹1,950', status: 'Completed' }
  ];

  dummyHistory.forEach(trip => {
    const div = document.createElement('div');
    div.className = 'driver-card';
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; font-size:0.9rem;">${trip.id}</span>
        <span style="padding: 2px 8px; border-radius:20px; font-size:0.65rem; font-weight:600; 
              background:${trip.status === 'Active' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; 
              color:${trip.status === 'Active' ? '#4f46e5' : '#10b981'};">${trip.status}</span>
      </div>
      <div style="font-size:0.8rem; display:flex; justify-content:space-between; margin-top:4px;">
        <span>Route: <strong>${trip.start} → ${trip.end}</strong></span>
        <strong>${trip.rev}</strong>
      </div>
      <div style="font-size:0.7rem; color:var(--driver-text-body); margin-top:2px;">Date: ${trip.date}</div>
    `;
    list.appendChild(div);
  });
}

// ----------------------------------------------------
// Interaction Event Handlers
// ----------------------------------------------------
function setupEventListeners() {
  // Global Role switches
  document.getElementById('btn-role-manager').addEventListener('click', () => {
    document.getElementById('btn-role-manager').classList.add('active');
    document.getElementById('btn-role-driver').classList.remove('active');
    
    // Switch themes & display
    document.body.style.backgroundColor = 'var(--bg-primary)';
    document.body.style.color = 'var(--text-primary)';
    
    document.getElementById('sidebar-panel').style.display = 'flex';
    document.getElementById('manager-view-frame').style.display = 'block';
    document.getElementById('driver-interface-view').classList.remove('active');
    
    switchView('dashboard');
  });

  document.getElementById('btn-role-driver').addEventListener('click', () => {
    document.getElementById('btn-role-driver').classList.add('active');
    document.getElementById('btn-role-manager').classList.remove('active');
    
    // Hide manager sidebar & layout frames
    document.getElementById('sidebar-panel').style.display = 'none';
    document.getElementById('manager-view-frame').style.display = 'none';
    document.getElementById('driver-interface-view').classList.add('active');
    
    switchDriverSubView('dashboard');
  });

  // Simulator controls
  document.getElementById('sim-speed-control').addEventListener('click', () => {
    if (state.simSpeed === 1) {
      state.simSpeed = 3;
      document.getElementById('sim-speed-control').innerText = 'Sim Speed: 3x';
      triggerNotification('Simulation speed accelerated to 3x', 'info');
    } else if (state.simSpeed === 3) {
      state.simSpeed = 0;
      document.getElementById('sim-speed-control').innerText = 'Sim: Paused';
      triggerNotification('Simulation loop paused', 'warning');
    } else {
      state.simSpeed = 1;
      document.getElementById('sim-speed-control').innerText = 'Sim Speed: 1x';
      triggerNotification('Simulation resumed at normal rate', 'info');
    }
  });

  document.getElementById('sim-trigger-issue').addEventListener('click', () => {
    // Inject a breakdown randomly into a running vehicle
    const movingVehicles = state.vehicles.filter(v => v.status === 'running');
    if (movingVehicles.length > 0) {
      const luckyVehicle = movingVehicles[Math.floor(Math.random() * movingVehicles.length)];
      luckyVehicle.status = 'issue';
      luckyVehicle.speed = 0;
      
      const trip = state.trips.find(t => t.vehicle === luckyVehicle.id && t.status !== 'delivered');
      if (trip) trip.status = 'issue';
      
      addActivityItem('issue-reported', `Emergency dispatch: Driver <strong>${luckyVehicle.driver}</strong> (${luckyVehicle.id}) reported critical sensor error.`);
      triggerNotification(`Breakdown reported on ${luckyVehicle.id}! Operations team notified.`, 'error');
      
      renderAllViews();
    } else {
      triggerNotification('No active running vehicles to trigger issues on.', 'warning');
    }
  });

  // Trip Search & Filters
  const searchInput = document.getElementById('trip-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      tripSearchQuery = e.target.value;
      renderTripsList();
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTripFilter = btn.getAttribute('data-filter');
      renderTripsList();
    });
  });

  // Tracking View Filters
  const trackingSearch = document.getElementById('tracking-search');
  if (trackingSearch) {
    trackingSearch.addEventListener('input', (e) => {
      trackingSearchQuery = e.target.value;
      renderTrackingView();
    });
  }

  const trackingFilter = document.getElementById('tracking-filter-select');
  if (trackingFilter) {
    trackingFilter.addEventListener('change', (e) => {
      trackingFilterStatus = e.target.value;
      renderTrackingView();
    });
  }

  // Dashboard Map Controls
  const zoomInBtn = document.getElementById('btn-zoom-in');
  const zoomOutBtn = document.getElementById('btn-zoom-out');
  const resetZoomBtn = document.getElementById('btn-zoom-reset');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      state.zoomLevel = Math.min(state.zoomLevel + 0.15, 2.5);
      applyMapZoom();
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      state.zoomLevel = Math.max(state.zoomLevel - 0.15, 0.6);
      applyMapZoom();
    });
  }
  if (resetZoomBtn) {
    resetZoomBtn.addEventListener('click', () => {
      state.zoomLevel = 1.0;
      applyMapZoom();
    });
  }

  // ----------------------------------------------------
  // Driver Event Forms Actions
  // ----------------------------------------------------
  const primaryDriverBtn = document.getElementById('driver-primary-action-btn');
  if (primaryDriverBtn) {
    primaryDriverBtn.addEventListener('click', () => {
      if (state.driverSession.status === 'idle') {
        // Trigger Start Trip Odometer Input Modal
        const defaultStartKm = state.driverSession.startOdometer || 14250;
        openDriverModal('Start Trip: Enter Odometer Reading', `
          <div class="driver-form-group">
            <label class="driver-form-label">Starting Odometer (KM)</label>
            <input type="number" id="input-start-km" class="driver-form-input" value="${defaultStartKm}" min="1" required>
          </div>
          <p style="font-size:0.7rem; color:var(--driver-text-body); margin-top:2px;">Verify vehicle MH-12-QW-5640 odometer before starting.</p>
          <button class="driver-btn primary-action" style="margin-top:10px; border:none;" onclick="submitStartTrip()">Confirm & Start Trip</button>
        `);
      } else {
        // Trigger Complete Trip Odometer Input Modal
        const minEndKm = (state.driverSession.startOdometer || 14250) + 1;
        const defaultEndKm = minEndKm + 120; // Suggest +120 KM based on Samsung trip length
        openDriverModal('Complete Trip: Enter Odometer Reading', `
          <div class="driver-form-group">
            <label class="driver-form-label">Ending Odometer (KM)</label>
            <input type="number" id="input-end-km" class="driver-form-input" value="${defaultEndKm}" min="${minEndKm}" required>
          </div>
          <p style="font-size:0.7rem; color:var(--driver-text-body); margin-top:2px;">Starting Odometer reading was: ${state.driverSession.startOdometer} KM</p>
          <button class="driver-btn primary-action" style="margin-top:10px; border:none;" onclick="submitEndTrip()">Confirm & Complete Trip</button>
        `);
      }
    });
  }

  // Fuel modal controls
  document.getElementById('btn-driver-fuel').addEventListener('click', () => {
    openDriverModal('Add Fuel Expense', `
      <div class="driver-form-group">
        <label class="driver-form-label">Fuel Amount (INR)</label>
        <input type="number" id="input-fuel-amount" class="driver-form-input" placeholder="e.g. 2500" required>
      </div>
      <div class="driver-form-group">
        <label class="driver-form-label">Quantity (Liters)</label>
        <input type="number" id="input-fuel-qty" class="driver-form-input" placeholder="e.g. 25" required>
      </div>
      <button class="driver-btn primary-action" style="margin-top:10px;" onclick="submitFuelLog()">Submit Fuel Invoice</button>
    `);
  });

  // Toll modal controls
  document.getElementById('btn-driver-toll').addEventListener('click', () => {
    openDriverModal('Log Toll Plaza', `
      <div class="driver-form-group">
        <label class="driver-form-label">Toll Amount (INR)</label>
        <input type="number" id="input-toll-amount" class="driver-form-input" placeholder="e.g. 350" required>
      </div>
      <div class="driver-form-group">
        <label class="driver-form-label">Toll Plaza Location</label>
        <input type="text" id="input-toll-location" class="driver-form-input" placeholder="e.g. NH-8 Gurgaon Toll Plaza" required>
      </div>
      <button class="driver-btn primary-action" style="margin-top:10px;" onclick="submitTollLog()">Log Toll Payment</button>
    `);
  });

  // Document Upload Mock modal
  document.getElementById('btn-driver-upload').addEventListener('click', () => {
    openDriverModal('Upload Logistics Invoice / POD', `
      <div class="driver-form-group">
        <label class="driver-form-label">Select Document Type</label>
        <select id="input-doc-type" class="driver-form-input">
          <option>Proof of Delivery (POD)</option>
          <option>Lorry Receipt (LR)</option>
          <option>Fuel Receipt Slip</option>
          <option>Toll Slip</option>
        </select>
      </div>
      <div class="driver-form-group">
        <label class="driver-form-label">Choose File</label>
        <input type="file" class="driver-form-input">
      </div>
      <button class="driver-btn primary-action" style="margin-top:10px;" onclick="submitDocumentMock()">Upload & Verify Document</button>
    `);
  });

  // Close modals
  document.getElementById('driver-modal-close-btn').addEventListener('click', closeDriverModal);
}

function applyMapZoom() {
  const maps = ['dashboard-map-svg', 'tracking-map-svg'];
  maps.forEach(mapId => {
    const map = document.getElementById(mapId);
    if (map) {
      map.style.transform = `scale(${state.zoomLevel})`;
      map.style.transformOrigin = 'center';
      map.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    }
  });
}

// ----------------------------------------------------
// Driver Modal Core Actions
// ----------------------------------------------------
function openDriverModal(title, formHtml) {
  const overlay = document.getElementById('driver-modal-overlay');
  const titleEl = document.getElementById('driver-modal-title');
  const bodyEl = document.getElementById('driver-modal-body');

  titleEl.innerText = title;
  bodyEl.innerHTML = formHtml;
  overlay.style.display = 'flex';
}

function closeDriverModal() {
  const overlay = document.getElementById('driver-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

// Inline bindings since they are added dynamically via string templates
window.submitFuelLog = function() {
  const amtInput = document.getElementById('input-fuel-amount');
  const qtyInput = document.getElementById('input-fuel-qty');
  
  if (!amtInput.value || !qtyInput.value) {
    alert('Please enter all details');
    return;
  }

  const amt = parseInt(amtInput.value);
  const qty = parseInt(qtyInput.value);

  // Update Driver state
  const timeStr = 'Today, ' + new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  state.driverSession.fuelLogs.unshift({
    date: timeStr,
    amount: `₹${amt.toLocaleString()}`,
    qty: `${qty} L`
  });

  // Update Operations KPIs
  state.kpis.fuelExpenseToday += amt;

  // Add Activity Feed
  addActivityItem('fuel-added', `Fuel logged by driver <strong>Arjun Singh</strong> (V-101): ₹${amt.toLocaleString()} (${qty} Liters)`);
  triggerNotification(`Fuel entry ₹${amt.toLocaleString()} logged successfully.`, 'success');

  closeDriverModal();
  renderDriverLogs();
  renderKPIs();
};

window.submitTollLog = function() {
  const amtInput = document.getElementById('input-toll-amount');
  const locInput = document.getElementById('input-toll-location');
  
  if (!amtInput.value || !locInput.value) {
    alert('Please enter all details');
    return;
  }

  const amt = parseInt(amtInput.value);
  const loc = locInput.value;

  // Update Driver state
  const timeStr = 'Today, ' + new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  state.driverSession.tollLogs.unshift({
    date: timeStr,
    amount: `₹${amt.toLocaleString()}`,
    location: loc
  });

  // Update Operations KPIs
  state.kpis.tollExpenseToday += amt;

  // Add Activity Feed
  addActivityItem('toll-added', `Toll Plaza expense logged for <strong>V-101</strong>: ₹${amt.toLocaleString()} at <strong>${loc}</strong>`);
  triggerNotification(`Toll expense ₹${amt.toLocaleString()} logged.`, 'success');

  closeDriverModal();
  renderDriverLogs();
  renderKPIs();
};

window.submitDocumentMock = function() {
  const docType = document.getElementById('input-doc-type').value;
  
  // Add to Activity Feed
  addActivityItem('trip-started', `Document upload: Driver <strong>Arjun Singh</strong> uploaded <strong>${docType}</strong> for validation.`);
  triggerNotification(`Document "${docType}" uploaded. Auto-verifying...`, 'info');

  closeDriverModal();

  setTimeout(() => {
    triggerNotification(`Document "${docType}" verified successfully!`, 'success');
  }, 3000);
};

// Login Handling Functions
window.updateDefaultCredentials = function() {
  const role = document.getElementById('login-role').value;
  const emailInput = document.getElementById('login-email');
  
  if (role === 'manager') {
    emailInput.value = 'manager@fleetflow.com';
  } else {
    emailInput.value = 'driver@fleetflow.com';
  }
};

window.handleLogin = function(event) {
  event.preventDefault();
  
  const role = document.getElementById('login-role').value;
  const email = document.getElementById('login-email').value;
  
  // Hide login screen
  document.getElementById('login-view').style.display = 'none';
  
  if (role === 'manager') {
    // Show manager view frame, headers, sidebars
    document.getElementById('app-header').style.display = 'flex';
    document.getElementById('sidebar-panel').style.display = 'flex';
    document.getElementById('manager-view-frame').style.display = 'block';
    document.getElementById('driver-interface-view').classList.remove('active');
    
    // De-activate driver role button highlight, activate manager button highlight
    document.getElementById('btn-role-manager').classList.add('active');
    document.getElementById('btn-role-driver').classList.remove('active');
    
    switchView('dashboard');
    triggerNotification(`Logged in as Operations Manager (${email})`, 'success');
  } else {
    // Show driver mobile frame, hide manager frames
    document.getElementById('app-header').style.display = 'none';
    document.getElementById('sidebar-panel').style.display = 'none';
    document.getElementById('manager-view-frame').style.display = 'none';
    document.getElementById('driver-interface-view').classList.add('active');
    
    // Sync header button state just in case
    document.getElementById('btn-role-driver').classList.add('active');
    document.getElementById('btn-role-manager').classList.remove('active');
    
    switchDriverSubView('dashboard');
    triggerNotification(`Logged in as Driver Arjun Singh (${email})`, 'success');
  }
};

// Logout triggers binding
window.handleLogout = function() {
  // Hide all main structures
  document.getElementById('app-header').style.display = 'none';
  document.getElementById('sidebar-panel').style.display = 'none';
  document.getElementById('manager-view-frame').style.display = 'none';
  document.getElementById('driver-interface-view').classList.remove('active');
  
  // Show login screen
  document.getElementById('login-view').style.display = 'flex';
  
  triggerNotification('Signed out successfully.', 'info');
};

// Bind sign out elements dynamically
const originalSetupListeners = setupEventListeners;
setupEventListeners = function() {
  originalSetupListeners();
  
  // Manager Sign Out
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // Driver Sign Out
  const driverLogoutBtn = document.getElementById('btn-driver-logout');
  if (driverLogoutBtn) {
    driverLogoutBtn.addEventListener('click', () => {
      handleLogout();
    });
  }
};

// Odometer Trip Sign In/Sign Out Verification Forms
window.submitStartTrip = function() {
  const kmInput = document.getElementById('input-start-km');
  if (!kmInput || !kmInput.value) {
    alert('Please enter starting KM');
    return;
  }
  const startKm = parseInt(kmInput.value);
  if (isNaN(startKm) || startKm <= 0) {
    alert('Please enter a valid starting odometer reading.');
    return;
  }

  // Update Driver state
  state.driverSession.status = 'running';
  state.driverSession.startOdometer = startKm;
  state.driverSession.distanceTraveled = '0 km';
  state.driverSession.elapsedTime = 'Just started';
  
  // Update vehicle state in main system
  const activeV = state.vehicles.find(v => v.id === state.driverSession.vehicleId);
  if (activeV) {
    activeV.status = 'running';
    activeV.routeIdx = 0;
    activeV.routeProgress = 0;
    activeV.speed = 52;
    activeV.currentRoute = ['Depot A', 'City Hub', 'Harbor Terminal'];
  }

  const activeT = state.trips.find(t => t.vehicle === state.driverSession.vehicleId);
  if (activeT) {
    activeT.status = 'running';
    activeT.progress = 0;
    activeT.startKm = startKm;
  }

  state.kpis.tripsRunning++;

  addActivityItem('trip-started', `Driver <strong>${state.driverSession.vehicleId}</strong> started trip <strong>${state.driverSession.tripNo}</strong> at Odo: <strong>${startKm.toLocaleString()} KM</strong>`);
  triggerNotification(`Trip started. Logged starting Odometer: ${startKm.toLocaleString()} KM`, 'success');

  closeDriverModal();
  renderDriverDashboard();
  renderAllViews();
};

window.submitEndTrip = function() {
  const kmInput = document.getElementById('input-end-km');
  if (!kmInput || !kmInput.value) {
    alert('Please enter ending KM');
    return;
  }
  const endKm = parseInt(kmInput.value);
  if (isNaN(endKm) || endKm <= state.driverSession.startOdometer) {
    alert(`Please enter a valid ending odometer reading (must be greater than starting reading of ${state.driverSession.startOdometer.toLocaleString()} KM).`);
    return;
  }

  const distanceDiff = endKm - state.driverSession.startOdometer;

  // Update Driver state
  state.driverSession.status = 'idle';
  state.driverSession.endOdometer = endKm;
  
  // Update vehicle state
  const activeV = state.vehicles.find(v => v.id === state.driverSession.vehicleId);
  if (activeV) {
    activeV.status = 'delivered';
    activeV.speed = 0;
    activeV.routeProgress = 1.0;
  }

  const activeT = state.trips.find(t => t.vehicle === state.driverSession.vehicleId && t.status !== 'delivered');
  if (activeT) {
    activeT.status = 'delivered';
    activeT.progress = 100;
    activeT.endKm = endKm;
    activeT.distance = `${distanceDiff} km`;
    
    state.kpis.tripsRunning--;
    state.kpis.tripsCompleted++;
    state.kpis.revenueToday += activeT.revenue;
    state.kpis.profitToday += Math.floor(activeT.revenue * 0.7);

    // Save end odometer value for next trip's start
    state.driverSession.startOdometer = endKm;

    addActivityItem('delivered', `Delivery completed: Trip <strong>${activeT.tripNo}</strong> reached destination. Odo: <strong>${endKm.toLocaleString()} KM</strong> (Logged distance: <strong>${distanceDiff} KM</strong>)`);
    triggerNotification(`Trip completed. Odometer logged. Revenue: ₹${activeT.revenue.toLocaleString()}`, 'success');
  }

  closeDriverModal();
  renderDriverDashboard();
  renderAllViews();
};

