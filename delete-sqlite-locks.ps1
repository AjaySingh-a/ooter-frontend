# Run this script ONCE as Administrator to delete SQLite lock files
# After running this, npx expo run:android should work without issues

Write-Host "Deleting SQLite lock files from C:\WINDOWS\..." -ForegroundColor Yellow

$lockFiles = Get-ChildItem "C:\WINDOWS\sqlite-*.dll.lck" -ErrorAction SilentlyContinue

if ($lockFiles) {
    $lockFiles | Remove-Item -Force -ErrorAction Stop
    Write-Host "✓ Deleted $($lockFiles.Count) lock file(s)" -ForegroundColor Green
} else {
    Write-Host "✓ No lock files found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Now you can run: npx expo run:android" -ForegroundColor Cyan
Write-Host "The build should work without SQLite errors!" -ForegroundColor Cyan

