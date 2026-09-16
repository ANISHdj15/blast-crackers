// server/services/notificationService.js
// Order Notification Dispatcher Service
// Handles dispatching notification events (in-app audit logging, extensible for SMS/Email/WhatsApp gateways)

class NotificationService {
  constructor() {
    this.subscribers = [];
  }

  // Subscribe custom listeners (e.g. for future SMS or webhook providers)
  subscribe(fn) {
    if (typeof fn === 'function') {
      this.subscribers.push(fn);
    }
  }

  /**
   * Dispatch an order event
   * @param {string} eventType e.g., 'order_placed', 'payment_submitted', 'payment_verified', 'order_shipped', 'order_delivered', 'order_cancelled'
   * @param {object} payload data containing orderId, orderNumber, customerName, customerPhone, customerEmail, amount, etc.
   */
  async notify(eventType, payload) {
    const timestamp = new Date().toISOString();
    const eventRecord = {
      event: eventType,
      orderId: payload.orderId || null,
      orderNumber: payload.orderNumber || 'N/A',
      customerName: payload.customerName || 'Customer',
      recipientPhone: payload.customerPhone || null,
      recipientEmail: payload.customerEmail || null,
      amount: payload.amount || null,
      notes: payload.notes || '',
      timestamp
    };

    console.log(`[NOTIFICATION SERVICE] Event: ${eventType.toUpperCase()} | Order: ${eventRecord.orderNumber} | Customer: ${eventRecord.customerName} | Time: ${timestamp}`);

    // Call any registered listeners safely
    for (const listener of this.subscribers) {
      try {
        await listener(eventRecord);
      } catch (err) {
        console.error('[NOTIFICATION SERVICE] Listener error:', err.message);
      }
    }

    return eventRecord;
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
