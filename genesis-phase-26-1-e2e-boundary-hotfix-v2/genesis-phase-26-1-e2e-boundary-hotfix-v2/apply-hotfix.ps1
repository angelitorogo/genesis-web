$ErrorActionPreference = 'Stop'

$path = Join-Path (Get-Location) 'e2e\app-navigation.spec.ts'

if (-not (Test-Path -LiteralPath $path)) {
  throw "No se encuentra: $path. Ejecuta este script desde la raíz de genesis-web."
}

$text = [System.IO.File]::ReadAllText($path)

$pattern = "(?s)(should expose the point-11\.5 focus control without offering a redundant change for the current galaxy.*?galaxy-detail-boundary'.*?\.toContainText\(\s*)'11\.6'(\s*,\s*\);)"
$regex = [System.Text.RegularExpressions.Regex]::new($pattern)
$matches = $regex.Matches($text)

if ($matches.Count -ne 1) {
  throw "Esperaba encontrar exactamente 1 expectativa 11.6 en el test de foco 11.5, pero encontre $($matches.Count). No se ha modificado el archivo."
}

$updated = $regex.Replace(
  $text,
  { param($m) $m.Groups[1].Value + "'26.1'" + $m.Groups[2].Value },
  1
)

if ($updated -eq $text) {
  throw 'El hotfix no produjo cambios. No se ha escrito el archivo.'
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $updated, $utf8NoBom)

Write-Host 'HOTFIX_OK: e2e/app-navigation.spec.ts actualizado: galaxy-detail-boundary 11.6 -> 26.1'
