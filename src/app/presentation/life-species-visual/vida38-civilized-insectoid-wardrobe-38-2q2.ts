/**
 * GENESIS Web · VIDA.38.2q2 — diversidad geométrica real de vestimenta insectoide.
 * Vestuario diseñado para tórax con múltiples pares de brazos, alas dorsales
 * y abdomen caudado. No altera contratos biológicos ni persistencia CT-0.
 */
import * as THREE from 'three';
import type {
  Vida38CivilizedInsectoidPlan38Q,
  Vida38CivilizedInsectoidQuality38Q,
  Vida38CivilizedInsectoidWardrobe38Q,
} from './vida38-civilized-insectoid-preview-38-2q';

export const VIDA38_INSECTOID_WARDROBE_REVISION_38Q2 = 'VIDA.38.2q2/insectoid-couture-six-silhouettes/v1' as const;

export type Vida38InsectoidTextile38Q2 = 'BIO_SILK' | 'MEMBRANE' | 'LAB_WEAVE' | 'FIELD_CLOTH' | 'SMART_SKIN' | 'CHITIN_ARMOR';
export interface Vida38InsectoidWardrobeStyle38Q2 {
  readonly revision: typeof VIDA38_INSECTOID_WARDROBE_REVISION_38Q2;
  readonly family: Vida38CivilizedInsectoidWardrobe38Q;
  readonly textile: Vida38InsectoidTextile38Q2;
  readonly culture: Vida38CivilizedInsectoidPlan38Q['culture'];
  readonly length: number;
  readonly flare: number;
  readonly folds: number;
  readonly wingOpening: boolean;
  readonly armOpeningDepth: number;
  readonly primary: string;
  readonly secondary: string;
  readonly edging: string;
  readonly materialRoughness: number;
  readonly signature: string;
}

export interface Vida38InsectoidGarmentPiece38Q2 {
  readonly mesh: THREE.Mesh;
  readonly part: 'CLOTH' | 'MANTLE' | 'TUNIC' | 'COAT' | 'ARMOR' | 'PONCHO' | 'EDGING' | 'CULTURAL_TRIM';
  readonly name: string;
}

const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
function u(seed: string): number { return hash32(seed) / 4294967295; }

const CULTURE_COLORS: Record<Vida38CivilizedInsectoidPlan38Q['culture'], readonly [string, string, string]> = {
  CRYSTAL_CONCLAVE: ['#91c4cd', '#172e42', '#c1f4ed'],
  HIVE_SYNDICATE: ['#173f39', '#abc19c', '#68e8be'],
  MYCELIAL_REPUBLIC: ['#879a91', '#273b43', '#a9e4c0'],
  NEBULA_ORDER: ['#293e69', '#a3bbd7', '#79dfff'],
  IRON_SWARM: ['#252e37', '#6b91a1', '#57d8f0'],
  PELAGIC_CHORUS: ['#398896', '#c2e3e0', '#83f4e9'],
};
const FAMILY_TEXTILES: Record<Vida38CivilizedInsectoidWardrobe38Q, Vida38InsectoidTextile38Q2> = {
  EXO_SUIT: 'SMART_SKIN', SEGMENTED_BIO_ARMOR: 'CHITIN_ARMOR', SCIENTIFIC_HARNESS: 'LAB_WEAVE',
  ROYAL_MANTLE: 'BIO_SILK', CEREMONIAL_VESTMENTS: 'BIO_SILK', EXPLORER_KIT: 'FIELD_CLOTH',
};
const PRIMARY_LEN: Record<Vida38CivilizedInsectoidWardrobe38Q, number> = {
  EXO_SUIT: 1.04, SEGMENTED_BIO_ARMOR: 1.16, SCIENTIFIC_HARNESS: .72,
  ROYAL_MANTLE: .57, CEREMONIAL_VESTMENTS: .54, EXPLORER_KIT: .91,
};
const FLARES: Record<Vida38CivilizedInsectoidWardrobe38Q, number> = {
  EXO_SUIT: .015, SEGMENTED_BIO_ARMOR: .038, SCIENTIFIC_HARNESS: .15,
  ROYAL_MANTLE: .20, CEREMONIAL_VESTMENTS: .18, EXPLORER_KIT: .10,
};

export function deriveVida38InsectoidWardrobeStyle38Q2(plan: Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidWardrobeStyle38Q2 {
  const seed = `${plan.speciesId}|${plan.signature}|38Q2`;
  const family = plan.wardrobe;
  const culture = plan.culture;
  const [culturalPrimary, culturalSecondary, culturalEdge] = CULTURE_COLORS[culture];
  const material = FAMILY_TEXTILES[family];
  const roleMultiplier = plan.role === 'NOBLE' || plan.role === 'TECHNO_PRIEST' ? 1.08
    : plan.role === 'MILITARY' ? .94 : plan.role === 'INDUSTRIAL_COLONIZER' ? .92 : 1;
  const culturalFactor = culture === 'PELAGIC_CHORUS' ? 1.12
    : culture === 'MYCELIAL_REPUBLIC' ? 1.07
      : culture === 'IRON_SWARM' ? .82 : 1;
  const length = clamp(PRIMARY_LEN[family] + (.5 - u(seed + '|len')) * .19 * roleMultiplier, .42, 1.17);
  const flare = clamp(FLARES[family] * culturalFactor * lerp(.82, 1.20, u(seed + '|flare')), .01, .27);
  const folds = 4 + hash32(seed + '|folds') % 5;
  const edging = family === 'EXO_SUIT' ? plan.neonHex : culturalEdge;
  const primary = family === 'SEGMENTED_BIO_ARMOR' ? plan.armorHex
    : family === 'EXO_SUIT' ? plan.garmentHex : culturalPrimary;
  const secondary = family === 'SEGMENTED_BIO_ARMOR' ? culturalPrimary
    : family === 'EXO_SUIT' ? culturalSecondary : culturalSecondary;
  const materialRoughness = material === 'BIO_SILK' ? .58 : material === 'LAB_WEAVE' ? .76
    : material === 'MEMBRANE' ? .42 : material === 'FIELD_CLOTH' ? .82
      : material === 'SMART_SKIN' ? .44 : .32;
  const armOpeningDepth = plan.armPairs > 2 ? 1.18 : 1.32;
  const signature = [family, culture, plan.role, material,
    length.toFixed(4), flare.toFixed(4), folds, armOpeningDepth.toFixed(2),
    primary, secondary, edging].join('|');
  return {
    revision: VIDA38_INSECTOID_WARDROBE_REVISION_38Q2, family, textile: material, culture,
    length, flare, folds, wingOpening: plan.wingPairs > 0, armOpeningDepth,
    primary, secondary, edging, materialRoughness, signature,
  };
}

/** Aproximación física al loft del torso utilizado por 38.2q1b; no una esfera/caja arbitraria. */
export function torsoRadiusVida38Q2(plan: Vida38CivilizedInsectoidPlan38Q, y: number): number {
  const t = (y - .91) / 1.03;
  return .14 + .05 * Math.sin(t * Math.PI)
    + .25 * plan.thoraxScale * Math.exp(-Math.pow((t - .71) / .23, 2))
    + .22 * plan.abdomenScale * Math.exp(-Math.pow((t - .30) / .24, 2)) - .095;
}

interface SurfaceShape38Q2 {
  readonly theta0: number;
  readonly theta1: number;
  readonly top: number;
  readonly bottom: number;
  readonly flare: number;
  readonly offset: number;
  readonly folds: number;
  readonly sideSlits: boolean;
  readonly wingOpening: boolean;
  readonly rearSweep: number;
  readonly asymmetric: number;
}
function angleDistance(a: number, b: number): number {
  const d = ((a - b) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  return Math.min(d, 2 * Math.PI - d);
}
function sampleSurface(plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidWardrobeStyle38Q2, shape: SurfaceShape38Q2,
  angle: number, t: number): THREE.Vector3 {
  // Sisas profundas, continuas y simétricas. Los brazos adicionales quedan fuera de la tela.
  const sideAngle = Math.min(angleDistance(angle, Math.PI * .5), angleDistance(angle, Math.PI * 1.5));
  const sideNotch = shape.sideSlits ? Math.exp(-Math.pow(sideAngle / .30, 4)) : 0;
  const dorsal = Math.exp(-Math.pow(angleDistance(angle, Math.PI) / .66, 4));
  const wingBackCut = shape.wingOpening ? .30 * dorsal : 0;
  const effectiveTop = Math.min(shape.top - .59 * sideNotch - wingBackCut, shape.top);
  const top = Math.max(shape.bottom + .10, effectiveTop);
  const y = lerp(top, shape.bottom, t);
  const lowerFraction = clamp((shape.top - y) / Math.max(.3, shape.top - shape.bottom), 0, 1);
  const bodyR = torsoRadiusVida38Q2(plan, y);
  // Tramo inferior libre: caída textil y no prolongación cilíndrica del abdomen.
  const base = Math.max(.185, bodyR) + shape.offset;
  const ripple = .011 * Math.sin(angle * shape.folds + t * 3.5) * Math.pow(lowerFraction, 1.5);
  const drape = shape.flare * Math.pow(lowerFraction, 1.55);
  const rr = base + ripple + drape;
  const x = Math.sin(angle) * rr + shape.asymmetric * Math.pow(t, 2);
  const z = Math.cos(angle) * rr * .84 - .035
    - shape.rearSweep * Math.max(0, -Math.cos(angle)) * Math.pow(lowerFraction, 1.50);
  return new THREE.Vector3(x, y + .009 * Math.sin(angle * style.folds + t * 2) * t, z);
}

function clothMaterial(color: string, roughness: number, translucent = false): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: translucent ? .06 : .025, roughness,
    clearcoat: translucent ? .2 : .045, clearcoatRoughness: .72,
    side: THREE.DoubleSide, transparent: translucent, opacity: translucent ? .86 : 1,
    depthWrite: !translucent,
  });
}
function trimMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: .38, metalness: .16, emissive: color, emissiveIntensity: .14 });
}
function makeTube(points: THREE.Vector3[], thickness: number, material: THREE.Material, name: string): THREE.Mesh {
  const path = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(12, points.length * 3), thickness, 5, false), material);
  mesh.name = name;
  return mesh;
}
function generateSurface(plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidWardrobeStyle38Q2,
  shape: SurfaceShape38Q2, quality: Vida38CivilizedInsectoidQuality38Q,
  material: THREE.Material, name: string): THREE.Mesh {
  const segments = quality === 'LOW' ? 32 : quality === 'MEDIUM' ? 48 : 64;
  const rows = quality === 'LOW' ? 20 : quality === 'MEDIUM' ? 32 : 44;
  const xyz: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    for (let i = 0; i <= segments; i++) {
      const a = lerp(shape.theta0, shape.theta1, i / segments);
      const p = sampleSurface(plan, style, shape, a, t);
      xyz.push(p.x, p.y, p.z); uv.push(i / segments, t);
      if (j > 0 && i > 0) {
        const v = j * (segments + 1) + i;
        indices.push(v, v - segments - 1, v - 1, v - 1, v - segments - 1, v - segments - 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(xyz, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.userData['vida38WardrobeContinuous38Q2'] = true;
  mesh.userData['vida38WardrobeShape38Q2'] = {
    top: shape.top, bottom: shape.bottom, flare: shape.flare,
    wingOpening: shape.wingOpening, sideSlits: shape.sideSlits,
    angularSpan: shape.theta1 - shape.theta0,
  };
  mesh.castShadow = true;
  return mesh;
}
function edgeCurve(plan: Vida38CivilizedInsectoidPlan38Q, style: Vida38InsectoidWardrobeStyle38Q2,
  shape: SurfaceShape38Q2, at: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT'): THREE.Vector3[] {
  const count = at === 'TOP' || at === 'BOTTOM' ? 42 : 20;
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const angle = at === 'LEFT' ? shape.theta0 : at === 'RIGHT' ? shape.theta1
      : lerp(shape.theta0, shape.theta1, t);
    const fraction = at === 'TOP' ? 0 : at === 'BOTTOM' ? 1 : t;
    const p = sampleSurface(plan, style, shape, angle, fraction);
    // El ribete sobresale mínimamente, sin parecer una franja de armadura.
    p.x += Math.sin(angle) * .005; p.z += Math.cos(angle) * .005;
    return p;
  });
}

export function buildVida38InsectoidWardrobe38Q2(
  plan: Vida38CivilizedInsectoidPlan38Q,
  quality: Vida38CivilizedInsectoidQuality38Q,
): Vida38InsectoidGarmentPiece38Q2[] {
  const style = deriveVida38InsectoidWardrobeStyle38Q2(plan);
  const pieces: Vida38InsectoidGarmentPiece38Q2[] = [];
  const primary = clothMaterial(style.primary, style.materialRoughness, plan.culture === 'PELAGIC_CHORUS' && style.family === 'ROYAL_MANTLE');
  const secondary = clothMaterial(style.secondary, clamp(style.materialRoughness + .07, .25, .93));
  const dark = clothMaterial(plan.garmentHex, .64);
  const trim = trimMaterial(style.edging);
  function add(mesh: THREE.Mesh, part: Vida38InsectoidGarmentPiece38Q2['part'], name: string): void {
    mesh.name = name;
    mesh.userData['vida38WardrobeFamily38Q2'] = style.family;
    mesh.userData['vida38WardrobeRevision38Q2'] = style.revision;
    pieces.push({ mesh, part, name });
  }
  function shell(name: string, part: Vida38InsectoidGarmentPiece38Q2['part'],
    shape: SurfaceShape38Q2, material = primary, borders: ('BOTTOM'|'TOP'|'LEFT'|'RIGHT')[] = ['BOTTOM']): void {
    add(generateSurface(plan, style, shape, quality, material, name), part, name);
    for (const edge of borders) {
      const path = edgeCurve(plan, style, shape, edge);
      add(makeTube(path, edge === 'TOP' ? .0055 : .005, trim, `${name}_${edge}_SEAM`), 'EDGING', `${name}_${edge}_SEAM`);
    }
  }
  const basic = (bottom: number, flare: number, offset = .032): SurfaceShape38Q2 => ({
    theta0: 0, theta1: 2 * Math.PI, top: 1.88, bottom,
    flare, offset, folds: style.folds, sideSlits: true, wingOpening: style.wingOpening,
    rearSweep: .018, asymmetric: 0,
  });
  switch (style.family) {
    case 'EXO_SUIT': {
      // Traje ceñido continuo: no peto + seis aros superpuestos.
      const suit = basic(1.00, .011, .018);
      shell('VIDA38_Q2_SMART_SKIN_360', 'CLOTH', suit, dark, ['TOP']);
      // Dos trazos longitudinales sutiles, evitando las bandas horizontales universales.
      for (const side of [-1, 1] as const) {
        const angle = side * .38;
        const points = Array.from({ length: 18 }, (_, i) =>
          sampleSurface(plan, style, suit, angle, .12 + i / 17 * .77));
        add(makeTube(points, .007, trim, 'VIDA38_Q2_SUIT_BIOLINE'), 'CULTURAL_TRIM', 'VIDA38_Q2_SUIT_BIOLINE');
      }
      break;
    }
    case 'SEGMENTED_BIO_ARMOR': {
      const under = basic(1.07, .016, .020);
      shell('VIDA38_Q2_ARMOR_UNDERWEAVE', 'CLOTH', under, dark, ['TOP']);
      // Placas de quitina curvadas, separadas, NO un cilindro rígido completo.
      const armor = new THREE.MeshPhysicalMaterial({ color: style.secondary, metalness: .32,
        roughness: .36, clearcoat: .24, side: THREE.DoubleSide });
      for (let j = 0; j < 3; j++) {
        const top = 1.79 - j * .21;
        const plate: SurfaceShape38Q2 = {
          theta0: -.95, theta1: .95, top, bottom: top - .17,
          flare: .015 + j * .006, offset: .055 + j * .003, folds: 4,
          sideSlits: false, wingOpening: false, rearSweep: 0, asymmetric: 0,
        };
        shell(`VIDA38_Q2_FLEX_PLATE_${j}`, 'ARMOR', plate, armor, ['BOTTOM']);
      }
      break;
    }
    case 'SCIENTIFIC_HARNESS': {
      // Túnica interior + bata abierta en el centro, continua por espalda y costados.
      const under = basic(1.11, .023, .024);
      shell('VIDA38_Q2_SCIENCE_UNDERDRESS', 'TUNIC', under, dark, []);
      const coat: SurfaceShape38Q2 = {
        ...basic(style.length, style.flare + .030, .049),
        theta0: .40, theta1: 2 * Math.PI - .40,
        folds: style.folds + 1, rearSweep: .070,
      };
      shell('VIDA38_Q2_OPEN_LAB_COAT', 'COAT', coat, primary, ['BOTTOM', 'LEFT', 'RIGHT']);
      // Solapas blandas curvadas en lugar de hombreras/placas.
      for (const side of [-1, 1] as const) {
        const angle = side * .43;
        const path = Array.from({ length: 18 }, (_, i) => sampleSurface(plan, style, coat,
          angle < 0 ? 2 * Math.PI + angle : angle, i / 17));
        add(makeTube(path, .010, trim, 'VIDA38_Q2_LAB_COAT_LAPEL'), 'CULTURAL_TRIM', 'VIDA38_Q2_LAB_COAT_LAPEL');
      }
      break;
    }
    case 'ROYAL_MANTLE': {
      // Túnica corta frontal y amplia capa dorsal: silueta de jerarquía, no armadura.
      shell('VIDA38_Q2_REGAL_UNDERLAYER', 'TUNIC', basic(1.10, .045, .031), secondary, ['TOP']);
      const cape: SurfaceShape38Q2 = {
        theta0: 1.13, theta1: 5.15, top: style.wingOpening ? 1.64 : 1.82,
        bottom: style.length, flare: style.flare + .22, offset: .064, folds: style.folds + 2,
        sideSlits: false, wingOpening: style.wingOpening, rearSweep: .17, asymmetric: 0,
      };
      shell('VIDA38_Q2_WIDE_DORSAL_MANTLE', 'MANTLE', cape, primary, ['BOTTOM', 'LEFT', 'RIGHT']);
      // Dos caídas frontales de tejido ceremonial: planchas curvas, no barras.
      for (const side of [-1, 1] as const) {
        const sash: SurfaceShape38Q2 = {
          theta0: side < 0 ? -.65 : .33,
          theta1: side < 0 ? -.33 : .65,
          top: 1.82, bottom: Math.max(.65, style.length + .14),
          flare: .065, offset: .065, folds: 4, sideSlits: false,
          wingOpening: false, rearSweep: 0, asymmetric: 0,
        };
        shell('VIDA38_Q2_REGAL_FRONT_FALL', 'MANTLE', sash, secondary, ['BOTTOM']);
      }
      break;
    }
    case 'CEREMONIAL_VESTMENTS': {
      // Hábito amplio de cuerpo completo con brazos libres y apertura dorsal de alas.
      const robe = basic(style.length, style.flare + .075, .045);
      shell('VIDA38_Q2_CEREMONIAL_ROBE_360', 'TUNIC', robe, primary, ['TOP', 'BOTTOM']);
      // Paños superpuestos diagonales que siguen la curvatura facial del torso.
      for (const side of [-1, 1] as const) {
        const panel: SurfaceShape38Q2 = {
          theta0: side < 0 ? -.68 : .14, theta1: side < 0 ? -.14 : .68,
          top: 1.77, bottom: style.length + .045,
          flare: style.flare + .035, offset: .065,
          folds: style.folds, sideSlits: false, wingOpening: false,
          rearSweep: 0, asymmetric: .025 * side,
        };
        shell('VIDA38_Q2_RITUAL_OVERLAP', 'TUNIC', panel, secondary, ['BOTTOM']);
      }
      break;
    }
    case 'EXPLORER_KIT': {
      // Poncho de explorador asimétrico y faldón de trabajo corto.
      const inner = basic(1.12, .025, .022);
      shell('VIDA38_Q2_EXPEDITION_BASE', 'CLOTH', inner, dark, []);
      const poncho: SurfaceShape38Q2 = {
        theta0: -.55, theta1: 3.2, top: 1.85, bottom: Math.min(1.12, style.length + .21),
        flare: style.flare + .10, offset: .055, folds: style.folds + 2,
        sideSlits: true, wingOpening: style.wingOpening,
        rearSweep: .11, asymmetric: .075 * (u(plan.signature + '|ponchoSide') > .5 ? 1 : -1),
      };
      shell('VIDA38_Q2_ASYMMETRIC_FIELD_PONCHO', 'PONCHO', poncho, primary, ['BOTTOM', 'RIGHT']);
      const fieldApron: SurfaceShape38Q2 = {
        theta0: -.75, theta1: .65, top: 1.25, bottom: Math.max(.77, style.length - .10),
        flare: .12, offset: .045, folds: 5, sideSlits: false,
        wingOpening: false, rearSweep: 0, asymmetric: 0,
      };
      shell('VIDA38_Q2_COLONIAL_WORK_SKIRT', 'PONCHO', fieldApron, secondary, ['BOTTOM']);
      break;
    }
  }
  // Marcador de revisión y firma en cada malla, útil para auditoría y galería.
  for (const piece of pieces) {
    piece.mesh.userData['vida38InsectoidCoutureSignature38Q2'] = style.signature;
    piece.mesh.userData['vida38InsectoidCoutureCulture38Q2'] = style.culture;
  }
  return pieces;
}
