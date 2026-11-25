/** GENESIS 38.bis-T7s — orientación DIURNA de la cámara, exclusiva de fichas planetarias.
 * No rota el cuerpo ni cambia sus luces científicas: solo escoge desde dónde se observa.
 */
export interface ScientificPreviewLightSourceT7s {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly weight01: number;
  readonly isOrbitalHost?: boolean;
}

export interface ScientificPreviewDaylightDirectionT7s {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

const EPSILON = 1e-10;
const FALLBACK_LIGHT = { x: 4.5, y: 3, z: 5 } as const;

function normalized(x: number, y: number, z: number): ScientificPreviewDaylightDirectionT7s | null {
  const norm = Math.hypot(x, y, z);
  return Number.isFinite(norm) && norm > EPSILON
    ? { x: x / norm, y: y / norm, z: z / norm }
    : null;
}

/**
 * Escoge la dirección diurna mirando hacia las fuentes estelares usadas por el
 * propio material del preview. La orientación final deja un pequeño ángulo
 * para que se aprecie volumen, pero permanece en el hemisferio iluminado.
 */
export function scientificPreviewDaylightCameraT7s(
  sources: readonly ScientificPreviewLightSourceT7s[] | null | undefined,
): ScientificPreviewDaylightDirectionT7s {
  const valid = (sources ?? []).filter(source =>
    Number.isFinite(source.x) && Number.isFinite(source.y) &&
    Number.isFinite(source.z) && Number.isFinite(source.weight01) &&
    source.weight01 > 0 && Math.hypot(source.x, source.y, source.z) > EPSILON,
  );
  const selected = valid.some(source => source.isOrbitalHost)
    ? valid.filter(source => source.isOrbitalHost)
    : valid;

  let x = 0;
  let y = 0;
  let z = 0;
  let strongest: ScientificPreviewDaylightDirectionT7s | null = null;
  let strongestWeight = -1;

  for (const source of selected) {
    const unit = normalized(source.x, source.y, source.z)!;
    x += unit.x * source.weight01;
    y += unit.y * source.weight01;
    z += unit.z * source.weight01;
    if (source.weight01 > strongestWeight) {
      strongestWeight = source.weight01;
      strongest = unit;
    }
  }

  const light = normalized(x, y, z) ?? strongest ??
    normalized(FALLBACK_LIGHT.x, FALLBACK_LIGHT.y, FALLBACK_LIGHT.z)!;

  // Angulo de presentación muy suave respecto a la estrella, sin desplazar
  // el observador a la cara oscura. No depende del giro/latitud de colonias.
  return normalized(light.x * 0.96, light.y * 0.96 + 0.01, light.z * 0.96 + 0.13)!;
}
