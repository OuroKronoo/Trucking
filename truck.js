// ══════════════════════════════════════════════════════════════
//  4K ENTERPRISES — Enhanced truck.js
//  Features: EmailJS sending, PH Toll rates, Gas pricing,
//             Route cost calculator, Leaflet maps, Chat
// ══════════════════════════════════════════════════════════════

// ── MOBILE MENU ──
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// ── MODAL (Quick Quote) ──
function openModal() {
  document.getElementById('quoteModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('quoteModal').classList.remove('open');
  document.body.style.overflow = '';
  // reset modal
  const fw = document.getElementById('modalFormWrap');
  const ms = document.getElementById('modalSuccess');
  if (fw) fw.style.display = '';
  if (ms) ms.classList.remove('show');
}
function handleModalClick(e) {
  if (e.target === document.getElementById('quoteModal')) closeModal();
}

// ── EMAILJS INTEGRATION ──
// Uses EmailJS (free plan — 200 emails/month). Configured via Public Key below.
// To activate: create account at emailjs.com, set up a service & template, fill in IDs below.
const EMAILJS_PUBLIC_KEY  = 'g96yY6NjQEO-Jdteu';    // ← replace
const EMAILJS_SERVICE_ID  = 'service_aezb4ce';    // ← replace
const EMAILJS_TEMPLATE_ID = 'template_423cqhr';   // ← replace

let emailJSReady = false;
(function loadEmailJS() {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
  s.onload = () => {
    if (EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      emailJSReady = true;
    }
  };
  document.head.appendChild(s);
})();

async function sendQuoteEmail(params) {
  if (!emailJSReady) {
    console.warn('EmailJS not configured — email not sent.');
    return { skipped: true };
  }
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
}

// ── MODAL SUBMIT (with email) ──
async function submitModal() {
  const btn = document.querySelector('#modalFormWrap .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  const name    = document.querySelector('#modalFormWrap input[placeholder="Your full name"]')?.value || '';
  const contact = document.querySelector('#modalFormWrap input[placeholder="For us to reach you"]')?.value || '';
  const cargo   = document.querySelector('#modalFormWrap .form-select')?.value || '';
  const from    = document.querySelector('#modalFormWrap input[placeholder="Origin city"]')?.value || '';
  const to      = document.querySelector('#modalFormWrap input[placeholder="Destination city"]')?.value || '';

  await sendQuoteEmail({
    from_name: name,
    from_contact: contact,
    cargo_type: cargo,
    origin: from,
    destination: to,
    message: `Quick quote request from modal. Cargo: ${cargo}. Route: ${from} → ${to}.`,
  });

  document.getElementById('modalFormWrap').style.display = 'none';
  document.getElementById('modalSuccess').classList.add('show');
}

// ── CONTACT FORM SUBMIT (with email) ──
async function submitContactForm() {
  const btn = document.querySelector('#contactFormWrap .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  const inputs = document.querySelectorAll('#contactFormWrap .form-input, #contactFormWrap .form-select, #contactFormWrap .form-textarea');
  const vals = {};
  inputs.forEach(el => { vals[el.placeholder || el.name || el.className] = el.value; });

  const nameEl    = document.querySelector('#contactFormWrap input[placeholder="Juan dela Cruz"]');
  const companyEl = document.querySelector('#contactFormWrap input[placeholder="Acme Corp."]');
  const emailEl   = document.querySelector('#contactFormWrap input[type="email"]');
  const phoneEl   = document.querySelector('#contactFormWrap input[type="tel"]');
  const pickupEl  = document.querySelector('#contactFormWrap input[placeholder="City or Address"]');
  const deliverEl = document.querySelectorAll('#contactFormWrap input[placeholder="City or Address"]')[1];
  const cargoEl   = document.querySelector('#contactFormWrap select');
  const dateEl    = document.querySelector('#contactFormWrap input[type="date"]');
  const notesEl   = document.querySelector('#contactFormWrap .form-textarea');

  await sendQuoteEmail({
    from_name:    nameEl?.value    || 'Not provided',
    company:      companyEl?.value || 'Not provided',
    from_email:   emailEl?.value   || 'Not provided',
    phone:        phoneEl?.value   || 'Not provided',
    origin:       pickupEl?.value  || 'Not provided',
    destination:  deliverEl?.value || 'Not provided',
    cargo_type:   cargoEl?.value   || 'Not provided',
    pickup_date:  dateEl?.value    || 'Not provided',
    message:      notesEl?.value   || 'No additional notes.',
  });

  document.getElementById('contactFormWrap').style.display = 'none';
  document.getElementById('formSuccess').classList.add('show');
}

function resetForm() {
  document.getElementById('contactFormWrap').style.display = 'block';
  document.getElementById('formSuccess').classList.remove('show');
  const btn = document.querySelector('#contactFormWrap .btn-primary');
  if (btn) { btn.disabled = false; btn.innerHTML = 'Send Inquiry <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>'; }
}

// ══════════════════════════════════════════════════════════════
//  PH TOLL RATE DATABASE (2025 Official Rates)
//  Sources: TRB, NLEX Corp, MPTC, SLEX, CAVITEX
// ══════════════════════════════════════════════════════════════
const PH_TOLL_ROUTES = {
  // Format: key → { name, km, tolls: [{gate, class1, class2, class3, class4, class5}] }
  // Class 1 = Cars/Jeep, Class 2 = Light Trucks/UV, Class 3 = Buses
  // Class 4 = 6-Wheeler Trucks, Class 5 = 10-Wheeler Trucks and above

  'manila-clark': {
    name: 'Manila → Clark (NLEX)',
    km: 84,
    expressway: 'NLEX',
    tolls: [
      { gate: 'Balintawak Toll Plaza',        c1: 25,  c2: 37,  c3: 50,  c4: 75,  c5: 100  },
      { gate: 'Bocaue Toll Plaza',             c1: 20,  c2: 30,  c3: 40,  c4: 60,  c5: 80   },
      { gate: 'San Fernando Toll Plaza',       c1: 30,  c2: 45,  c3: 60,  c4: 90,  c5: 120  },
      { gate: 'Dau/Clark Exit Toll Plaza',     c1: 28,  c2: 42,  c3: 56,  c4: 84,  c5: 112  },
    ]
  },
  'manila-dagupan': {
    name: 'Manila → Dagupan (NLEX + TPLEX)',
    km: 200,
    expressway: 'NLEX + TPLEX',
    tolls: [
      { gate: 'Balintawak Toll Plaza (NLEX)',  c1: 25,  c2: 37,  c3: 50,  c4: 75,  c5: 100  },
      { gate: 'Bocaue Toll Plaza (NLEX)',      c1: 20,  c2: 30,  c3: 40,  c4: 60,  c5: 80   },
      { gate: 'San Fernando (NLEX)',           c1: 30,  c2: 45,  c3: 60,  c4: 90,  c5: 120  },
      { gate: 'Dau Toll Plaza (NLEX)',         c1: 28,  c2: 42,  c3: 56,  c4: 84,  c5: 112  },
      { gate: 'TPLEX Entry (Subic–Clark–Tarlac)', c1: 65, c2: 97, c3: 130, c4: 195, c5: 260 },
      { gate: 'Rosales Toll Plaza (TPLEX)',    c1: 50,  c2: 75,  c3: 100, c4: 150, c5: 200  },
    ]
  },
  'manila-batangas': {
    name: 'Manila → Batangas (SLEX + STAR)',
    km: 110,
    expressway: 'SLEX + STAR',
    tolls: [
      { gate: 'Alabang Toll Plaza (SLEX)',     c1: 20,  c2: 30,  c3: 40,  c4: 60,  c5: 80   },
      { gate: 'Susana Heights (SLEX)',         c1: 18,  c2: 27,  c3: 36,  c4: 54,  c5: 72   },
      { gate: 'Calamba Toll (SLEX)',           c1: 35,  c2: 52,  c3: 70,  c4: 105, c5: 140  },
      { gate: 'STAR Tollway Entry (Batangas)', c1: 55,  c2: 82,  c3: 110, c4: 165, c5: 220  },
    ]
  },
  'manila-cavite': {
    name: 'Manila → Cavite (CAVITEX)',
    km: 35,
    expressway: 'CAVITEX',
    tolls: [
      { gate: 'CAVITEX Toll Entry (R1)',       c1: 20,  c2: 30,  c3: 40,  c4: 60,  c5: 80   },
      { gate: 'Kawit Toll Barrier',            c1: 15,  c2: 22,  c3: 30,  c4: 45,  c5: 60   },
      { gate: 'Imus Exit',                     c1: 12,  c2: 18,  c3: 24,  c4: 36,  c5: 48   },
    ]
  },
  'manila-pampanga': {
    name: 'Manila → Pampanga (NLEX)',
    km: 72,
    expressway: 'NLEX',
    tolls: [
      { gate: 'Balintawak Toll Plaza',         c1: 25,  c2: 37,  c3: 50,  c4: 75,  c5: 100  },
      { gate: 'Bocaue Toll Plaza',             c1: 20,  c2: 30,  c3: 40,  c4: 60,  c5: 80   },
      { gate: 'San Fernando Toll Plaza',       c1: 30,  c2: 45,  c3: 60,  c4: 90,  c5: 120  },
    ]
  },
  'manila-cebu': {
    name: 'Manila → Cebu (NLEX + SCTEX + RORO)',
    km: 600,
    expressway: 'NLEX + SCTEX + RORO',
    tolls: [
      { gate: 'NLEX Balintawak',               c1: 25,  c2: 37,  c3: 50,  c4: 75,  c5: 100  },
      { gate: 'SCTEX (Subic Clark)',           c1: 58,  c2: 87,  c3: 116, c4: 174, c5: 232  },
      { gate: 'RORO Ferry (Matnog–Allen)',      c1: 0,   c2: 0,   c3: 0,   c4: 2700, c5: 4500 },
    ]
  },
  'manila-laguna': {
    name: 'Manila → Laguna (SLEX)',
    km: 55,
    expressway: 'SLEX',
    tolls: [
      { gate: 'Alabang Toll Plaza',            c1: 20,  c2: 30,  c3: 40,  c4: 60,  c5: 80   },
      { gate: 'Susana Heights',                c1: 18,  c2: 27,  c3: 36,  c4: 54,  c5: 72   },
      { gate: 'Calamba Exit',                  c1: 28,  c2: 42,  c3: 56,  c4: 84,  c5: 112  },
    ]
  },
  'manila-bulacan': {
    name: 'Manila → Bulacan (NLEX)',
    km: 32,
    expressway: 'NLEX',
    tolls: [
      { gate: 'Balintawak Toll Plaza',         c1: 25,  c2: 37,  c3: 50,  c4: 75,  c5: 100  },
      { gate: 'Bocaue Exit',                   c1: 20,  c2: 30,  c3: 40,  c4: 60,  c5: 80   },
    ]
  },
};

// ── VEHICLE TOLL CLASS MAPPING ──
const VEHICLE_TOLL_CLASS = {
  'Mini Van':             { class: 2, label: 'Class 2 (Light Vehicle)' },
  '4-Wheeler Closed Van': { class: 3, label: 'Class 3 (Medium Truck)' },
  '6-Wheeler Truck':      { class: 4, label: 'Class 4 (6-Wheeler Truck)' },
  'Reefer Truck':         { class: 4, label: 'Class 4 (6-Wheeler Reefer)' },
  '10-Wheeler Truck':     { class: 5, label: 'Class 5 (10-Wheeler / Heavy)' },
};

// ── PH GAS PRICES (May 2026 — DOE Reference) ──
const GAS_PRICES = {
  diesel:      { price: 58.50, label: 'Diesel (ULSD)', unit: 'per liter' },
  gasoline95:  { price: 72.30, label: 'Gasoline RON 95', unit: 'per liter' },
  gasoline91:  { price: 68.90, label: 'Gasoline RON 91', unit: 'per liter' },
};

// ── FUEL CONSUMPTION ESTIMATES (km per liter) ──
const FUEL_CONSUMPTION = {
  'Mini Van':             { kpl: 12, fuelType: 'gasoline91' },
  '4-Wheeler Closed Van': { kpl: 9,  fuelType: 'diesel'     },
  '6-Wheeler Truck':      { kpl: 6,  fuelType: 'diesel'     },
  'Reefer Truck':         { kpl: 5,  fuelType: 'diesel'     },
  '10-Wheeler Truck':     { kpl: 4,  fuelType: 'diesel'     },
};

// ── BASE FREIGHT RATES (₱ per km, approximate PH market 2025) ──
const FREIGHT_BASE_RATE = {
  'Mini Van':             80,
  '4-Wheeler Closed Van': 120,
  '6-Wheeler Truck':      180,
  'Reefer Truck':         220,  // premium for cold chain
  '10-Wheeler Truck':     280,
};

// ── ROUTE COST CALCULATOR ──
let selectedRoute = null;
let selectedTruck = null;

function populateRouteSelect() {
  const sel = document.getElementById('routeSelect');
  if (!sel) return;
  Object.entries(PH_TOLL_ROUTES).forEach(([key, route]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = route.name;
    sel.appendChild(opt);
  });
}

function populateTruckSelect() {
  const sel = document.getElementById('truckSelect');
  if (!sel) return;
  Object.keys(VEHICLE_TOLL_CLASS).forEach(truck => {
    const opt = document.createElement('option');
    opt.value = truck;
    opt.textContent = truck;
    sel.appendChild(opt);
  });
}

function calculateQuote() {
  const routeKey  = document.getElementById('routeSelect')?.value;
  const truckName = document.getElementById('truckSelect')?.value;
  const weight    = parseFloat(document.getElementById('quoteWeight')?.value || 0);

  if (!routeKey || !truckName) {
    showQuoteError('Please select a route and truck type.');
    return;
  }

  const route     = PH_TOLL_ROUTES[routeKey];
  const tollClass = VEHICLE_TOLL_CLASS[truckName].class;
  const classKey  = 'c' + tollClass;
  const fuel      = FUEL_CONSUMPTION[truckName];
  const fuelPrice = GAS_PRICES[fuel.fuelType];
  const baseRate  = FREIGHT_BASE_RATE[truckName];

  // Toll computation
  let totalToll = 0;
  const tollBreakdown = route.tolls.map(t => {
    const amount = t[classKey] || 0;
    totalToll += amount;
    return { gate: t.gate, amount };
  });

  // Fuel computation
  const litersNeeded    = route.km / fuel.kpl;
  const fuelCost        = litersNeeded * fuelPrice.price;

  // Base freight computation
  const freightCost     = baseRate * route.km;

  // Surcharges
  const coldChainSurcharge = truckName === 'Reefer Truck' ? freightCost * 0.20 : 0;
  const heavySurcharge     = weight > 10000 ? freightCost * 0.10 : 0;

  const subtotal = freightCost + fuelCost + totalToll + coldChainSurcharge + heavySurcharge;
  const vatAmount = subtotal * 0.12;
  const grandTotal = subtotal + vatAmount;

  renderQuoteResult({
    route, truckName, weight, tollClass,
    tollBreakdown, totalToll,
    litersNeeded, fuelPrice, fuelCost,
    freightCost, coldChainSurcharge, heavySurcharge,
    subtotal, vatAmount, grandTotal,
    classLabel: VEHICLE_TOLL_CLASS[truckName].label,
    fuelLabel: fuelPrice.label,
  });
}

function showQuoteError(msg) {
  const el = document.getElementById('quoteError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
}

function fmt(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderQuoteResult(d) {
  const el = document.getElementById('quoteResult');
  if (!el) return;
  // Hide placeholder when results appear
  const placeholder = document.getElementById('routePlaceholder');
  if (placeholder) placeholder.style.display = 'none';
  el.innerHTML = `
    <div class="qr-header">
      <div class="qr-route-badge">${d.route.expressway}</div>
      <h3 class="qr-title">${d.route.name}</h3>
      <p class="qr-meta">${d.route.km} km &middot; ${d.truckName} &middot; ${d.classLabel}</p>
    </div>

    <div class="qr-section">
      <div class="qr-section-title">🛣️ Tollgate Breakdown</div>
      <div class="qr-table">
        ${d.tollBreakdown.map(t => `
          <div class="qr-row">
            <span>${t.gate}</span>
            <span class="qr-amount">${fmt(t.amount)}</span>
          </div>
        `).join('')}
        <div class="qr-row qr-subtotal">
          <span>Total Toll Fees</span>
          <span class="qr-amount">${fmt(d.totalToll)}</span>
        </div>
      </div>
      <p class="qr-note">ℹ️ Rates based on TRB-approved 2025 toll schedules for ${d.classLabel}.</p>
    </div>

    <div class="qr-section">
      <div class="qr-section-title">⛽ Fuel Estimate</div>
      <div class="qr-table">
        <div class="qr-row">
          <span>Fuel Type</span>
          <span>${d.fuelLabel}</span>
        </div>
        <div class="qr-row">
          <span>Current DOE Price</span>
          <span>${fmt(d.fuelPrice.price)} / liter</span>
        </div>
        <div class="qr-row">
          <span>Estimated Consumption</span>
          <span>${d.litersNeeded.toFixed(1)} liters</span>
        </div>
        <div class="qr-row qr-subtotal">
          <span>Fuel Cost</span>
          <span class="qr-amount">${fmt(d.fuelCost)}</span>
        </div>
      </div>
      <p class="qr-note">ℹ️ Fuel price from DOE reference (Metro Manila, May 2026). Actual may vary.</p>
    </div>

    <div class="qr-section">
      <div class="qr-section-title">📦 Freight Charges</div>
      <div class="qr-table">
        <div class="qr-row">
          <span>Base Freight (${d.route.km} km × ₱${FREIGHT_BASE_RATE[d.truckName]}/km)</span>
          <span class="qr-amount">${fmt(d.freightCost)}</span>
        </div>
        ${d.coldChainSurcharge > 0 ? `
        <div class="qr-row">
          <span>Cold Chain Surcharge (+20%)</span>
          <span class="qr-amount">${fmt(d.coldChainSurcharge)}</span>
        </div>` : ''}
        ${d.heavySurcharge > 0 ? `
        <div class="qr-row">
          <span>Heavy Load Surcharge (+10% for ${d.weight.toLocaleString()} kg)</span>
          <span class="qr-amount">${fmt(d.heavySurcharge)}</span>
        </div>` : ''}
        <div class="qr-row">
          <span>Toll Fees</span>
          <span class="qr-amount">${fmt(d.totalToll)}</span>
        </div>
        <div class="qr-row">
          <span>Fuel</span>
          <span class="qr-amount">${fmt(d.fuelCost)}</span>
        </div>
        <div class="qr-row qr-subtotal">
          <span>Subtotal</span>
          <span class="qr-amount">${fmt(d.subtotal)}</span>
        </div>
        <div class="qr-row">
          <span>VAT (12%)</span>
          <span class="qr-amount">${fmt(d.vatAmount)}</span>
        </div>
        <div class="qr-row qr-grand">
          <span>GRAND TOTAL</span>
          <span class="qr-amount grand">${fmt(d.grandTotal)}</span>
        </div>
      </div>
      <p class="qr-note">⚠️ This is an ESTIMATE. Final rates depend on actual load, route adjustments, and current fuel prices. Contact us for a confirmed quotation.</p>
    </div>

    <button class="btn-primary qr-inquire-btn" onclick="prefillAndScrollToForm('${d.route.name}','${d.truckName}','${fmt(d.grandTotal)}')">
      Request Formal Quote for This Route
      <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    </button>
  `;
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function prefillAndScrollToForm(route, truck, estimate) {
  const notesEl = document.querySelector('#contactFormWrap .form-textarea');
  if (notesEl) {
    notesEl.value = `Route: ${route}\nVehicle: ${truck}\nEstimated Cost: ${estimate}\n\nPlease provide a formal quotation for this shipment.`;
  }
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// ── ALSO SHOW ROUTE ON MAP WHEN QUOTE IS CALCULATED ──
function showRouteOnQuoteMap() {
  const routeKey = document.getElementById('routeSelect')?.value;
  if (!routeKey || !ROUTE_MAP_COORDS[routeKey]) return;
  const coords = ROUTE_MAP_COORDS[routeKey];
  if (quoteMap) {
    quoteMap.remove();
    quoteMap = null;
  }
  const mapDiv = document.getElementById('quoteMiniMap');
  if (!mapDiv) return;
  mapDiv.style.display = 'block';
  quoteMap = L.map('quoteMiniMap', { scrollWheelZoom: false, zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM &copy; CARTO', subdomains: 'abcd', maxZoom: 19
  }).addTo(quoteMap);

  const orgIcon = L.divIcon({ className: '', html: `<div style="width:14px;height:14px;border-radius:50%;background:#F5A623;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`, iconSize:[14,14], iconAnchor:[7,7] });
  const dstIcon = L.divIcon({ className: '', html: `<div style="width:14px;height:14px;border-radius:50%;background:#2E7D32;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`, iconSize:[14,14], iconAnchor:[7,7] });

  L.marker(coords.origin, { icon: orgIcon }).addTo(quoteMap).bindPopup('<strong>Origin</strong>');
  L.marker(coords.dest,   { icon: dstIcon }).addTo(quoteMap).bindPopup('<strong>Destination</strong>');
  L.polyline([coords.origin, coords.dest], { color: '#F5A623', weight: 3, dashArray: '8,6' }).addTo(quoteMap);
  quoteMap.fitBounds(L.latLngBounds([coords.origin, coords.dest]), { padding: [40,40] });
  setTimeout(() => quoteMap.invalidateSize(), 200);
}

let quoteMap = null;
const ROUTE_MAP_COORDS = {
  'manila-clark':    { origin: [14.5995,120.9842], dest: [15.1719,120.5587] },
  'manila-dagupan':  { origin: [14.5995,120.9842], dest: [16.0430,120.3330] },
  'manila-batangas': { origin: [14.5995,120.9842], dest: [13.7565,121.0583] },
  'manila-cavite':   { origin: [14.5995,120.9842], dest: [14.4791,120.8980] },
  'manila-pampanga': { origin: [14.5995,120.9842], dest: [15.0794,120.6200] },
  'manila-cebu':     { origin: [14.5995,120.9842], dest: [10.3157,123.8854] },
  'manila-laguna':   { origin: [14.5995,120.9842], dest: [14.1407,121.4685] },
  'manila-bulacan':  { origin: [14.5995,120.9842], dest: [14.7942,120.8760] },
};

// Override calculateQuote to also show map
const _calcOrig = calculateQuote;
window.calculateQuote = function() {
  _calcOrig();
  showRouteOnQuoteMap();
};

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
    originCoords: [14.5995, 120.9842],
    destCoords:   [10.3157, 123.8854],
    truckCoords:  [13.0827, 122.5640],
  },
  'TC-2024-77532': {
    origin: 'Quezon City',
    dest: 'Davao City',
    eta: 'May 19, 2026',
    status: 'Out for Delivery',
    step: 4,
    originCoords: [14.6760, 121.0437],
    destCoords:   [7.1907,  125.4553],
    truckCoords:  [8.4800,  126.0000],
  },
  'TC-2024-44819': {
    origin: 'Makati',
    dest: 'Iloilo City',
    eta: 'May 18, 2026',
    status: 'Delivered',
    step: 5,
    originCoords: [14.5547, 121.0244],
    destCoords:   [10.7202, 122.5621],
    truckCoords:  [10.7202, 122.5621],
  },
};

// ── LEAFLET MAP ──
let trackMap = null;
let mapMarkers = [];
let mapPolyline = null;
let mapTruckMarker = null;

function initTrackMap(data) {
  const mapSection = document.getElementById('trackMapSection');
  mapSection.classList.add('show');

  if (trackMap) { trackMap.remove(); trackMap = null; }

  trackMap = L.map('trackMap', { zoomControl: true, scrollWheelZoom: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(trackMap);

  const originIcon = L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#F5A623;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
    iconSize: [14,14], iconAnchor: [7,7],
  });
  const destIcon = L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#2E7D32;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
    iconSize: [18,18], iconAnchor: [9,9],
  });
  const truckIcon = L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:50%;background:#F5A623;border:3px solid #D4880A;box-shadow:0 4px 16px rgba(245,166,35,0.6);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#111;"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/></svg>
    </div>`,
    iconSize: [34,34], iconAnchor: [17,17],
  });

  L.marker(data.originCoords, { icon: originIcon }).addTo(trackMap)
    .bindPopup(`<strong>Origin:</strong> ${data.origin}`);
  L.marker(data.destCoords,   { icon: destIcon   }).addTo(trackMap)
    .bindPopup(`<strong>Destination:</strong> ${data.dest}<br><strong>ETA:</strong> ${data.eta}`);
  L.polyline([data.originCoords, data.destCoords], {
    color: 'rgba(255,255,255,0.15)', weight: 2, dashArray: '8,8'
  }).addTo(trackMap);
  L.polyline([data.originCoords, data.truckCoords], {
    color: '#F5A623', weight: 3, opacity: 0.85
  }).addTo(trackMap);
  mapTruckMarker = L.marker(data.truckCoords, { icon: truckIcon }).addTo(trackMap)
    .bindPopup(`<strong>Current Location</strong><br>Lat: ${data.truckCoords[0].toFixed(4)}, Lng: ${data.truckCoords[1].toFixed(4)}`)
    .openPopup();

  trackMap.invalidateSize();
  trackMap.fitBounds(L.latLngBounds([data.originCoords, data.destCoords, data.truckCoords]), { padding: [40,40] });
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
  document.getElementById('trackStatus').textContent    = data.status;
  document.getElementById('trackOrigin').textContent    = data.origin;
  document.getElementById('trackDest').textContent      = data.dest;
  document.getElementById('trackETA').textContent       = data.eta;

  const badge = document.getElementById('trackStatus');
  if (data.step === 5) { badge.style.background = '#E8F5E9'; badge.style.color = '#2E7D32'; }
  else { badge.style.background = '#FFF3D6'; badge.style.color = '#D4880A'; }

  const steps = ['ts1','ts2','ts3','ts4','ts5'];
  steps.forEach((sid, i) => {
    const el  = document.getElementById(sid);
    const dot = el.querySelector('.track-dot');
    el.className = 'track-step';
    dot.className = 'track-dot';
    if (i + 1 < data.step)       { el.classList.add('done');   dot.classList.add('done');   dot.textContent = '✓'; }
    else if (i + 1 === data.step) { el.classList.add('active'); dot.classList.add('active'); dot.textContent = i === 4 ? '✓' : '→'; }
    else { dot.textContent = i + 1; }
  });

  const pct = ((data.step - 1) / 4) * 100;
  document.getElementById('trackProgress').style.width = pct + '%';
  result.classList.add('show');
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => initTrackMap(data), 300);
}

document.addEventListener('DOMContentLoaded', () => {
  const ti = document.getElementById('trackInput');
  if (ti) ti.addEventListener('keypress', e => { if (e.key === 'Enter') trackShipment(); });
});

// ── CHAT ──
let chatOpen = false;
const chatReplies = [
  "Thanks for reaching out! Our team will follow up shortly.",
  "Great question! You can get a free quote by clicking the 'Get Quote' button at the top.",
  "We offer 24/7 support. Feel free to call +63 917 000 1234 anytime.",
  "We cover all major routes nationwide — from Metro Manila to Mindanao!",
  "Our cold chain fleet maintains temperatures from -20°C to 10°C.",
  "You can track your shipment using the Track Shipment section with your TC-XXXX-XXXXX ID.",
  "For large freight over 10,000 kg, we recommend our 10-Wheeler trucks. Use the Cargo Planner to calculate!",
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
  const out = document.createElement('div');
  out.className = 'chat-msg outgoing';
  out.textContent = msg;
  msgs.appendChild(out);
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    const inn = document.createElement('div');
    inn.className = 'chat-msg incoming';
    inn.textContent = chatReplies[replyIdx % chatReplies.length];
    replyIdx++;
    msgs.appendChild(inn);
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
});

// ── WEIGHT RECOMMENDER ──
const TRUCKS = [
  { name: 'Mini Van',             cap: 1000,  capLabel: 'up to 1,000 kg',  badge: 'Best for last-mile & urban' },
  { name: '4-Wheeler Closed Van', cap: 3000,  capLabel: 'up to 3,000 kg',  badge: 'Best for city & province runs' },
  { name: '6-Wheeler Truck',      cap: 7000,  capLabel: 'up to 7,000 kg',  badge: 'Best for regional freight' },
  { name: 'Reefer Truck',         cap: 5000,  capLabel: 'up to 5,000 kg',  badge: 'Cold chain specialist' },
  { name: '10-Wheeler Truck',     cap: 15000, capLabel: 'up to 15,000 kg', badge: 'Best for long haul & heavy cargo' },
];

function getTruckForWeight(kg) {
  const sorted = [...TRUCKS].sort((a,b) => a.cap - b.cap);
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
  const rec  = document.getElementById('truckRec');
  const warn = document.getElementById('recWarning');
  const alts = document.getElementById('recAlts');
  if (!kg || kg <= 0) { rec.classList.remove('show'); return; }
  rec.classList.add('show');
  const truck = getTruckForWeight(kg);
  warn.classList.remove('show');
  alts.innerHTML = '';

  if (!truck) {
    warn.classList.add('show');
    document.getElementById('recName').textContent  = '10-Wheeler Truck x2+';
    document.getElementById('recCap').textContent   = 'Exceeds single vehicle capacity';
    document.getElementById('recBar').style.width   = '100%';
    document.getElementById('recFitLabel').textContent = 'Multiple trucks needed';
    return;
  }

  const pct = Math.min(Math.round((kg / truck.cap) * 100), 100);
  document.getElementById('recName').textContent     = truck.name;
  document.getElementById('recCap').textContent      = `${truck.capLabel} — ${truck.badge}`;
  document.getElementById('recBar').style.width      = pct + '%';
  document.getElementById('recFitLabel').textContent = `Load fill: ${pct}% (${kg.toLocaleString()} kg / ${truck.cap.toLocaleString()} kg)`;

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
  if (!svg || !overlay) return;

  function positionOverlay() {
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / 520, scaleY = rect.height / 220;
    const ox = 26*scaleX, oy = 54*scaleY, ow = 328*scaleX, oh = 122*scaleY;
    overlay.style.left   = ox + 'px'; overlay.style.top    = oy + 'px';
    overlay.style.width  = ow + 'px'; overlay.style.height = oh + 'px';
    const slotW = (ow - (GRID_COLS-1)*3) / GRID_COLS;
    const slotH = (oh - (GRID_ROWS-1)*3) / GRID_ROWS;
    overlay.style.gridTemplateColumns = `repeat(${GRID_COLS}, ${slotW.toFixed(1)}px)`;
    overlay.style.gridTemplateRows    = `repeat(${GRID_ROWS}, ${slotH.toFixed(1)}px)`;
  }

  overlay.innerHTML = '';
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const slot = document.createElement('div');
      slot.className = 'cargo-slot';
      slot.dataset.r = r; slot.dataset.c = c; slot.dataset.idx = r*GRID_COLS+c;
      slot.addEventListener('mousedown', e => {
        isDragging = true;
        dragFillMode = !filledSlots.has(parseInt(slot.dataset.idx));
        toggleSlotBlock(parseInt(slot.dataset.r), parseInt(slot.dataset.c));
        e.preventDefault();
      });
      slot.addEventListener('mouseenter', () => {
        if (isDragging) toggleSlotBlock(parseInt(slot.dataset.r), parseInt(slot.dataset.c));
        else previewSlots(parseInt(slot.dataset.r), parseInt(slot.dataset.c));
      });
      slot.addEventListener('mouseleave', () => { if (!isDragging) clearPreview(); });
      overlay.appendChild(slot);
    }
  }
  document.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('resize', positionOverlay);
  positionOverlay();
  setTimeout(positionOverlay, 200);
}

function getSlot(r,c) {
  if (r<0||r>=GRID_ROWS||c<0||c>=GRID_COLS) return null;
  return document.querySelector(`.cargo-slot[data-r="${r}"][data-c="${c}"]`);
}

function previewSlots(r,c) {
  clearPreview();
  for (let dr=0;dr<pkgRows;dr++) for (let dc=0;dc<pkgCols;dc++) {
    const s = getSlot(r+dr,c+dc);
    if (s && !s.classList.contains('filled')) s.classList.add('preview');
  }
}
function clearPreview() { document.querySelectorAll('.cargo-slot.preview').forEach(s=>s.classList.remove('preview')); }

function toggleSlotBlock(r,c) {
  clearPreview();
  const slots = [];
  for (let dr=0;dr<pkgRows;dr++) for (let dc=0;dc<pkgCols;dc++) { const s=getSlot(r+dr,c+dc); if(s) slots.push(s); }
  if (!slots.length) return;
  const allFilled = slots.every(s => filledSlots.has(parseInt(s.dataset.idx)));
  if (allFilled || !dragFillMode) {
    slots.forEach(s => { const idx=parseInt(s.dataset.idx); if(filledSlots.has(idx)){filledSlots.delete(idx);s.classList.remove('filled');s.textContent='';} });
    if (allFilled) packageCount = Math.max(0, packageCount-1);
  } else {
    let anyNew = false;
    slots.forEach(s => { const idx=parseInt(s.dataset.idx); if(!filledSlots.has(idx)){filledSlots.add(idx);s.classList.add('filled');anyNew=true;} });
    if (anyNew) packageCount++;
  }
  updateCargoStats();
}

function setPkgSize(rows,cols,btn) {
  pkgRows=rows; pkgCols=cols;
  document.querySelectorAll('.pkg-size-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function clearCargo() {
  filledSlots.clear(); packageCount=0;
  document.querySelectorAll('.cargo-slot').forEach(s=>{s.classList.remove('filled','preview');s.textContent='';});
  updateCargoStats();
}

function updateCargoStats() {
  const filled = filledSlots.size;
  const pct = Math.round((filled/TOTAL_SLOTS)*100);
  document.getElementById('statSlots').textContent = filled;
  document.getElementById('statPct').textContent   = pct + '%';
  document.getElementById('statPkgs').textContent  = packageCount;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initCargoGrid();
  populateRouteSelect();
  populateTruckSelect();
  setTimeout(() => {
    const overlay = document.getElementById('cargoSlotsOverlay');
    if (!overlay) return;
    const svg = document.getElementById('truckShellSvg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width/520, scaleY = rect.height/220;
    const ox=26*scaleX, oy=54*scaleY, ow=328*scaleX, oh=122*scaleY;
    overlay.style.left=ox+'px'; overlay.style.top=oy+'px';
    overlay.style.width=ow+'px'; overlay.style.height=oh+'px';
    const slotW=(ow-(GRID_COLS-1)*3)/GRID_COLS;
    const slotH=(oh-(GRID_ROWS-1)*3)/GRID_ROWS;
    overlay.style.gridTemplateColumns=`repeat(${GRID_COLS}, ${slotW.toFixed(1)}px)`;
    overlay.style.gridTemplateRows=`repeat(${GRID_ROWS}, ${slotH.toFixed(1)}px)`;
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