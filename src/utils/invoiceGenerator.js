import { formatINR, amountInWords } from './gst';

export const generateInvoiceHTML = (invoice, business) => {
  const items = invoice.items || [];
  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <strong>${item.product_name}</strong>
        ${item.description ? `<br/><small>${item.description}</small>` : ''}
        ${item.hsn_sac ? `<br/><small>HSN/SAC: ${item.hsn_sac}</small>` : ''}
      </td>
      <td>${item.quantity} ${item.unit || ''}</td>
      <td>${formatINR(item.price)}</td>
      ${item.discount_percent ? `<td>${item.discount_percent}%</td>` : '<td>-</td>'}
      <td>${item.tax_percent}%</td>
      ${invoice.is_interstate 
        ? `<td>${formatINR(item.igst)}</td>`
        : `<td>${formatINR(item.cgst)}</td><td>${formatINR(item.sgst)}</td>`
      }
      <td>${formatINR(item.total)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: white; }
    .invoice-wrapper { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: bold; }
    .invoice-title { font-size: 32px; font-weight: 900; text-align: right; }
    .invoice-meta { text-align: right; }
    .section { display: flex; gap: 20px; margin-bottom: 15px; }
    .box { flex: 1; background: #f8f9ff; border: 1px solid #e2e8ff; border-radius: 8px; padding: 12px; }
    .box h4 { color: #667eea; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    thead { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    thead th { padding: 10px 8px; text-align: left; font-size: 11px; }
    tbody tr:nth-child(even) { background: #f8f9ff; }
    tbody td { padding: 8px; border-bottom: 1px solid #eee; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
    .grand-total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 5px; }
    .amount-words { background: #fff8e1; border: 1px solid #ffd54f; border-radius: 8px; padding: 10px; margin: 15px 0; font-style: italic; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; border-top: 2px solid #667eea; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 11px; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-overdue { background: #f8d7da; color: #721c24; }
    .bank-info { background: #f0f4ff; border-radius: 8px; padding: 10px; margin-top: 10px; }
  </style>
</head>
<body>
<div class="invoice-wrapper">
  <div class="header">
    <div>
      ${business?.logo_url ? `<img src="${business.logo_url}" style="height:60px;border-radius:8px;margin-bottom:8px" /><br/>` : ''}
      <div class="company-name">${business?.business_name || 'Business Name'}</div>
      <div style="opacity:0.85;margin-top:4px">${business?.address || ''}</div>
      ${business?.gst_number ? `<div style="opacity:0.85">GSTIN: ${business.gst_number}</div>` : ''}
      ${business?.phone ? `<div style="opacity:0.85">📞 ${business.phone}</div>` : ''}
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <div style="margin-top:10px">
        <div><strong>#${invoice.invoice_number}</strong></div>
        <div>Date: ${invoice.invoice_date}</div>
        ${invoice.due_date ? `<div>Due: ${invoice.due_date}</div>` : ''}
        <div style="margin-top:6px">
          <span class="status-badge status-${(invoice.status || 'pending').toLowerCase().replace(' ', '-')}">${invoice.status}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="box">
      <h4>Bill To</h4>
      <strong>${invoice.customer_name}</strong><br/>
      ${invoice.customer_address ? `${invoice.customer_address}<br/>` : ''}
      ${invoice.customer_phone ? `📞 ${invoice.customer_phone}<br/>` : ''}
      ${invoice.customer_email ? `✉️ ${invoice.customer_email}<br/>` : ''}
      ${invoice.customer_gst ? `GSTIN: ${invoice.customer_gst}` : ''}
    </div>
    <div class="box">
      <h4>Payment Info</h4>
      ${invoice.payment_mode ? `<div>Mode: <strong>${invoice.payment_mode}</strong></div>` : ''}
      ${business?.upi_id ? `<div>UPI: <strong>${business.upi_id}</strong></div>` : ''}
      ${business?.bank_name ? `<div>Bank: ${business.bank_name}</div>` : ''}
      ${business?.bank_account ? `<div>A/C: ${business.bank_account}</div>` : ''}
      ${business?.bank_ifsc ? `<div>IFSC: ${business.bank_ifsc}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Disc%</th>
        <th>Tax%</th>
        ${invoice.is_interstate 
          ? '<th>IGST</th>'
          : '<th>CGST</th><th>SGST</th>'
        }
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>${formatINR(invoice.subtotal)}</span></div>
      ${invoice.discount_amount ? `<div class="total-row"><span>Discount</span><span>-${formatINR(invoice.discount_amount)}</span></div>` : ''}
      ${invoice.is_interstate 
        ? `<div class="total-row"><span>IGST</span><span>${formatINR(invoice.igst_total)}</span></div>`
        : `<div class="total-row"><span>CGST</span><span>${formatINR(invoice.cgst_total)}</span></div>
           <div class="total-row"><span>SGST</span><span>${formatINR(invoice.sgst_total)}</span></div>`
      }
      <div class="grand-total"><span>TOTAL</span><span>${formatINR(invoice.total)}</span></div>
      ${invoice.amount_paid ? `<div class="total-row" style="color:#16a34a"><span>Amount Paid</span><span>${formatINR(invoice.amount_paid)}</span></div>` : ''}
      ${invoice.balance_due ? `<div class="total-row" style="color:#dc2626;font-weight:bold"><span>Balance Due</span><span>${formatINR(invoice.balance_due)}</span></div>` : ''}
    </div>
  </div>

  <div class="amount-words">
    💰 <strong>Amount in Words:</strong> ${amountInWords(invoice.total)}
  </div>

  ${invoice.notes ? `<div class="box" style="margin-bottom:15px"><h4>Notes</h4>${invoice.notes}</div>` : ''}
  ${invoice.terms ? `<div class="box" style="margin-bottom:15px"><h4>Terms & Conditions</h4>${invoice.terms}</div>` : ''}

  <div class="footer">
    <div>
      <div style="font-size:11px;color:#666">Thank you for your business!</div>
      <div style="font-size:10px;color:#999;margin-top:4px">Generated by BillNova AI</div>
    </div>
    ${business?.signature_url 
      ? `<div style="text-align:center"><img src="${business.signature_url}" style="height:60px"/><br/><div style="border-top:1px solid #333;padding-top:4px;font-size:11px">Authorised Signatory</div></div>`
      : '<div style="border-top:1px solid #333;padding-top:4px;text-align:center;width:150px;font-size:11px">Authorised Signatory</div>'
    }
  </div>
</div>
</body>
</html>`;
};
