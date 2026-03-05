const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRESETS_FILE = path.join(DATA_DIR, 'presets.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPresets() {
  ensureDataDir();
  if (!fs.existsSync(PRESETS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PRESETS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function savePresets(presets) {
  ensureDataDir();
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2));
}

function createPreset(name, prompt) {
  const presets = loadPresets();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const preset = { id, name, prompt, createdAt: Date.now() };
  presets.push(preset);
  savePresets(presets);
  return preset;
}

function deletePreset(id) {
  const presets = loadPresets();
  const filtered = presets.filter((p) => p.id !== id);
  if (filtered.length === presets.length) return false;
  savePresets(filtered);
  return true;
}

function updatePreset(id, updates) {
  const presets = loadPresets();
  const preset = presets.find((p) => p.id === id);
  if (!preset) return null;
  if (updates.name) preset.name = updates.name;
  if (updates.prompt) preset.prompt = updates.prompt;
  savePresets(presets);
  return preset;
}

module.exports = { loadPresets, createPreset, deletePreset, updatePreset };
