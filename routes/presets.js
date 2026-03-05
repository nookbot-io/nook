const { Router } = require('express');
const { loadPresets, createPreset, deletePreset, updatePreset } = require('../lib/presets');

const router = Router();

router.get('/', (_req, res) => {
  res.json(loadPresets());
});

router.post('/', (req, res) => {
  const { name, prompt } = req.body || {};
  if (!name || !prompt) {
    return res.status(400).json({ error: 'name and prompt are required' });
  }
  const preset = createPreset(name, prompt);
  res.json(preset);
});

router.put('/:id', (req, res) => {
  const { name, prompt } = req.body || {};
  const preset = updatePreset(req.params.id, { name, prompt });
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  res.json(preset);
});

router.delete('/:id', (req, res) => {
  const deleted = deletePreset(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  res.json({ success: true });
});

module.exports = { prefix: '/presets', router };
