const express = require('express');

const { analyzeEnv } = require('../lib/env');
const { analyzeJson } = require('../lib/json');
const { analyzeYaml } = require('../lib/yaml');

const router = express.Router();

function requireContent(req, res, next) {
  const { content } = req.body || {};
  if (typeof content !== 'string') {
    return res.status(400).json({ ok: false, error: { message: 'Body must include string field: content' } });
  }
  if (content.length > 500_000) {
    return res.status(413).json({ ok: false, error: { message: 'Content too large' } });
  }
  return next();
}

router.post('/env', requireContent, (req, res) => {
  const result = analyzeEnv(req.body.content);
  res.json({ ok: true, ...result });
});

router.post('/json', requireContent, (req, res) => {
  const result = analyzeJson(req.body.content);
  res.json({ ok: true, ...result });
});

router.post('/yaml', requireContent, (req, res) => {
  const result = analyzeYaml(req.body.content);
  res.json({ ok: true, ...result });
});

module.exports = router;
