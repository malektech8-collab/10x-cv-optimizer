import React from 'react';
import { X, Printer } from 'lucide-react';
import { translations, Language } from '../constants/translations';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  lang: Language;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, item, lang }) => {
  const t = translations[lang];
  const inv = t.invoice;

  if (!isOpen || !item) return null;

  const formatDate = (d: any) => {
    if (!d) return '—';
    const date = d?.toDate ? d.toDate() : new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const amount = item.amount ? (item.amount / 100).toFixed(2) : '0.00';
  const currencyCode = item.currency || 'SAR';
  const currency = currencyCode === 'SAR' ? 'ر.س' : currencyCode;
  const invoiceNumber = item.order_number || item.id?.slice(0, 8).toUpperCase();
  const invoiceDate = formatDate(item.paid_at || item.created_at);
  const isRtl = lang === 'ar';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the invoice.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <title>${inv.title} - ${invoiceNumber}</title>
        <style>
          @page { size: A4; margin: 1in; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a2e; direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .invoice { max-width: 700px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2D1065; padding-bottom: 20px; }
          .brand { font-size: 22pt; font-weight: bold; color: #2D1065; }
          .brand-sub { font-size: 10pt; color: #666; margin-top: 4px; }
          .invoice-title { font-size: 18pt; font-weight: bold; color: #2D1065; text-align: ${isRtl ? 'left' : 'right'}; }
          .invoice-meta { font-size: 10pt; color: #666; margin-top: 6px; text-align: ${isRtl ? 'left' : 'right'}; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .details-section { }
          .details-label { font-size: 9pt; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .details-value { font-size: 11pt; font-weight: 500; color: #1a1a2e; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          thead th { background: #2D1065; color: white; padding: 10px 14px; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; text-align: ${isRtl ? 'right' : 'left'}; }
          thead th:last-child { text-align: ${isRtl ? 'left' : 'right'}; }
          tbody td { padding: 12px 14px; border-bottom: 1px solid #eee; font-size: 10pt; }
          tbody td:last-child { text-align: ${isRtl ? 'left' : 'right'}; font-weight: 600; }
          .total-row { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .total-box { background: #F2EEF9; border: 2px solid #2D1065; border-radius: 8px; padding: 16px 28px; text-align: center; }
          .total-label { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .total-amount { font-size: 20pt; font-weight: bold; color: #2D1065; margin-top: 4px; }
          .footer { border-top: 1px solid #eee; padding-top: 20px; }
          .footer-row { display: flex; justify-content: space-between; font-size: 9pt; color: #999; margin-bottom: 6px; }
          .status-paid { display: inline-block; background: #dcfce7; color: #16a34a; padding: 2px 10px; border-radius: 10px; font-size: 9pt; font-weight: 600; }
          .status-unpaid { display: inline-block; background: #fef3c7; color: #d97706; padding: 2px 10px; border-radius: 10px; font-size: 9pt; font-weight: 600; }
          @media print { body { padding: 0; } .invoice { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <div class="brand">10X</div>
              <div class="brand-sub">${inv.companyName}</div>
            </div>
            <div>
              <div class="invoice-title">${inv.title}</div>
              <div class="invoice-meta">${inv.invoiceNumber} ${invoiceNumber}</div>
              <div class="invoice-meta">${inv.date}: ${invoiceDate}</div>
            </div>
          </div>

          <div class="details">
            <div class="details-section">
              <div class="details-label">${inv.customerEmail}</div>
              <div class="details-value">${item.email || '—'}</div>
            </div>
            <div class="details-section">
              <div class="details-label">${inv.status}</div>
              <div class="details-value">
                <span class="${item.is_paid ? 'status-paid' : 'status-unpaid'}">${item.is_paid ? inv.paid : inv.unpaid}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${inv.description}</th>
                <th style="text-align:center">${inv.quantity}</th>
                <th style="text-align:${isRtl ? 'left' : 'right'}">${inv.total}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ${inv.item}
                  <br><span style="font-size:9pt;color:#999">${inv.filename}: ${item.original_filename || '—'}</span>
                </td>
                <td style="text-align:center">1</td>
                <td>${amount} ${currency}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-row">
            <div class="total-box">
              <div class="total-label">${inv.grandTotal}</div>
              <div class="total-amount">${amount} ${currency}</div>
            </div>
          </div>

          <div class="footer">
            ${item.paymob_transaction_id ? `<div class="footer-row"><span>${inv.transactionId}</span><span>${item.paymob_transaction_id}</span></div>` : ''}
            <div class="footer-row"><span>${inv.orderRef}</span><span>${invoiceNumber}</span></div>
            <div class="footer-row"><span>${inv.paymentMethod}</span><span>Paymob</span></div>
          </div>
        </div>
        <script>
          window.onload = () => { window.focus(); setTimeout(() => { window.print(); }, 300); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#150D30]/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir={t.dir}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden border border-[#E8E2F0] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E2F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/brand-assets/10-x logo.png" alt="10-x" className="w-9 h-9" />
            <span className="font-semibold text-[#150D30]">{inv.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* Invoice number & date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">{inv.invoiceNumber}</p>
              <p className="font-bold text-[#150D30]">{invoiceNumber}</p>
            </div>
            <div className={`${isRtl ? 'text-left' : 'text-right'}`}>
              <p className="text-xs text-slate-400">{inv.date}</p>
              <p className="font-medium text-[#150D30]">{invoiceDate}</p>
            </div>
          </div>

          {/* Customer & status */}
          <div className="flex items-center justify-between bg-[#F2EEF9] rounded-xl p-4 border border-[#E8E2F0]">
            <div>
              <p className="text-xs text-slate-400">{inv.customerEmail}</p>
              <p className="text-sm font-medium text-[#150D30]">{item.email || '—'}</p>
            </div>
            <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${
              item.is_paid
                ? 'bg-green-50 text-green-600 border-green-100'
                : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {item.is_paid ? inv.paid : inv.unpaid}
            </span>
          </div>

          {/* Line items */}
          <div className="border border-[#E8E2F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#2D1065] text-white">
                  <th className={`px-4 py-2.5 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium uppercase tracking-wide`}>{inv.description}</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide">{inv.quantity}</th>
                  <th className={`px-4 py-2.5 ${isRtl ? 'text-left' : 'text-right'} text-xs font-medium uppercase tracking-wide`}>{inv.total}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="font-medium text-[#150D30]">{inv.item}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{inv.filename}: {item.original_filename || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">1</td>
                  <td className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'} font-semibold text-[#150D30]`}>{amount} {currency}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
            <div className="bg-[#F2EEF9] border-2 border-[#2D1065] rounded-xl px-7 py-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{inv.grandTotal}</p>
              <p className="text-2xl font-black text-[#2D1065] mt-1">{amount} {currency}</p>
            </div>
          </div>

          {/* Footer details */}
          <div className="space-y-2 text-xs text-slate-400 border-t border-[#E8E2F0] pt-4">
            {item.paymob_transaction_id && (
              <div className="flex justify-between">
                <span>{inv.transactionId}</span>
                <span className="font-medium text-slate-600">{item.paymob_transaction_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{inv.orderRef}</span>
              <span className="font-medium text-slate-600">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>{inv.paymentMethod}</span>
              <span className="font-medium text-slate-600">Paymob</span>
            </div>
          </div>
        </div>

        {/* Print button */}
        <div className="px-6 py-4 border-t border-[#E8E2F0] flex-shrink-0">
          <button
            onClick={handlePrint}
            className="w-full py-3 bg-[#2D1065] text-white rounded-xl font-medium text-sm hover:bg-[#220C4E] transition-colors flex items-center justify-center gap-2.5 shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
          >
            <Printer className="w-4 h-4" />
            {inv.printInvoice}
          </button>
        </div>
      </div>
    </div>
  );
};
