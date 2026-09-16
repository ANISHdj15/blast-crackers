import React from 'react';
import { Flame, ShieldCheck, Truck, Phone, Mail, MapPin, Sparkles, Heart } from 'lucide-react';

export const Footer = ({ onSelectCategory, onOpenTracking, onOpenLegal }) => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Brand Column */}
        <div className="footer-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="brand-icon-box" style={{ width: 36, height: 36 }}>
              <Flame size={20} />
            </div>
            <div className="brand-title" style={{ color: '#ffffff', fontSize: '1.25rem' }}>
              BLAST <span style={{ color: '#f59e0b' }}>CRACKERS</span>
            </div>
          </div>
          <p style={{ marginBottom: 14 }}>
            Direct manufacturer & wholesale distributor from Sivakasi, Tamil Nadu. We supply 100% genuine, CSIR-NEERI certified Green Crackers adhering to national pollution and safety standards.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="ribbon-pill" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <ShieldCheck size={14} color="#10b981" /> Licensed Pyrotechnics
            </span>
            <span className="ribbon-pill" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Truck size={14} color="#f59e0b" /> Fragile Express Door Delivery
            </span>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="footer-col">
          <h4>Popular Fireworks</h4>
          <ul className="footer-links">
            <li>
              <a href="#store-catalog" onClick={() => onSelectCategory('sparklers')}>
                Electric & Gold Sparklers
              </a>
            </li>
            <li>
              <a href="#store-catalog" onClick={() => onSelectCategory('flower-pots')}>
                Colour Fountain Flower Pots
              </a>
            </li>
            <li>
              <a href="#store-catalog" onClick={() => onSelectCategory('ground-chakkars')}>
                Deluxe Ground Chakkars
              </a>
            </li>
            <li>
              <a href="#store-catalog" onClick={() => onSelectCategory('rockets')}>
                Sky Rockets & Parachutes
              </a>
            </li>
            <li>
              <a href="#store-catalog" onClick={() => onSelectCategory('gift-boxes')}>
                Diwali Family Gift Boxes
              </a>
            </li>
            <li>
              <a href="#store-catalog" onClick={() => onSelectCategory('combo-packs')}>
                Mega Celebration Combos
              </a>
            </li>
          </ul>
        </div>

        {/* Customer Support & Safety */}
        <div className="footer-col">
          <h4>Customer Service & Safety</h4>
          <ul className="footer-links">
            <li>
              <a href="#track" onClick={(e) => { e.preventDefault(); onOpenTracking(); }}>
                Live Consignment Tracking
              </a>
            </li>
            <li>
              <a href="#safety" onClick={(e) => { e.preventDefault(); onOpenLegal && onOpenLegal('safety'); }}>
                Fireworks Safety Manual
              </a>
            </li>
            <li>
              <a href="#delivery" onClick={(e) => { e.preventDefault(); onOpenLegal && onOpenLegal('delivery'); }}>
                Doorstep Delivery & Hazardous Transit Policy
              </a>
            </li>
            <li>
              <a href="#cancellation" onClick={(e) => { e.preventDefault(); onOpenLegal && onOpenLegal('cancellation'); }}>
                Cancellation & Refund Policy
              </a>
            </li>
            <li>
              <a href="#terms" onClick={(e) => { e.preventDefault(); onOpenLegal && onOpenLegal('terms'); }}>
                Terms & Conditions of Sale
              </a>
            </li>
            <li>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); onOpenLegal && onOpenLegal('privacy'); }}>
                Privacy Policy & Merchant Info
              </a>
            </li>
          </ul>
        </div>

        {/* Factory Contact */}
        <div className="footer-col">
          <h4>Sivakasi Depot</h4>
          <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
            <MapPin size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 4 }} />
            <span>Depot No. 18, Bypass Road, Sivakasi, Tamil Nadu - 626123, India</span>
          </p>
          <p style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Phone size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>+91 98765 43210 / +91 91234 56789</span>
          </p>
          <p style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Mail size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>support@blastcrackers.com</span>
          </p>
          <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#6ee7b7' }}>
            Open 7 Days a week: 8:00 AM - 10:00 PM IST
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div>
          © {new Date().getFullYear()} Blast Crackers Sivakasi. All rights reserved. 100% Genuine Green Fireworks.
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => onOpenLegal && onOpenLegal('safety')}>Safety Guidelines</span>
          <span>•</span>
          <span style={{ cursor: 'pointer' }} onClick={() => onOpenLegal && onOpenLegal('delivery')}>PESO Compliant</span>
          <span>•</span>
          <span style={{ cursor: 'pointer' }} onClick={() => onOpenLegal && onOpenLegal('cancellation')}>Fair Refunds</span>
        </div>
      </div>
    </footer>
  );
};
