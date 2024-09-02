const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const userAccountController = require('./userAccountController');
const { connectDB } = require('../Database/connectDB');

// This function creates and returns an authenticated OAuth2Client
async function createAuthClient(refreshToken, accessToken) {
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

async function fetchnewEmails(historyChanges, lastProcessedId, auth , email) {
    const gmail = google.gmail({ version: 'v1', auth });
    const processedEmails = [];


    // const filteredChanges = historyChanges.filter(change => change.id > lastProcessedId);
    const filteredChanges = [];
    for (let i = 0; i < historyChanges.length; i++) {
        const change = historyChanges[i];

        const changeId = parseInt(change.id,10);
        console.log('Change id: ', changeId + ' ' + typeof(changeId));
        console.log('last id , ' + lastProcessedId + ' ' + typeof(lastProcessedId));
        if (changeId > lastProcessedId) {
            await userAccountController.updateHistoryIdByEmail(email , changeId);
            filteredChanges.push(change);
        }
    }
    console.log('Filtered changes:', filteredChanges.length);

    for (const change of filteredChanges) {
        // Check if 'messagesAdded' exists and is an array
        if (Array.isArray(change.messagesAdded)) {
            for (const messageWrapper of change.messagesAdded) {
                const message = messageWrapper.message;
                // Check if labelIds contains both 'UNREAD' and 'INBOX'
                if (message.labelIds.includes('UNREAD') && message.labelIds.includes('INBOX')) {
                    const latestMessageId = message.id;
                    const threadId = message.threadId;
                    const messageDetails = await gmail.users.messages.get({
                        userId: 'me',
                        id: latestMessageId,
                    });
                    const thread = await gmail.users.threads.get({
                        userId: 'me',
                        id: threadId,
                    });

                    console.log('Thread retrieved successfully');

                    const messageDetails2 = extractMessageDetails(thread.data);
                    await removeUnreadLabel(auth, latestMessageId);

                    console.log('Extracted message details:', JSON.stringify(messageDetails2, null, 2));

                    let finalMessage = {
                        thread: messageDetails2,
                        originalMessage: messageDetails
                    };
                    processedEmails.push(finalMessage);

                }
            }
        }
    }
    return processedEmails;

}
async function getHistoryChanges(auth, startHistoryId, lastProcessedId , email) {
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const response = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: startHistoryId,
            historyTypes: ['messageAdded']
        });
        console.log('History changes fetched successfully');
        const processesEmails = await fetchnewEmails(response.data.history || [], lastProcessedId, auth , email);
        return processesEmails;
        // return response.data.history || [];
    } catch (error) {
        console.error('Error fetching history changes:', error);
        throw error;
    }
}
async function retrieveSpecificMessage(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const response = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        });

        return response.data;
    } catch (error) {
        console.error(`Error retrieving message ${messageId}:`, error);
        throw error;
    }
}
async function processInboxMessage(messageData, labels) {
    console.log(`Processing INBOX message: ${messageData.id}`);

    const subject = messageData.payload.headers.find(header => header.name === 'Subject').value;
    const from = messageData.payload.headers.find(header => header.name === 'From').value;

    // Implement your message processing logic here
    // For example, categorize the message, generate a response, etc.
    if (labels.includes('CATEGORY_PERSONAL')) {
        console.log(`Personal email from ${from}: ${subject}`);
        // Handle personal email
    } else if (labels.includes('CATEGORY_PROMOTIONS')) {
        console.log(`Promotional email: ${subject}`);
        // Handle promotional email
    } else {
        console.log(`Other email from ${from}: ${subject}`);
        // Handle other types of email
    }

    // Add your AI processing and response sending logic here
}
async function manageNewEmail(userData) {

    console.log("inside manage new email");
    try {
        await connectDB();

        let message;
        if (typeof userData === 'object') {
            message = userData;
        } else {
            message = JSON.parse(userData.toString());
        }
        if (message.message && message.message.data) {
            const decodedData = JSON.parse(Buffer.from(message.message.data, 'base64').toString());

            const email = decodedData.emailAddress;
            console.log("inside manage new email for email = " + email);

            const newHistoryId = decodedData.historyId;
            const latestProcessedHistoryId = await userAccountController.getHistoryIdByEmail(email);



            // if(latestProcessedHistoryId != null && newHistoryId <= latestProcessedHistoryId){
            //     console.log("No new email to process");
            //   return "No new email to process";
            // }
            // console.log("got greater history id")

            // await userAccountController.updateHistoryIdByEmail(email , newHistoryId);

            const refreshToken = await userAccountController.getRefreshTokenByEmail(email);

            // const messageId = message.message.messageId;
            const accessToken = await userAccountController.getAccessToken(email);


            let authClient = await createAuthClient(refreshToken, accessToken);

            console.log("histoty changes start");

            const historyChanges = await getHistoryChanges(authClient, newHistoryId, latestProcessedHistoryId , email);
            // console.log("history changes ", JSON.stringify(historyChanges));
            console.log("history changes end");


            // let allMessages = await retrieveThreadFromMessage(authClient , messageId);
            return historyChanges;

        } else {
            console.log('Unexpected message format:', message);
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing notification:', error);
        return res.status(400).send('Error processing notification');
    }
}

async function retrieveThreadFromMessage(auth, messageId) {
    try {
        console.log('notification got for message id ;- ', messageId);

        const gmail = google.gmail({ version: 'v1', auth });

        // Step 1: Get the latest unread message
        console.log('Fetching latest unread message...');
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread',
            maxResults: 1,
        });

        if (!response.data.messages || response.data.messages.length === 0) {
            console.log('No unread messages found.');
            return null;
        }

        const latestMessageId = response.data.messages[0].id;
        console.log(`Latest unread message ID: ${latestMessageId}`);

        // Step 2: Get the thread ID of the latest unread message
        console.log('Fetching message details to get thread ID...');
        const messageDetails = await gmail.users.messages.get({
            userId: 'me',
            id: latestMessageId,
        });

        // console.log('messageDetails' , messageDetails);

        const threadId = messageDetails.data.threadId;
        console.log(`Thread ID of the latest unread message: ${threadId}`);

        // Step 3: Get the entire thread
        console.log('Fetching the entire thread...');
        const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
        });

        console.log('Thread retrieved successfully');
        // console.log(JSON.stringify(thread.data));
        // return thread.data;
        const messageDetails2 = extractMessageDetails(thread.data);
        await removeUnreadLabel(auth, latestMessageId);
        console.log('Extracted message details:', JSON.stringify(messageDetails2, null, 2));

        let finalMessage = {
            thread: messageDetails2,
            originalMessage: messageDetails
        };
        return finalMessage;

    } catch (error) {
        console.error('Error retrieving latest unread thread:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        throw error;
    }
}

async function removeUnreadLabel(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                removeLabelIds: ['UNREAD']
            }
        });
        console.log(`UNREAD label removed from message ${messageId}`);
    } catch (error) {
        console.error(`Error removing UNREAD label from message ${messageId}:`, error);
        throw error;
    }
}
function extractMessageDetails(threadData) {
    const thread = typeof threadData === 'string' ? JSON.parse(threadData) : threadData;

    return thread.messages.map(message => {
        const headers = message.payload.headers;
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        let bodyContent = '';
        if (message.payload.body.data) {
            bodyContent = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
        } else if (message.payload.parts) {
            const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
            if (textPart && textPart.body.data) {
                bodyContent = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
        }

        return {
            id: message.id,
            from: getHeader('from'),
            to: getHeader('to'),
            subject: getHeader('subject'),
            date: getHeader('date'),
            body: bodyContent.trim()
        };
    });
}




module.exports = {
    manageNewEmail
}