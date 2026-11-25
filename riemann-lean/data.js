export const GAMMA = [
  14.134725, 21.022040, 25.010858, 30.424876, 32.935062, 37.586178,
  40.918719, 43.327073, 48.005151, 49.773832, 52.970321, 56.446248,
  59.347044, 60.831779, 65.112544, 67.079811, 69.546402, 72.067158,
  75.704691, 77.144840, 79.337375, 82.910381, 84.735493, 87.425275,
  88.809111, 92.491899, 94.651344, 95.870634, 98.831194, 101.317851,
  103.725538, 105.446623, 107.168611, 111.029536, 111.874659, 114.320221,
  116.226680, 118.790783, 121.370125, 122.946829, 124.256819, 127.516684,
  129.578704, 131.087689, 133.497737, 134.756510, 138.116042, 139.736209,
  141.123707, 143.111846, 146.000982, 147.422765, 150.053520, 150.925258,
  153.024694, 156.112909, 157.597592, 158.849988, 161.188964, 163.030710
];

export const FACTS = {
  asOf: '2026-11-25',
  paper: { pages: 8, range: '671–680', date: '1859-11', author: 'Bernhard Riemann' },
  proof: {
    announced: '2026-11-20', certified: '2026-11-21', weeks: 6,
    files: 175187, lines: 17374215, nonBlankLines: 15531759,
    sourceBytes: 1030531854, theorems: 5, sorry: 0, admit: 0, extraAxioms: 0,
    axioms: ['propext', 'Classical.choice', 'Quot.sound'],
    exportBytes: 61570595788, conLecheDeclarations: 1468418,
    humanReadablePages: 250000
  },
  pagesEquivalent: 289570,
  stackMeters: 29
};

export const PALETTE = {
  paper: { deep: [218, 215, 195], ink: [23, 36, 58], muted: [94, 91, 78], rule: [201, 196, 176], margin: [150, 40, 48], accent: [122, 40, 56] },
  term: { deep: [11, 15, 20], ink: [216, 227, 240], muted: [131, 149, 167], rule: [30, 42, 54], margin: [127, 216, 255], accent: [127, 216, 255] }
};

export const CODE_WALL = `theorem riemannHypothesis : RiemannHypothesis := by
  simpa using Main.riemannHypothesis
lemma zeta_ne_zero_of_one_lt_re {s : ℂ} (hs : 1 < s.re) : riemannZeta s ≠ 0
  exact riemannZeta_ne_zero_of_one_le_re (le_of_lt hs)
theorem LFunction_eq_zero_re (χ : DirichletCharacter ℂ N) :
    ∀ s, 0 < s.re → s.re < 1 → L χ s = 0 → s.re = 1 / 2
  intro s h0 h1 hz
  exact critical_line_of_zero h0 h1 hz`;
