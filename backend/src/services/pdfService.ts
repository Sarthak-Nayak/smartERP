import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface SalesVoucherLine {
  stockItem: {
    name: string;
    sku: string;
    unit: string;
  };
  quantity: any;
  rate: any;
  lineTotal: any;
}

interface SalesVoucherWithCustomer {
  voucherNo: string;
  invoiceNo: string;
  date: Date;
  grandTotal: any;
  customer: {
    name: string;
    mobile: string | null;
    address: string | null;
  };
  lines: SalesVoucherLine[];
}

export function generateInvoicePDF(voucher: SalesVoucherWithCustomer, res: Response): void {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to the express response
  doc.pipe(res);

  // Colors
  const primaryColor = '#1e293b'; // slate-800
  const secondaryColor = '#475569'; // slate-600
  const accentColor = '#0f172a'; // slate-900

  // Title & Header
  doc.fillColor(accentColor)
     .font('Helvetica-Bold')
     .fontSize(20)
     .text('SmartERP Billing System', 50, 50);

  doc.fillColor(secondaryColor)
     .font('Helvetica')
     .fontSize(10)
     .text('Tax Invoice / Bill of Sale', 50, 75);

  // Horizontal line
  doc.moveTo(50, 95).lineTo(550, 95).strokeColor('#e2e8f0').stroke();

  // Invoice Meta Info (Right side)
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('INVOICE DETAILS', 380, 110);
  
  doc.font('Helvetica')
     .text(`Invoice No: ${voucher.invoiceNo}`, 380, 125)
     .text(`Voucher No: ${voucher.voucherNo}`, 380, 140)
     .text(`Date: ${new Date(voucher.date).toLocaleDateString()}`, 380, 155);

  // Customer Info (Left side)
  doc.font('Helvetica-Bold')
     .text('BILL TO:', 50, 110);

  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text(voucher.customer.name, 50, 125);

  doc.font('Helvetica')
     .fontSize(10)
     .text(`Mobile: ${voucher.customer.mobile || 'N/A'}`, 50, 140)
     .text(`Address: ${voucher.customer.address || 'N/A'}`, 50, 155);

  // Line Spacer
  doc.moveTo(50, 185).lineTo(550, 185).strokeColor('#e2e8f0').stroke();

  // Table Headers
  const tableTop = 200;
  doc.font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('Sl.', 50, tableTop)
     .text('Item Description', 80, tableTop)
     .text('SKU', 250, tableTop)
     .text('Qty', 350, tableTop, { width: 50, align: 'right' })
     .text('Rate', 410, tableTop, { width: 60, align: 'right' })
     .text('Total', 480, tableTop, { width: 70, align: 'right' });

  // Border below table header
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#cbd5e1').stroke();

  let y = tableTop + 25;
  doc.font('Helvetica').fillColor('#334155');

  voucher.lines.forEach((line, index) => {
    // Page overflow handling (rudimentary check, margin 50)
    if (y > 700) {
      doc.addPage();
      y = 50;
      doc.font('Helvetica-Bold')
         .text('Item Description (cont.)', 80, y)
         .text('Qty', 350, y, { width: 50, align: 'right' })
         .text('Rate', 410, y, { width: 60, align: 'right' })
         .text('Total', 480, y, { width: 70, align: 'right' });
      doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#cbd5e1').stroke();
      y += 25;
      doc.font('Helvetica');
    }

    doc.text(`${index + 1}`, 50, y)
       .text(line.stockItem.name, 80, y, { width: 160 })
       .text(line.stockItem.sku, 250, y)
       .text(`${line.quantity} ${line.stockItem.unit}`, 350, y, { width: 50, align: 'right' })
       .text(Number(line.rate).toFixed(2), 410, y, { width: 60, align: 'right' })
       .text(Number(line.lineTotal).toFixed(2), 480, y, { width: 70, align: 'right' });

    y += 25;
  });

  // Table Footer Line
  doc.moveTo(50, y).lineTo(550, y).strokeColor('#cbd5e1').stroke();

  y += 15;

  // Grand Total Box
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .fillColor(accentColor)
     .text('Grand Total:', 350, y, { width: 120, align: 'right' })
     .text(`$${Number(voucher.grandTotal).toFixed(2)}`, 480, y, { width: 70, align: 'right' });

  // Thank you message
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(secondaryColor)
     .text('Thank you for your business!', 50, y + 50, { align: 'center' });

  doc.end();
}
