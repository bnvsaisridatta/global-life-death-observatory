// ===== COUNTERS MODULE =====
// Live ticking estimates from midnight UTC today

const Counters = {};

Counters.startTime = null;    // ms since midnight UTC when page loaded
Counters.intervalId = null;
Counters.elements = {};       // { catId: { valueEl, rateEl } }

// Seconds elapsed since midnight UTC
Counters.secondsSinceMidnight = function() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(0, 0, 0, 0);
  return (now - midnight) / 1000;
};

// Format large number with commas
Counters.fmt = function(n) {
  return Math.floor(n).toLocaleString('en-IN');
};

// Shorten for ticker
Counters.fmtShort = function(n, cat) {
  if (cat.unit === 'M') {
    return (n / 1e6).toFixed(3) + 'M';
  } else {
    if (n >= 1e6) return (n / 1e6).toFixed(3) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
  }
};

// Build counter cards
Counters.buildCards = function() {
  const grid = document.getElementById('counterGrid');
  if (!grid) return;
  grid.innerHTML = '';

  VS.CATEGORIES.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'counter-card';
    card.style.setProperty('--card-accent', cat.color);

    const annualReadable = cat.perYear >= 1
      ? cat.perYear.toFixed(1) + 'M / year'
      : (cat.perYear * 1000).toFixed(0) + 'K / year';

    card.innerHTML = `
      <div class="counter-icon">${cat.icon}</div>
      <div class="counter-label">${cat.label}</div>
      <div class="counter-value" id="cval-${cat.id}">0</div>
      <div class="counter-rate" id="crate-${cat.id}">
        ${(VS.ratesPerSecond[cat.id]).toFixed(4)} / sec
      </div>
      <div class="counter-annual">≈ ${annualReadable} · since midnight UTC</div>
    `;
    grid.appendChild(card);

    Counters.elements[cat.id] = {
      valueEl: document.getElementById('cval-' + cat.id)
    };
  });
};

// Tick every 100ms for smooth counting
Counters.tick = function() {
  const secs = Counters.secondsSinceMidnight();
  VS.CATEGORIES.forEach(cat => {
    const el = Counters.elements[cat.id];
    if (!el || !el.valueEl) return;
    const count = VS.ratesPerSecond[cat.id] * secs;
    el.valueEl.textContent = Counters.fmt(count);
  });
  Counters.updateTicker();
};

// Ticker strip
Counters.buildTicker = function() {
  const inner = document.getElementById('tickerInner');
  if (!inner) return;
  // Duplicate for seamless loop
  const html = [...VS.TICKER_ITEMS, ...VS.TICKER_ITEMS].map(item => {
    const cat = VS.CATEGORIES.find(c => c.id === item.id);
    return `<span class="ticker-item">
      <span class="t-label" style="color:${item.color}">${cat.icon} ${item.label}</span>
      <span class="t-value" id="tick-${item.id}" style="color:${item.color}">0</span>
    </span>
    <span class="ticker-sep" style="color:#333">·</span>`;
  }).join('');
  inner.innerHTML = html;
};

Counters.updateTicker = function() {
  const secs = Counters.secondsSinceMidnight();
  VS.TICKER_ITEMS.forEach(item => {
    const cat = VS.CATEGORIES.find(c => c.id === item.id);
    const count = VS.ratesPerSecond[item.id] * secs;
    document.querySelectorAll(`#tick-${item.id}`).forEach(el => {
      el.textContent = Counters.fmtShort(count, cat);
    });
  });
};

// Rate table
Counters.buildRateTable = function() {
  const tbody = document.getElementById('rateTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  VS.CATEGORIES.forEach(cat => {
    const rps = VS.ratesPerSecond[cat.id];
    const rpm = rps * 60;
    const rph = rps * 3600;
    const rpd = rps * 86400;
    const rpy = cat.perYear * 1e6;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="cat-cell">
        <span class="cat-dot" style="background:${cat.color}"></span>
        ${cat.icon} ${cat.label}
      </div></td>
      <td class="num-cell">${rps.toFixed(3)}</td>
      <td class="num-cell">${rpm.toFixed(1)}</td>
      <td class="num-cell">${rph.toFixed(0)}</td>
      <td class="num-cell">${Math.floor(rpd).toLocaleString('en-IN')}</td>
      <td class="num-cell">${Math.floor(rpy).toLocaleString('en-IN')}</td>
    `;
    tbody.appendChild(tr);
  });
};

// Ratio cards
Counters.buildRatios = function() {
  const grid = document.getElementById('ratioGrid');
  if (!grid) return;
  const births = VS.CATEGORIES.find(c => c.id === 'births');
  const birthsPerSec = VS.ratesPerSecond['births'];

  const comparisons = [
    { against: 'homicides', label: 'births per homicide', desc: 'For every murder, this many babies are born.' },
    { against: 'suicides',  label: 'births per suicide',  desc: 'For every suicide, this many lives begin.' },
    { against: 'road',      label: 'births per road death', desc: 'For every fatal crash, this many births occur.' },
    { against: 'deaths',    label: 'births per all-cause death', desc: 'Net population growth ratio per death.' },
    { against: 'ivf',       label: 'natural births per IVF birth', desc: 'Natural vs assisted reproduction.' },
    { against: 'cancer',    label: 'births per cancer death', desc: 'Life entering vs cancer-caused exits.' },
  ];

  comparisons.forEach(comp => {
    const cat = VS.CATEGORIES.find(c => c.id === comp.against);
    const ratio = Math.round(VS.ratesPerSecond['births'] / VS.ratesPerSecond[comp.against]);
    const card = document.createElement('div');
    card.className = 'ratio-card';
    card.innerHTML = `
      <div class="ratio-label">${births.icon} births : ${cat.icon} ${cat.label}</div>
      <div class="ratio-value" style="color:${cat.color}">${ratio.toLocaleString('en-IN')}×</div>
      <div class="ratio-desc">${comp.desc}</div>
    `;
    grid.appendChild(card);
  });
};

Counters.start = function() {
  Counters.buildTicker();
  Counters.buildCards();
  Counters.buildRateTable();
  Counters.buildRatios();
  Counters.tick(); // immediate first tick
  Counters.intervalId = setInterval(Counters.tick, 250); // 4 times/sec
};

Counters.stop = function() {
  if (Counters.intervalId) clearInterval(Counters.intervalId);
};
