# Invoice Number Fix Summary

## Problem
When invoices were created, they were assigned a `DRAFT_` prefix in the `invoice_number` field. Even after being successfully submitted to FBR and getting an official FBR invoice number, the `DRAFT_` prefix remained in the `invoice_number` field, causing confusion in the UI.

## Solution
Modified the `submitSavedInvoice` function in `src/controller/mysql/invoiceController.js` to update the `invoice_number` field with the FBR-generated number when an invoice is successfully posted to FBR.

## Changes Made

### Backend Changes

1. **Updated `submitSavedInvoice` function** (`src/controller/mysql/invoiceController.js`):
   - When an invoice is successfully submitted to FBR, the `invoice_number` field is now updated with the FBR-generated number
   - This replaces the `DRAFT_` prefix with the official FBR invoice number
   - Added documentation comment explaining the behavior

2. **Updated invoice template** (`src/views/invoiceTemplate.ejs`):
   - Added conditional display of FBR invoice number if it differs from the main invoice number
   - This provides additional tracking information when needed

### Frontend Changes

1. **Updated invoice view modal** (`src/component/InvoiceViewModal.jsx`):
   - Added conditional display of FBR invoice number if it differs from the main invoice number
   - Shows both numbers for better tracking when they're different

## How It Works

### Before the Fix
1. Invoice created → `invoice_number` = `DRAFT_1234567890_abc123`
2. Invoice submitted to FBR → `fbr_invoice_number` = `FBR123456789`
3. Invoice status updated to 'posted'
4. **Problem**: `invoice_number` still shows `DRAFT_1234567890_abc123` in UI

### After the Fix
1. Invoice created → `invoice_number` = `DRAFT_1234567890_abc123`
2. Invoice submitted to FBR → `fbr_invoice_number` = `FBR123456789`
3. Invoice status updated to 'posted'
4. **Fixed**: `invoice_number` is updated to `FBR123456789`
5. UI now shows the official FBR invoice number instead of the draft number

## Benefits

1. **Clear Invoice Numbers**: Posted invoices now show official FBR numbers instead of draft numbers
2. **Better User Experience**: Users can easily identify official invoices vs drafts
3. **Consistent Display**: All parts of the system (table, modal, print) show the same invoice number
4. **Backward Compatibility**: Existing functionality remains unchanged
5. **Tracking**: FBR number is still stored separately for reference if needed

## Testing

A test script `test-invoice-number-fix.js` has been created to verify:
- Current state of invoices in all tenant databases
- Whether posted invoices have proper numbers (no DRAFT prefix)
- Whether FBR numbers are properly stored

## Files Modified

- `src/controller/mysql/invoiceController.js` - Main fix
- `src/views/invoiceTemplate.ejs` - Template enhancement
- `src/component/InvoiceViewModal.jsx` - UI enhancement
- `test-invoice-number-fix.js` - Test script (new)

## Notes

- This fix only affects invoices that are successfully submitted to FBR
- Draft invoices will continue to show `DRAFT_` prefix until submitted
- The `fbr_invoice_number` field is still maintained for additional tracking
- No database migrations are required as the existing schema supports this change
