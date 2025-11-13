// contentScript.js
// Fügt ein farbiges Banner am oberen Rand der Seite ein,
// wenn die aktuelle URL auf das konfigurierte Muster passt.

function wildcardToRegExp(pattern) {
  // Sonderzeichen escapen, dann * in .*
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexStr = '^' + escaped.replace(/\\\*/g, '.*') + '$';
  return new RegExp(regexStr);
}

function matchesPattern(url, pattern) {
  if (!pattern) return false;
  try {
    const re = wildcardToRegExp(pattern);
    return re.test(url);
  } catch (e) {
    console.warn('Fehler im Pattern:', e);
    return false;
  }
}

function removeBanner() {
  const existing = document.getElementById('url-tab-highlighter-banner');
  if (existing && existing.parentElement) {
    existing.parentElement.removeChild(existing);
  }
}

function addBanner(color) {
  removeBanner();
  const banner = document.createElement('div');
  banner.id = 'url-tab-highlighter-banner';
  banner.style.position = 'fixed';
  banner.style.top = '0';
  banner.style.left = '0';
  banner.style.width = '100%';
  banner.style.height = '4px';
  banner.style.zIndex = '2147483647';
  banner.style.backgroundColor = color;
  banner.style.pointerEvents = 'none';
  document.documentElement.appendChild(banner);
}

// Theme-Color steuern, um den Tab (z. B. in Mobilbrowsern) optisch zu färben
let originalThemeMeta = null;
let originalThemeContent = null;

function setThemeColor(color) {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head && document.head.appendChild(meta);
  }
  if (!originalThemeMeta) {
    originalThemeMeta = meta;
    originalThemeContent = meta.getAttribute('content');
  }
  meta.setAttribute('content', color);
}

function restoreThemeColor() {
  if (originalThemeMeta) {
    if (originalThemeContent == null) {
      // kein ursprünglicher Wert: entfernen, wenn von uns erzeugt
      // Entfernen nur, wenn kein anderer Wert gesetzt wurde
      if (originalThemeMeta.getAttribute('content') !== null) {
        originalThemeMeta.removeAttribute('content');
      }
    } else {
      originalThemeMeta.setAttribute('content', originalThemeContent);
    }
  }
  originalThemeMeta = null;
  originalThemeContent = null;
}

// Favicon-Manipulation wurde entfernt

function updateHighlight() {
  const url = window.location.href;
  chrome.storage.sync.get(
    { rules: [] },
    ({ rules }) => {
      const list = Array.isArray(rules) ? rules : [];
      const matches = list.filter(r => r && r.enabled && r.pattern && r.color && matchesPattern(url, r.pattern));
      // Wähle die spezifischste Regel: längstes Muster gewinnt
      const best = matches.reduce((acc, r) => {
        if (!acc) return r;
        return (r.pattern.length > acc.pattern.length) ? r : acc;
      }, null);
      if (best) {
        addBanner(best.color);
        if (document.visibilityState === 'visible') {
          setThemeColor(best.color);
        } else {
          restoreThemeColor();
        }
      } else {
        removeBanner();
        restoreThemeColor();
      }
    }
  );
}

// Beim Laden der Seite ausführen
updateHighlight();

// Auf Änderungen in den Einstellungen reagieren
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.rules || changes.pattern || changes.color)) {
      updateHighlight();
    }
  });
} catch (e) {
  // Ignorieren, falls API nicht verfügbar
}

// Reagiere auf Tab-Aktivität (Sichtbarkeit)
document.addEventListener('visibilitychange', () => {
  updateHighlight();
});
