# URL Tab Highlighter

Ein leichtgewichtiges Chrome-Extension (Manifest V3), das aktive Seiten mit einem schmalen Farb‑Banner oben markiert – basierend auf frei definierbaren URL‑Mustern. Nützlich, um Umgebungen (Prod/Staging/Local) oder wichtige Seiten auf einen Blick zu unterscheiden.

## Funktionen
- Regeln (CRUD) mit Muster + Farbe, pro Regel aktivierbar.
- Wildcards im Muster unterstützt (z. B. `https://example.com/*`).
- Die spezifischste passende Regel gewinnt (längstes Muster).
- Setzt optional die `theme-color`, wenn der Tab sichtbar ist.

## Installation (Entwicklermodus)
1. Öffne `chrome://extensions` (oder Edge: `edge://extensions`).
2. Aktiviere den Entwicklermodus.
3. „Entpackte Erweiterung laden“ und dieses Verzeichnis auswählen.

## Verwendung
1. Optionen der Erweiterung öffnen.
2. Unter „Neue Regel hinzufügen“ ein URL‑Muster und eine Farbe wählen, „Hinzufügen“.
3. In der Tabelle Regeln bei Bedarf bearbeiten, aktivieren/deaktivieren oder löschen.
4. Beim Besuch passender Seiten erscheint oben ein 4px‑Banner in der gewählten Farbe.

### Musterbeispiele
- Nur Domain: `https://example.com/*`
- Subpfad: `https://example.com/app/*`
- Beliebiges Protokoll: `*://example.com/*`
- Sehr breit (Fallback): `*://*/*`

## Berechtigungen
- `storage` zum Speichern der Regeln.
- `host_permissions: <all_urls>` damit das Banner auf allen Seiten angezeigt werden kann.

## Entwicklung
- Keine Build‑Schritte nötig; reine Dateien:
  - `manifest.json` – Metadaten, Berechtigungen, Einbindung der Scripts
  - `contentScript.js` – Bannerlogik und Regelmatching
  - `options.html`, `options.js` – Options‑UI für Regeln
- Projektstruktur ist flach; IDE‑Ordner werden via `.gitignore` ausgeschlossen.

## Bekannte Einschränkungen
- Nur optische Markierung (Banner/Theme‑Farbe); kein Tab‑Icon wird verändert.
- Regelpriorität richtet sich nach Spezifität (Länge des Musters), nicht nach Reihenfolge.
