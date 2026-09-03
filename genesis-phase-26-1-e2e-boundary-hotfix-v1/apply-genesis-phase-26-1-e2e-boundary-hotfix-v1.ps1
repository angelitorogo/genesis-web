$ErrorActionPreference = 'Stop'

$path = Join-Path (Get-Location) 'e2e\app-navigation.spec.ts'
if (-not (Test-Path -LiteralPath $path)) {
  throw "No se encontró $path. Ejecuta este script desde la raíz de genesis-web."
}

$text = [IO.File]::ReadAllText($path)
$pattern = "(?s)(page\.getByTestId\(\s*'galaxy-detail-boundary',\s*\),\s*\)\.toContainText\(\s*)'11\.6'(\s*,\s*\);)"
$matches = [regex]::Matches($text, $pattern)

if ($matches.Count -ne 1) {
  throw "Se esperaba exactamente 1 assert obsoleto galaxy-detail-boundary -> 11.6; encontrados: $($matches.Count). No se modificó el archivo."
}

$replacement = '${1}''26.1''${2}'
$updated = [regex]::Replace($text, $pattern, $replacement, 1)
[IO.File]::WriteAllText($path, $updated, [Text.UTF8Encoding]::new($false))
Write-Host 'HOTFIX_APPLIED: galaxy-detail-boundary 11.6 -> 26.1'
