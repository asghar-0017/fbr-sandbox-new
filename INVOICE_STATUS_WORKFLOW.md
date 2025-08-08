# Invoice Status Workflow

## Overview
The invoice system supports a comprehensive status workflow that tracks the lifecycle of invoices from creation to final submission to FBR.

## Status Values

### 1. **draft** (Default)
- **When**: Invoice is first created or saved without validation
- **Description**: Initial state for new invoices
- **Actions Allowed**: Edit, save, validate, delete
- **Invoice Number**: Auto-generated with `DRAFT_` prefix

### 2. **saved**
- **When**: User saves invoice without validation
- **Description**: Invoice is saved but not yet validated
- **Actions Allowed**: Edit, validate, delete
- **Invoice Number**: Auto-generated with `SAVED_` prefix

### 3. **validated**
- **When**: User saves and validates invoice
- **Description**: Invoice has passed basic validation checks
- **Actions Allowed**: Submit to FBR, edit, delete
- **Invoice Number**: Auto-generated with `SAVED_` prefix

### 4. **submitted**
- **When**: Invoice has been submitted to FBR but not yet confirmed
- **Description**: Intermediate state during FBR submission
- **Actions Allowed**: Check status, view details
- **Invoice Number**: Assigned by user or system

### 5. **posted**
- **When**: Invoice has been successfully submitted to FBR
- **Description**: Final state - invoice is live in FBR system
- **Actions Allowed**: View, print, download
- **Invoice Number**: FBR-assigned invoice number stored in `fbr_invoice_number`

## Workflow Actions

### Create Invoice
```javascript
// Creates invoice with 'draft' status
POST /api/invoices
{
  "status": "draft", // Optional, defaults to 'draft'
  // ... other invoice data
}
```

### Save Invoice
```javascript
// Saves invoice as draft
POST /api/invoices/save
{
  // ... invoice data
}
// Status: 'draft'
```

### Save and Validate
```javascript
// Saves and validates invoice
POST /api/invoices/save-and-validate
{
  // ... invoice data
}
// Status: 'validated'
```

### Submit to FBR
```javascript
// Submits validated invoice to FBR
POST /api/invoices/submit-saved
{
  "id": invoice_id
}
// Status: 'posted' (if successful)
```

## Database Schema

### Status Column
```sql
ALTER TABLE invoices MODIFY COLUMN status 
ENUM('draft', 'saved', 'validated', 'submitted', 'posted') 
NOT NULL DEFAULT 'draft';
```

### FBR Invoice Number
```sql
ALTER TABLE invoices ADD COLUMN fbr_invoice_number VARCHAR(100) NULL;
```

## Recent Fix

### Issue
The database schema was missing the 'posted' status value, causing errors when trying to update invoice status after successful FBR submission.

### Solution
1. **Migration Script**: Created `update-status-enum-to-include-posted.js`
2. **Database Update**: Updated all tenant databases to include 'posted' in the status ENUM
3. **Model Verification**: Confirmed Invoice model already had correct ENUM definition

### Migration Commands
```bash
# Run the migration to add 'posted' status
node update-status-enum-to-include-posted.js

# Or run the updated original migration
node add-status-field-to-invoices.js
```

## Frontend Integration

### Status Display
- **Draft**: Gray badge, editable
- **Saved**: Blue badge, editable
- **Validated**: Yellow badge, ready for submission
- **Submitted**: Orange badge, processing
- **Posted**: Green badge, final state

### Status Transitions
1. **Create** → Draft
2. **Save** → Draft
3. **Save & Validate** → Validated
4. **Submit to FBR** → Posted

## Error Handling

### Common Issues
1. **Status Truncation**: Fixed by updating ENUM definition
2. **Invalid Status**: Validated against allowed values
3. **Missing Invoice Number**: Required for posted/submitted status

### Validation Rules
- Only draft invoices can be edited
- Only validated invoices can be submitted to FBR
- Posted invoices cannot be modified
- Invoice number required for posted/submitted status

## API Endpoints

| Endpoint | Method | Description | Status Change |
|----------|--------|-------------|---------------|
| `/api/invoices` | POST | Create invoice | → draft |
| `/api/invoices/save` | POST | Save as draft | → draft |
| `/api/invoices/save-and-validate` | POST | Save and validate | → validated |
| `/api/invoices/submit-saved` | POST | Submit to FBR | → posted |

## Testing

### Test Scripts
- `test-invoice-status.js`: Tests status field functionality
- `test-invoice-fixes.js`: Tests invoice creation and updates
- `test-print-invoice.js`: Tests invoice printing

### Manual Testing
1. Create new invoice → Should be 'draft'
2. Save invoice → Should remain 'draft'
3. Save and validate → Should be 'validated'
4. Submit to FBR → Should be 'posted'
5. Verify FBR invoice number is stored
