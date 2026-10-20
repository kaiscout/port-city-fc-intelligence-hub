param([string]$Version = '6.0')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseDirectory = Join-Path $repositoryRoot 'release'
New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
$stamp = [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')
$prefix = "pcfc-candidate-$Version-$stamp"

function New-SafeZip([string]$Destination, [hashtable]$Entries) {
  $zip = [System.IO.Compression.ZipFile]::Open($Destination, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($entry in ($Entries.Keys | Sort-Object)) {
      $source = $Entries[$entry]
      if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Required artifact missing: $entry" }
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $source, $entry.Replace('\','/'), [System.IO.Compression.CompressionLevel]::Fastest) | Out-Null
    }
  } finally { $zip.Dispose() }
}

$publicEntries = @{}
$publicNames = @('index.html','styles.css','app.js','model.js','scenario-visuals.js','lab.css','data.js','assets/pcfc-logo.png')
foreach ($name in $publicNames) { $publicEntries[$name] = Join-Path $repositoryRoot ('dist/' + $name) }
$actual = @(Get-ChildItem -LiteralPath (Join-Path $repositoryRoot 'dist') -File -Recurse | ForEach-Object { [System.IO.Path]::GetRelativePath((Join-Path $repositoryRoot 'dist'), $_.FullName).Replace('\','/') } | Sort-Object)
if (@(Compare-Object ($publicNames | Sort-Object) $actual).Count -ne 0) { throw 'Public bundle has unexpected or missing files; review before packaging' }
$publicZip = Join-Path $releaseDirectory "$prefix-public.zip"
New-SafeZip $publicZip $publicEntries

$sourceEntries = @{}
foreach ($directory in @('app','components','data','lib','prisma','scripts','site','tests','powerbi','docs','public','.github')) {
  Get-ChildItem -LiteralPath (Join-Path $repositoryRoot $directory) -File -Recurse | Where-Object { $_.FullName -notmatch '[\\/]\.pbi[\\/]' } | ForEach-Object {
    $name = [System.IO.Path]::GetRelativePath($repositoryRoot, $_.FullName).Replace('\','/')
    $sourceEntries[$name] = $_.FullName
  }
}
foreach ($name in @('README.md','LICENSE','SECURITY.md','.env.example','.gitattributes','.gitignore','.prettierignore','.prettierrc.json','package.json','package-lock.json','next.config.ts','next-env.d.ts','tsconfig.json','vitest.config.mts','playwright.config.ts','instrumentation.ts','proxy.ts','eslint.config.mjs','docker-compose.yml')) { $sourceEntries[$name] = Join-Path $repositoryRoot $name }
$workbookName = 'outputs/01a128c4-1c8c-71b0-819c-29eaae5a311f/PortCityFC_Analytics_Companion.xlsx'
$sourceEntries[$workbookName] = Join-Path $repositoryRoot $workbookName
$walkthroughNames = @('README.md','narration.txt','record-walkthrough.html','port-city-fc-intelligence-hub-walkthrough.webm','frames/01-ownership.png','frames/02-dashboard.png','frames/03-scenarios.png','frames/04-operations.png')
foreach ($name in $walkthroughNames) { $sourceEntries['walkthrough/' + $name] = Join-Path $repositoryRoot ('walkthrough/' + $name) }
$sourceZip = Join-Path $releaseDirectory "$prefix-source.zip"
New-SafeZip $sourceZip $sourceEntries

$companionEntries = @{}
foreach ($directory in @('docs','powerbi','data/processed')) {
  Get-ChildItem -LiteralPath (Join-Path $repositoryRoot $directory) -File -Recurse | Where-Object { $_.FullName -notmatch '[\\/]\.pbi[\\/]' } | ForEach-Object {
    $companionEntries[[System.IO.Path]::GetRelativePath($repositoryRoot, $_.FullName).Replace('\','/')] = $_.FullName
  }
}
$companionEntries['README.md'] = Join-Path $repositoryRoot 'README.md'
$companionEntries['companions/PortCityFC_Analytics_Companion.xlsx'] = Join-Path $repositoryRoot $workbookName
foreach ($name in $walkthroughNames) { $companionEntries['walkthrough/' + $name] = Join-Path $repositoryRoot ('walkthrough/' + $name) }
Get-ChildItem -LiteralPath (Join-Path $repositoryRoot 'public/screenshots') -File -Filter 'completion-*' | ForEach-Object { $companionEntries['screenshots/' + $_.Name] = $_.FullName }
$companionZip = Join-Path $releaseDirectory "$prefix-presentation.zip"
New-SafeZip $companionZip $companionEntries

$runtimeFiles = @{}
foreach ($name in $sourceEntries.Keys) {
  if ($name -match '^(app|components|lib|data|prisma|site)/' -or $name -in @('package.json','package-lock.json','next.config.ts','proxy.ts','instrumentation.ts')) {
    $runtimeFiles[$name] = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourceEntries[$name]).Hash.ToLowerInvariant()
  }
}
$runtimeText = ($runtimeFiles.Keys | Sort-Object | ForEach-Object { "$_ $($runtimeFiles[$_])" }) -join "`n"
$runtimeHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData([System.Text.Encoding]::UTF8.GetBytes($runtimeText))).ToLowerInvariant()
$artifacts = @($publicZip,$sourceZip,$companionZip) | ForEach-Object { @{ file = [System.IO.Path]::GetFileName($_); bytes = (Get-Item -LiteralPath $_).Length; sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_).Hash.ToLowerInvariant() } }
$manifest = @{ version=$Version; preparedAt=[DateTime]::UtcNow.ToString('o'); published=$false; evidence='Synthetic/generalized public artifacts; private app source, no private database'; runtimeFingerprint=$runtimeHash; runtimeFiles=$runtimeFiles; publicFileCount=$publicEntries.Count; sourceFileCount=$sourceEntries.Count; presentationFileCount=$companionEntries.Count; artifacts=$artifacts }
$manifestPath = Join-Path $releaseDirectory "$prefix-manifest.json"
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
$artifacts | ConvertTo-Json -Depth 4
Write-Output $manifestPath
