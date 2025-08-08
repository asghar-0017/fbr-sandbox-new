# Buyer Registration Type Auto-Fetch Implementation

## Overview

This implementation automatically fetches the buyer's registration type from FBR's `Get_Reg_Type` API during buyer creation, eliminating the need for manual selection and ensuring data accuracy.

## What Changed

### Backend Changes

#### 1. Updated Buyer Controller (`src/controller/mysql/buyerController.js`)
- **Removed**: Manual `buyerRegistrationType` requirement from client
- **Added**: Automatic FBR API call to `dist/v1/Get_Reg_Type` endpoint
- **Added**: Token handling (Authorization header or tenant tokens)
- **Added**: Environment support (`?environment=production` or `sandbox`)

#### 2. New Validation Flow
- **Required**: `buyerNTNCNIC` and `buyerProvince`
- **Optional**: `buyerBusinessName` and `buyerAddress`
- **Automatic**: `buyerRegistrationType` fetched from FBR

### Frontend Changes

#### 1. Updated BuyerModal (`Fbr-Frontend-tenant/src/component/BuyerModal.jsx`)
- **Removed**: Manual Registration Type dropdown
- **Removed**: Frontend FBR validation logic
- **Added**: Helper text indicating automatic FBR lookup
- **Simplified**: Form now only requires NTN/CNIC, Business Name, Province, and Address

#### 2. Updated RegisterUser Page (`Fbr-Frontend-tenant/src/pages/RegisterUser.jsx`)
- **Removed**: Manual Registration Type dropdown
- **Removed**: Frontend FBR validation logic
- **Consistent**: Same simplified form as BuyerModal

#### 3. Cleaned Up FBRService (`Fbr-Frontend-tenant/src/API/FBRService.js`)
- **Removed**: Unused `checkRegistrationStatus` and `validateRegistrationStatus` functions
- **Kept**: File structure for future FBR-related functionality

## How It Works

### 1. Client Request
```bash
POST /api/tenant/:tenantId/buyers?environment=production
Authorization: Bearer YOUR_FBR_TOKEN
Content-Type: application/json

{
  "buyerNTNCNIC": "4220181848433",
  "buyerBusinessName": "Test Company",
  "buyerProvince": "Punjab",
  "buyerAddress": "Test Address"
}
```

### 2. Backend Processing
1. **Validate**: Check required fields (NTN/CNIC, Province)
2. **Check Duplicates**: Ensure NTN/CNIC doesn't already exist
3. **Fetch Token**: Use Authorization header or tenant's stored token
4. **Call FBR**: POST to `https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type`
   ```json
   {
     "Registration_No": "4220181848433"
   }
   ```
5. **Process Response**: Extract `REGISTRATION_TYPE` from FBR response
6. **Save Buyer**: Create buyer record with fetched registration type

### 3. FBR Response Handling
```json
{
  "statuscode": "00",
  "REGISTRATION_NO": "4220181848433",
  "REGISTRATION_TYPE": "Registered"
}
```

- **Success** (`statuscode: "00"`): Save buyer with `REGISTRATION_TYPE`
- **Failure**: Return HTTP 400 with FBR response details
- **Network Error**: Return HTTP 502 with error details

## API Usage Examples

### Using Authorization Header Token
```bash
curl --location --request POST 'http://localhost:3000/api/tenant/1/buyers?environment=production' \
--header 'Authorization: Bearer 6963a140-35f9-3f92-9100-20453a885a9e' \
--header 'Content-Type: application/json' \
--data '{
  "buyerNTNCNIC": "4220181848433",
  "buyerBusinessName": "Test Company",
  "buyerProvince": "Punjab",
  "buyerAddress": "Test Address"
}'
```

### Using Tenant Stored Token (Fallback)
```bash
curl --location --request POST 'http://localhost:3000/api/tenant/1/buyers?environment=sandbox' \
--header 'Content-Type: application/json' \
--data '{
  "buyerNTNCNIC": "4220181848433",
  "buyerBusinessName": "Test Company",
  "buyerProvince": "Punjab",
  "buyerAddress": "Test Address"
}'
```

## Error Handling

### 1. Missing Required Fields
```json
{
  "success": false,
  "message": "Buyer province and NTN/CNIC are required"
}
```

### 2. Duplicate NTN/CNIC
```json
{
  "success": false,
  "message": "Buyer with NTN/CNIC \"4220181848433\" already exists. Please use a different NTN/CNIC or update the existing buyer."
}
```

### 3. Missing Authorization Token
```json
{
  "success": false,
  "message": "Authorization token required to fetch registration type from FBR"
}
```

### 4. FBR API Error
```json
{
  "success": false,
  "message": "Failed to fetch registration type from FBR",
  "fbrResponse": {
    "statuscode": "01",
    "message": "Invalid registration number"
  }
}
```

### 5. Network Error
```json
{
  "success": false,
  "message": "Error calling FBR Get_Reg_Type API",
  "error": "Network timeout"
}
```

## Testing

### Run Test Script
```bash
cd Fbr-backend-tenant
node test-buyer-registration-type.js
```

**Before running:**
1. Replace `YOUR_TEST_TOKEN_HERE` with actual FBR token
2. Ensure server is running on correct port
3. Verify tenant ID 1 exists in your system

### Manual Testing
1. Open buyer creation form in frontend
2. Enter NTN/CNIC: `4220181848433`
3. Fill other required fields
4. Submit form
5. Verify registration type is automatically populated

## Benefits

1. **Accuracy**: Registration type is always correct (fetched from FBR)
2. **Simplicity**: No manual selection required
3. **Consistency**: All buyers have verified registration types
4. **Efficiency**: Single API call handles both creation and validation
5. **Reliability**: Backend handles all FBR communication

## Migration Notes

### For Existing Systems
- Existing buyers retain their manually entered registration types
- New buyers will have automatically fetched registration types
- No database migration required

### For Frontend Integration
- Remove any manual registration type dropdowns
- Update forms to only require NTN/CNIC, Business Name, Province, and Address
- Remove frontend FBR validation logic
- Update error handling to expect backend FBR errors

## Future Enhancements

1. **Caching**: Cache FBR responses to reduce API calls
2. **Batch Processing**: Support bulk buyer creation with FBR validation
3. **Retry Logic**: Implement retry mechanism for failed FBR calls
4. **Audit Trail**: Log FBR API calls and responses for debugging
5. **Fallback Options**: Provide manual override for FBR API failures
