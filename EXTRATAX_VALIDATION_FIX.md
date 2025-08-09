# ExtraTax Validation Fix

## Problem
The FBR API was returning an error: "Decimal value is not valid at item 1 for ExtraTax" when submitting invoices. This was caused by invalid decimal values being sent to FBR for the ExtraTax field.

## Root Cause
The ExtraTax field was being converted using `Number(rest.extraTax) || 0` which could result in:
- `NaN` values when the input was invalid
- Invalid decimal formats
- Negative values being sent to FBR

## Solution

### Frontend Fixes

#### 1. Enhanced Validation Function
Added a robust `safeExtraTaxConversion` function in both `createInvoiceForm.jsx` and `productionForm.jsx`:

```javascript
const safeExtraTaxConversion = (extraTaxValue) => {
  if (extraTaxValue === null || extraTaxValue === undefined || extraTaxValue === "") {
    return 0;
  }
  
  // Convert to string and trim
  const strValue = String(extraTaxValue).trim();
  if (strValue === "") {
    return 0;
  }
  
  // Check for valid decimal number pattern (only digits, one decimal point, no negative)
  if (!/^\d*\.?\d*$/.test(strValue) || strValue.startsWith('.') || strValue.endsWith('.')) {
    return 0;
  }
  
  const parsedValue = parseFloat(strValue);
  if (isNaN(parsedValue) || !isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }
  
  return Number(parsedValue.toFixed(2));
};
```

#### 2. Updated All ExtraTax Conversions
Replaced all instances of `Number(rest.extraTax) || 0` with `safeExtraTaxConversion(rest.extraTax)` in:
- `handleSave` function
- `handleSaveAndValidate` function  
- `handleSubmitChange` function

### Backend Fixes

#### 1. Enhanced ExtraTax Validation
Updated the ExtraTax handling in `invoiceController.js` to include better validation:

```javascript
// Only include extraTax when it's a valid positive value
const extraTaxValue = cleanNumericValue(item.extraTax);
if (extraTaxValue !== null && isFinite(Number(extraTaxValue)) && Number(extraTaxValue) > 0) {
  mappedItem.extraTax = Number(parseFloat(extraTaxValue).toFixed(2));
}
```

#### 2. Improved FBR Data Preparation
Enhanced the ExtraTax handling in the `submitSavedInvoice` function:

```javascript
// Align with validation behavior: include extraTax for non-reduced sale types, even when 0
const extraTaxValue = cleanNumericValue(item.extraTax);
const isReduced = (cleanValue(item.saleType) || '').trim() === 'Goods at Reduced Rate';
if (!isReduced && extraTaxValue !== null && isFinite(Number(extraTaxValue)) && Number(extraTaxValue) >= 0) {
  baseItem.extraTax = Number(parseFloat(extraTaxValue).toFixed(2));
} else if (!isReduced) {
  // Ensure extraTax is 0 for non-reduced sale types when invalid or negative
  baseItem.extraTax = 0;
}
```

## Validation Rules

The new validation ensures that ExtraTax:
1. **Cannot be negative** - automatically converts to 0
2. **Must be a valid decimal** - rejects invalid strings, NaN, Infinity
3. **Must have proper decimal format** - rejects multiple decimal points, leading/trailing decimal points
4. **Is properly rounded** - always returns a number with max 2 decimal places
5. **Handles edge cases** - null, undefined, empty strings all become 0

## Files Modified

### Frontend
- `Fbr-Frontend-tenant/src/pages/createInvoiceForm.jsx`
- `Fbr-Frontend-tenant/src/pages/productionForm.jsx`

### Backend  
- `Fbr-backend-tenant/src/controller/mysql/invoiceController.js`

## Testing

The validation function was thoroughly tested with various edge cases:
- Empty strings, null, undefined → 0
- Valid numbers → properly formatted decimals
- Invalid strings → 0
- Negative numbers → 0
- Multiple decimal points → 0
- Leading/trailing decimal points → 0

## Result

This fix ensures that:
1. **No invalid decimal values** are sent to FBR
2. **Consistent behavior** across frontend and backend
3. **Proper error handling** for edge cases
4. **FBR API compatibility** with valid decimal formats

The "Decimal value is not valid at item 1 for ExtraTax" error should now be resolved.
