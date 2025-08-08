import axios from 'axios';

const testPrintInvoice = async () => {
  try {
    // Test with a sample invoice number
    const invoiceNumber = '6386420DI1754579228653';
    const url = `http://localhost:5150/api/print-invoice/${invoiceNumber}`;
    
    console.log(`Testing print-invoice endpoint: ${url}`);
    
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000
    });
    
    console.log('✅ Print invoice endpoint is working!');
    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    
    // Save the PDF to a file for testing
    const fs = await import('fs');
    const writer = fs.createWriteStream(`test-invoice-${invoiceNumber}.pdf`);
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log(`✅ PDF saved as test-invoice-${invoiceNumber}.pdf`);
    });
    
  } catch (error) {
    console.error('❌ Error testing print-invoice endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testPrintInvoice();
