$currentDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($currentDir)) {
    $currentDir = Get-Location
}

$urls = @(
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
)

foreach ($url in $urls) {

    $fileName = Split-Path -Leaf $url
    $outputPath = Join-Path $currentDir $fileName
    
    Write-Host "Downloading $fileName to $currentDir..." -ForegroundColor Cyan
    
    Invoke-WebRequest -Uri $url -OutFile $outputPath
}

Write-Host "All downloads complete!" -ForegroundColor Green