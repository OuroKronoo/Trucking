// ── MOBILE MENU ──
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// ── MODAL ──
function openModal() {
  document.getElementById('quoteModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('quoteModal').classList.remove('open');
  document.body.style.overflow = '';
}
function handleModalClick(e) {
  if (e.target === document.getElementById('quoteModal')) closeModal();
}
function submitModal() {
  document.getElementById('modalFormWrap').style.display = 'none';
  document.getElementById('modalSuccess').classList.add('show');
}

// ── CONTACT FORM ──
function submitContactForm() {
  document.getElementById('contactFormWrap').style.display = 'none';
  document.getElementById('formSuccess').classList.add('show');
}
function resetForm() {
  document.getElementById('contactFormWrap').style.display = 'block';
  document.getElementById('formSuccess').classList.remove('show');
}

// ── FLEET FILTER ──
function filterFleet(cat, btn) {
  document.querySelectorAll('.fleet-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.fleet-card').forEach(card => {
    const cats = card.dataset.category || '';
    if (cat === 'all' || cats.includes(cat)) {
      card.style.display = '';
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 10);
    } else {
      card.style.display = 'none';
    }
  });
}

// ── HOW IT WORKS STEPS ──
function setActiveStep(el) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

// ── SHIPMENT TRACKER DATA ──
const trackData = {
  'TC-2024-98271': {
    origin: 'Manila',
    dest: 'Cebu City',
    eta: 'May 20, 2026',
    status: 'In Transit',
    step: 3,
    // Coordinates: [lat, lng]
    originCoords: [14.5995, 120.9842],   // Manila
    destCoords:   [10.3157, 123.8854],   // Cebu City
    truckCoords:  [13.0827, 122.5640],   // Mid-point: Visayan Sea area
  },
  'TC-2024-77532': {
    origin: 'Quezon City',
    dest: 'Davao City',
    eta: 'May 19, 2026',
    status: 'Out for Delivery',
    step: 4,
    originCoords: [14.6760, 121.0437],  // Quezon City
    destCoords:   [7.1907, 125.4553],   // Davao City
    truckCoords:  [8.4800, 126.0000],   // Near Davao
  },
  'TC-2024-44819': {
    origin: 'Makati',
    dest: 'Iloilo City',
    eta: 'May 18, 2026',
    status: 'Delivered',
    step: 5,
    originCoords: [14.5547, 121.0244],  // Makati
    destCoords:   [10.7202, 122.5621],  // Iloilo City
    truckCoords:  [10.7202, 122.5621],  // Same as dest since delivered
  },
};

// ── LEAFLET MAP INSTANCE ──
let trackMap = null;
let mapMarkers = [];
let mapPolyline = null;
let mapTruckMarker = null;

function initTrackMap(data) {
  const mapSection = document.getElementById('trackMapSection');
  mapSection.classList.add('show');

  // Remove old map if any
  if (trackMap) {
    trackMap.remove();
    trackMap = null;
    mapMarkers = [];
    mapPolyline = null;
    mapTruckMarker = null;
  }

  // Init Leaflet map
  trackMap = L.map('trackMap', { zoomControl: true, scrollWheelZoom: false });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(trackMap);

  // Custom icons
  const originIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:#F5A623;border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const destIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:#2E7D32;border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  const truckIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:#F5A623;border:3px solid #D4880A;
      box-shadow:0 4px 16px rgba(245,166,35,0.6);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
    ">
      <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#111;">
        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
      </svg>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  // Add origin marker
  const oMarker = L.marker(data.originCoords, { icon: originIcon })
    .addTo(trackMap)
    .bindPopup(`<strong>Origin:</strong> ${data.origin}`, { className: 'track-popup' });

  // Add destination marker
  const dMarker = L.marker(data.destCoords, { icon: destIcon })
    .addTo(trackMap)
    .bindPopup(`<strong>Destination:</strong> ${data.dest}<br><strong>ETA:</strong> ${data.eta}`, { className: 'track-popup' });

  // Draw dashed route line (origin -> dest)
  const routeLine = L.polyline([data.originCoords, data.destCoords], {
    color: 'rgba(255,255,255,0.15)',
    weight: 2,
    dashArray: '8, 8',
  }).addTo(trackMap);

  // Draw progress line (origin -> truck current)
  const progressLine = L.polyline([data.originCoords, data.truckCoords], {
    color: '#F5A623',
    weight: 3,
    opacity: 0.85,
  }).addTo(trackMap);

  // Add truck (current location) marker
  mapTruckMarker = L.marker(data.truckCoords, { icon: truckIcon })
    .addTo(trackMap)
    .bindPopup(`<strong>Current Location</strong><br>Lat: ${data.truckCoords[0].toFixed(4)}, Lng: ${data.truckCoords[1].toFixed(4)}`)
    .openPopup();

  mapMarkers = [oMarker, dMarker];
  mapPolyline = progressLine;

  // Fit bounds to show all points with padding
  // invalidateSize ensures Leaflet recalculates layout after being shown from display:none
  trackMap.invalidateSize();
  const bounds = L.latLngBounds([data.originCoords, data.destCoords, data.truckCoords]);
  trackMap.fitBounds(bounds, { padding: [40, 40] });

  // Scroll map into view smoothly
  document.getElementById('trackMapSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── SHIPMENT TRACKER ──
function trackShipment() {
  const id = document.getElementById('trackInput').value.trim().toUpperCase();
  const result = document.getElementById('trackerResult');
  const data = trackData[id];

  if (!data) {
    document.getElementById('trackInput').style.borderColor = '#e74c3c';
    setTimeout(() => document.getElementById('trackInput').style.borderColor = '', 1500);
    return;
  }

  document.getElementById('trackIdDisplay').textContent = id;
  document.getElementById('trackStatus').textContent = data.status;
  document.getElementById('trackOrigin').textContent = data.origin;
  document.getElementById('trackDest').textContent = data.dest;
  document.getElementById('trackETA').textContent = data.eta;

  // Badge color based on status
  const badge = document.getElementById('trackStatus');
  if (data.step === 5) {
    badge.style.background = '#E8F5E9';
    badge.style.color = '#2E7D32';
  } else {
    badge.style.background = '#FFF3D6';
    badge.style.color = '#D4880A';
  }

  // Update step states
  const steps = ['ts1', 'ts2', 'ts3', 'ts4', 'ts5'];
  steps.forEach((sid, i) => {
    const el = document.getElementById(sid);
    const dot = el.querySelector('.track-dot');
    el.className = 'track-step';
    dot.className = 'track-dot';
    if (i + 1 < data.step) {
      el.classList.add('done'); dot.classList.add('done'); dot.textContent = '\u2713';
    } else if (i + 1 === data.step) {
      el.classList.add('active'); dot.classList.add('active'); dot.textContent = i === 4 ? '\u2713' : '\u2192';
    } else {
      dot.textContent = i + 1;
    }
  });

  // Progress bar: spans from step 1 dot (10%) to step 5 dot (90%) = 80% total range
  // At step 1: 0%, step 2: 25%, step 3: 50%, step 4: 75%, step 5: 100% (of the 80% span)
  const pct = ((data.step - 1) / 4) * 100;
  document.getElementById('trackProgress').style.width = pct + '%';

  result.classList.add('show');
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Initialize map
  setTimeout(() => initTrackMap(data), 300);
}

document.getElementById('trackInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') trackShipment();
});

// ── CHAT ──
let chatOpen = false;
const chatReplies = [
  "Thanks for reaching out! Our team will follow up shortly.",
  "Great question! You can get a free quote by clicking the 'Get Quote' button at the top.",
  "We offer 24/7 support. Feel free to call +63 917 000 1234 anytime.",
  "We cover all major routes nationwide — from Metro Manila to Mindanao!",
  "Our cold chain fleet maintains temperatures from -20 degrees C to 10 degrees C."
];
let replyIdx = 0;

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatPanel').classList.toggle('open', chatOpen);
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  const msgs = document.getElementById('chatMessages');
  const outDiv = document.createElement('div');
  outDiv.className = 'chat-msg outgoing';
  outDiv.textContent = msg;
  msgs.appendChild(outDiv);
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    const inDiv = document.createElement('div');
    inDiv.className = 'chat-msg incoming';
    inDiv.textContent = chatReplies[replyIdx % chatReplies.length];
    replyIdx++;
    msgs.appendChild(inDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }, 900);
}

function handleChatEnter(e) {
  if (e.key === 'Enter') sendChatMessage();
}

// ── SCROLL REVEAL ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── COUNTER ANIMATION ──
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '+';
      if (!el.dataset.animated) {
        el.dataset.animated = true;
        let current = 0;
        const step = target / 50;
        const interval = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.round(current) + suffix;
          if (current >= target) clearInterval(interval);
        }, 30);
      }
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// ── WEIGHT RECOMMENDER ──
const TRUCKS = [
  { name: 'Mini Van',             cap: 1000,  capLabel: 'up to 1,000 kg',  badge: 'Best for last-mile & urban' },
  { name: '4-Wheeler Closed Van', cap: 3000,  capLabel: 'up to 3,000 kg',  badge: 'Best for city & province runs' },
  { name: '6-Wheeler Truck',      cap: 7000,  capLabel: 'up to 7,000 kg',  badge: 'Best for regional freight' },
  { name: 'Reefer Truck',         cap: 5000,  capLabel: 'up to 5,000 kg',  badge: 'Cold chain specialist' },
  { name: '10-Wheeler Truck',     cap: 15000, capLabel: 'up to 15,000 kg', badge: 'Best for long haul & heavy cargo' },
];

function getTruckForWeight(kg) {
  const sorted = [...TRUCKS].sort((a, b) => a.cap - b.cap);
  return sorted.find(t => kg <= t.cap) || null;
}

function onWeightInput(val) {
  const kg = parseFloat(val);
  document.getElementById('weightSlider').value = Math.min(kg || 0, 15000);
  document.querySelectorAll('.weight-preset').forEach(b => b.classList.remove('active'));
  runRecommendation(kg);
}

function onSliderInput(val) {
  document.getElementById('weightInput').value = val;
  document.querySelectorAll('.weight-preset').forEach(b => b.classList.remove('active'));
  runRecommendation(parseFloat(val));
}

function setWeight(kg, btn) {
  document.getElementById('weightInput').value = kg;
  document.getElementById('weightSlider').value = kg;
  document.querySelectorAll('.weight-preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  runRecommendation(kg);
}

function runRecommendation(kg) {
  const rec = document.getElementById('truckRec');
  const warn = document.getElementById('recWarning');
  const alts = document.getElementById('recAlts');
  if (!kg || kg <= 0) { rec.classList.remove('show'); return; }

  rec.classList.add('show');
  const truck = getTruckForWeight(kg);
  warn.classList.remove('show');
  alts.innerHTML = '';

  if (!truck) {
    warn.classList.add('show');
    document.getElementById('recName').textContent = '10-Wheeler Truck x2+';
    document.getElementById('recCap').textContent = 'Exceeds single vehicle capacity';
    document.getElementById('recBar').style.width = '100%';
    document.getElementById('recFitLabel').textContent = 'Multiple trucks needed';
    return;
  }

  const pct = Math.min(Math.round((kg / truck.cap) * 100), 100);
  document.getElementById('recName').textContent = truck.name;
  document.getElementById('recCap').textContent = `${truck.capLabel} - ${truck.badge}`;
  document.getElementById('recBar').style.width = pct + '%';
  document.getElementById('recFitLabel').textContent = `Load fill: ${pct}% (${kg.toLocaleString()} kg / ${truck.cap.toLocaleString()} kg capacity)`;

  const alternatives = TRUCKS.filter(t => t.name !== truck.name && t.cap >= kg).slice(0, 3);
  if (alternatives.length) {
    alts.innerHTML = '<div style="font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;width:100%;">Also works:</div>';
    alternatives.forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'rec-alt-chip';
      chip.textContent = t.name + ` (${t.capLabel})`;
      alts.appendChild(chip);
    });
  }
}

// ── CARGO GRID VISUALIZER ──
const GRID_COLS = 14;
const GRID_ROWS = 6;
const TOTAL_SLOTS = GRID_COLS * GRID_ROWS;

let filledSlots = new Set();
let pkgRows = 1, pkgCols = 1;
let packageCount = 0;
let isDragging = false;
let dragFillMode = true;

function initCargoGrid() {
  const svg = document.getElementById('truckShellSvg');
  const overlay = document.getElementById('cargoSlotsOverlay');

  function positionOverlay() {
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / 520;
    const scaleY = rect.height / 220;
    const ox = 26 * scaleX;
    const oy = 54 * scaleY;
    const ow = 328 * scaleX;
    const oh = 122 * scaleY;
    overlay.style.left = ox + 'px';
    overlay.style.top = oy + 'px';
    overlay.style.width = ow + 'px';
    overlay.style.height = oh + 'px';
    const slotW = (ow - (GRID_COLS - 1) * 3) / GRID_COLS;
    const slotH = (oh - (GRID_ROWS - 1) * 3) / GRID_ROWS;
    overlay.style.gridTemplateColumns = `repeat(${GRID_COLS}, ${slotW.toFixed(1)}px)`;
    overlay.style.gridTemplateRows = `repeat(${GRID_ROWS}, ${slotH.toFixed(1)}px)`;
  }

  overlay.innerHTML = '';
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const slot = document.createElement('div');
      slot.className = 'cargo-slot';
      slot.dataset.r = r;
      slot.dataset.c = c;
      slot.dataset.idx = r * GRID_COLS + c;

      slot.addEventListener('mousedown', (e) => {
        isDragging = true;
        const idx = parseInt(slot.dataset.idx);
        dragFillMode = !filledSlots.has(idx);
        toggleSlotBlock(parseInt(slot.dataset.r), parseInt(slot.dataset.c));
        e.preventDefault();
      });

      slot.addEventListener('mouseenter', () => {
        if (isDragging) toggleSlotBlock(parseInt(slot.dataset.r), parseInt(slot.dataset.c));
        else previewSlots(parseInt(slot.dataset.r), parseInt(slot.dataset.c));
      });

      slot.addEventListener('mouseleave', () => {
        if (!isDragging) clearPreview();
      });

      overlay.appendChild(slot);
    }
  }

  document.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('resize', positionOverlay);
  positionOverlay();
  setTimeout(positionOverlay, 200);
}

function getSlot(r, c) {
  if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return null;
  return document.querySelector(`.cargo-slot[data-r="${r}"][data-c="${c}"]`);
}

function previewSlots(r, c) {
  clearPreview();
  for (let dr = 0; dr < pkgRows; dr++) {
    for (let dc = 0; dc < pkgCols; dc++) {
      const s = getSlot(r + dr, c + dc);
      if (s && !s.classList.contains('filled')) s.classList.add('preview');
    }
  }
}

function clearPreview() {
  document.querySelectorAll('.cargo-slot.preview').forEach(s => s.classList.remove('preview'));
}

function toggleSlotBlock(r, c) {
  clearPreview();
  const slots = [];
  for (let dr = 0; dr < pkgRows; dr++) {
    for (let dc = 0; dc < pkgCols; dc++) {
      const s = getSlot(r + dr, c + dc);
      if (s) slots.push(s);
    }
  }
  if (!slots.length) return;

  const allFilled = slots.every(s => filledSlots.has(parseInt(s.dataset.idx)));

  if (allFilled || !dragFillMode) {
    slots.forEach(s => {
      const idx = parseInt(s.dataset.idx);
      if (filledSlots.has(idx)) {
        filledSlots.delete(idx);
        s.classList.remove('filled');
        s.textContent = '';
      }
    });
    if (allFilled) packageCount = Math.max(0, packageCount - 1);
  } else {
    let anyNew = false;
    slots.forEach(s => {
      const idx = parseInt(s.dataset.idx);
      if (!filledSlots.has(idx)) {
        filledSlots.add(idx);
        s.classList.add('filled');
        anyNew = true;
      }
    });
    if (anyNew) packageCount++;
  }
  updateCargoStats();
}

function setPkgSize(rows, cols, btn) {
  pkgRows = rows;
  pkgCols = cols;
  document.querySelectorAll('.pkg-size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function clearCargo() {
  filledSlots.clear();
  packageCount = 0;
  document.querySelectorAll('.cargo-slot').forEach(s => {
    s.classList.remove('filled', 'preview');
    s.textContent = '';
  });
  updateCargoStats();
}

function updateCargoStats() {
  const filled = filledSlots.size;
  const pct = Math.round((filled / TOTAL_SLOTS) * 100);
  document.getElementById('statSlots').textContent = filled;
  document.getElementById('statPct').textContent = pct + '%';
  document.getElementById('statPkgs').textContent = packageCount;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initCargoGrid();
  // Re-position overlay after fonts/layout settle
  setTimeout(() => {
    const overlay = document.getElementById('cargoSlotsOverlay');
    if (overlay) {
      const svg = document.getElementById('truckShellSvg');
      const rect = svg.getBoundingClientRect();
      const scaleX = rect.width / 520;
      const scaleY = rect.height / 220;
      const ox = 26 * scaleX, oy = 54 * scaleY;
      const ow = 328 * scaleX, oh = 122 * scaleY;
      overlay.style.left = ox + 'px'; overlay.style.top = oy + 'px';
      overlay.style.width = ow + 'px'; overlay.style.height = oh + 'px';
      const slotW = (ow - (GRID_COLS - 1) * 3) / GRID_COLS;
      const slotH = (oh - (GRID_ROWS - 1) * 3) / GRID_ROWS;
      overlay.style.gridTemplateColumns = `repeat(${GRID_COLS}, ${slotW.toFixed(1)}px)`;
      overlay.style.gridTemplateRows = `repeat(${GRID_ROWS}, ${slotH.toFixed(1)}px)`;
    }
  }, 300);
});

// ── BACK TO TOP ──
window.addEventListener('scroll', () => {
  document.getElementById('backTop').classList.toggle('show', window.scrollY > 400);
});

// ── NAV SCROLL STYLE ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.style.background = window.scrollY > 20 ? 'rgba(17,17,17,0.99)' : 'rgba(17,17,17,0.97)';
});