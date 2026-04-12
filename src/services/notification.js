import axios from 'axios';

class NotificationService {
  constructor() {
    this.useMock = true;
    this.smtpConfig = {
      username: 'ebaydrop@geonoyc.com',
      password: 'Z7NgaRV&Z]_]',
      host: 'business35.web-hosting.com',
      port: 465
    };
  }

  /**
   * Sends an email notification via the SMTP bridge (Node.js backend).
   */
  async sendEmail(to, subject, body) {
    if (this.useMock) {
      console.log(`[Mock Email] To: ${to}, Subject: ${subject}, Body: ${body}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Email sent successfully via SMTP' };
    }

    try {
      // API integration: POST /api/notifications/email
      const response = await axios.post('/api/notifications/email', {
        to,
        subject,
        body,
        config: this.smtpConfig
      });
      return response.data;
    } catch (e) {
      console.error("SMTP Notification Failed", e);
      throw e;
    }
  }

  /**
   * Triggers an automated alert for a product sale.
   */
  async notifySale(productTitle, price) {
    const subject = `🚀 New Sale: ${productTitle}`;
    const body = `Great news! You have a new sale on eBay for "${productTitle}" at $${price}. Time to source the item!`;
    return this.sendEmail('admin@geonoyc.com', subject, body);
  }

  /**
   * Triggers an automated alert for low inventory.
   */
  async notifyLowStock(productTitle, remaining) {
    const subject = `⚠️ Low Inventory Alert: ${productTitle}`;
    const body = `Warning! Your source for "${productTitle}" only has ${remaining} units left. Consider updating your eBay listing.`;
    return this.sendEmail('admin@geonoyc.com', subject, body);
  }

  /**
   * Triggers an automated alert for trending opportunities.
   */
  async notifyTrend(niche) {
    const subject = `🔥 Trending Opportunity in ${niche}`;
    const body = `We've detected a significant spike in searches for ${niche}. Check the Discovery tab for potential winners!`;
    return this.sendEmail('admin@geonoyc.com', subject, body);
  }
}

export default new NotificationService();
