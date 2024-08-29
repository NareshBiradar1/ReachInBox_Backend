const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {getRefreshTokenByEmail} = require('../Controllers/userAccountController');
const { google } = require('googleapis');

async function sendEmailService({emailData, originalMessageData}) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );

      const refreshToken = await getRefreshTokenByEmail(emailData.from);

      oauth2Client.setCredentials({refresh_token: refreshToken});

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      try {
        const messageId = originalMessageData.data.id;
        const threadId = originalMessageData.data.threadId;
        const headers = originalMessageData.data.payload.headers;
        const subject = headers.find(h => h.name.toLowerCase() === 'subject').value;
        const to = headers.find(h => h.name.toLowerCase() === 'from').value;
    
        const message = [
          `From: ${emailData.from}`,
          `To: ${to}`,
          `Subject: Re: ${subject}`,
          `In-Reply-To: <${messageId}@mail.gmail.com>`,
          `References: <${messageId}@mail.gmail.com>`,
          'Content-Type: text/plain; charset="UTF-8"',
          '',
          emailData.body
        ].join('\r\n');

        const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId,
      },
    });
    console.log('Reply sent successfully:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error sending reply:', error);
    throw error;
  }

}

module.exports = {
    sendEmailService,
}
