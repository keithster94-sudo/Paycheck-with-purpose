// ============================================================
//  Builder OS  –  app.js
//  All data lives in localStorage. No server required.
// ============================================================

// ---- Field ID maps ----

const SLIDERS      = ['sleep', 'energy', 'pain', 'stress', 'focus', 'capacity'];
const TEXTS        = ['capacity-notes', 'priority1', 'priority2', 'priority3',
                      'win', 'challenge', 'lesson', 'tomorrow-focus'];
const HEALTH_IDS   = ['water', 'walk', 'stretch', 'meals'];
const VENTURE_IDS  = ['scg', 'primerica', 'xosial', 'school', 'ministry', 'drivers'];
const DASH_GOALS   = ['drivers', 'pmcert', 'scgclients', 'income', 'health', 'ministry', 'school'];

const WEEKLY_FIELDS = [
  { id: 'weekly-wins',        key: 'wins'              },
  { id: 'weekly-challenges',  key: 'challenges'        },
  { id: 'faith-check',        key: 'faithCheck'        },
  { id: 'weekly-health',      key: 'healthCheck'       },
  { id: 'scg-progress',       key: 'scgProgress'       },
  { id: 'school-progress',    key: 'schoolProgress'    },
  { id: 'financial-progress', key: 'financialProgress' },
  { id: 'next-week-focus',    key: 'nextWeekFocus'     },
];

// ---- Utility ----

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getEntryDate() {
  return document.getElementById('entry-date').value || todayStr();
}

function getMondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + shift);
  return d.toISOString().split('T')[0];
}

function formatLongDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}

function el(id) {
  return document.getElementById(id);
}

// ---- Toast ----

let toastTimer = null;

function showToast(msg, ms = 2200) {
  const toast = el('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}

// ---- Tab Switching ----

function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  el('tab-' + name).classList.add('active');
  el('nav-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

// ---- Sliders ----

function updateSlider(id) {
  const input   = el(id);
  const display = el(id + '-val');
  if (input && display) display.textContent = input.value;
}

function updateDashSlider(id) {
  const input = el('dash-' + id);
  const badge = el('dash-' + id + '-val');
  const fill  = el('dash-' + id + '-bar');
  if (!input) return;
  const pct = input.value + '%';
  if (badge) badge.textContent = pct;
  if (fill)  fill.style.width  = pct;
}

// ---- Daily Entry ----

function loadEntry() {
  const data = JSON.parse(localStorage.getItem('daily_' + getEntryDate()) || '{}');

  SLIDERS.forEach(id => {
    const input = el(id);
    if (!input) return;
    const defaultVal = id === 'capacity' ? 50 : (id === 'pain' ? 1 : 5);
    input.value = data[id] !== undefined ? data[id] : defaultVal;
    updateSlider(id);
  });

  TEXTS.forEach(id => {
    const input = el(id);
    if (input) input.value = data[id] || '';
  });

  HEALTH_IDS.forEach(id => {
    const box = el('health-' + id);
    if (box) box.checked = data['health_' + id] || false;
  });

  VENTURE_IDS.forEach(id => {
    const box = el('venture-' + id);
    if (box) box.checked = data['venture_' + id] || false;
  });
}

function saveEntry() {
  const data = {};

  SLIDERS.forEach(id => {
    const input = el(id);
    if (input) data[id] = input.value;
  });

  TEXTS.forEach(id => {
    const input = el(id);
    if (input) data[id] = input.value;
  });

  HEALTH_IDS.forEach(id => {
    const box = el('health-' + id);
    if (box) data['health_' + id] = box.checked;
  });

  VENTURE_IDS.forEach(id => {
    const box = el('venture-' + id);
    if (box) data['venture_' + id] = box.checked;
  });

  localStorage.setItem('daily_' + getEntryDate(), JSON.stringify(data));
  showToast('Entry saved');
}

function clearToday() {
  if (!confirm('Clear all data for this date? This cannot be undone.')) return;
  localStorage.removeItem('daily_' + getEntryDate());
  loadEntry();
  showToast('Entry cleared');
}

// ---- Export Text ----

function exportText() {
  const dateStr = getEntryDate();
  const data    = JSON.parse(localStorage.getItem('daily_' + dateStr) || '{}');

  function v(id) {
    const input = el(id);
    if (input) return input.value || '—';
    return data[id] || '—';
  }

  function c(id) {
    const box = el(id);
    const checked = box ? box.checked : (data[id.replace('health-','health_').replace('venture-','venture_')] || false);
    return checked ? '[x]' : '[ ]';
  }

  const text = [
    '=== BUILDER OS — Daily Entry ===',
    formatLongDate(dateStr),
    '',
    '--- Daily Builder Sheet ---',
    'Sleep:  ' + v('sleep')  + '/10',
    'Energy: ' + v('energy') + '/10',
    'Pain:   ' + v('pain')   + '/10',
    'Stress: ' + v('stress') + '/10',
    'Focus:  ' + v('focus')  + '/10',
    '',
    '--- Capacity Check ---',
    'Capacity: ' + v('capacity') + '%',
    'Notes:    ' + v('capacity-notes'),
    '',
    '--- Top 3 Priorities ---',
    '1. ' + v('priority1'),
    '2. ' + v('priority2'),
    '3. ' + v('priority3'),
    '',
    '--- Health Check ---',
    c('health-water')   + ' Water',
    c('health-walk')    + ' Walk',
    c('health-stretch') + ' Stretch',
    c('health-meals')   + ' Healthy Meals',
    '',
    '--- Venture Check ---',
    c('venture-scg')       + ' SCG',
    c('venture-primerica') + ' Primerica',
    c('venture-xosial')    + " Xosial X",
    c('venture-school')    + ' School',
    c('venture-ministry')  + ' Ministry',
    c('venture-drivers')   + " Driver's License",
    '',
    '--- Evening Review ---',
    'Biggest Win:       ' + v('win'),
    'Biggest Challenge: ' + v('challenge'),
    'Lesson Learned:    ' + v('lesson'),
    "Tomorrow's Focus:  " + v('tomorrow-focus'),
  ].join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(area);
  area.focus();
  area.select();
  try {
    document.execCommand('copy');
    showToast('Copied to clipboard');
  } catch (_) {
    showToast('Could not copy — try again', 3000);
  }
  document.body.removeChild(area);
}

// ---- Weekly Review ----

function loadWeekly() {
  const weekDate = el('week-date').value;
  if (!weekDate) return;

  const key  = 'weekly_' + getMondayOf(weekDate);
  const data = JSON.parse(localStorage.getItem(key) || '{}');

  WEEKLY_FIELDS.forEach(({ id, key: k }) => {
    const input = el(id);
    if (input) input.value = data[k] || '';
  });
}

function saveWeekly() {
  const weekDate = el('week-date').value;
  if (!weekDate) {
    showToast('Pick a date first', 3000);
    return;
  }

  const key  = 'weekly_' + getMondayOf(weekDate);
  const data = {};

  WEEKLY_FIELDS.forEach(({ id, key: k }) => {
    const input = el(id);
    if (input) data[k] = input.value;
  });

  localStorage.setItem(key, JSON.stringify(data));
  showToast('Weekly review saved');
}

// ---- Dashboard ----

function loadDashboard() {
  const data = JSON.parse(localStorage.getItem('dashboard') || '{}');

  DASH_GOALS.forEach(id => {
    const goal     = data[id] || {};
    const slider   = el('dash-' + id);
    const notesBox = el('dash-' + id + '-notes');

    if (slider) {
      slider.value = goal.progress || 0;
      updateDashSlider(id);
    }
    if (notesBox) notesBox.value = goal.notes || '';
  });
}

function saveDashboard() {
  const data = {};

  DASH_GOALS.forEach(id => {
    const slider   = el('dash-' + id);
    const notesBox = el('dash-' + id + '-notes');
    data[id] = {
      progress: slider   ? slider.value   : 0,
      notes:    notesBox ? notesBox.value : '',
    };
  });

  localStorage.setItem('dashboard', JSON.stringify(data));
  showToast('Dashboard saved');
}

// ---- Initialization ----

function init() {
  // Set date inputs to today / this week's Monday
  el('entry-date').value = todayStr();
  el('week-date').value  = getMondayOf(todayStr());

  // Load all sections
  loadEntry();
  loadWeekly();
  loadDashboard();
}

document.addEventListener('DOMContentLoaded', init);
