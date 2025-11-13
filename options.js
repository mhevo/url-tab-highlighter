// options.js – Pro-UX: Drag & Drop, Validierung, Import/Export, Toasts
(function () {
  'use strict';

  const patternInput = document.getElementById('pattern');
  const colorInput = document.getElementById('color');
  const addButton = document.getElementById('add');
  const rulesList = document.getElementById('rulesList');
  const emptyState = document.getElementById('emptyState');
  const status = document.getElementById('status');
  const toast = document.getElementById('toast');
  const btnExport = document.getElementById('export');
  const btnImport = document.getElementById('import');
  const inputImport = document.getElementById('importFile');
  const btnClear = document.getElementById('clear');

  function showToast(msg, kind = 'info') {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function showStatus(msg) {
    status.textContent = msg;
    setTimeout(() => { status.textContent = ''; }, 1200);
  }

  function wildcardToRegExp(pattern) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = '^' + escaped.replace(/\\\*/g, '.*') + '$';
    return new RegExp(regexStr);
  }

  function isValidPattern(pattern) {
    if (!pattern) return false;
    try { wildcardToRegExp(pattern); return true; } catch { return false; }
  }

  function loadRules(cb) {
    chrome.storage.sync.get({ rules: [] }, (data) => {
      if ((!data.rules || data.rules.length === 0)) {
        chrome.storage.sync.get({ pattern: '', color: '' }, ({ pattern, color }) => {
          if (pattern || color) {
            const migrated = [];
            if (pattern && color) migrated.push({ pattern, color, enabled: true });
            chrome.storage.sync.set({ rules: migrated }, () => cb(migrated));
          } else {
            cb([]);
          }
        });
        return;
      }
      cb(data.rules || []);
    });
  }

  function saveRules(rules, cb) {
    chrome.storage.sync.set({ rules }, () => cb && cb());
  }

  function updateEmptyState(rules) {
    if (!rules || rules.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }
  }

  function renderRules(rules) {
    rulesList.innerHTML = '';
    updateEmptyState(rules);
    rules.forEach((rule, index) => {
      const li = document.createElement('li');
      li.className = 'rule';
      li.draggable = true;
      li.dataset.index = String(index);

      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.title = 'Ziehen zum Sortieren';
      handle.textContent = '⋮⋮';

      const inputPattern = document.createElement('input');
      inputPattern.type = 'text';
      inputPattern.value = rule.pattern || '';
      if (!isValidPattern(inputPattern.value)) inputPattern.classList.add('invalid');

      const inputColor = document.createElement('input');
      inputColor.type = 'color';
      inputColor.value = rule.color || '#ff0000';

      const enabledWrap = document.createElement('label');
      enabledWrap.className = 'switch';
      const inputEnabled = document.createElement('input');
      inputEnabled.type = 'checkbox';
      inputEnabled.checked = !!rule.enabled;
      enabledWrap.appendChild(inputEnabled);
      const enabledTxt = document.createElement('span');
      enabledTxt.textContent = 'Aktiv';
      enabledWrap.appendChild(enabledTxt);

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Speichern';

      const delBtn = document.createElement('button');
      delBtn.className = 'danger';
      delBtn.textContent = 'Löschen';

      li.appendChild(handle);
      li.appendChild(inputPattern);
      li.appendChild(inputColor);
      li.appendChild(enabledWrap);
      li.appendChild(saveBtn);
      li.appendChild(delBtn);
      rulesList.appendChild(li);

      // Inline validation
      inputPattern.addEventListener('input', () => {
        inputPattern.classList.toggle('invalid', !isValidPattern(inputPattern.value.trim()));
      });

      // Enabled toggle (save immediately)
      inputEnabled.addEventListener('change', () => {
        loadRules((current) => {
          current[index].enabled = inputEnabled.checked;
          saveRules(current);
        });
      });

      // Save edits
      saveBtn.addEventListener('click', () => {
        const pattern = inputPattern.value.trim();
        const color = inputColor.value;
        if (!isValidPattern(pattern)) {
          inputPattern.classList.add('invalid');
          showToast('Ungültiges Muster. Wildcards mit * nutzen.');
          return;
        }
        loadRules((current) => {
          current[index] = { pattern, color, enabled: inputEnabled.checked };
          saveRules(current, () => showToast('Regel gespeichert.'));
        });
      });

      // Delete
      delBtn.addEventListener('click', () => {
        if (!confirm('Regel wirklich löschen?')) return;
        loadRules((current) => {
          current.splice(index, 1);
          saveRules(current, () => {
            renderRules(current);
            showToast('Regel gelöscht.');
          });
        });
      });

      // Drag & Drop reorder
      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const to = index;
        if (Number.isNaN(from) || from === to) return;
        loadRules((current) => {
          const item = current.splice(from, 1)[0];
          current.splice(to, 0, item);
          saveRules(current, () => renderRules(current));
        });
      });
    });
  }

  function addRule() {
    const pattern = patternInput.value.trim();
    const color = colorInput.value;
    if (!isValidPattern(pattern)) {
      patternInput.classList.add('invalid');
      showStatus('Bitte ein gültiges Muster angeben.');
      return;
    }
    patternInput.classList.remove('invalid');
    loadRules((rules) => {
      rules.push({ pattern, color, enabled: true });
      saveRules(rules, () => {
        patternInput.value = '';
        renderRules(rules);
        showToast('Regel hinzugefügt.');
      });
    });
  }

  function exportRules() {
    loadRules((rules) => {
      const blob = new Blob([JSON.stringify({ rules }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'url-tab-highlighter-rules.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Regeln exportiert.');
    });
  }

  function importRulesFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const arr = Array.isArray(parsed.rules) ? parsed.rules : [];
        const cleaned = arr
          .filter(r => r && typeof r.pattern === 'string' && typeof r.color === 'string')
          .map(r => ({ pattern: r.pattern, color: r.color, enabled: !!r.enabled }));
        saveRules(cleaned, () => {
          renderRules(cleaned);
          showToast('Regeln importiert.');
        });
      } catch (e) {
        showToast('Import fehlgeschlagen: ungültige Datei.');
      }
    };
    reader.readAsText(file);
  }

  function clearAll() {
    if (!confirm('Alle Regeln löschen?')) return;
    saveRules([], () => {
      renderRules([]);
      showToast('Alle Regeln gelöscht.');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    addButton.addEventListener('click', addRule);
    btnExport.addEventListener('click', exportRules);
    btnImport.addEventListener('click', () => inputImport.click());
    inputImport.addEventListener('change', (e) => importRulesFromFile(e.target.files && e.target.files[0]));
    btnClear.addEventListener('click', clearAll);
    loadRules((rules) => renderRules(rules));
  });
})();
