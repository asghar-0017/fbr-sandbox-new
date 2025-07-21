import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import Invoice from "../../model/invoiceCreationResponse/index.js";
import numberToWords from 'number-to-words';

const { toWords } = numberToWords;

const invoiceController = {
  // ✅ CREATE INVOICE
  createInvoice: async (req, res) => {
    try {
      const invoiceData = req.body;
      const savedInvoiceData = new Invoice(invoiceData);
      await savedInvoiceData.save();

      res.status(201).json({
        message: "Data Saved Successfully",
        data: savedInvoiceData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  },

 printInvoice: async (req, res) => {
    try {
      const invoiceId = req.params.id;
      const invoice = await Invoice.findOne({ invoiceNumber: invoiceId });
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Base64 encode logo
      const logoPath = path.join(process.cwd(), 'public', 'fbr_logo.png');
      const fbrLogoBase64 = fs.readFileSync(logoPath).toString('base64');

      // Generate QR Code data
      const pdfFileName = `${invoice.invoiceNumber}.pdf`;
      const pdfPath = path.join(process.cwd(), 'public', 'invoices', pdfFileName);

      // Add new variable for company logo
      const companyLogoPath = path.join(process.cwd(), 'public', 'fbr-logo-1.png');
      const companyLogoBase64 = fs.readFileSync(companyLogoPath).toString('base64');
      
      const qrUrl = `http://localhost:5173/invoices/${pdfFileName}`;
const qrData = await QRCode.toDataURL(qrUrl, {
  errorCorrectionLevel: 'M',
  width: 96 // ~1 inch at 96 DPI
});


      // Render HTML from EJS template
      const html = await ejs.renderFile(
  path.join(process.cwd(), 'src', 'views', 'invoiceTemplate.ejs'),
  {
    invoice,
    qrData,
    fbrLogoBase64,
    companyLogoBase64,
    convertToWords: (amount) => {
      const words = toWords(Math.floor(amount));
      return words.charAt(0).toUpperCase() + words.slice(1);
    }
  }
);


      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
      await browser.close();

      // Return the PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=${pdfFileName}`);
      fs.createReadStream(pdfPath).pipe(res);

    } catch (error) {
      console.error('PDF generation failed:', error);
      res.status(500).json({
        message: 'Error generating invoice',
        error: error.message
      });
    }
  },
  getAllInvoicesdata:async(req,res)=>{
    try{
        const data = await Invoice.find()
        if(!data){
            return res.status(404).send({message:"Data not found"})
        }
        return res.status(200).send({message:"Fetch data Successfully",data:data})
    }catch(error){
        res.status(500).json({message:"Internal Server Error",error:error.message})

    }
  },
//   getAllInvoicesdata: async (req, res) => {
//   try {
//     let { page = 1, limit = 10, search } = req.query;
//     page = Math.max(Number(page), 1);
//     limit = Math.max(Number(limit), 1);

//     const query = {};
  

//     const total = await Invoice.countDocuments(query);
//     const data = await Invoice.find(query)
//       .sort({ invoiceDate: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit);

//     res.status(200).json({
//       message: "Fetch data Successfully",
//       data,
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// },
  getinvoiceData:async(req,res)=>{
    try{
        const invoiceId=req.params.id
        const data = await Invoice.findOne({invoiceNumber:invoiceId});
        if(!data){
            return res.status(404).send({message:"Data not found"})
        }
        return res.status(200).send({message:"Fetch data Successfully",data:data})
    }catch(error){
        res.status(500).json({message:"Internal Server Error",error:error.message})

    }
  }
};

export default invoiceController;
