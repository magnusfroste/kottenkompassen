/* Kontrollerar nivåerna i Kotten och kompassen med en egen modell av reglerna.
   Kör: node verify.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const NIVAER = require('./public/nivaer.js');

const COLS = 5, ROWS = 4;
const RIKT = [[0, -1], [1, 0], [0, 1], [-1, 0]];

let fel = 0;
const klaga = (m) => { console.log('  FEL: ' + m); fel++; };

function upptagen(n, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  return n.stubbar.some(([bx, by]) => bx === x && by === y);
}

/* Egen BFS på tillstånd (x, y, riktning, mask av tagna nötter). */
function losa(n) {
  let startMask = 0;
  n.notter.forEach(([ax, ay], i) => { if (ax === n.start.x && ay === n.start.y) startMask |= 1 << i; });
  const full = (1 << n.notter.length) - 1;
  const nyckel = (s) => `${s.x},${s.y},${s.dir},${s.mask}`;
  const start = { x: n.start.x, y: n.start.y, dir: n.start.dir, mask: startMask };
  if (startMask === full) return { langd: 0, vag: [] };
  const sedd = new Map([[nyckel(start), null]]);
  let ko = [start], djup = 0;
  while (ko.length && djup < 60) {
    const nasta = [];
    for (const u of ko) {
      const val = [
        { a: 'V', x: u.x, y: u.y, dir: (u.dir + 3) % 4, mask: u.mask },
        { a: 'H', x: u.x, y: u.y, dir: (u.dir + 1) % 4, mask: u.mask },
      ];
      const nx = u.x + RIKT[u.dir][0], ny = u.y + RIKT[u.dir][1];
      if (!upptagen(n, nx, ny)) {
        let m = u.mask;
        n.notter.forEach(([ax, ay], i) => { if (ax === nx && ay === ny) m |= 1 << i; });
        val.push({ a: 'F', x: nx, y: ny, dir: u.dir, mask: m });
      }
      for (const v of val) {
        const k = nyckel(v);
        if (sedd.has(k)) continue;
        sedd.set(k, { fran: nyckel(u), a: v.a });
        if (v.mask === full) {
          const vag = []; let nk = k;
          while (sedd.get(nk)) { vag.unshift(sedd.get(nk).a); nk = sedd.get(nk).fran; }
          return { langd: vag.length, vag };
        }
        nasta.push(v);
      }
    }
    ko = nasta; djup++;
  }
  return null;
}

/* Kör en handling på en fristående spelmodell – används för att bevisa att
   lösarens väg verkligen samlar alla nötter. */
function spela(n, handlingar) {
  const l = { x: n.start.x, y: n.start.y, dir: n.start.dir, tagna: new Set() };
  n.notter.forEach(([ax, ay], i) => { if (ax === l.x && ay === l.y) l.tagna.add(i); });
  for (const h of handlingar) {
    if (h === 'V') l.dir = (l.dir + 3) % 4;
    else if (h === 'H') l.dir = (l.dir + 1) % 4;
    else if (h === 'F') {
      const nx = l.x + RIKT[l.dir][0], ny = l.y + RIKT[l.dir][1];
      if (upptagen(n, nx, ny)) return { ok: false, varfor: 'gick in i stubbe/vägg', x: l.x, y: l.y };
      l.x = nx; l.y = ny;
      n.notter.forEach(([ax, ay], i) => { if (ax === nx && ay === ny) l.tagna.add(i); });
    } else return { ok: false, varfor: 'okänd handling ' + h };
  }
  return { ok: l.tagna.size === n.notter.length, kvar: n.notter.length - l.tagna.size, x: l.x, y: l.y };
}

/* Alla nåbara tillstånd utan nötter: bevisar att varje ruta går att nå. */
function nåbara(n) {
  const sedd = new Set();
  const ko = [{ x: n.start.x, y: n.start.y, dir: n.start.dir }];
  sedd.add(`${ko[0].x},${ko[0].y},${ko[0].dir}`);
  while (ko.length) {
    const u = ko.pop();
    const val = [
      { x: u.x, y: u.y, dir: (u.dir + 3) % 4 },
      { x: u.x, y: u.y, dir: (u.dir + 1) % 4 },
    ];
    const nx = u.x + RIKT[u.dir][0], ny = u.y + RIKT[u.dir][1];
    if (!upptagen(n, nx, ny)) val.push({ x: nx, y: ny, dir: u.dir });
    for (const v of val) {
      const k = `${v.x},${v.y},${v.dir}`;
      if (!sedd.has(k)) { sedd.add(k); ko.push(v); }
    }
  }
  return sedd;
}

console.log(`Kotten och kompassen – ${NIVAER.length} nivåer, ${COLS}×${ROWS} rutor\n`);

let minTotal = 0;
NIVAER.forEach((n, i) => {
  console.log(`Nivå ${i + 1}: start (${n.start.x},${n.start.y}) riktning ${['upp', 'höger', 'ner', 'vänster'][n.start.dir]}, ` +
    `${n.notter.length} nöt(er), ${n.stubbar.length} stubbe(n)`);

  // 1. geometri
  if (upptagen(n, n.start.x, n.start.y)) klaga(`nivå ${i + 1}: Kotten står i en stubbe`);
  n.notter.forEach(([x, y], j) => {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) klaga(`nivå ${i + 1}: nöt ${j} utanför brädan`);
    if (upptagen(n, x, y)) klaga(`nivå ${i + 1}: nöt ${j} står i en stubbe`);
  });
  n.stubbar.forEach(([x, y]) => {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) klaga(`nivå ${i + 1}: stubbe utanför brädan`);
  });
  const nycklar = new Set(n.notter.map(([x, y]) => `${x},${y}`));
  if (nycklar.size !== n.notter.length) klaga(`nivå ${i + 1}: två nötter på samma ruta`);

  // 2. lösbar
  const svar = losa(n);
  if (!svar) { klaga(`nivå ${i + 1}: OLÖSBAR`); return; }

  // 3. lösarens väg spelad på en egen modell
  const ut = spela(n, svar.vag);
  if (!ut.ok) klaga(`nivå ${i + 1}: lösarens väg samlade inte alla nötter (${JSON.stringify(ut)})`);

  minTotal += svar.langd;
  console.log(`  lösbar på ${svar.langd} tryck  ${svar.vag.join(' ')}  ✓`);
});

// 4. alla rutor nåbara någon gång (banan har inga återvändsgränder)
NIVAER.forEach((n, i) => {
  const nådd = nåbara(n);
  const rutor = new Set([...nådd].map((k) => k.split(',').slice(0, 2).join(',')));
  const fria = COLS * ROWS - n.stubbar.length;
  if (rutor.size !== fria) klaga(`nivå ${i + 1}: bara ${rutor.size} av ${fria} fria rutor nåbara`);
});

console.log(`\nMinsta antal tryck totalt: ${minTotal}`);
if (fel === 0) console.log('\n0 fel.');
else { console.log(`\n${fel} fel.`); process.exit(1); }