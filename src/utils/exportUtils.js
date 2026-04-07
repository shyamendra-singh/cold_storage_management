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
  doc.text(`Bag Rate: Rs.${rentPerBag}/bag`, 12, y);
  y += 5;
  doc.text(`Date: ${formatDate(new Date())}`, 12, y);

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
    'Rs.' + formatCurrency(tx.amount || tx.payment || 0),
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
        `Generated: ${formatDate(new Date())}`,
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
    ['Total Rent', 'Rs.' + formatCurrency(totalRent)],
    ['Total Paid', 'Rs.' + formatCurrency(totalPaid)],
    ['Pending Amount', 'Rs.' + formatCurrency(pendingAmount)],
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

export const exportAllFarmerLedgersExcel = (allData) => {
  const storageName = getStorageName();
  const worksheetData = [
    [storageName],
    ['All Farmers Ledger Export'],
    [''],
    [
      'Farmer Name',
      'Father Name',
      'Village',
      'Bags Deposited',
      'Bags Withdrawn',
      'Remaining Bags',
      'Rent',
      'Paid',
      'Balance Amount',
    ],
  ];

  allData.forEach((row) => {
    worksheetData.push([
      row.farmerName,
      row.fatherName,
      row.village,
      row.totalDeposited,
      row.totalWithdrawn,
      row.remainingBags,
      row.totalRent,
      row.totalPaid,
      row.balanceAmount,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'All Farmers');
  XLSX.writeFile(workbook, `${storageName}_All_Farmers_Ledger.xlsx`);
};

export const printAllFarmerLedgersPDF = (allData) => {
  const storageName = getStorageName();
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(storageName, 105, 12, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('All Farmers Ledger Export', 105, 18, { align: 'center' });

  const body = allData.map((row) => [
    row.farmerName,
    row.fatherName,
    row.village,
    row.totalDeposited,
    row.totalWithdrawn,
    row.remainingBags,
    'Rs.' + formatCurrency(row.totalRent),
    'Rs.' + formatCurrency(row.totalPaid),
    'Rs.' + formatCurrency(row.balanceAmount),
  ]);

  autoTable(doc, {
    startY: 26,
    head: [
      [
        'Farmer Name',
        'Father Name',
        'Village',
        'Bags Deposited',
        'Bags Withdrawn',
        'Remaining Bags',
        'Rent',
        'Paid',
        'Balance Amount',
      ],
    ],
    body,
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
    theme: 'grid',
    margin: { left: 10, right: 10 },
  });

  doc.save(`${storageName}_All_Farmers_Ledger.pdf`);
};

/**
 * Backward compatibility (so old code doesn't break)
 */
export const printLedger = printLedgerVector;