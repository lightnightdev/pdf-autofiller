$currentDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($currentDir)) {
    $currentDir = Get-Location
}

$urls = @(
    "https://cdn.jsdelivr.net/npm/@alpinejs/csp@3.x.x/dist/cdn.min.js",
    "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
    "https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
    "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js",
    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"
)

foreach ($url in $urls) {

    $fileName = Split-Path -Leaf $url
    $outputPath = Join-Path $currentDir $fileName
    
    Write-Host "Downloading $fileName to $currentDir..." -ForegroundColor Cyan
    
    Invoke-WebRequest -Uri $url -OutFile $outputPath
}

Write-Host "All downloads complete!" -ForegroundColor Green