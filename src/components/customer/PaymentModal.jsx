import React, { useState } from 'react';
import { formatINR } from '../../utils/costCalculator';

export function PaymentModal({ totalCost, customerName, onPaymentSuccess, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [upiApp, setUpiApp] = useState('GPAY');
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePay = (e) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      const txnId = `CW-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      setProcessing(false);
      onPaymentSuccess(txnId, paymentMethod);
    }, 250);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel payment-modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Complete Payment ({formatINR(totalCost)})</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              100% Secure 256-Bit Encrypted Indian Payment Gateway
            </span>
          </div>
          <button type="button" className="btn-secondary-action" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Payment Method Selector Tabs */}
          <div className="payment-tabs-bar">
            <button
              type="button"
              className={`pay-tab ${paymentMethod === 'UPI' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('UPI')}
            >
              ⚡ Instant UPI & QR
            </button>
            <button
              type="button"
              className={`pay-tab ${paymentMethod === 'CARD' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('CARD')}
            >
              💳 Debit / Credit Card
            </button>
            <button
              type="button"
              className={`pay-tab ${paymentMethod === 'NETBANKING' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('NETBANKING')}
            >
              🏦 NetBanking
            </button>
          </div>

          {paymentMethod === 'UPI' && (
            <div className="upi-payment-block">
              <div className="upi-apps-row">
                <button
                  type="button"
                  className={`upi-app-btn ${upiApp === 'GPAY' ? 'active' : ''}`}
                  onClick={() => setUpiApp('GPAY')}
                >
                  Google Pay
                </button>
                <button
                  type="button"
                  className={`upi-app-btn ${upiApp === 'PHONEPE' ? 'active' : ''}`}
                  onClick={() => setUpiApp('PHONEPE')}
                >
                  PhonePe
                </button>
                <button
                  type="button"
                  className={`upi-app-btn ${upiApp === 'PAYTM' ? 'active' : ''}`}
                  onClick={() => setUpiApp('PAYTM')}
                >
                  Paytm UPI
                </button>
              </div>

              <div className="upi-qr-card">
                <div className="qr-box">
                  <div className="qr-grid-mock" />
                  <div className="qr-scan-text">Scan with any UPI App</div>
                </div>
                <div className="qr-details">
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                    Payee: CineWave Box Office
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    UPI ID: cinewave.multiplex@icici
                  </div>
                  <div className="qr-amount-badge">
                    {formatINR(totalCost)}
                  </div>
                </div>
              </div>

              <div className="or-divider">OR ENTER UPI ID</div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="e.g. yourname@oksbi"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                />
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="card-payment-block">
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input type="text" placeholder="4111 2222 3333 4444" defaultValue="4532 8900 1234 5678" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Valid Thru</label>
                  <input type="text" placeholder="MM/YY" defaultValue="08/29" />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input type="password" placeholder="•••" defaultValue="888" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Name on Card</label>
                <input type="text" defaultValue={customerName || 'Aarav Mehta'} />
              </div>
            </div>
          )}

          {paymentMethod === 'NETBANKING' && (
            <div className="netbanking-block">
              <label className="form-label">Select Popular Indian Bank</label>
              <div className="banks-grid">
                <button type="button" className="bank-pill active">HDFC Bank</button>
                <button type="button" className="bank-pill">ICICI Bank</button>
                <button type="button" className="bank-pill">State Bank of India</button>
                <button type="button" className="bank-pill">Axis Bank</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary-action" onClick={onClose} disabled={processing}>
            Cancel
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={handlePay}
            disabled={processing}
            style={{ minWidth: '160px', justifyContent: 'center' }}
          >
            {processing ? 'Authorizing Payment...' : `Authorize & Pay ${formatINR(totalCost)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
