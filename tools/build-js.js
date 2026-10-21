#!/usr/bin/env node
/* Regenerates js/post-offices.js from data/post-offices.json (the editable master file). Run: node tools/build-js.js */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const recs = JSON.parse(fs.readFileSync(path.join(root, 'data/post-offices.json'), 'utf8'));
fs.writeFileSync(path.join(root, 'js/post-offices.js'), '/* GENERATED from data/post-offices.json (run: node tools/build-js.js). Values are read from the scanned passport (Philately.pdf); nothing here is independently verified yet. */\n(window.K24 = window.K24 || {}).POST_OFFICES = ' + JSON.stringify(recs) + ';\n(window.K24.mods = window.K24.mods || {})[\'postoffices\'] = \'2026.10.20a\';\n');
console.log('Wrote js/post-offices.js with ' + recs.length + ' records');
