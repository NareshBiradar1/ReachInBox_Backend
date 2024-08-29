const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const userAccountControllers = require('../Controllers/userAccountController');
const { google } = require('googleapis');
const { type } = require('os');

async function sendEmailService({emailData, originalMessageData}) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );

      const messageId = originalMessageData.data.id;
        const threadId = originalMessageData.data.threadId;
        const headers = originalMessageData.data.payload.headers;
        const subject = headers.find(h => h.name.toLowerCase() === 'subject').value;
        const to = headers.find(h => h.name.toLowerCase() === 'from').value;
        const fromEmail = emailData.from;


      console.log("email data in service ", fromEmail);
      console.log("type of " , typeof(fromEmail));

      const refreshToken = await userAccountControllers.getRefreshTokenByEmail(fromEmail);

      console.log("refresh i main ", refreshToken);

      const accessToken = await userAccountControllers.getAccessToken(fromEmail);

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });
        console.log("set credentials suucessfully");

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      try {
        

    
        const message = [
          `From: ${fromEmail}`,
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
