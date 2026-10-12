param(
  [string]$InputPath = "walkthrough/narration.txt",
  [string]$OutputPath = "walkthrough/narration.wav",
  [int]$Rate = 2
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$source = (Resolve-Path -LiteralPath $InputPath).Path
$destination = [System.IO.Path]::GetFullPath((Join-Path $PWD $OutputPath))
$text = Get-Content -Raw -LiteralPath $source

$synthesizer = [System.Speech.Synthesis.SpeechSynthesizer]::new()
try {
  $synthesizer.Rate = $Rate
  $synthesizer.Volume = 100
  $synthesizer.SetOutputToWaveFile($destination)
  $synthesizer.Speak($text)
}
finally {
  $synthesizer.Dispose()
}

Get-Item -LiteralPath $destination | Select-Object FullName, Length, LastWriteTime
