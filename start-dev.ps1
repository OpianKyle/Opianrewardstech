# PowerShell script to start development server with Adumo environment variables
# Replace the values below with your actual Adumo credentials

Write-Host "Setting up Adumo environment variables..." -ForegroundColor Green

# Required Adumo configuration
$env:ADUMO_MERCHANTID = "9BA5008C-08EE-4286-A349-54AF91A621B0"
$env:ADUMO_JWTSECRET = "yglTxLCSMm7PEsfaMszAKf2LSRvM2qVW"
$env:ADUMO_APPLICATIONID = "23ADADC0-DA2D-4DAC-A128-4845A5D71293"

# Optional: Additional configuration
$env:ADUMO_CLIENT_ID = "9BA5008C-08EE-4286-A349-54AF91A621B0"
$env:ADUMO_CLIENT_SECRET = "23adadc0-da2d-4dac-a128-4845a5d71293"

# Email Configuration
$env:EMAIL_HOST = "smtp.opianfsgroup.com"
$env:EMAIL_USER = "portal@opianfsgroup.com"
$env:EMAIL_PASS = "@Dm20251Nl@NC3#543321@#"
$env:EMAIL_FROM = "portal@opianfsgroup.com"

Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
