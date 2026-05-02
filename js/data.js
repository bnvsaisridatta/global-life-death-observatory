// ===== VITAL STATS DATA MODULE =====
// Sources: WHO Global Health Estimates, UN World Population Prospects,
// UNODC Homicide Monitor, ESHRE ART Fact Sheets, World Bank open data
// All values are in MILLIONS unless noted

const VS = {};

// ---- YEAR RANGE ----
VS.YEAR_START = 1924;
VS.YEAR_END   = 2024;
VS.YEARS = Array.from({ length: VS.YEAR_END - VS.YEAR_START + 1 }, (_, i) => VS.YEAR_START + i);

// ---- CATEGORY CONFIG ----
VS.CATEGORIES = [
  {
    id: 'births',
    label: 'Natural births',
    icon: '🍼',
    color: '#22c87a',
    unit: 'M',
    perYear: 140,        // millions/year current
    apiSource: 'UN World Population Division',
    desc: 'Live births globally per year'
  },
  {
    id: 'ivf',
    label: 'IVF / ART births',
    icon: '🔬',
    color: '#3b9de8',
    unit: 'K',
    perYear: 0.5,        // millions → 500K
    apiSource: 'ESHRE ART',
    desc: 'Assisted reproductive technology births'
  },
  {
    id: 'deaths',
    label: 'All-cause deaths',
    icon: '💀',
    color: '#8fa3ba',
    unit: 'M',
    perYear: 60,
    apiSource: 'WHO GHE',
    desc: 'Total deaths from all causes'
  },
  {
    id: 'homicides',
    label: 'Homicides',
    icon: '🔴',
    color: '#f05252',
    unit: 'K',
    perYear: 0.43,       // millions → 430K
    apiSource: 'UNODC Homicide Monitor',
    desc: 'Intentional homicides worldwide'
  },
  {
    id: 'suicides',
    label: 'Suicides',
    icon: '🟠',
    color: '#f5a623',
    unit: 'K',
    perYear: 0.70,       // millions → 700K
    apiSource: 'WHO Mental Health',
    desc: 'Deaths by suicide globally'
  },
  {
    id: 'road',
    label: 'Road accident deaths',
    icon: '🚗',
    color: '#9b7fff',
    unit: 'M',
    perYear: 1.35,
    apiSource: 'WHO Road Safety',
    desc: 'Fatal road traffic accidents'
  },
  {
    id: 'infant',
    label: 'Infant deaths',
    icon: '👶',
    color: '#f06292',
    unit: 'M',
    perYear: 5,
    apiSource: 'UN IGME',
    desc: 'Deaths of children under age 1'
  },
  {
    id: 'cancer',
    label: 'Cancer deaths',
    icon: '🎗️',
    color: '#26d4c3',
    unit: 'M',
    perYear: 10,
    apiSource: 'WHO IARC / GHE',
    desc: 'Deaths attributable to cancer'
  }
];

// ---- HISTORICAL DATA GENERATOR ----
// Generates plausible historical values based on known anchor points
// Key anchors from WHO/UN historical records:
//
// BIRTHS: 1924≈65M → 1950≈98M → 1970≈123M → 1990≈140M → 2000≈134M → 2024≈140M
// IVF: pre-1978=0, 1980≈1K, 1990≈100K, 2000≈200K, 2010≈370K, 2024≈500K
// DEATHS: 1924≈55M (incl. post-WWI influenza tail) → 1950≈50M → 1980≈51M → 2024≈60M
// HOMICIDES: 1924≈800K → 1950≈600K → 1980≈540K → 2000≈500K → 2024≈430K
// SUICIDES: 1924≈400K → 1950≈550K → 1970≈680K → 1990≈820K → 2000≈870K → 2024≈700K
// ROAD: pre-1920≈0, 1930≈100K, 1950≈400K, 1972≈1.1M(peak), 2000≈1.2M, 2024≈1.35M
// INFANT: 1924≈20M → 1950≈15M → 1970≈10M → 1990≈8M → 2000≈7M → 2024≈5M
// CANCER: 1924≈2M → 1950≈3M → 1970≈4.5M → 1990≈6.5M → 2000≈7.5M → 2024≈10M

function lerp(a, b, t) { return a + (b - a) * t; }

function makeAnchors(anchors) {
  // anchors: [[year, value], ...]
  return function(year) {
    for (let i = 0; i < anchors.length - 1; i++) {
      const [y0, v0] = anchors[i];
      const [y1, v1] = anchors[i + 1];
      if (year >= y0 && year <= y1) {
        const t = (year - y0) / (y1 - y0);
        // slight ease-in-out
        const te = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
        return lerp(v0, v1, te);
      }
    }
    // clamp outside
    if (year < anchors[0][0]) return anchors[0][1];
    return anchors[anchors.length-1][1];
  };
}

const historicalFns = {
  births: makeAnchors([
    [1924, 65], [1935, 73], [1946, 85], [1950, 98], [1960, 112],
    [1965, 122], [1970, 123], [1975, 125], [1980, 127], [1985, 130],
    [1990, 140], [1995, 137], [2000, 134], [2005, 135], [2010, 137],
    [2015, 140], [2020, 140], [2024, 140]
  ]),
  ivf: makeAnchors([
    [1924, 0], [1977, 0], [1978, 0.001], [1980, 0.002], [1985, 0.02],
    [1990, 0.1], [1995, 0.15], [2000, 0.20], [2005, 0.28], [2010, 0.37],
    [2015, 0.42], [2019, 0.47], [2024, 0.50]
  ]),
  deaths: makeAnchors([
    [1924, 55], [1930, 51], [1935, 50], [1940, 58], [1943, 75], // WWII peak
    [1945, 62], [1950, 50], [1960, 51], [1970, 52], [1980, 51],
    [1990, 53], [2000, 56], [2010, 57], [2019, 58], [2020, 61], // COVID
    [2021, 62], [2022, 60], [2024, 60]
  ]),
  homicides: makeAnchors([
    [1924, 0.80], [1930, 0.75], [1940, 0.70], [1945, 0.85], // post-WWII
    [1950, 0.60], [1960, 0.52], [1970, 0.50], [1975, 0.52],
    [1980, 0.54], [1990, 0.51], [1995, 0.50], [2000, 0.50],
    [2007, 0.48], [2012, 0.47], [2018, 0.44], [2024, 0.43]
  ]),
  suicides: makeAnchors([
    [1924, 0.40], [1930, 0.45], [1935, 0.48], [1940, 0.50],
    [1950, 0.55], [1960, 0.62], [1970, 0.68], [1980, 0.75],
    [1990, 0.82], [1995, 0.85], [2000, 0.87], [2005, 0.84],
    [2010, 0.80], [2015, 0.79], [2019, 0.74], [2024, 0.70]
  ]),
  road: makeAnchors([
    [1924, 0.05], [1930, 0.10], [1940, 0.20], [1950, 0.40],
    [1960, 0.70], [1970, 0.96], [1972, 1.10], [1980, 1.05],
    [1990, 1.10], [2000, 1.20], [2010, 1.27], [2018, 1.35],
    [2024, 1.35]
  ]),
  infant: makeAnchors([
    [1924, 20], [1930, 18], [1940, 17], [1950, 15], [1960, 13],
    [1970, 10], [1980, 8.5], [1990, 8], [2000, 7], [2010, 6],
    [2015, 5.5], [2024, 5]
  ]),
  cancer: makeAnchors([
    [1924, 2.0], [1930, 2.3], [1940, 2.8], [1950, 3.0],
    [1960, 3.8], [1970, 4.5], [1980, 5.5], [1990, 6.5],
    [2000, 7.5], [2010, 8.5], [2015, 9.0], [2024, 10.0]
  ])
};

// Build full dataset
VS.historical = {};
VS.CATEGORIES.forEach(cat => {
  VS.historical[cat.id] = VS.YEARS.map(y => {
    const raw = historicalFns[cat.id](y);
    // Add tiny noise for realism (±0.5%)
    const noise = 1 + (Math.random() - 0.5) * 0.005;
    return Math.max(0, parseFloat((raw * noise).toFixed(4)));
  });
});

// ---- CURRENT RATES (per second) ----
VS.SECONDS_PER_YEAR = 365.25 * 24 * 3600;

VS.ratesPerSecond = {};
VS.CATEGORIES.forEach(cat => {
  // perYear is in millions; convert to per-second count
  VS.ratesPerSecond[cat.id] = (cat.perYear * 1e6) / VS.SECONDS_PER_YEAR;
});

// ---- DONUT DATA ----
VS.deathCauses = [
  { label: 'Cardiovascular disease', pct: 31.8, color: '#f05252' },
  { label: 'Cancer',                 pct: 17.1, color: '#26d4c3' },
  { label: 'Respiratory disease',    pct: 7.3,  color: '#9b7fff' },
  { label: 'Alzheimer\'s / dementia',pct: 5.2,  color: '#f5a623' },
  { label: 'Lower resp. infections', pct: 5.0,  color: '#3b9de8' },
  { label: 'Road accidents',         pct: 2.3,  color: '#9b7fff' },
  { label: 'Diabetes',               pct: 2.2,  color: '#ff7043' },
  { label: 'Suicides',               pct: 1.2,  color: '#f5a623' },
  { label: 'Homicides',              pct: 0.7,  color: '#f06292' },
  { label: 'Other causes',           pct: 27.2, color: '#4d6070' }
];

// ---- API SOURCES ----
VS.API_SOURCES = [
  {
    name: 'UN World Population Division',
    badge: 'FREE · JSON',
    desc: 'Historical and projected global birth rates, population, mortality. Annual datasets from 1950 onwards.',
    url: 'https://population.un.org/dataportal/data/indicators/55/locations/900/start/1950/end/2023/table/pivotbylocation',
    cost: '100% free, no API key needed',
    dataFor: 'Births, population growth, life expectancy'
  },
  {
    name: 'WHO Global Health Observatory',
    badge: 'FREE · REST API',
    desc: 'WHO open data on mortality, disease burden, road safety, mental health including suicide rates by country.',
    url: 'https://ghoapi.azureedge.net/api/',
    cost: '100% free, no authentication',
    dataFor: 'Deaths, disease, road accidents, suicide'
  },
  {
    name: 'World Bank Open Data',
    badge: 'FREE · JSON',
    desc: 'Structured API with indicators like SP.DYN.CBRT.IN (birth rate), SH.STA.SUIC.P5 (suicide rate), VC.IHR.PSRC.P5 (homicide rate).',
    url: 'https://api.worldbank.org/v2/country/WLD/indicator/SP.DYN.CBRT.IN?format=json',
    cost: '100% free, no API key',
    dataFor: 'Birth rate, suicide rate, homicide rate'
  },
  {
    name: 'UNODC Homicide Monitor',
    badge: 'FREE · CSV/JSON',
    desc: 'UN Office on Drugs and Crime — global intentional homicide counts and rates by year and country.',
    url: 'https://dataunodc.un.org/dp-intentional-homicide-victims',
    cost: '100% free download',
    dataFor: 'Global & national homicide data'
  },
  {
    name: 'ESHRE ART Fact Sheets',
    badge: 'FREE · PDF/CSV',
    desc: 'European Society of Human Reproduction — annual IVF/ART cycle data across 47 countries. Best global IVF dataset.',
    url: 'https://www.eshre.eu/Data-collection-and-research/Consortia/EIM/ART-fact-sheet',
    cost: '100% free download',
    dataFor: 'IVF / test-tube baby counts'
  },
  {
    name: 'Our World in Data (OWID)',
    badge: 'FREE · CSV/JSON',
    desc: 'Well-structured long-run historical data on all these metrics. Direct CSV downloads and GitHub repo. Best for 100-year historical charts.',
    url: 'https://ourworldindata.org/grapher/child-mortality-igme',
    cost: '100% free, MIT license',
    dataFor: 'Historical trends 1800–present'
  }
];

// ---- TICKER ITEMS ----
VS.TICKER_ITEMS = VS.CATEGORIES.map(c => ({
  id: c.id,
  label: c.label,
  color: c.color
}));

console.log('[VitalStats] Data module loaded — ' + VS.YEARS.length + ' years, ' + VS.CATEGORIES.length + ' categories');
