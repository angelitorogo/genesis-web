# GENESIS 32.11 — Surgical and idempotent route insert. Does not replace app.routes.ts.
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$routeFile = Join-Path $root 'src\app\app.routes.ts'
if (-not (Test-Path -LiteralPath $routeFile)) { throw 'Ejecuta este script desde la raíz de genesis-web.' }
$content = [System.IO.File]::ReadAllText($routeFile)
$target = 'export const genesisRoutes: Routes = ['
$marker = "path: 'laboratory/planetary-history'"
if ($content.Contains($marker)) {
  Write-Host 'La ruta de 32.11 ya está registrada. No hay cambios.'
  exit 0
}
if (-not $content.Contains($target)) { throw 'No encuentro genesisRoutes; el archivo no se ha modificado.' }
$entry = @'
export const genesisRoutes: Routes = [
  // GENESIS 32.11: demo sintética, no historia canónica del jugador.
  {
    path: 'laboratory/planetary-history',
    loadComponent: () => import('./presentation/planetary-history/planetary-history-lab-32-11')
      .then(module => module.PlanetaryHistoryLab32_11),
    title: 'Timeline histórico | Laboratorio GENESIS',
  },
'@
$updated = $content.Replace($target, $entry)
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($routeFile, $updated, $utf8)
Write-Host 'Ruta incorporada: /laboratory/planetary-history'
