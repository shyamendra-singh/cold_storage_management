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
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 100%; padding: 6px; }
        .header { text-align: center; margin-bottom: 6px; border-bottom: 2px solid #333; padding-bottom: 4px; }
        .header h1 { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 2px; }
        .header p { font-size: 12px; color: #666; }
        .section { margin-bottom: 6px; }
        .section-title { font-size: 11px; font-weight: bold; color: #2c3e50; margin-bottom: 3px; border-bottom: 1px solid #3498db; padding-bottom: 2px; }
        .details-box { background-color: #f5f5f5; border-left: 2px solid #3498db; padding: 5px; font-size: 10px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background-color: #3498db; color: white; padding: 4px; text-align: left; border: 1px solid #999; font-weight: bold; }
        td { padding: 3px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary-table { font-size: 10px; width: 100%; }
        .summary-table tr { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 4px; }
        .summary-table td { padding: 4px 3px; border: none; }
        .summary-label { font-weight: bold; text-align: left; white-space: nowrap; }
        .summary-value { text-align: right; background-color: #f0f8ff; padding: 4px; font-weight: bold; white-space: nowrap; }
        .signature-section { margin-top: 8px; border-top: 1px solid #999; padding-top: 5px; display: flex; justify-content: space-between; font-size: 9px; }
        .sig-box { flex: 1; text-align: center; }
        .stamp-area { height: 18px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; color: #999; font-weight: bold; margin-bottom: 2px; font-size: 8px; }
        .sig-line { border-top: 1px solid #333; margin-top: 2px; padding-top: 3px; font-weight: bold; }
        .footer { text-align: center; font-size: 8px; color: #666; margin-top: 6px; border-top: 1px solid #ddd; padding-top: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${storageName}</h1>
          <p>Farmer Ledger Report</p>
        </div>

        <div class="section">
          <div class="section-title">Farmer Details</div>
          <div class="details-box">
            <div><strong>Name:</strong> ${farmerName} | <strong>Season:</strong> ${seasonName}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')} | <strong>Time:</strong> ${printTime}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Transaction Details</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Bags</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx) => `
                <tr>
                  <td>${formatDate(tx.date)}</td>
                  <td>${tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : 'Payment'}</td>
                  <td>${tx.bags || '-'}</td>
                  <td>${formatCurrency(tx.amount || tx.payment || 0)}</td>
                  <td>${(tx.note || '-').substring(0, 15)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Payment Summary</div>
          <table class="summary-table">
            <tr>
              <td class="summary-label">Total Deposited:</td>
              <td class="summary-value">${totalDeposited} bags</td>
              <td class="summary-label">Remaining:</td>
              <td class="summary-value">${remainingBags} bags</td>
            </tr>
            <tr>
              <td class="summary-label">Total Withdrawn:</td>
              <td class="summary-value">${totalWithdrawn} bags</td>
              <td class="summary-label">Rent (₹${rentPerBag}/bag):</td>
              <td class="summary-value">${formatCurrency(totalRent)}</td>
            </tr>
            <tr style="border-top: 1px solid #999;">
              <td class="summary-label">Total Paid:</td>
              <td class="summary-value">${formatCurrency(totalPaid)}</td>
              <td class="summary-label" style="color: ${pendingAmount > 0 ? '#c62828' : '#2e7d32'};">Pending:</td>
              <td class="summary-value" style="background-color: ${pendingAmount > 0 ? '#ffcdd2' : '#c8e6c9'}; color: ${pendingAmount > 0 ? '#c62828' : '#2e7d32'};">${formatCurrency(pendingAmount)}</td>
            </tr>
          </table>
        </div>

        <div class="signature-section">
          <div class="sig-box">
            <div class="stamp-area">STAMP</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">Farmer Sig</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">Officer Sig</div>
          </div>
        </div>

        <div class="footer">
          <p>Computer-generated document | Generated: ${printTime}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const opt = {
    margin: 8,
    filename: `${storageName}_${farmerName}_${seasonName}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 3, 
      useCORS: true, 
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    },
    jsPDF: { 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4',
      compress: true
    },
    pagebreak: { mode: 'avoid-all', before: [] },
  };

  html2pdf().set(opt).from(element).save();
};
