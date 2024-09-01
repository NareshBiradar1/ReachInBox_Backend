const {google} = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const userAccountController = require('./userAccountController');
const { connectDB } = require('../Database/connectDB');

// This function creates and returns an authenticated OAuth2Client
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

async function getHistoryChanges(auth, startHistoryId) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  try {
    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: startHistoryId,
      historyTypes: ['messageAdded', 'labelAdded', 'labelRemoved']
    });

    return response.data.history || [];
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
  
  // Extract relevant information from messageData
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
async function manageNewEmail(userData){
    try {
        await connectDB();

        let message;
        if (typeof userData === 'object') {
            message = userData;
        } else {
            message = JSON.parse(userData.toString());
        }
        // console.log(userData);
        if (message.message && message.message.data) {
            const decodedData = JSON.parse(Buffer.from(message.message.data, 'base64').toString());

            const email = decodedData.emailAddress;

            // console.log('userData' , decodedData);
            // console.log('userData', decodedData.historyId);
            // console.log('type ' , typeof decodedData.historyId);
            
            const newHistoryId = decodedData.historyId;
            const latestProcessedHistoryId = await userAccountController.getHistoryIdByEmail(email);

            // console.log('latestProcessedHistoryId' , latestProcessedHistoryId);
            // console.log('newHistoryId' , newHistoryId);

            if(latestProcessedHistoryId != null && newHistoryId <= latestProcessedHistoryId){
                console.log("No new email to process");
              return "No new email to process";
            }
            console.log("got greater history id")
            
            await userAccountController.updateHistoryIdByEmail(email , newHistoryId);

            const refreshToken = await userAccountController.getRefreshTokenByEmail(email);

            const messageId = message.message.messageId;
            const accessToken = await userAccountController.getAccessToken(email);

            
            // await processNewEmail(decodedData.emailAddress, messageId, refreshToken);
            let authClient = await createAuthClient(refreshToken , accessToken);

            // let historyChanges = await getHistoryChanges(authClient , newHistoryId);
            // console.log('historyChanges' , historyChanges);

          // console.log('historyChanges sterted');
          //   for (const change of historyChanges) {
          //     if (change.messagesAdded) {
          //         for (const addedMessage of change.messagesAdded) {
          //           console.log('Processing addedMessage:', addedMessage);
                    
          //           const messageId = addedMessage.message.id;
          //           const threadId = addedMessage.message.threadId;
          //           const labels = addedMessage.message.labelIds;

          //           // Skip processing for SENT messages
          //           if (labels.includes('SENT')) {
          //               console.log(`Skipping SENT message: ${messageId}`);
          //               continue;
          //           }

          //           // Process only INBOX messages
          //           if (labels.includes('INBOX')) {
          //               let messageData = await retrieveSpecificMessage(authClient, messageId);
          //               await processInboxMessage(messageData, labels);
          //           }
                      // let messageData = await retrieveSpecificMessage(authClient, messageId);
                      // Process the new message (e.g., send to AI for response)
                      // await processMessage(messageData);
          //         }
          //     }
          // }

          // console.log('historyChanges ended');
            let allMessages = await retrieveThreadFromMessage(authClient , messageId);
            return allMessages;
            // let unreadMeassge = await  getLatestUnreadMessage(authClient);
            // return unreadMeassge;

            // let processedThreads = await processRecentThreads(accessToken);
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
        const messageDetails =  await gmail.users.messages.get({
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
          thread : messageDetails2,
          originalMessage : messageDetails
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