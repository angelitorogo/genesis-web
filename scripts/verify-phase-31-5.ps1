# GENESIS Web — 31.5 closure. Run from the project root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\verify-phase-31-5.ps1
# Stops at the first regression; no discovery data or world state is modified.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Push-Location (Join-Path $PSScriptRoot '..')
try {
    $population = @(
        'src/app/domain/stellar/compact-planetary-host.spec.ts',
        'src/app/simulation/planetary/compact-host-planetary-system-generator.spec.ts',
        'src/app/simulation/planetary/compact-host-planet-characterization-engine.spec.ts',
        'src/app/simulation/planetary/compact-host-environment-engine.spec.ts',
        'src/app/simulation/exploration/galaxy-exploration-telemetry-engine.spec.ts',
        'src/app/presentation/runtime/galaxy-compact-closure-31-5.spec.ts',
        'src/app/presentation/runtime/galaxy-planet-moon-catalog-snapshot.runtime.spec.ts',
        'src/app/presentation/runtime/galaxy-minor-body-catalog-snapshot.runtime.spec.ts',
        'src/app/presentation/runtime/galaxy-knowledge-snapshot.runtime.spec.ts'
    )
    $presentation = @(
        'src/app/presentation/system/system-compact-host-secondary-population.spec.ts',
        'src/app/presentation/system/system-compact-host-scientific-session.spec.ts',
        'src/app/presentation/system/system-compact-black-hole-occlusion.spec.ts',
        'src/app/presentation/system/system-compact-black-hole-secondary-occlusion.spec.ts',
        'src/app/presentation/planet-detail/planet-scientific-fiche-layout.spec.ts',
        'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-planets-moons-catalog.data-source.spec.ts',
        'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-minor-bodies-catalog.data-source.spec.ts',
        'src/app/presentation/system/system-scene.spec.ts'
    )
    $conventional = @(
        'src/app/simulation/stellar/stellar-multihost-formation.spec.ts',
        'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-systems-catalog.data-source.spec.ts',
        'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-catalog-regression.spec.ts'
    )
    foreach ($batch in @($population, $presentation, $conventional)) {
        foreach ($file in $batch) {
            if (!(Test-Path -LiteralPath $file)) {
                throw "Missing required regression file: $file"
            }
        }
        $includeArgs = @($batch | ForEach-Object { "--include=$_" })
        & npx ng test --watch=false @includeArgs
        if ($LASTEXITCODE -ne 0) { throw "Vitest batch failed ($LASTEXITCODE)." }
    }
    & npm run test:architecture
    if ($LASTEXITCODE -ne 0) { throw "Architecture check failed ($LASTEXITCODE)." }
    & npm run test:worker
    if ($LASTEXITCODE -ne 0) { throw "Worker check failed ($LASTEXITCODE)." }
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "Production build failed ($LASTEXITCODE)." }
    Write-Host '31.5 focused regressions, architecture, worker and build: PASS' -ForegroundColor Green
} finally {
    Pop-Location
}
