# PulseGrid - Secure Serverless Uptime Dashboard

Live Frontend: https://dXXXXXXXXX.cloudfront.net
Live API: https://5ceurkewhi.execute-api.us-east-1.amazonaws.com/prod/status
Live API History: https://5ceurkewhi.execute-api.us-east-1.amazonaws.com/prod/history?endpoint=/api/auth&hours=1

## Architecture
S3 (private) + CloudFront OAC + Lambda + DynamoDB + EventBridge

Frontend: S3 -> CloudFront OAC E1DBEALQQP9E6A
Backend: API Gateway + Lambda API + DynamoDB
Worker: EventBridge (1 min) -> Lambda Telemetry Worker -> DynamoDB

## Security Highlights
- CloudFront Origin Access Control E1DBEALQQP9E6A (no public S3, bucket policy allows only CloudFront with AWS:SourceArn condition)
- Least privilege IAM: API role can only Query/Scan, Worker role can only Put/BatchWrite on pulsegrid-telemetry table
- OIDC GitHub Deploy Role: token.actions.githubusercontent.com with repo condition, no long-lived AWS keys
- DynamoDB TTL enabled on ttl attribute (30-day auto-expire) + PAY_PER_REQUEST billing
- CORS locked, sanitized API response (no internal fields)

## API
GET /prod/status -> latest status for 10 endpoints
GET /prod/history?endpoint=/api/auth&hours=1 -> history for charts

## Endpoints Monitored
/api/auth, /api/payments, /api/users, /api/orders, /api/inventory, /api/search, /api/notifications, /api/analytics, /api/billing, /api/webhooks
