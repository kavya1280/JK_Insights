$repoUrl = "https://github.com/kavya1280/JK_Insights.git"
$tempDir = "D:\JKC_Git_Push_Temp"
$frontendDir = $PSScriptRoot
$targetDir = Join-Path $tempDir "AJA\Abinesh\Frontend"

Write-Host "Cleaning up old temp directory..." -ForegroundColor Cyan
if (Test-Path $tempDir) { Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host "Cloning JK_Insights repository (Shallow)..." -ForegroundColor Cyan
git clone --depth 1 $repoUrl $tempDir

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to clone the repository. Check your network or permissions." -ForegroundColor Red
    pause
    exit
}

Write-Host "Copying Frontend files into the repository (AJA/Abinesh/Frontend)..." -ForegroundColor Cyan
Set-Location $tempDir
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
robocopy $frontendDir $targetDir /E /XD node_modules dist .git

Write-Host "Committing the changes..." -ForegroundColor Cyan
git add AJA/Abinesh/Frontend
git commit -m "Upload Frontend to AJA/Abinesh"

Write-Host "Pushing to GitHub. You may be prompted to enter your credentials..." -ForegroundColor Yellow
git push origin HEAD:main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
}
else {
    Write-Host "Failed to push to GitHub. You might not have the correct permissions." -ForegroundColor Red
}

Write-Host "Cleaning up temp directory..." -ForegroundColor Cyan
Set-Location $frontendDir
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Done!" -ForegroundColor Green
pause
