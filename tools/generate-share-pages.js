#!/usr/bin/env node
/* Optional: generates static "share" pages + sitemap.xml so links shared on WhatsApp/Facebook/X show a proper preview.
   Usage:  node tools/generate-share-pages.js https://USERNAME.github.io/REPO/
   Reads the seed data in js/data.js (posts you create in the browser live only in your browser, so add them to data.js to get share pages). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const base = (process.argv[2] || '').replace(/\/?$/, '/');
if (!/^https?:\/\//.test(base)) { console.error('Pass your site URL, e.g. node tools/generate-share-pages.js https://USERNAME.github.io/REPO/'); process.exit(1); }
const root = path.join(__dirname, '..'), sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), sandbox);
const K = sandbox.window.K24, esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const urls = [base];
function page(type, id, title, desc) {
  const dir = path.join(root, 'share', type, id); fs.mkdirSync(dir, { recursive: true });
  const target = base + 'index.html#/' + type + '/' + encodeURIComponent(id), self = base + 'share/' + type + '/' + id + '/';
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — K_24 Karnataka Post Trails</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${self}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${base}assets/og-image.png"><meta property="og:url" content="${self}">
<meta name="twitter:card" content="summary_large_image"><meta http-equiv="refresh" content="0;url=${target}"><script>location.replace(${JSON.stringify(target)})</script></head>
<body><p><a href="${target}">${esc(title)}</a></p></body></html>`);
  urls.push(self);
}
K.PASSPORT.forEach((l) => page('destination', l.id, l.name, 'Post office details and travel notes for ' + l.name + (l.district ? ', ' + l.district : '') + '.'));
K.BLOGS.forEach((b) => page('blog', b.id, b.title, b.excerpt));
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + base + 'sitemap.xml\n');
console.log('Wrote ' + (urls.length - 1) + ' share pages, sitemap.xml and robots.txt for ' + base);
