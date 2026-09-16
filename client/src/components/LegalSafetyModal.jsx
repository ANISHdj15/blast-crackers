// client/src/components/LegalSafetyModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  Truck, 
  RotateCcw, 
  FileText, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Phone, 
  Mail, 
  MapPin,
  HelpCircle
} from 'lucide-react';

export const LegalSafetyModal = ({ isOpen, onClose, initialTab = 'safety' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1150 }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              background: 'rgba(245, 158, 11, 0.2)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
                Safety Guidelines & Legal Terms
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#a7f3d0', margin: '2px 0 0 0' }}>
                Blast Crackers Sivakasi • PESO & CSIR-NEERI Green Crackers Compliance
              </p>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} aria-label="Close safety modal" style={{ color: '#fff' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 16px'
        }}>
          {[
            { id: 'safety', label: 'Fireworks Safety', icon: Flame },
            { id: 'delivery', label: 'Delivery Policy', icon: Truck },
            { id: 'cancellation', label: 'Cancellation & Refunds', icon: RotateCcw },
            { id: 'terms', label: 'Terms & Conditions', icon: FileText },
            { id: 'privacy', label: 'Privacy & Contact', icon: Lock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #064e3b' : '3px solid transparent',
                  color: isActive ? '#064e3b' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
          {/* TAB 1: SAFETY */}
          {activeTab === 'safety' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: '#064e3b' }}>
                  All products supplied by Blast Crackers are 100% genuine Green Crackers certified by CSIR-NEERI with reduced particulate matter and barium-free compositions.
                </span>
              </div>

              <h4 style={{ color: '#0f172a', fontSize: '1rem', marginTop: 4 }}>
                Essential Safety Do's and Don'ts:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                  <h5 style={{ color: '#059669', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} /> What You Should Always Do
                  </h5>
                  <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li>Light fireworks strictly outdoors in open grounds, away from overhead wires, dry grass, and vehicles.</li>
                    <li>Always keep a bucket of water and dry sand nearby for immediate disposal of burnt sparklers and duds.</li>
                    <li>Light only one firework at a time using an incense stick (agarbatti) or long taper lighter.</li>
                    <li>Maintain minimum safe viewing distance (5–15 meters) as printed on each individual box.</li>
                    <li>Ensure children are always under active adult supervision when lighting sparklers or chakkars.</li>
                    <li>Wear tight-fitting cotton clothes; avoid loose synthetic garments near open flames.</li>
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                  <h5 style={{ color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={16} /> What You Must Never Do
                  </h5>
                  <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li>Never attempt to re-ignite a firework that failed to burst ("dud"). Wait 15 minutes, then submerge it in a bucket of water.</li>
                    <li>Never hold burning fireworks in your hand, throw them towards others, or light them inside closed containers.</li>
                    <li>Never store fireworks near cooking stoves, electrical panels, or heat sources. Keep in cool, dry places.</li>
                    <li>Never burst crackers in silence zones (near hospitals, schools, and old-age homes).</li>
                    <li>Never bend directly over a firework while igniting the fuse.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DELIVERY */}
          {activeTab === 'delivery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ color: '#0f172a', fontSize: '1rem', margin: 0 }}>
                Hazardous Goods Packaging & Doorstep Delivery Policy
              </h4>
              <p>
                Fireworks and pyrotechnics are classified as hazardous consumer commodities under Indian transport regulations. We strictly adhere to PESO and state transport guidelines for safe transit.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>Licensed Surface Transport:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    Orders are dispatched via licensed hazardous chemical parcel carriers through designated surface road transit. Air cargo dispatch of pyrotechnics is strictly prohibited by law.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>Moisture-Proof Explosive Packaging:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    Each box is individually wrapped in moisture-resistant film and packed in multi-ply, heavy-duty corrugated cartons sealed with tamper-evident security tape.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>Delivery Timelines & Fragile Surcharge:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    Standard delivery timelines range from 3 to 7 business days depending on delivery pincode. Delivery is FREE for orders above ₹1,999; standard fragile transport fee of ₹150 applies to smaller orders.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>Adult Recipient Verification:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    Delivery parcels containing fireworks must be received by an adult aged 18 or above with delivery address verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CANCELLATION & REFUNDS */}
          {activeTab === 'cancellation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ color: '#0f172a', fontSize: '1rem', margin: 0 }}>
                Order Cancellation & Refund Terms
              </h4>
              <p>
                We believe in total transparency and fair policies for our customers and festival celebrants.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>1. Pre-Fulfillment Online Self-Cancellation:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    Customers can cancel their order with a single click directly from the <em>My Orders</em> portal as long as the status is <strong>Pending Payment</strong>, <strong>Payment Verification</strong>, or <strong>Confirmed</strong>. Reserved fireworks stock is immediately restored back to the catalog.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>2. Post-Dispatch In-Transit Restriction:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    Once an order transitions to <em>Shipped</em> or <em>Dispatched</em> with a tracking number, it cannot be cancelled online as hazardous road consignments cannot be rerouted mid-transit.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>3. Verified UPI Refund Process:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    If a paid order is cancelled prior to depot picking, the full refund is initiated to the originating UPI VPA / bank account within 3–5 working days upon cancellation confirmation.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#064e3b' }}>4. Transit Damage or Defect Support:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                    In the rare event that outer packaging arrives visibly damp or physically damaged, please document unboxing pictures and contact support within 24 hours for replacement or store credit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ color: '#0f172a', fontSize: '1rem', margin: 0 }}>
                Terms & Conditions of Sale
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
                <div>
                  <strong>1. Age of Majority:</strong>
                  <p style={{ margin: '2px 0 0 0' }}>By placing an order on Blast Crackers, you affirm that you are at least 18 years of age and legally competent to purchase pyrotechnic commodities in India.</p>
                </div>

                <div>
                  <strong>2. Consumer Usage:</strong>
                  <p style={{ margin: '2px 0 0 0' }}>All products purchased are intended solely for personal, ceremonial, or celebratory use in accordance with municipal guidelines and timings set by local authorities.</p>
                </div>

                <div>
                  <strong>3. Product Availability & Substitution:</strong>
                  <p style={{ margin: '2px 0 0 0' }}>Inventory counts are synchronized in real-time from our Sivakasi warehouse. In the unlikely event of an unexpected factory stockout, customers will be contacted for an equivalent higher-value substitute or immediate refund.</p>
                </div>

                <div>
                  <strong>4. Limitation of Liability:</strong>
                  <p style={{ margin: '2px 0 0 0' }}>Blast Crackers warrants that products are fresh, factory-tested, and comply with safety regulations. Users assume full responsibility for proper handling, supervision, and adhering to printed safety distances.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & CONTACT */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ color: '#0f172a', fontSize: '1rem', margin: 0 }}>
                Privacy Policy & Merchant Information
              </h4>

              <p style={{ fontSize: '0.84rem' }}>
                We respect your personal privacy. Customer information (name, phone, delivery address) is used exclusively for fulfilling cracker consignments, verifying UPI payments, and providing order tracking notifications.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <h5 style={{ color: '#0f172a', marginBottom: 10, fontSize: '0.92rem' }}>
                  Registered Sivakasi Wholesale Merchant:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <MapPin size={16} color="#064e3b" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>Blast Crackers Sivakasi, Depot No. 18, Bypass Road, Sivakasi, Tamil Nadu - 626123, India</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Phone size={16} color="#064e3b" style={{ flexShrink: 0 }} />
                    <span>Customer Care: +91 98765 43210 / +91 91234 56789</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Mail size={16} color="#064e3b" style={{ flexShrink: 0 }} />
                    <span>Email: support@blastcrackers.com</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#f8fafc'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#064e3b',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
