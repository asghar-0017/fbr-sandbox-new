import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import pdf from 'html-pdf';
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
        const incoiceId=req.params.id
      const invoice = await Invoice.findOne({invoiceNumber:incoiceId});
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const logoPath = path.join(process.cwd(), 'public', 'fbr_logo.png');
      const logoBase64 = fs.readFileSync(logoPath).toString('base64');

      const pdfFileName = `${invoice.invoiceNumber}.pdf`;
      const pdfPath = path.join(process.cwd(), 'public', 'invoices', pdfFileName);
      const qrUrl = `http://45.55.137.96:5150/invoices/${pdfFileName}`;
      const qrData = await QRCode.toDataURL(qrUrl);

      const html = await ejs.renderFile(
        path.join(process.cwd(), 'src', 'views', 'invoiceTemplate.ejs'),
        {
          invoice,
          qrData,
          logoBase64,
          convertToWords: (amount) => {
            const words = toWords(Math.floor(amount));
            return words.charAt(0).toUpperCase() + words.slice(1);
          }
        }
      );

      pdf.create(html, { format: 'A4' }).toFile(pdfPath, (err, result) => {
        if (err) return res.status(500).send('PDF generation error');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${pdfFileName}`);
        fs.createReadStream(pdfPath).pipe(res);
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error generating invoice',
        error: error.message,
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
