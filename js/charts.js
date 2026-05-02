// ===== CHARTS MODULE =====

const Charts = {};
Charts.historicalChart = null;
Charts.comparisonChart = null;
Charts.donutChart = null;

Charts.activeCategories = new Set(VS.CATEGORIES.map(c => c.id));
Charts.currentTab = 'line';
Charts.yearFrom = VS.YEAR_START;
Charts.yearTo   = VS.YEAR_END;

// ---- CATEGORY PILLS ----
Charts.buildPills = function() {
  const container = document.getElementById('categoryPills');
  if (!container) return;
  container.innerHTML = '';

  VS.CATEGORIES.forEach(cat => {
    const pill = document.createElement('div');
    pill.className = 'pill active';
    pill.style.setProperty('--pill-color', cat.color);
    pill.dataset.id = cat.id;
    pill.innerHTML = `
      <span class="pill-dot" style="background:${cat.color}"></span>
      ${cat.icon} ${cat.label}
    `;
    pill.addEventListener('click', () => {
      if (Charts.activeCategories.has(cat.id)) {
        Charts.activeCategories.delete(cat.id);
        pill.classList.remove('active');
      } else {
        Charts.activeCategories.add(cat.id);
        pill.classList.add('active');
      }
      Charts.renderHistorical();
    });
    container.appendChild(pill);
  });
};

// ---- YEAR FILTER ----
Charts.filteredYears = function() {
  return VS.YEARS.filter(y => y >= Charts.yearFrom && y <= Charts.yearTo);
};

Charts.filteredData = function(catId) {
  const start = VS.YEARS.indexOf(Charts.yearFrom);
  const end   = VS.YEARS.indexOf(Charts.yearTo);
  return VS.historical[catId].slice(start, end + 1);
};

// ---- HISTORICAL CHART ----
Charts.renderHistorical = function() {
  const ctx = document.getElementById('historicalChart');
  if (!ctx) return;

  const years = Charts.filteredYears();
  const activeCats = VS.CATEGORIES.filter(c => Charts.activeCategories.has(c.id));

  const datasets = activeCats.map(cat => {
    const data = Charts.filteredData(cat.id);
    const type = Charts.currentTab;
    return {
      label: cat.label,
      data: data,
      borderColor: cat.color,
      backgroundColor: type === 'area' ? cat.color + '22' : cat.color + '44',
      fill: type === 'area',
      tension: 0.4,
      borderWidth: 2,
      pointRadius: years.length > 50 ? 0 : 3,
      pointHoverRadius: 5,
      pointBackgroundColor: cat.color
    };
  });

  if (Charts.historicalChart) Charts.historicalChart.destroy();

  Charts.historicalChart = new Chart(ctx, {
    type: Charts.currentTab === 'bar' ? 'bar' : 'line',
    data: { labels: years, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#141b24',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e8edf3',
          bodyColor: '#8fa3ba',
          padding: 12,
          callbacks: {
            title: items => 'Year ' + items[0].label,
            label: item => {
              const cat = VS.CATEGORIES.find(c => c.label === item.dataset.label);
              const v = item.raw;
              const unit = cat ? cat.unit : '';
              return ` ${item.dataset.label}: ${v.toFixed(3)} ${unit}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#4d6070', font: { family: "'DM Mono', monospace", size: 11 },
            maxTicksLimit: 20, maxRotation: 45
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: {
            color: '#4d6070', font: { family: "'DM Mono', monospace", size: 11 },
            callback: v => v >= 1 ? v.toFixed(1) + '' : v.toFixed(3)
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
};

// ---- COMPARISON CHART ----
Charts.populateCompareSelects = function() {
  const selA = document.getElementById('yearA');
  const selB = document.getElementById('yearB');
  if (!selA || !selB) return;

  VS.YEARS.forEach(y => {
    selA.appendChild(new Option(y, y));
    selB.appendChild(new Option(y, y));
  });
  selA.value = 1990;
  selB.value = 2024;
};

Charts.renderComparison = function() {
  const yearA = parseInt(document.getElementById('yearA').value);
  const yearB = parseInt(document.getElementById('yearB').value);
  const ctx = document.getElementById('comparisonChart');
  if (!ctx) return;

  const idxA = VS.YEARS.indexOf(yearA);
  const idxB = VS.YEARS.indexOf(yearB);

  const labels = VS.CATEGORIES.map(c => c.label);
  const dataA  = VS.CATEGORIES.map(c => VS.historical[c.id][idxA] || 0);
  const dataB  = VS.CATEGORIES.map(c => VS.historical[c.id][idxB] || 0);

  if (Charts.comparisonChart) Charts.comparisonChart.destroy();

  Charts.comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: String(yearA),
          data: dataA,
          backgroundColor: '#3b9de8aa',
          borderColor: '#3b9de8',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: String(yearB),
          data: dataB,
          backgroundColor: '#22c87aaa',
          borderColor: '#22c87a',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#8fa3ba', font: { family: "'DM Mono', monospace", size: 12 } }
        },
        tooltip: {
          backgroundColor: '#141b24',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e8edf3',
          bodyColor: '#8fa3ba',
          padding: 12
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#4d6070', font: { family: "'DM Mono', monospace", size: 10 },
            maxRotation: 35
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: {
            color: '#4d6070', font: { family: "'DM Mono', monospace", size: 11 },
            callback: v => v.toFixed(2)
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
};

// ---- DONUT CHART ----
Charts.renderDonut = function() {
  const ctx = document.getElementById('donutChart');
  const legendEl = document.getElementById('donutLegend');
  if (!ctx || !legendEl) return;

  if (Charts.donutChart) Charts.donutChart.destroy();

  Charts.donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: VS.deathCauses.map(d => d.label),
      datasets: [{
        data: VS.deathCauses.map(d => d.pct),
        backgroundColor: VS.deathCauses.map(d => d.color),
        borderColor: '#080b0f',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#141b24',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e8edf3',
          bodyColor: '#8fa3ba',
          callbacks: { label: ctx => ` ${ctx.raw}% of all deaths` }
        }
      }
    }
  });

  // Custom legend
  legendEl.innerHTML = '';
  VS.deathCauses.forEach(d => {
    const item = document.createElement('div');
    item.className = 'donut-legend-item';
    item.innerHTML = `
      <span class="donut-legend-swatch" style="background:${d.color}"></span>
      <span class="donut-legend-name">${d.label}</span>
      <span class="donut-legend-pct" style="color:${d.color}">${d.pct}%</span>
    `;
    legendEl.appendChild(item);
  });
};

// ---- TAB SWITCHING ----
Charts.initTabs = function() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Charts.currentTab = btn.dataset.tab;
      Charts.renderHistorical();
    });
  });
};

// ---- API CARDS ----
Charts.buildApiCards = function() {
  const grid = document.getElementById('apiGrid');
  if (!grid) return;
  VS.API_SOURCES.forEach(src => {
    const card = document.createElement('div');
    card.className = 'api-card';
    card.innerHTML = `
      <div class="api-card-header">
        <span class="api-badge">${src.badge}</span>
        <span class="api-name">${src.name}</span>
      </div>
      <div class="api-desc">${src.desc}</div>
      <div style="font-size:12px;color:#4d6070;margin-bottom:6px;">Covers: ${src.dataFor}</div>
      <div class="api-url">${src.url}</div>
      <div class="api-cost">✓ ${src.cost}</div>
    `;
    grid.appendChild(card);
  });
};

Charts.init = function() {
  Charts.buildPills();
  Charts.initTabs();
  Charts.populateCompareSelects();
  Charts.renderHistorical();
  Charts.renderDonut();
  Charts.buildApiCards();
};
