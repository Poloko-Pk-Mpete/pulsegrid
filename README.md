# PulseGrid - Secure Serverless Uptime Dashboard

Live Frontend: https://dXXXXXXXXX.cloudfront.net
Live API: https://5ceurkewhi.execute-api.us-east-1.amazonaws.com/prod/status

## Architecture
S3 (private) + CloudFront OAC + Lambda + DynamoDB + EventBridge

## Security Highlights
- CloudFront Origin Access Control E1DBEALQQP9E6A (no public S3)
- Least privilege IAM: API can only Query/Scan, Worker can only Put/BatchWrite
- OIDC GitHub Deploy Role (no long-lived AWS keys)
- DynamoDB TTL enabled (30-day auto-expire) + PAY_PER_REQUEST
- CORS locked to frontend origin

## Endpoints Monitored
/api/auth, /api/payments, /api/users, /api/orders, /api/inventory, /api/search, /api/notifications, /api/analytics, /api/billing, /api/webhooks
