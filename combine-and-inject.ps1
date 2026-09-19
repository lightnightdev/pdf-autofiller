# PowerShell script to combine JS/CSS files and inject them into a main file
# updated to create new file

# Set the base directory (defaults to current directory)
$baseDir = Get-Location

# Define paths
$jsDir = Join-Path $baseDir "js"
$cssDir = Join-Path $baseDir "css"

# Search keys
$jsSearchKey = "//_JS_IMPORT_SEARCHKEY"
$cssSearchKey = "  <!-- _STYLE_IMPORT_SEARCHKEY -->"

Write-Host "Starting file combination process..." -ForegroundColor Green

# (1) Combine all JS files
Write-Host "`nCombining JavaScript files from $jsDir..." -ForegroundColor Yellow
$megaJs = ""
if (Test-Path $jsDir) {
    # Get all files except the initialization setup script
    $jsFiles = Get-ChildItem -Path $jsDir -Filter "*.js" -File | Where-Object { $_.Name -ne "_setup.js" } | Sort-Object Name

    # Safely find and isolate the setup script
    $setupFile = Get-ChildItem -Path $jsDir -Filter "_setup.js" -File

    # Combine them so that module libraries load first, and the setup initialization executes last
    $orderedJsFiles = $jsFiles + $setupFile

    foreach ($file in $orderedJsFiles) {
        Write-Host "  Adding: $($file.Name)" -ForegroundColor Cyan
        $content = Get-Content $file.FullName -Raw
        $megaJs += "`n// === $($file.Name) ===`n"
        $megaJs += $content
        $megaJs += "`n"
    }
    Write-Host "Combined $($jsFiles.Count) JavaScript file(s)" -ForegroundColor Green
}
else {
    Write-Host "Warning: $jsDir not found!" -ForegroundColor Red
}

# (2) Combine all CSS files and wrap in <style> tags
Write-Host "`nCombining CSS files from $cssDir..." -ForegroundColor Yellow
$megaCss = ""
if (Test-Path $cssDir) {
    $cssFiles = Get-ChildItem -Path $cssDir -Filter "*.css" -File | Sort-Object Name
    $cssContent = ""
    foreach ($file in $cssFiles) {
        Write-Host "  Adding: $($file.Name)" -ForegroundColor Cyan
        $content = Get-Content $file.FullName -Raw
        $cssContent += "`n/* === $($file.Name) === */`n"
        $cssContent += $content
        $cssContent += "`n"
    }
    $megaCss = "<style>$cssContent</style>"
    Write-Host "Combined $($cssFiles.Count) CSS file(s)" -ForegroundColor Green
}
else {
    Write-Host "Warning: $cssDir not found!" -ForegroundColor Red
}

# (3) & (4) Find and replace in target file
Write-Host "`nLooking for target file to inject into..." -ForegroundColor Yellow

# Look for common HTML files in the base directory
$targetFile = $null
$htmlFiles = Get-ChildItem -Path $baseDir -Filter "*.html" -File

if ($htmlFiles.Count -eq 0) {
    Write-Host "Error: No HTML files found in $baseDir" -ForegroundColor Red
    Write-Host "Please specify the target file path as a parameter:" -ForegroundColor Yellow
    Write-Host "  .\combine-and-inject.ps1 -TargetFile 'path\to\your\file.html'" -ForegroundColor Yellow
    exit
}
elseif ($htmlFiles.Count -eq 1) {
    $targetFile = $htmlFiles[0].FullName
}
else {
    Write-Host "Multiple HTML files found. Please select one:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $htmlFiles.Count; $i++) {
        Write-Host "  [$i] $($htmlFiles[$i].Name)"
    }
    $selection = Read-Host "Enter number"
    $targetFile = $htmlFiles[[int]$selection].FullName
}

Write-Host "Target file: $targetFile" -ForegroundColor Cyan

# Read the target file
$content = Get-Content $targetFile -Raw

# Perform replacements
$originalContent = $content
$content = $content -replace [regex]::Escape($jsSearchKey), $megaJs
$content = $content -replace [regex]::Escape($cssSearchKey), $megaCss

# Check if replacements were made
$jsReplaced = $content -ne $originalContent -and $originalContent.Contains($jsSearchKey)
$cssReplaced = $content.Contains($megaCss) -and $originalContent.Contains($cssSearchKey)

if ($jsReplaced -or $cssReplaced) {
    # Create output filename with -singlefile suffix
    $directory = Split-Path $targetFile
    $filename = [System.IO.Path]::GetFileNameWithoutExtension($targetFile)
    $extension = [System.IO.Path]::GetExtension($targetFile)
    $outputFile = Join-Path $directory "$filename-singlefile$extension"
    
    # Write to new file
    Set-Content -Path $outputFile -Value $content -NoNewline
    Write-Host "`nInjection complete!" -ForegroundColor Green
    Write-Host "Output file: $outputFile" -ForegroundColor Cyan
    if ($jsReplaced) { Write-Host "  ✓ JavaScript injected" -ForegroundColor Green }
    if ($cssReplaced) { Write-Host "  ✓ CSS injected" -ForegroundColor Green }
}
else {
    Write-Host "`nWarning: Search keys not found in target file!" -ForegroundColor Red
    Write-Host "Looking for:" -ForegroundColor Yellow
    Write-Host "  - $jsSearchKey" -ForegroundColor Yellow
    Write-Host "  - $cssSearchKey" -ForegroundColor Yellow
}

Write-Host "`nDone!" -ForegroundColor Green
