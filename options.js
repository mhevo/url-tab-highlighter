// options.js
// Verwaltung mehrerer Regeln (CRUD) in chrome.storage.sync

(function () {
  'use strict';

  const patternInput = document.getElementById('pattern');
  const colorInput = document.getElementById('color');
  const addButton = document.getElementById('add');
  const rulesTbody = document.getElementById('rules');
  const status = document.getElementById('status');

  function showStatus(msg) {
    status.textContent = msg;
    setTimeout(() => { status.textContent = ''; }, 1500);
  }

  function loadRules(cb) {
    chrome.storage.sync.get({ rules: [] }, async (data) => {
      // Migration: alte Felder in rules überführen
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
    chrome.storage.sync.set({ rules }, () => {
      cb && cb();
    });
  }

  function renderRules(rules) {
    rulesTbody.innerHTML = '';
    rules.forEach((rule, index) => {
      const tr = document.createElement('tr');
      tr.dataset.index = String(index);

      const tdPattern = document.createElement('td');
      const inputPattern = document.createElement('input');
      inputPattern.type = 'text';
      inputPattern.value = rule.pattern || '';
      inputPattern.style.width = '100%';
      tdPattern.appendChild(inputPattern);

      const tdColor = document.createElement('td');
      const inputColor = document.createElement('input');
      inputColor.type = 'color';
      inputColor.value = rule.color || '#ff0000';
      tdColor.appendChild(inputColor);

      const tdEnabled = document.createElement('td');
      const inputEnabled = document.createElement('input');
      inputEnabled.type = 'checkbox';
      inputEnabled.checked = !!rule.enabled;
      tdEnabled.appendChild(inputEnabled);

      const tdActions = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'row-actions';
      const btnSave = document.createElement('button');
      btnSave.textContent = 'Speichern';
      const btnDelete = document.createElement('button');
      btnDelete.textContent = 'Löschen';
      actions.appendChild(btnSave);
      actions.appendChild(btnDelete);
      tdActions.appendChild(actions);

      tr.appendChild(tdPattern);
      tr.appendChild(tdColor);
      tr.appendChild(tdEnabled);
      tr.appendChild(tdActions);
      rulesTbody.appendChild(tr);

      // Events
      inputEnabled.addEventListener('change', () => {
        loadRules((current) => {
          current[index].enabled = inputEnabled.checked;
          saveRules(current);
        });
      });

      btnSave.addEventListener('click', () => {
        const pattern = inputPattern.value.trim();
        const color = inputColor.value;
        loadRules((current) => {
          current[index] = { pattern, color, enabled: inputEnabled.checked };
          saveRules(current, () => showStatus('Regel gespeichert.'));
        });
      });

      btnDelete.addEventListener('click', () => {
        loadRules((current) => {
          current.splice(index, 1);
          saveRules(current, () => {
            renderRules(current);
            showStatus('Regel gelöscht.');
          });
        });
      });
    });
  }

  function addRule() {
    const pattern = patternInput.value.trim();
    const color = colorInput.value;
    if (!pattern) {
      showStatus('Bitte ein Muster angeben.');
      return;
    }
    loadRules((rules) => {
      rules.push({ pattern, color, enabled: true });
      saveRules(rules, () => {
        patternInput.value = '';
        renderRules(rules);
        showStatus('Regel hinzugefügt.');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    addButton.addEventListener('click', addRule);
    loadRules((rules) => renderRules(rules));
  });
})();
