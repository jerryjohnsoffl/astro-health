/**
 * Generates a SYNTHETIC training set for the CDSS differential-diagnosis MLP.
 *
 *   node scripts/generate-synthetic-data.js --n 12000 --seed 42
 *
 * Outputs (deterministic for a given seed):
 *   data/synthetic/cdss-synthetic.json   normalised vectors + labels + splits (for TF.js)
 *   data/synthetic/cdss-synthetic.csv    raw, human-readable
 *
 * NOT real astronaut data. See src/ml/conditionProfiles.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYMPTOMS, CONTEXT, FEATURE_NAMES, encode } from '../src/ml/features.js';
import { CLASS_NAMES, CLASS_PRIORS, PROFILES } from '../src/ml/conditionProfiles.js';

// ---------- CLI ----------
const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []),
);
const N_TOTAL = parseInt(args.n ?? '12000', 10);
const SEED = parseInt(args.seed ?? '42', 10);
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', args.out ?? 'data/synthetic');

// ---------- seeded RNG ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const raw = mulberry32(SEED);
const rng = {
  next: raw,
  chance: (p) => raw() < p,
  range: (lo, hi) => lo + (hi - lo) * raw(),
  gauss() {                                   // Box-Muller
    let u = 0, v = 0;
    while (u === 0) u = raw();
    while (v === 0) v = raw();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },
  exp: (mean) => -mean * Math.log(1 - raw()),
  pickWeighted(weights) {
    const u = raw(); let acc = 0;
    for (let i = 0; i < weights.length; i++) { acc += weights[i]; if (u < acc) return i; }
    return weights.length - 1;
  },
};

// ---------- noise knobs (these keep the task realistically ambiguous) ----------
const BACKGROUND_SYMPTOM_P = 0.035;  // unrelated mild symptom appears
const DROPOUT_P = 0.08;              // present symptom not reported
const CONFOUNDER_P = 0.12;           // borrow symptoms from another condition
const LABEL_NOISE_P = 0.01;          // rare mislabel (diagnostic uncertainty)

function sampleSeverity(weights) { return 1 + rng.pickWeighted(weights); }

function sampleSymptoms(spec) {
  const s = {};
  for (const name of SYMPTOMS) {
    const entry = spec[name];
    if (entry) {
      const [p, w] = entry;
      if (rng.chance(p) && !rng.chance(DROPOUT_P)) s[name] = sampleSeverity(w);
    } else if (rng.chance(BACKGROUND_SYMPTOM_P)) {
      s[name] = 1;
    }
  }
  return s;
}

function addConfounders(symptoms, ownClass) {
  const others = CLASS_NAMES.filter((c) => c !== ownClass);
  const other = others[Math.floor(raw() * others.length)];
  const prof = PROFILES[other];
  const spec = prof.subtypes
    ? Object.values(prof.subtypes)[Math.floor(raw() * Object.keys(prof.subtypes).length)].symptoms
    : prof.symptoms;
  for (const [name, [p, w]] of Object.entries(spec)) {
    if (p > 0.4 && !symptoms[name] && rng.chance(p * 0.5)) symptoms[name] = Math.min(2, sampleSeverity(w));
  }
}

function sampleRecord(cls) {
  const prof = PROFILES[cls];
  const sub = prof.subtypes
    ? Object.values(prof.subtypes)[rng.next() < 0.5 ? 0 : 1]
    : prof;
  const symptoms = sampleSymptoms(sub.symptoms);
  if (rng.chance(CONFOUNDER_P)) addConfounders(symptoms, cls);
  const context = sub.context(rng);
  // wearable-style measurement jitter
  context.spo2 = Math.min(100, context.spo2 + 0.6 * rng.gauss());
  context.heart_rate += 2 * rng.gauss();
  return { symptoms, context };
}

// ---------- build dataset ----------
const counts = CLASS_NAMES.map((c) => Math.round(CLASS_PRIORS[c] * N_TOTAL));
const rows = [];
CLASS_NAMES.forEach((cls, ci) => {
  for (let k = 0; k < counts[ci]; k++) {
    const rec = sampleRecord(cls);
    const label = rng.chance(LABEL_NOISE_P) ? Math.floor(raw() * CLASS_NAMES.length) : ci;
    rows.push({ rec, label, trueClass: ci });
  }
});

// shuffle then stratified 70/15/15 split (by original class)
for (let i = rows.length - 1; i > 0; i--) {
  const j = Math.floor(raw() * (i + 1));
  [rows[i], rows[j]] = [rows[j], rows[i]];
}
const seen = new Array(CLASS_NAMES.length).fill(0);
rows.forEach((r) => {
  const total = counts[r.trueClass];
  const idx = seen[r.trueClass]++;
  r.split = idx < 0.7 * total ? 'train' : idx < 0.85 * total ? 'val' : 'test';
});

const r3 = (x) => Math.round(x * 1000) / 1000;
const splits = { train: { X: [], y: [] }, val: { X: [], y: [] }, test: { X: [], y: [] } };
rows.forEach((r) => {
  splits[r.split].X.push(encode(r.rec).map(r3));
  splits[r.split].y.push(r.label);
});

fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(path.join(OUT_DIR, 'cdss-synthetic.json'), JSON.stringify({
  meta: {
    synthetic: true,
    disclaimer: 'Synthetic, rule-derived data for a demo decision-support prototype. Not real patient data.',
    seed: SEED, n: rows.length, nFeatures: FEATURE_NAMES.length,
    noise: { BACKGROUND_SYMPTOM_P, DROPOUT_P, CONFOUNDER_P, LABEL_NOISE_P },
  },
  featureNames: FEATURE_NAMES,
  classNames: CLASS_NAMES,
  splits,
}));

const header = ['id', 'split', 'label', ...SYMPTOMS, ...CONTEXT.map((c) => c.name)];
const csv = [header.join(',')];
rows.forEach((r, i) => {
  csv.push([
    i, r.split, CLASS_NAMES[r.label],
    ...SYMPTOMS.map((s) => r.rec.symptoms[s] ?? 0),
    ...CONTEXT.map((c) => r3(r.rec.context[c.name])),
  ].join(','));
});
fs.writeFileSync(path.join(OUT_DIR, 'cdss-synthetic.csv'), csv.join('\n'));

console.log(`Generated ${rows.length} samples (seed ${SEED}) -> ${OUT_DIR}`);
CLASS_NAMES.forEach((c, i) => console.log(`  ${c.padEnd(26)} ${counts[i]}`));
console.log(' split sizes:', Object.fromEntries(Object.entries(splits).map(([k, v]) => [k, v.y.length])));
