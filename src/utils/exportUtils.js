import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, getStorageName } from './calculations';

/**
 * Export ledger to Excel
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
      tx.amount || tx.payment || '',
      tx.note || '',
    ]);
  });

  worksheetData.push([]);
  worksheetData.push(['Summary']);

  const totalDeposited = parseInt(stats.totalDeposited) || 0;
  const totalWithdrawn = parseInt(stats.totalWithdrawn) || 0;
  const remainingBags = parseInt(stats.remainingBags) || 0;

  const totalRent = totalDeposited * rentPerBag;
  const totalPaid = parseFloat(stats.totalPaid) || 0;
  const pendingAmount = totalRent - totalPaid;

  worksheetData.push(['Total Deposited', totalDeposited]);
  worksheetData.push(['Total Withdrawn', totalWithdrawn]);
  worksheetData.push(['Remaining Bags', remainingBags]);
  worksheetData.push(['Total Rent', totalRent]);
  worksheetData.push(['Total Paid', totalPaid]);
  worksheetData.push(['Pending Amount', pendingAmount]);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');

  const fileName = `${storageName}_${farmerName}_${seasonName}_Ledger.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Vector PDF (FAST + SELECTABLE TEXT + AUTO PAGE BREAK)
 */
export const printLedgerVector = (
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
  const pendingAmount = totalRent - totalPaid;

  const doc = new jsPDF('p', 'mm', 'a4');

  // ✅ FIX: correct font + remove spacing issue
  doc.setFont('helvetica', 'normal');
  doc.setCharSpace(0);

  let y = 10;

  // ================= HEADER =================
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, 210, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(storageName, 105, 10, { align: 'center' });

  doc.setFontSize(11);
  doc.text('Farmer Ledger Report', 105, 16, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  y = 30;

  // ================= DETAILS =================
  doc.setFillColor(240, 248, 255);
  doc.rect(10, y - 5, 190, 25, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Farmer Details', 12, y);

  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Farmer: ${farmerName}`, 12, y);
  y += 5;
  doc.text(`Season: ${seasonName}`, 12, y);
  y += 5;
  doc.text(`Bag Rate: ₹${rentPerBag}/bag`, 12, y);
  y += 5;
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 12, y);

  y += 10;

  // ================= TABLE =================
  const tableData = transactions.map((tx) => [
    formatDate(tx.date),
    tx.type === 'deposit'
      ? 'Deposit'
      : tx.type === 'withdrawal'
      ? 'Withdrawal'
      : 'Payment',
    tx.bags || '-',
    '₹' + formatCurrency(tx.amount || tx.payment || 0),
    tx.note || '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Type', 'Bags', 'Amount', 'Notes']],
    body: tableData,

    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      overflow: 'ellipsize',
    },

    headStyles: {
      fillColor: [52, 152, 219],
      textColor: 255,
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },

    columnStyles: {
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 50, overflow: 'ellipsize' },
      4: { cellWidth: 70 },
    },

    didDrawPage: () => {
      doc.setFontSize(8);
      doc.text(
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        105,
        290,
        { align: 'center' }
      );
    },
  });

  // ================= SUMMARY =================
  let finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', 10, finalY);

  finalY += 6;

  const summary = [
    ['Total Deposited', `${totalDeposited} bags`],
    ['Total Withdrawn', `${totalWithdrawn} bags`],
    ['Remaining Bags', `${remainingBags} bags`],
    ['Total Rent', '₹' + formatCurrency(totalRent)],
    ['Total Paid', '₹' + formatCurrency(totalPaid)],
    ['Pending Amount', '₹' + formatCurrency(pendingAmount)],
  ];

  autoTable(doc, {
    startY: finalY,
    body: summary,
    theme: 'grid',

    styles: {
      font: 'helvetica',
      fontSize: 10,
    },

    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
    },

    didParseCell: function (data) {
      // Highlight pending
      if (data.row.index === 5) {
        if (pendingAmount > 0) {
          data.cell.styles.textColor = [198, 40, 40];
          data.cell.styles.fillColor = [255, 205, 210];
        } else {
          data.cell.styles.textColor = [46, 125, 50];
          data.cell.styles.fillColor = [200, 230, 201];
        }
      }
    },
  });

  // ================= SIGNATURE =================
  const signY = doc.lastAutoTable.finalY + 20;

  doc.text('Stamp/Seal', 20, signY);
  doc.text('Farmer Signature', 90, signY);
  doc.text('Officer Signature', 150, signY);

  // ================= SAVE =================
  doc.save(`${storageName}_${farmerName}_${seasonName}.pdf`);
};

/**
 * Backward compatibility (so old code doesn't break)
 */
export const printLedger = printLedgerVector;