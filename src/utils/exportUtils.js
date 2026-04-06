import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min';
import { formatCurrency, formatDate, getStorageName } from './calculations';

/**
 * Export ledger to Excel
 * @param {string} farmerName - Name of farmer
 * @param {string} seasonName - Name of season
 * @param {Array} transactions - Array of transactions
 * @param {Object} stats - Statistics object
 * @param {number} rentPerBag - Rent per bag
 */
export const exportToExcel = (
  farmerName,
  seasonName,
  transactions,
  stats,
  rentPerBag
) => {
  const storageName = getStorageName();
  const worksheetData = [
    [storageName],
    ['Cold Storage Ledger'],
    [''],
    [`Farmer: ${farmerName}`],
    [`Season: ${seasonName}`],
    [''],
    ['Date', 'Type', 'Bags', 'Payment/Amount', 'Notes'],
  ];

  transactions.forEach((tx) => {
    worksheetData.push([
      formatDate(tx.date),
      tx.type,
      tx.bags || '',
      (tx.amount || tx.payment || ''),
      tx.note || '',
    ]);
  });

  worksheetData.push([]);
  worksheetData.push(['Summary']);
  worksheetData.push(['Total Deposited', parseInt(stats.totalDeposited) || 0]);
  worksheetData.push(['Total Withdrawn', parseInt(stats.totalWithdrawn) || 0]);
  worksheetData.push(['Remaining Bags', parseInt(stats.remainingBags) || 0]);
  const totalRent = (parseInt(stats.totalDeposited) || 0) * rentPerBag;
  worksheetData.push(['Total Rent', parseFloat(totalRent.toFixed(2))]);
  worksheetData.push(['Total Paid', parseFloat(stats.totalPaid) || 0]);
  worksheetData.push(['Pending Amount', parseFloat((totalRent - (parseFloat(stats.totalPaid) || 0)).toFixed(2))]);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');

  const fileName = `${storageName}_${farmerName}_${seasonName}_Ledger.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Print ledger with farmer details, stamp area, and payment summary
 * @param {string} farmerName - Name of farmer
 * @param {string} seasonName - Name of season
 * @param {Array} transactions - Array of transactions
 * @param {Object} stats - Statistics object
 * @param {number} rentPerBag - Rent per bag
 */
export const printLedger = (
  farmerName,
  seasonName,
  transactions,
  stats,
  rentPerBag
) => {
  const storageName = getStorageName();
  const totalDeposited = parseInt(stats.totalDeposited) || 0;
  const totalWithdrawn = parseInt(stats.totalWithdrawn) || 0;
  const remainingBags = parseInt(stats.remainingBags) || 0;
  const totalRent = totalDeposited * rentPerBag;
  const totalPaid = parseFloat(stats.totalPaid) || 0;
  const pendingAmount = parseFloat((totalRent - totalPaid).toFixed(2));
  const now = new Date();
  const printTime = now.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 15px; page-break-after: avoid; break-after: avoid;">
        <h1 style="margin: 5px 0; color: #2c3e50;">${storageName}</h1>
        <h2 style="margin: 5px 0; color: #666;">Farmer Ledger Report</h2>
      </div>

      <!-- Farmer Details Section -->
      <div style="margin-bottom: 20px; background-color: #f5f5f5; border-left: 4px solid #3498db; padding: 15px; page-break-inside: avoid; break-inside: avoid;">
        <h3 style="margin-top: 0; color: #2c3e50;">Farmer Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; width: 50%;"><strong>Farmer Name:</strong> ${farmerName}</td>
            <td style="padding: 8px; width: 50%;"><strong>Season:</strong> ${seasonName}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Print Date:</strong> ${new Date().toLocaleDateString('en-IN')}</td>
            <td style="padding: 8px;"><strong>Print Time:</strong> ${printTime}</td>
          </tr>
        </table>
      </div>

      <!-- Transactions Section -->
      <div style="margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid;">
        <h3 style="margin-bottom: 10px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">Transaction Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #3498db; color: white; border-bottom: 2px solid #333;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Type</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Bags</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((tx, index) => `
              <tr style="border-bottom: 1px solid #ddd; background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(tx.date)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize; font-weight: 500;">
                  ${tx.type === 'deposit' ? '📥 Deposit' : tx.type === 'withdrawal' ? '📤 Withdrawal' : '💰 Payment'}
                </td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${tx.bags || '-'}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(tx.amount || tx.payment || 0)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px;">${tx.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Payment Summary Section -->
      <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border: 2px solid #3498db; border-radius: 8px; page-break-inside: avoid; break-inside: avoid;">
        <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; text-align: center;">Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: transparent;">
            <td style="padding: 12px 15px; width: 60%;"><strong>Total Deposited Bags:</strong></td>
            <td style="padding: 12px 15px; width: 40%; text-align: right; background-color: #e8f5e9; border-radius: 5px;"><strong style="font-size: 16px; color: #2e7d32;">${totalDeposited} bags</strong></td>
          </tr>
          <tr style="background-color: transparent;">
            <td style="padding: 12px 15px;"><strong>Total Withdrawn Bags:</strong></td>
            <td style="padding: 12px 15px; text-align: right; background-color: #fff3e0; border-radius: 5px;"><strong style="font-size: 16px; color: #e65100;">${totalWithdrawn} bags</strong></td>
          </tr>
          <tr style="background-color: transparent;">
            <td style="padding: 12px 15px;"><strong>Remaining Bags (in Storage):</strong></td>
            <td style="padding: 12px 15px; text-align: right; background-color: #e1f5fe; border-radius: 5px;"><strong style="font-size: 16px; color: #01579b;">${remainingBags} bags</strong></td>
          </tr>
          <tr style="background-color: transparent; border-top: 2px solid #90caf9;">
            <td style="padding: 12px 15px;"><strong>Total Rent (@ ₹${rentPerBag}/bag):</strong></td>
            <td style="padding: 12px 15px; text-align: right; background-color: #f3e5f5; border-radius: 5px;"><strong style="font-size: 16px; color: #6a1b9a;">${formatCurrency(totalRent)}</strong></td>
          </tr>
          <tr style="background-color: transparent;">
            <td style="padding: 12px 15px;"><strong>Total Paid:</strong></td>
            <td style="padding: 12px 15px; text-align: right; background-color: #e8f5e9; border-radius: 5px;"><strong style="font-size: 16px; color: #2e7d32;">${formatCurrency(totalPaid)}</strong></td>
          </tr>
          <tr style="background-color: transparent; border-top: 2px solid #ff9800;">
            <td style="padding: 12px 15px;"><strong>🔴 Pending Amount:</strong></td>
            <td style="padding: 12px 15px; text-align: right; background-color: ${pendingAmount > 0 ? '#ffcdd2' : '#c8e6c9'}; border-radius: 5px;"><strong style="font-size: 18px; color: ${pendingAmount > 0 ? '#c62828' : '#2e7d32'};">${formatCurrency(pendingAmount)}</strong></td>
          </tr>
        </table>
      </div>

      <!-- Stamp/Signature Section -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #999; display: flex; justify-content: space-between; page-break-inside: avoid; break-inside: avoid;">
        <div style="width: 30%; text-align: center;">
          <div style="height: 80px; border: 2px dashed #999; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #999; font-weight: bold;">
            STAMP / SEAL
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px;"><strong>Authorized Stamp</strong></p>
        </div>
        <div style="width: 30%; text-align: center;">
          <p style="margin: 60px 0 10px 0; border-top: 2px solid #333; padding-top: 10px; font-size: 12px;"><strong>Farmer Signature</strong></p>
        </div>
        <div style="width: 30%; text-align: center;">
          <p style="margin: 60px 0 10px 0; border-top: 2px solid #333; padding-top: 10px; font-size: 12px;"><strong>Officer Signature</strong></p>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
        <p style="margin: 5px 0;">This is a computer-generated document. No signature required.</p>
        <p style="margin: 5px 0;">Generated: ${printTime}</p>
      </div>
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const opt = {
    margin: 12,
    filename: `${storageName}_${farmerName}_${seasonName}.pdf`,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { scale: 1.2, useCORS: true, scrollY: 0, windowWidth: 1400 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  html2pdf().set(opt).from(element).save();
};
