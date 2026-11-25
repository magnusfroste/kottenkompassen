/* Nivåer för Kotten och kompassen.
   rutnät: 5 kolumner x 4 rader. riktning: 0 = upp, 1 = höger, 2 = ner, 3 = vänster.
   Alla nivåer är kontrollerade av verify.mjs (BFS: lösbar, minsta antal tryck). */
var NIVAER = [
  { start: { x: 2, y: 3, dir: 0 }, notter: [[2, 2]], stubbar: [] },
  { start: { x: 1, y: 3, dir: 0 }, notter: [[1, 1]], stubbar: [] },
  { start: { x: 1, y: 3, dir: 3 }, notter: [[1, 0]], stubbar: [] },
  { start: { x: 0, y: 0, dir: 1 }, notter: [[4, 0]], stubbar: [] },
  { start: { x: 0, y: 3, dir: 1 }, notter: [[2, 3], [2, 1]], stubbar: [] },
  { start: { x: 0, y: 0, dir: 2 }, notter: [[0, 2]], stubbar: [[0, 1]] },
  { start: { x: 4, y: 3, dir: 0 }, notter: [[1, 3], [4, 0]], stubbar: [[2, 3], [1, 1]] },
  { start: { x: 2, y: 3, dir: 0 }, notter: [[0, 0], [4, 0], [2, 1]], stubbar: [[1, 2], [3, 2]] }
];

if (typeof module !== 'undefined' && module.exports) module.exports = NIVAER;