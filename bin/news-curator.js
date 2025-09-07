#!/usr/bin/env node
// Thin launcher that loads the compiled CLI
require('dotenv/config');
try {
  require('../dist/index.js');
} catch (err) {
  console.error('\nnews-curator: missing build output. Run: npm run build');
  console.error(String(err && err.message ? err.message : err));
  process.exit(1);
}

