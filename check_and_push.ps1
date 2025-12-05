# PowerShell script to check and push to GitHub
Set-Location "f:\Project\PC-WEB\smartmeter-vision"

Write-Host "=== Git Status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Recent Commits ===" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n=== Remote Configuration ===" -ForegroundColor Cyan
git remote -v

Write-Host "`n=== Checking for uncommitted changes ===" -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "Found uncommitted changes:" -ForegroundColor Yellow
    Write-Host $status
    
    Write-Host "`n=== Adding all files ===" -ForegroundColor Cyan
    git add -A
    
    Write-Host "=== Committing changes ===" -ForegroundColor Cyan
    git commit -m "Update SmartMeter Vision with latest features and improvements"
    
    Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
    git push -u origin main --force
    
    Write-Host "`n=== Push completed! ===" -ForegroundColor Green
} else {
    Write-Host "No uncommitted changes found." -ForegroundColor Green
    Write-Host "Checking if we need to push..." -ForegroundColor Yellow
    
    $local = git rev-parse @
    $remote = git rev-parse @{u} 2>$null
    
    if ($LASTEXITCODE -ne 0 -or $local -ne $remote) {
        Write-Host "Local and remote are out of sync. Pushing..." -ForegroundColor Yellow
        git push -u origin main --force
        Write-Host "Push completed!" -ForegroundColor Green
    } else {
        Write-Host "Everything is up to date!" -ForegroundColor Green
    }
}

Write-Host "`n=== Final Status ===" -ForegroundColor Cyan
git status
