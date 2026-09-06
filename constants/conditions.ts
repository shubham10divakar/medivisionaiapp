// Educational reference for the 14 findings the NIH ChestX-ray14 models score.
// Written for a general/research audience, not as clinical guidance. Every
// screen that shows this also shows the "not a medical device" disclaimer.

export interface ConditionInfo {
  /** Human-readable name. */
  name: string;
  /** One-line gloss. */
  short: string;
  /** What the term refers to. */
  description: string;
  /** What a positive read tends to indicate. */
  meaning: string;
  /** Typical underlying causes. */
  causes: string[];
  /** How it classically appears on a chest radiograph. */
  radiographicSigns: string[];
}

const DEFAULT: ConditionInfo = {
  name: 'Finding',
  short: 'A radiographic finding on the chest X-ray.',
  description:
    'One of the 14 thoracic findings labelled in the NIH ChestX-ray14 dataset. The model outputs an independent probability for each.',
  meaning:
    'A higher score means the model considers the pattern for this finding more likely present in the image. It is not a diagnosis.',
  causes: ['Many possible causes — correlate with history and clinical exam.'],
  radiographicSigns: ['Varies by finding and severity.'],
};

const CONDITIONS: Record<string, ConditionInfo> = {
  Atelectasis: {
    name: 'Atelectasis',
    short: 'Partial or complete collapse of lung tissue.',
    description:
      'Loss of lung volume from alveoli that have deflated or filled, so a region of lung is no longer aerated.',
    meaning:
      'Suggests a segment, lobe, or subsegment of lung is not fully expanded. Often incidental and reversible; can also flag airway obstruction.',
    causes: [
      'Mucus plugging or an obstructing lesion in a bronchus',
      'Shallow breathing after surgery or from pain',
      'Compression from pleural fluid or a mass',
      'Surfactant deficiency',
    ],
    radiographicSigns: [
      'Increased opacity with volume loss',
      'Displacement of fissures, hila, or mediastinum toward the opacity',
      'Crowded vessels and ribs over the affected area',
      'Elevated hemidiaphragm',
    ],
  },
  Cardiomegaly: {
    name: 'Cardiomegaly',
    short: 'Enlarged cardiac silhouette.',
    description:
      'The heart shadow is larger than expected — on a frontal film, a cardiothoracic ratio above ~0.5.',
    meaning:
      'Points to chamber enlargement, myocardial disease, or a pericardial effusion. Needs echocardiography to characterise.',
    causes: [
      'Hypertensive heart disease',
      'Heart failure / dilated cardiomyopathy',
      'Valvular disease',
      'Pericardial effusion',
    ],
    radiographicSigns: [
      'Cardiothoracic ratio > 0.5 on a PA film',
      'Widened cardiac contour',
      'Sometimes with pulmonary vascular congestion or effusions',
    ],
  },
  Effusion: {
    name: 'Pleural Effusion',
    short: 'Fluid in the pleural space.',
    description:
      'Abnormal collection of fluid between the visceral and parietal pleura, layering with gravity.',
    meaning:
      'A non-specific sign of an underlying process — cardiac, infective, inflammatory, or malignant. Size and chronicity matter.',
    causes: [
      'Heart failure (usually bilateral)',
      'Pneumonia (parapneumonic) or empyema',
      'Malignancy',
      'Pulmonary embolism, renal or liver failure',
    ],
    radiographicSigns: [
      'Blunting of the costophrenic angle',
      'Meniscus sign at the fluid margin',
      'Layering on a lateral decubitus view',
      'Large effusions opacify a hemithorax and shift the mediastinum away',
    ],
  },
  Infiltration: {
    name: 'Infiltration',
    short: 'Ill-defined increased lung opacity.',
    description:
      'A broad ChestX-ray14 label for hazy or patchy density where alveolar or interstitial spaces are filled with fluid, cells, or other material.',
    meaning:
      'Non-specific — overlaps with consolidation, oedema, and inflammation. Distribution and clinical context narrow it down.',
    causes: [
      'Infection (pneumonia)',
      'Pulmonary oedema',
      'Aspiration',
      'Haemorrhage or inflammatory disease',
    ],
    radiographicSigns: [
      'Hazy or patchy opacities without clear volume loss',
      'May obscure vessel margins',
      'Air bronchograms when air-space filling predominates',
    ],
  },
  Mass: {
    name: 'Mass',
    short: 'A discrete opacity larger than 3 cm.',
    description:
      'A focal space-occupying lesion measuring more than 3 cm. Lesions ≤ 3 cm are labelled as a nodule.',
    meaning:
      'Raises concern for malignancy but includes benign causes. Cross-sectional imaging (CT) and often tissue sampling are the next steps.',
    causes: [
      'Primary lung cancer',
      'Metastasis',
      'Infective — abscess, tuberculoma, fungal ball',
      'Benign — hamartoma, bronchogenic cyst',
    ],
    radiographicSigns: [
      'Rounded or lobulated opacity > 3 cm',
      'May cavitate or contain calcification',
      'Can be associated with hilar enlargement or effusion',
    ],
  },
  Nodule: {
    name: 'Nodule',
    short: 'A rounded opacity 3 cm or smaller.',
    description:
      'A well- or poorly-defined round opacity up to 3 cm, surrounded by aerated lung.',
    meaning:
      'Most small nodules are benign, but follow-up or CT characterisation is used to assess risk based on size, edge, and growth.',
    causes: [
      'Granuloma (old infection)',
      'Early primary lung cancer',
      'Metastasis',
      'Intrapulmonary lymph node, hamartoma',
    ],
    radiographicSigns: [
      'Round opacity ≤ 3 cm',
      'Calcification favours a benign cause',
      'Spiculated or irregular margins raise concern',
    ],
  },
  Pneumonia: {
    name: 'Pneumonia',
    short: 'Infective air-space consolidation.',
    description:
      'Infection of the lung parenchyma producing inflammatory exudate that fills the alveoli.',
    meaning:
      'A clinical–radiographic diagnosis: imaging supports it alongside fever, cough, and raised inflammatory markers.',
    causes: [
      'Bacterial (e.g. Streptococcus pneumoniae)',
      'Viral (including influenza, COVID-19)',
      'Atypical organisms, fungi',
      'Aspiration',
    ],
    radiographicSigns: [
      'Lobar or patchy consolidation',
      'Air bronchograms',
      'Silhouette sign obscuring the heart border or diaphragm',
      'Sometimes a parapneumonic effusion',
    ],
  },
  Pneumothorax: {
    name: 'Pneumothorax',
    short: 'Air in the pleural space.',
    description:
      'Air between the lung and chest wall, causing the lung to retract from the chest wall.',
    meaning:
      'Can be an emergency. A tension pneumothorax with mediastinal shift and cardiovascular compromise needs immediate decompression.',
    causes: [
      'Spontaneous (tall thin young people, ruptured bleb)',
      'Trauma or iatrogenic (line insertion, biopsy)',
      'Underlying lung disease — COPD, cystic fibrosis',
    ],
    radiographicSigns: [
      'Visible visceral pleural line with no lung markings beyond it',
      'Deep sulcus sign on a supine film',
      'Mediastinal shift away from the side of a tension pneumothorax',
    ],
  },
  Consolidation: {
    name: 'Consolidation',
    short: 'Alveoli filled with fluid or cells rather than air.',
    description:
      'A region of lung in which the air-spaces are replaced by fluid, pus, blood, or cells, producing a dense opacity.',
    meaning:
      'Points to an air-space filling process. Pneumonia is the commonest cause but not the only one.',
    causes: [
      'Pneumonia',
      'Pulmonary oedema',
      'Pulmonary haemorrhage',
      'Aspiration, infarction, or (rarely) malignancy',
    ],
    radiographicSigns: [
      'Homogeneous opacity that does not efface vessels by volume loss',
      'Air bronchograms',
      'Silhouette sign with the adjacent soft-tissue border',
    ],
  },
  Edema: {
    name: 'Pulmonary Edema',
    short: 'Fluid accumulation in the lungs.',
    description:
      'Excess fluid in the interstitium and alveoli, most often because raised pulmonary venous pressure forces fluid out of the capillaries.',
    meaning:
      'Usually cardiogenic (heart failure) but can be from fluid overload or capillary leak (ARDS). Often bilateral and gravity-dependent.',
    causes: [
      'Left heart failure',
      'Fluid overload / renal failure',
      'Acute respiratory distress syndrome',
      'High altitude, neurogenic causes',
    ],
    radiographicSigns: [
      'Cardiomegaly with upper-zone vascular redistribution',
      'Kerley B lines, peribronchial cuffing',
      'Perihilar "bat-wing" haze',
      'Pleural effusions',
    ],
  },
  Emphysema: {
    name: 'Emphysema',
    short: 'Permanent enlargement of the air-spaces with wall destruction.',
    description:
      'Irreversible destruction of alveolar walls distal to the terminal bronchioles, part of the COPD spectrum.',
    meaning:
      'Indicates chronic structural lung damage. Correlates with a smoking history and obstructive spirometry.',
    causes: [
      'Cigarette smoking',
      'Long-term air pollution or occupational exposure',
      'Alpha-1 antitrypsin deficiency',
    ],
    radiographicSigns: [
      'Hyperinflated lungs with flattened diaphragms',
      'Increased retrosternal air space',
      'Attenuated peripheral vessels',
      'Bullae',
    ],
  },
  Fibrosis: {
    name: 'Pulmonary Fibrosis',
    short: 'Scarring of lung tissue.',
    description:
      'Replacement of normal lung by fibrous scar tissue, stiffening the lung and reducing gas exchange.',
    meaning:
      'Usually chronic and progressive. High-resolution CT is the reference test to pattern and stage it.',
    causes: [
      'Idiopathic pulmonary fibrosis',
      'Connective tissue disease',
      'Occupational dust exposure (asbestosis, silicosis)',
      'Drug toxicity, prior radiotherapy',
    ],
    radiographicSigns: [
      'Reticular (net-like) opacities, often lower-zone and peripheral',
      'Volume loss',
      'Traction bronchiectasis, honeycombing in advanced disease',
    ],
  },
  Pleural_Thickening: {
    name: 'Pleural Thickening',
    short: 'Thickened, often scarred pleura.',
    description:
      'Fibrous thickening of the pleural lining, focal or diffuse, frequently a sequela of prior inflammation.',
    meaning:
      'Usually a marker of an old process. Diffuse or nodular thickening, especially with an asbestos history, warrants CT.',
    causes: [
      'Prior pleural effusion, empyema, or haemothorax',
      'Asbestos exposure (plaques)',
      'Prior tuberculosis',
      'Mesothelioma (nodular, circumferential)',
    ],
    radiographicSigns: [
      'Soft-tissue density along the pleural surface',
      'Blunting of a costophrenic angle without a meniscus',
      'Calcified plaques with asbestos exposure',
    ],
  },
  Hernia: {
    name: 'Hiatus / Diaphragmatic Hernia',
    short: 'Abdominal contents projecting into the thorax.',
    description:
      'Herniation of stomach or other abdominal contents through the diaphragm — most commonly a hiatus hernia through the oesophageal opening.',
    meaning:
      'Hiatus hernia is common and often incidental. A large or traumatic diaphragmatic hernia can be clinically significant.',
    causes: [
      'Age-related laxity of the diaphragmatic hiatus',
      'Raised intra-abdominal pressure, obesity',
      'Congenital defect',
      'Prior trauma or surgery',
    ],
    radiographicSigns: [
      'Retrocardiac air-fluid level',
      'Soft-tissue or gas-containing mass above the diaphragm',
      'Elevated or ill-defined hemidiaphragm contour',
    ],
  },
};

export function getConditionInfo(label: string): ConditionInfo {
  return CONDITIONS[label] ?? { ...DEFAULT, name: prettyLabel(label) };
}

export function getAllConditionLabels(): string[] {
  return Object.keys(CONDITIONS);
}

/** Turn a raw model label ("Pleural_Thickening") into "Pleural Thickening". */
export function prettyLabel(label: string): string {
  return label.replace(/_/g, ' ').trim();
}
