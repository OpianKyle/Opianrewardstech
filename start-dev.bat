@echo off
echo Setting up Adumo environment variables...

REM Replace these with your actual Adumo credentials
set ADUMO_MERCHANTID=your_merchant_id_here
set ADUMO_JWTSECRET=your_jwt_secret_here
set ADUMO_APPLICATIONID=your_application_id_here

REM Optional: Additional configuration
REM set ADUMO_SUBSCRIPTION_APPLICATION_ID=your_subscription_app_id
REM set ADUMO_CLIENT_ID=your_oauth_client_id
REM set ADUMO_CLIENT_SECRET=your_oauth_client_secret

echo Starting development server...
npm run dev
