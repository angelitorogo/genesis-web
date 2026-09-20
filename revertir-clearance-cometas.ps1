# Ejecutar desde la raiz de genesis-web, DESPUES de Expand-Archive.
# Solo elimina los tres ficheros nuevos de la entrega defectuosa;
# los cinco ficheros anteriores los restituye el ZIP.
$paths = @(
  'src/app/presentation/system/system-scene-v2-comet-clearance-vector.ts',
  'src/app/presentation/system/system-scene-v2-comet-clearance.ts',
  'src/app/presentation/system/system-scene-v2-comet-clearance.spec.ts'
)
if (-not (Test-Path -LiteralPath 'angular.json') -or -not (Test-Path -LiteralPath 'src/app/presentation/system/system-scene.ts')) {
  throw 'Ejecuta el script desde la raiz de genesis-web.'
}
foreach ($path in $paths) {
  if (Test-Path -LiteralPath $path -PathType Leaf) {
    Remove-Item -LiteralPath $path -Force
    Write-Host "Retirado: $path"
  }
}
Write-Host 'Reversion del hotfix defectuoso completada. No se han modificado datos de partida.'
