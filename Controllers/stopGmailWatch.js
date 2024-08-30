const {google} = require('googleapis');
const { connectDB } = require('../Database/connectDB');
const userAccountController = require('./userAccountController');

async function stopGmailWatch(auth, userId = 'me') {
  try {
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.stop({
      userId: userId
    });
    console.log('Gmail watch stopped successfully');
  } catch (error) {
    console.error('Error stopping Gmail watch:', error);
    throw error;
  }
}

async function createAuthClient(refreshToken , accessToken) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    return oauth2Client;
}

async function stopWatchForUser(email) {
await connectDB();

const refreshToken = await userAccountController.getRefreshTokenByEmail(email);
const accessToken = await userAccountController.getAccessToken(email);

const authClient = await createAuthClient(refreshToken , accessToken);

await stopGmailWatch(authClient);
// await userAccountController.deleteUserAccountByEmail(email);

console.log("Gmail watch stopped successfully for user ", email);

}


module.exports = {
    stopWatchForUser
}