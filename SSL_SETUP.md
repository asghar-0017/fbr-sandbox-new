# SSL/HTTPS Setup Guide

## Overview
This guide explains how to set up HTTPS for your FBR Backend application to resolve SSL protocol errors and CORS issues.

## Issues Resolved
- SSL Protocol Errors (ERR_SSL_PROTOCOL_ERROR)
- Cross-Origin-Opener-Policy header issues
- Origin-Agent-Cluster warnings
- Mixed HTTP/HTTPS content issues

## Quick Setup

### 1. Generate SSL Certificates
```bash
cd FBR-Backend
npm run generate-ssl
```

### 2. Start Server with HTTPS
```bash
npm run start-https
```

### 3. Update Frontend Configuration
Update your frontend to use HTTPS endpoints:

```javascript
// In your API configuration
const API_CONFIG = {
  apiKeyHttps: 'https://45.55.137.96:5151/api'
};
```

## Manual SSL Certificate Generation

If the automatic script doesn't work, generate certificates manually:

### Using OpenSSL
```bash
# Create ssl directory
mkdir ssl
cd ssl

# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate signing request
openssl req -new -key key.pem -out csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

# Clean up
rm csr.pem
```

## Server Configuration

The server now supports both HTTP and HTTPS:

- **HTTP**: Port 5150 (http://45.55.137.96:5150)
- **HTTPS**: Port 5151 (https://45.55.137.96:5151)

## CORS Configuration

Updated CORS settings allow:
- Local development (localhost:5174)
- Production IP (45.55.137.96:5174)
- Both HTTP and HTTPS protocols

## Security Headers

Added security headers to resolve browser warnings:
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp
- Origin-Agent-Cluster: ?1

## Troubleshooting

### SSL Certificate Errors
1. Ensure OpenSSL is installed
2. Check certificate file permissions
3. Verify certificate paths in app.js

### CORS Issues
1. Check origin configuration in app.js
2. Verify frontend URL matches allowed origins
3. Ensure proper headers are sent

### Browser Security Warnings
1. Accept self-signed certificate in browser
2. Add security exception for localhost
3. Use proper domain names in production

## Production Deployment

For production, replace self-signed certificates with:
1. Let's Encrypt certificates
2. Commercial SSL certificates
3. Cloud provider SSL (AWS, Azure, GCP)

## Environment Variables

Add to your .env file:
```
HTTPS_PORT=5151
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
``` 