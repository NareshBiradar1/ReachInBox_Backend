const {google} = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const userAccountController = require('./userAccountController');
const { connectDB } = require('../Database/connectDB');
const { processRecentThreads } = require('./test');

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

async function manageNewEmail(userData){
    try {
        await connectDB();

        let message;
        if (typeof userData === 'object') {
            message = userData;
        } else {
            message = JSON.parse(userData.toString());
        }
        console.log(userData);
        if (message.message && message.message.data) {
            const decodedData = JSON.parse(Buffer.from(message.message.data, 'base64').toString());

            const email = decodedData.emailAddress;
            
            const refreshToken = await userAccountController.getRefreshTokenByEmail(email);

            const messageId = message.message.messageId;
            const accessToken = await userAccountController.getAccessToken(email);

            
            // await processNewEmail(decodedData.emailAddress, messageId, refreshToken);
            let authClient = await createAuthClient(refreshToken , accessToken);
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
async function getLatestUnreadMessage(oauth2Client) {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        // Fetch the list of unread messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread', // Query to filter unread messages
            maxResults: 1, // Only need the latest one
        });
        
        const messages = response.data.messages;

        if (messages && messages.length > 0) {
            const messageId = messages[0].id;
            
            // Fetch the message details
            const messageResponse = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full', // Use 'full' to get all details
            });

            const message = messageResponse.data;
            console.log('Latest unread message:', message);
            return message;
        } else {
            console.log('No unread messages found.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching unread messages:', error);
        throw error;
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
          thread : JSON.stringify(messageDetails2, null, 2),
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
// Function to get the Gmail message
// async function getMessage(accessToken, messageId) {
//     const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  
//     const headers = {
//       Authorization: `Bearer ${accessToken}`,
//     };
  
//     try {
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: headers,
//       });
  
//       if (!response.ok) {
//         throw new Error(`Error: ${response.status} ${response.statusText}`);
//       }
  
//       const messageData = await response.json();
//       console.log('Message retrieved:', messageData);
  
//       // Process the message data
//       return messageData;
//     } catch (error) {
//       console.error('Failed to retrieve the message:', error);
//     }
//   }

// async function processNewEmail(email, messageId, refreshToken) {
//     try {
//         console.log(`Processing email for: ${email}, Message ID: ${messageId}`);

//         const oauth2Client = new google.auth.OAuth2(
//             process.env.GOOGLE_CLIENT_ID,
//             process.env.GOOGLE_CLIENT_SECRET
//         );

//         oauth2Client.setCredentials({
//             refresh_token: refreshToken
//         });

//         const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

//         let message;
//         try {
//             // Try to fetch the specific message
//             message = await gmail.users.messages.get({
//                 userId: 'me',
//                 id: messageId,
//                 format: 'full'
//             });
//         } catch (error) {
//             console.error('Error fetching specific message:', error);
            
//             // Fallback: List recent messages
//             const response = await gmail.users.messages.list({
//                 userId: 'me',
//                 maxResults: 1  // Adjust this number as needed
//             });

//             if (response.data.messages && response.data.messages.length > 0) {
//                 const latestMessageId = response.data.messages[0].id;
//                 message = await gmail.users.messages.get({
//                     userId: 'me',
//                     id: latestMessageId,
//                     format: 'full'
//                 });
//                 console.log(`Fetched latest message instead. New Message ID: ${latestMessageId}`);
//             } else {
//                 throw new Error('No messages found');
//             }
//         }

//         // Process the message
//         const headers = message.data.payload.headers;
//         const subject = headers.find(header => header.name.toLowerCase() === 'subject')?.value || 'No Subject';
//         const from = headers.find(header => header.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
//         const to = headers.find(header => header.name.toLowerCase() === 'to')?.value || 'Unknown Recipient';
//         const date = headers.find(header => header.name.toLowerCase() === 'date')?.value || 'Unknown Date';

//         console.log('Processed email:');
//         console.log(`Message ID: ${message.data.id}`);
//         console.log(`Subject: ${subject}`);
//         console.log(`From: ${from}`);
//         console.log(`To: ${to}`);
//         console.log(`Date: ${date}`);

//         // Extract body
//         const body = getMessageBody(message.data.payload);
//         console.log(`Body: ${body.substring(0, 100)}...`); // First 100 characters

//         // Extract attachments
//         const attachments = getAttachments(message.data.payload);
//         console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);

//         // Add your logic here to further process or store the email as needed

//     } catch (error) {
//         console.error('Error processing email:', error);
//         throw error;
//     }
// }

// function getMessageBody(payload) {
//     if (payload.body.data) {
//         return Buffer.from(payload.body.data, 'base64').toString('utf-8');
//     }

//     if (payload.parts) {
//         for (let part of payload.parts) {
//             if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
//                 return Buffer.from(part.body.data, 'base64').toString('utf-8');
//             }
//         }
//     }

//     return 'No readable message body';
// }

// function getAttachments(payload) {
//     let attachments = [];

//     if (payload.parts) {
//         for (let part of payload.parts) {
//             if (part.filename && part.filename.length > 0) {
//                 attachments.push({
//                     filename: part.filename,
//                     mimeType: part.mimeType,
//                     size: part.body.size,
//                     attachmentId: part.body.attachmentId
//                 });
//             }

//             if (part.parts) {
//                 attachments = attachments.concat(getAttachments(part));
//             }
//         }
//     }

//     return attachments;
// }

module.exports = {
    manageNewEmail
}