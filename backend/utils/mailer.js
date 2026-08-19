const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

const sendErrorNotification = async (developers, bugDetails, appName) => {
  if (!process.env.SMTP_HOST) {
    console.log('SMTP config missing, skipping email notification.');
    console.log('Would have sent to:', developers.map(d => d.email).filter(Boolean).join(', '));
    return;
  }
  
  const mailList = developers.map(d => d.email).filter(Boolean);
  if (mailList.length === 0) return;

  const mailOptions = {
    from: `"App Catalog" <${process.env.SMTP_USER || 'noreply@example.com'}>`,
    to: mailList.join(','),
    subject: `[Bug Report] New Error in ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #d9534f;">New Error / Bug Reported</h3>
        <p>A new error has been reported by an external user. Details are as follows:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">Application</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${appName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reported By</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${bugDetails.reportedBy || 'Unknown User'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Description</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${bugDetails.description}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Please check the application catalog system for more details and to view any attached screenshots.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Error notification email sent to ${mailList.length} developer(s).`);
  } catch (err) {
    console.error('Failed to send error notification email:', err);
  }
};

module.exports = {
  sendErrorNotification
};
