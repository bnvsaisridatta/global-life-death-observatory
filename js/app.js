// ===== APP ENTRYPOINT =====

// ---- YEAR RANGE APPLY ----
function applyYearRange() {
  const from = parseInt(document.getElementById('yearFrom').value);
  const to   = parseInt(document.getElementById('yearTo').value);
  if (from >= to || from < VS.YEAR_START || to > VS.YEAR_END) {
    alert('Please enter a valid range between ' + VS.YEAR_START + ' and ' + VS.YEAR_END);
    return;
  }
  Charts.yearFrom = from;
  Charts.yearTo   = to;
  Charts.renderHistorical();
}

// ---- COMPARISON TRIGGER ----
function renderComparison() {
  Charts.renderComparison();
}

// ---- SCROLL OBSERVER (section fade-in) ----
function initScrollObserver() {
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  sections.forEach(s => observer.observe(s));
}

// ---- NAV ACTIVE STATE ----
function initNavHighlight() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}

// ---- WORLD BANK API FETCH (live data for current year) ----
// Fetches birth rate, suicide rate from World Bank free API
// Indicator: SP.DYN.CBRT.IN = birth rate per 1000
async function fetchWorldBankData() {
  try {
    const url = 'https://api.worldbank.org/v2/country/WLD/indicator/SP.DYN.CBRT.IN?format=json&mrv=1&per_page=1';
    const res = await fetch(url);
    const json = await res.json();
    if (json && json[1] && json[1][0]) {
      const rate = json[1][0].value; // births per 1000 population
      // World population ~8.1B → births per year
      const worldPop = 8.1e9;
      const birthsPerYear = (rate / 1000) * worldPop;
      // Update the births rate in VS
      if (birthsPerYear && birthsPerYear > 0) {
        VS.ratesPerSecond['births'] = birthsPerYear / VS.SECONDS_PER_YEAR;
        console.log('[WorldBank] Live birth rate updated:', rate, '→', Math.floor(birthsPerYear/1e6) + 'M/yr');
      }
    }
  } catch (e) {
    console.warn('[WorldBank] Could not fetch live data, using estimates:', e.message);
  }
}

// ---- WHO API FETCH (suicide rate) ----
async function fetchWHOData() {
  try {
    // WHO GHO API: SDGSUICIDE = Age-standardized suicide rate
    const url = 'https://ghoapi.azureedge.net/api/SDGSUICIDE?$filter=SpatialDim eq \'GLOBAL\'&$top=1&$orderby=TimeDim desc';
    const res = await fetch(url);
    const json = await res.json();
    if (json && json.value && json.value[0]) {
      const rate = json.value[0].NumericValue; // per 100K population
      const worldPop = 8.1e9;
      const suicidesPerYear = (rate / 1e5) * worldPop;
      if (suicidesPerYear && suicidesPerYear > 0) {
        VS.ratesPerSecond['suicides'] = suicidesPerYear / VS.SECONDS_PER_YEAR;
        console.log('[WHO] Live suicide rate updated:', rate, '→', Math.floor(suicidesPerYear/1e3) + 'K/yr');
      }
    }
  } catch (e) {
    console.warn('[WHO] Could not fetch suicide data, using estimates:', e.message);
  }
}

// ---- WORLD BANK HOMICIDE ----
async function fetchHomicideData() {
  try {
    const url = 'https://api.worldbank.org/v2/country/WLD/indicator/VC.IHR.PSRC.P5?format=json&mrv=1&per_page=1';
    const res = await fetch(url);
    const json = await res.json();
    if (json && json[1] && json[1][0]) {
      const rate = json[1][0].value; // per 100K
      const worldPop = 8.1e9;
      const homicidesPerYear = (rate / 1e5) * worldPop;
      if (homicidesPerYear && homicidesPerYear > 0) {
        VS.ratesPerSecond['homicides'] = homicidesPerYear / VS.SECONDS_PER_YEAR;
        console.log('[WorldBank] Live homicide rate updated:', rate, '→', Math.floor(homicidesPerYear/1e3) + 'K/yr');
      }
    }
  } catch (e) {
    console.warn('[WorldBank] Could not fetch homicide data, using estimates:', e.message);
  }
}

// ---- STATUS TOAST ----
function showDataStatus(text, type = 'ok') {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 999;
    background: #141b24; border: 1px solid rgba(255,255,255,0.1);
    padding: 10px 16px; border-radius: 8px;
    font-family: 'DM Mono', monospace; font-size: 12px;
    color: ${type === 'ok' ? '#22c87a' : '#f5a623'};
    transition: opacity 0.4s;
  `;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 500); }, 3000);
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
  // Start live counters immediately
  Counters.start();

  // Build charts
  Charts.init();

  // Setup observers
  initScrollObserver();
  initNavHighlight();

  // Fetch live API data (non-blocking)
  showDataStatus('⟳ Fetching live data from WHO & World Bank…', 'warn');
  await Promise.allSettled([
    fetchWorldBankData(),
    fetchWHOData(),
    fetchHomicideData()
  ]);
  showDataStatus('✓ Live data synced from open APIs');

  // Setup year input clamping
  ['yearFrom', 'yearTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (el.value < VS.YEAR_START) el.value = VS.YEAR_START;
      if (el.value > VS.YEAR_END)   el.value = VS.YEAR_END;
    });
  });

  console.log('[VitalStats] Fully initialized.');
});
