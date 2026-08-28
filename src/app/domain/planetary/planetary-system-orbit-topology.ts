/**
 * Point-18.2 host topology used by the mature planetary architecture.
 *
 * SINGLE stellar systems currently generate circumstellar planets around the
 * canonical A component. BINARY/TRIPLE systems use the P-type circumbinary
 * envelope frozen by point 16.5. S-type planets around one component of a
 * multiple system are deliberately outside the V1 contract.
 */
export enum PlanetarySystemOrbitTopology {
  CIRCUMSTELLAR =
    'CIRCUMSTELLAR',

  CIRCUMBINARY =
    'CIRCUMBINARY',
}
