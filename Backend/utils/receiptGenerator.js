// utils/receiptGenerator.js
import PDFDocument from 'pdfkit';

export const generateReceiptPDF = (sale, store) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).font('Helvetica-Bold')
         .text(store.name, { align: 'center' });
      doc.fontSize(10).font('Helvetica')
         .text(store.address.street, { align: 'center' });
      doc.text(`${store.address.city}, ${store.address.state} ${store.address.zipCode}`, { align: 'center' });
      doc.text(`Phone: ${store.phone}`, { align: 'center' });
      
      // Separator
      doc.moveDown().text('-' .repeat(50), { align: 'center' }).moveDown();

      // Sale Information
      doc.fontSize(12);
      doc.text(`Receipt #: ${sale.saleNumber}`);
      doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`);
      doc.text(`Cashier: ${sale.cashier.name}`);
      
      doc.moveDown();

      // Items Table Header
      doc.font('Helvetica-Bold');
      const tableTop = doc.y;
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Price', 300, tableTop);
      doc.text('Total', 350, tableTop);
      
      doc.moveDown();
      doc.font('Helvetica');

      // Items
      let yPos = doc.y;
      sale.items.forEach(item => {
        doc.text(item.product.name, 50, yPos, { width: 190 });
        doc.text(item.quantity.toString(), 250, yPos);
        doc.text(`$${item.price.toFixed(2)}`, 300, yPos);
        doc.text(`$${item.total.toFixed(2)}`, 350, yPos);
        yPos += 20;
      });

      doc.y = yPos + 20;

      // Totals
      doc.text(`Subtotal: $${sale.subtotal.toFixed(2)}`, { align: 'right' });
      doc.text(`Tax (${store.taxRate}%): $${sale.tax.toFixed(2)}`, { align: 'right' });
      doc.font('Helvetica-Bold')
         .text(`Total: $${sale.total.toFixed(2)}`, { align: 'right' })
         .font('Helvetica');
      doc.text(`Paid: $${sale.amountPaid.toFixed(2)}`, { align: 'right' });
      doc.text(`Change: $${sale.change.toFixed(2)}`, { align: 'right' });

      // Footer
      doc.moveDown(2);
      doc.text('Thank you for your business!', { align: 'center' });
      doc.text('Please keep this receipt for your records', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const generateSimpleReceipt = (sale, store) => {
  let receipt = `
${store.name}
${store.address.street}
${store.address.city}, ${store.address.state} ${store.address.zipCode}
Phone: ${store.phone}

Date: ${new Date(sale.createdAt).toLocaleString()}
Receipt #: ${sale.saleNumber}
Cashier: ${sale.cashier.name}

${'-'.repeat(40)}

ITEMS:
`;

  sale.items.forEach(item => {
    receipt += `
${item.product.name}
  ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`;
  });

  receipt += `

${'-'.repeat(40)}
Subtotal: $${sale.subtotal.toFixed(2)}
Tax: $${sale.tax.toFixed(2)}
TOTAL: $${sale.total.toFixed(2)}

Paid: $${sale.amountPaid.toFixed(2)}
Change: $${sale.change.toFixed(2)}

Thank you for your business!
`;

  return receipt;
};