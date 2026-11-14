export const SYMPTOMS = [
  'headache',
  'nausea',
  'vomiting',
  'dizziness',
  'vertigo',
  'blurred_vision',
  'near_vision_change',
  'confusion',
  'fatigue',
  'shortness_of_breath',
  'chest_pain',
  'palpitations',
  'joint_pain',
  'skin_tingling_rash',
  'faint_on_standing',
  'flank_pain',
  'blood_in_urine',
  'low_urine_output',
  'thirst',
  'poor_sleep',
  'poor_concentration',
  'head_motion_worsens',
]

export const CONTEXT = [
  { name: 'spo2', min: 70, max: 100, unit: '%' },
  { name: 'heart_rate', min: 30, max: 190, unit: 'bpm' },
  { name: 'systolic_bp', min: 60, max: 180, unit: 'mmHg' },
  { name: 'ppo2_kpa', min: 8, max: 32, unit: 'kPa' },
  { name: 'ambient_kpa', min: 20, max: 110, unit: 'kPa' },
  { name: 'prebreathe_min', min: 0, max: 240, unit: 'min' },
  { name: 'sleep_hours', min: 0, max: 10, unit: 'h' },
  { name: 'fluid_intake_l', min: 0, max: 4, unit: 'L' },
  { name: 'urine_output_l', min: 0, max: 2.5, unit: 'L' },
  { name: 'mission_day', min: 0, max: 400, unit: 'd' },
  { name: 'hrs_since_entry_microg', min: 0, max: 336, unit: 'h' },
  { name: 'hrs_since_landing', min: 0, max: 336, unit: 'h' },
  { name: 'eva_recent', min: 0, max: 1, unit: 'flag' },
  { name: 'hr_irregular', min: 0, max: 1, unit: 'flag' },
]

export const FEATURE_NAMES = [...SYMPTOMS, ...CONTEXT.map(({ name }) => name)]
export const N_FEATURES = FEATURE_NAMES.length

const clamp01 = (value) => Math.min(1, Math.max(0, value))

export function encode(record) {
  const features = SYMPTOMS.map((symptom) =>
    clamp01((record.symptoms?.[symptom] ?? 0) / 3),
  )

  for (const { name, min, max } of CONTEXT) {
    const value = record.context?.[name] ?? (min + max) / 2
    features.push(clamp01((value - min) / (max - min)))
  }

  return features
}
