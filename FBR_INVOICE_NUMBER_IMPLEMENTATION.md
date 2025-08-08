# FBR Invoice Number Implementation

## Overview
This document explains how the FBR invoice number is being saved and displayed in the system when an invoice is submitted to the FBR API.

## Current Implementation Status

### ✅ Backend Implementation (Already Complete)
The backend already correctly handles FBR invoice numbers:

1. **FBR Response Processing** (`submitSavedInvoice` function):
   - Extracts `invoiceNumber` from FBR response: `postRes.data.invoiceNumber`
   - Validates success using `validationResponse.statusCode === "00"`
   - Saves to `fbr_invoice_number` field in database
   - Updates invoice status to 'posted'

2. **Database Schema**:
   - `Invoice` model has `fbr_invoice_number` field (VARCHAR(100))
   - Field is nullable to handle draft invoices

3. **Invoice Display Logic** (`getAllInvoices` function):
   - Prioritizes FBR invoice number: `fbr_invoice_number || invoice_number`
   - Returns as `invoiceNumber` in API response

### ✅ Recent Improvements Made

#### 1. Enhanced Search Functionality
**File**: `src/controller/mysql/invoiceController.js`
**Lines**: 465-472

**Before**:
```javascript
whereClause[req.tenantDb.Sequelize.Op.or] = [
  { invoice_number: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
  { buyerBusinessName: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
  { sellerBusinessName: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } }
];
```

**After**:
```javascript
whereClause[req.tenantDb.Sequelize.Op.or] = [
  { invoice_number: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
  { fbr_invoice_number: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
  { buyerBusinessName: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
  { sellerBusinessName: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } }
];
```

#### 2. Enhanced Frontend Display
**File**: `Fbr-Frontend-tenant/src/component/BasicComponent.jsx`
**Lines**: 420-430

**Before**:
```jsx
<TableCell component="th" scope="row" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 15 }}>
  {row.invoiceNumber}
</TableCell>
```

**After**:
```jsx
<TableCell component="th" scope="row" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 15 }}>
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2' }}>
      {row.invoiceNumber}
    </Typography>
    {row.fbr_invoice_number && row.fbr_invoice_number !== row.invoiceNumber && (
      <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
        FBR: {row.fbr_invoice_number}
      </Typography>
    )}
  </Box>
</TableCell>
```

#### 3. Updated Search Placeholder
**File**: `Fbr-Frontend-tenant/src/component/BasicComponent.jsx`
**Line**: 315

**Before**: `"Search by Invoice # or Buyer NTN"`
**After**: `"Search by Invoice #, FBR #, or Buyer NTN"`

#### 4. Enhanced Debugging
Added comprehensive logging to track FBR response processing and database updates.

## FBR API Response Structure
The system handles this response structure:

```json
{
    "invoiceNumber": "6386420DI1754587489984",
    "dated": "2025-08-07 22:24:49",
    "validationResponse": {
        "statusCode": "00",
        "status": "Valid",
        "error": "",
        "invoiceStatuses": [
            {
                "itemSNo": "1",
                "statusCode": "00",
                "status": "Valid",
                "invoiceNo": "6386420DI1754587489984-1",
                "errorCode": "",
                "error": ""
            }
        ]
    }
}
```

## How It Works

### 1. Invoice Submission Flow
1. User submits invoice to FBR via `POST /tenant/{tenant_id}/invoices/{id}/submit`
2. Backend calls FBR API: `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb`
3. FBR returns response with `invoiceNumber`
4. Backend extracts and saves `invoiceNumber` to `fbr_invoice_number` field
5. Invoice status updated to 'posted'

### 2. Display Logic
1. Frontend fetches invoices via `GET /tenant/{tenant_id}/invoices`
2. Backend prioritizes `fbr_invoice_number` over `invoice_number`
3. Frontend displays FBR number as primary, shows original number as secondary if different

### 3. Search Functionality
Users can now search by:
- Original invoice number
- FBR invoice number
- Buyer business name
- Seller business name

## Testing

### Test Script
Created `test-fbr-invoice-number.js` to verify functionality:
- Shows current invoice numbers
- Tests FBR submission
- Verifies FBR numbers are saved
- Tests search functionality

### Manual Testing Steps
1. Create a draft invoice
2. Submit to FBR (requires valid credentials)
3. Check that FBR invoice number appears in the table
4. Test search functionality with FBR number
5. Verify both original and FBR numbers are displayed

## Expected Behavior

### Before FBR Submission
- Invoice shows internal number (e.g., `DRAFT_1754670799793_jc7zp4nyf`)
- Status: "Draft"

### After FBR Submission
- Invoice shows FBR number (e.g., `6386420DI1754587489984`)
- Original number shown as secondary if different
- Status: "Posted"
- Searchable by FBR number

## Troubleshooting

### If FBR Numbers Not Appearing
1. Check backend logs for FBR response processing
2. Verify FBR credentials are valid
3. Check database for `fbr_invoice_number` field values
4. Ensure invoice status is 'posted'

### If Search Not Working
1. Verify search includes `fbr_invoice_number` field
2. Check database indexes on search fields
3. Test with exact FBR number match

## Files Modified
- `src/controller/mysql/invoiceController.js` - Enhanced search and debugging
- `Fbr-Frontend-tenant/src/component/BasicComponent.jsx` - Improved display and search
- `test-fbr-invoice-number.js` - New test script

## Next Steps
1. Test the implementation with real FBR credentials
2. Monitor logs for any issues
3. Consider adding FBR number validation
4. Add export functionality for FBR numbers
