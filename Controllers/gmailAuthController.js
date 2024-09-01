require('dotenv').config();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const {saveUserToDb} = require('./userAccountController');



const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

function getGoogleOAuthUrl(userId) {

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/gmail.modify",
        ].join(" "),
        state : userId,
    }

    const qs = new URLSearchParams(options).toString();

    return `${rootUrl}?${qs}`;
}

async function saveUser(code , userId , timestamp) {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URL,
        grant_type: 'authorization_code',
      });

      const { email, iss } = await getUserEmail(data.id_token);
      
      await saveUserToDb({
        userId : userId,
        accountEmail : email,
        iss : iss,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: timestamp + (45*60 * 1000),
      });

      console.log("User saved to DB");
      
      oauth2Client.setCredentials({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: (new Date()).getTime() + (45*60 * 1000)
    });

    console.log("Credentials set");

    const watchResponse = await setupGmailWatch(oauth2Client);

    return watchResponse;

}

async function setupGmailWatch(auth) {
    try {
        console.log('Setting up watch');

        const gmail = google.gmail({ version: 'v1', auth });
        const watchResponse = await gmail.users.watch({
            userId: 'me',
            requestBody: {
                topicName: `projects/${process.env.PROJECT_ID}/topics/${process.env.TOPIC_NAME}`,
                labelIds: ['INBOX'],
                labelFilterBehavior: 'INCLUDE',
                historyTypes: ['messageAdded'],
            },
        });

        console.log('Watch setup:', watchResponse.data);
        return watchResponse.data;
    } catch (error) {
        console.error('Error during watch setup:', error);
        throw error;
    }
}

async function getUserEmail(idToken){
    try {
        const decoded = jwt.decode(idToken);
        
        return { email: decoded.email, iss: decoded.iss };

    } catch (err) {
        console.error('Error decoding JWT:', err);
        return null;
    }
}

module.exports = {getGoogleOAuthUrl, saveUser};