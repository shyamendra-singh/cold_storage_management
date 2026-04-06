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
    <div style="width: 210mm; height: 297mm; margin: 0 auto; padding: 10mm; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 8mm; border-bottom: 2px solid #333; padding-bottom: 5mm;">
        <h1 style="margin: 0; color: #2c3e50; font-size: 16px;">${storageName}</h1>
        <p style="margin: 2px 0; color: #666; font-size: 11px;">Farmer Ledger Report</p>
      </div>

      <!-- Farmer Details Section -->
      <div style="margin-bottom: 8mm; background-color: #f5f5f5; border-left: 3px solid #3498db; padding: 8mm;">
        <p style="margin: 0 0 4mm 0; color: #2c3e50; font-weight: bold; font-size: 10px;">Farmer Details</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <tr>
            <td style="padding: 3mm; width: 50%;"><strong>Name:</strong> ${farmerName}</td>
            <td style="padding: 3mm; width: 50%;"><strong>Season:</strong> ${seasonName}</td>
          </tr>
          <tr>
            <td style="padding: 3mm;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</td>
            <td style="padding: 3mm;"><strong>Time:</strong> ${printTime}</td>
          </tr>
        </table>
      </div>

      <!-- Transactions Section -->
      <div style="margin-bottom: 8mm;">
        <p style="margin: 0 0 4mm 0; color: #2c3e50; font-weight: bold; font-size: 10px; border-bottom: 1px solid #3498db; padding-bottom: 2mm;">Transaction Details</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
          <thead>
            <tr style="background-color: #3498db; color: white;">
              <th style="padding: 3mm; text-align: left; border: 1px solid #999; width: 15%;">Date</th>
              <th style="padding: 3mm; text-align: left; border: 1px solid #999; width: 18%;">Type</th>
              <th style="padding: 3mm; text-align: center; border: 1px solid #999; width: 12%;">Bags</th>
              <th style="padding: 3mm; text-align: right; border: 1px solid #999; width: 25%;">Amount</th>
              <th style="padding: 3mm; text-align: left; border: 1px solid #999; width: 30%;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((tx, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <td style="padding: 2mm; border: 1px solid #ddd;">${formatDate(tx.date)}</td>
                <td style="padding: 2mm; border: 1px solid #ddd; font-weight: 500;">
                  ${tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : 'Payment'}
                </td>
                <td style="padding: 2mm; border: 1px solid #ddd; text-align: center;">${tx.bags || '-'}</td>
                <td style="padding: 2mm; border: 1px solid #ddd; text-align: right;">${formatCurrency(tx.amount || tx.payment || 0)}</td>
                <td style="padding: 2mm; border: 1px solid #ddd; font-size: 7px;">${(tx.note || '-').substring(0, 20)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Payment Summary Section -->
      <div style="margin-top: 8mm; padding: 10mm; background: #f0f8ff; border: 1px solid #3498db; border-radius: 3px;">
        <p style="margin: 0 0 4mm 0; color: #2c3e50; font-weight: bold; font-size: 10px; text-align: center;">Payment Summary</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <tr>
            <td style="padding: 2mm 5mm;"><strong>Total Deposited:</strong></td>
            <td style="padding: 2mm 5mm; text-align: right; background-color: #e8f5e9;"><strong>${totalDeposited} bags</strong></td>
          </tr>
          <tr>
            <td style="padding: 2mm 5mm;"><strong>Total Withdrawn:</strong></td>
            <td style="padding: 2mm 5mm; text-align: right; background-color: #fff3e0;"><strong>${totalWithdrawn} bags</strong></td>
          </tr>
          <tr>
            <td style="padding: 2mm 5mm;"><strong>Remaining:</strong></td>
            <td style="padding: 2mm 5mm; text-align: right; background-color: #e1f5fe;"><strong>${remainingBags} bags</strong></td>
          </tr>
          <tr style="border-top: 1px solid #999;">
            <td style="padding: 2mm 5mm;"><strong>Total Rent (@ ₹${rentPerBag}/bag):</strong></td>
            <td style="padding: 2mm 5mm; text-align: right; background-color: #f3e5f5;"><strong>${formatCurrency(totalRent)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 2mm 5mm;"><strong>Total Paid:</strong></td>
            <td style="padding: 2mm 5mm; text-align: right; background-color: #e8f5e9;"><strong>${formatCurrency(totalPaid)}</strong></td>
          </tr>
          <tr style="border-top: 2px solid #ff9800;">
            <td style="padding: 3mm 5mm;"><strong>Pending:</strong></td>
            <td style="padding: 3mm 5mm; text-align: right; background-color: ${pendingAmount > 0 ? '#ffcdd2' : '#c8e6c9'}; font-weight: bold; color: ${pendingAmount > 0 ? '#c62828' : '#2e7d32'};"><strong>${formatCurrency(pendingAmount)}</strong></td>
          </tr>
        </table>
      </div>

      <!-- Stamp/Signature Section -->
      <div style="margin-top: 8mm; padding-top: 5mm; border-top: 1px solid #999; display: table; width: 100%;">
        <div style="display: table-cell; width: 30%; text-align: center; padding-right: 5mm;">
          <div style="height: 20mm; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; color: #999; font-weight: bold; font-size: 9px;">
            STAMP
          </div>
        </div>
        <div style="display: table-cell; width: 35%; text-align: center; padding: 0 5mm; border-top: 1px solid #333; padding-top: 3mm; font-size: 8px;">
          <strong>Farmer Signature</strong>
        </div>
        <div style="display: table-cell; width: 35%; text-align: center; padding-left: 5mm; border-top: 1px solid #333; padding-top: 3mm; font-size: 8px;">
          <strong>Officer Signature</strong>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 8mm; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ddd; padding-top: 3mm;">
        <p style="margin: 0;">Computer-generated document. Generated: ${printTime}</p>
      </div>
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const opt = {
    margin: [5, 5, 5, 5],
    filename: `${storageName}_${farmerName}_${seasonName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1, 
      useCORS: true, 
      allowTaint: true,
      scrollY: 0, 
      windowWidth: 794,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4' 
    },
    pagebreak: { mode: 'avoid-all' },
  };

  html2pdf().set(opt).from(element).save();
};
