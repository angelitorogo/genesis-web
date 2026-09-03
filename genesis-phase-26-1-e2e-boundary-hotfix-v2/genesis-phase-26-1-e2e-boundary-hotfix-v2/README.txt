GENESIS Web - 26.1 E2E boundary hotfix V2

Objetivo:
- Cambiar SOLO el assert historico del test de foco 11.5 que espera '11.6'
  en galaxy-detail-boundary para que espere '26.1'.
- No modifica produccion.

Aplicacion recomendada desde la raiz de genesis-web:
  powershell -ExecutionPolicy Bypass -File ".\genesis-phase-26-1-e2e-boundary-hotfix-v2\apply-hotfix.ps1"

Despues:
  npm run test:e2e
