# System Invoice ID Implementation

## Overview
This document describes the implementation of system-generated invoice IDs with the format `INV-0001` for the FBR Invoice System.

## Features
- **Automatic ID Generation**: Every new invoice gets a unique system-generated ID
- **Sequential Numbering**: IDs follow the pattern `INV-0001`, `INV-0002`, `INV-0003`, etc.
- **Per-Tenant Sequence**: Each tenant has its own independent sequence counter
- **Frontend Display**: System IDs are prominently displayed in the "Your Invoices" table
- **Database Migration**: Existing invoices are automatically assigned system IDs

## Implementation Details

### Backend Changes

#### 1. Database Schema
Added new field to the Invoice model:
```javascript
system_invoice_id: {
  type: DataTypes.STRING(20),
  allowNull: true,
  unique: true
}
```

#### 2. ID Generation Logic
```javascript
const generateSystemInvoiceId = async (Invoice) => {
  // Get the highest existing system invoice ID
  const lastInvoice = await Invoice.findOne({
    where: {
      system_invoice_id: {
        [Invoice.sequelize.Sequelize.Op.like]: 'INV-%'
      }
    },
    order: [['system_invoice_id', 'DESC']],
    attributes: ['system_invoice_id']
  });

  let nextNumber = 1;
  if (lastInvoice && lastInvoice.system_invoice_id) {
    const match = lastInvoice.system_invoice_id.match(/INV-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `INV-${nextNumber.toString().padStart(4, '0')}`;
};
```

#### 3. Controller Updates
Updated all invoice creation endpoints to generate and include system invoice IDs:
- `createInvoice()`
- `saveInvoice()`
- `saveAndValidateInvoice()`
- `getAllInvoices()` (includes system ID in response)
- `getInvoiceById()` (includes system ID in response)

### Frontend Changes

#### 1. Invoice Table Display
Updated `BasicComponent.jsx` to display the system invoice ID as the first column:
- Added "System ID" column header
- Added system ID cell with blue styling for better visibility
- Displays "N/A" for invoices without system IDs (backward compatibility)

#### 2. Visual Styling
```javascript
<TableCell
  sx={{
    fontWeight: 700,
    fontSize: 13,
    color: "#1976d2"  // Blue color for system IDs
  }}
>
  {row.systemInvoiceId || "N/A"}
</TableCell>
```

## Migration Support

### Database Migration Script
`add-system-invoice-id-field.js` automatically:
1. Adds the `system_invoice_id` column to all tenant databases
2. Generates sequential system IDs for existing invoices
3. Handles multiple tenant databases safely

### Usage
```bash
node add-system-invoice-id-field.js
```

## Testing

### Test Script
`test-system-invoice-id.js` verifies:
1. System ID generation logic
2. Sequential numbering
3. Pattern validation
4. Existing invoice analysis

### Usage
```bash
node test-system-invoice-id.js
```

## API Response Examples

### Create Invoice Response
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoice_id": 123,
    "invoice_number": "DRAFT_1703123456789_abc123def",
    "system_invoice_id": "INV-0001",
    "status": "draft"
  }
}
```

### Get Invoices Response
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 123,
        "invoiceNumber": "DRAFT_1703123456789_abc123def",
        "systemInvoiceId": "INV-0001",
        "invoiceType": "Sale Invoice",
        "status": "draft",
        // ... other fields
      }
    ]
  }
}
```

## Benefits

1. **User-Friendly**: Simple, memorable format (`INV-0001`)
2. **Sequential**: Easy to track and reference
3. **Unique**: Guaranteed uniqueness per tenant
4. **Persistent**: System ID remains constant throughout invoice lifecycle
5. **Backward Compatible**: Existing functionality remains unchanged

## Technical Notes

- System IDs are generated at invoice creation time
- Each tenant maintains its own sequence counter
- The format is fixed: `INV-` followed by 4-digit zero-padded number
- Maximum supported invoices per tenant: 9,999 (can be extended if needed)
- System IDs are separate from FBR invoice numbers and draft numbers

## Future Enhancements

1. **Configurable Format**: Allow tenants to customize the prefix
2. **Bulk Import**: Handle system ID assignment for bulk invoice imports
3. **Search Enhancement**: Enable search by system invoice ID
4. **Reporting**: Include system IDs in reports and exports
