const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function sendEmailService({emailData, originalMessageData}) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );
}

module.exports = {
    sendEmailService,
}
