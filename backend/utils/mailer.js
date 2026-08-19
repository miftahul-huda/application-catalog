const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.GMAIL_OAUTH_CLIENT_ID) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.SMTP_USER || process.env.GMAIL_USER,
        clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
        clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN
      }
    });
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
  } else {
    // Fallback to Ethereal Email for testing if no SMTP config is provided
    console.log('No SMTP config found. Generating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
};

const sendErrorNotification = async (developers, bugDetails, appName, reporterEmail) => {
  const mailList = developers.map(d => d.email || (d.user && d.user.email)).filter(Boolean);
  
  if (mailList.length === 0) {
    console.log('No developer emails found to notify.');
    return;
  }

  const mailOptions = {
    from: `"AppCat Alerts" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'alerts@appcat.local'}>`,
    to: mailList.join(','),
    subject: `[Bug Report] New Error in ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #d9534f;">New Error / Bug Reported</h3>
        <p>A new error has been reported by an external user. Details are as follows:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">Error ID</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${bugDetails.id || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Application</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${appName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reported By</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${bugDetails.reportedBy || 'Unknown User'} ${reporterEmail ? `(${reporterEmail})` : ''}</td>
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
    const tp = await getTransporter();
    const info = await tp.sendMail(mailOptions);
    console.log(`Error notification email sent to ${mailList.length} developer(s).`);
    
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('Failed to send error notification email:', err);
  }
};

module.exports = {
  sendErrorNotification
};
