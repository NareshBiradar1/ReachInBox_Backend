const { google } = require('googleapis');

function getGmailClient(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function getRecentThreads(accessToken) {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.threads.list({
    userId: 'me',
    maxResults: 10,
    q: 'is:unread'
  });
  
  return response.data.threads || [];
}



async function getThreadDetails(accessToken, threadId) {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full'  
  });
  
  return response.data;
}

function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function extractEmailContent(message) {
  let content = '';
  const parts = message.payload.parts || [message.payload];
  
  for (const part of parts) {
    if (part.mimeType === 'text/plain') {
      content += decodeBase64Url(part.body.data);
    }
  }
  
  return content;
}

// async function processRecentThreads(accessToken) {/
  // const threads = await getRecentThreads(accessToken);
  // const processedThreads = [];

  // console.log(`Processing ${threads.length} recent threads`);

  // for (const thread of threads) {
  //   const threadDetails = await getThreadDetails(accessToken, thread.id);
  //   const processedMessages = [];

  //   for (const message of threadDetails.messages) {
  //     const subject = message.payload.headers.find(h => h.name.toLowerCase() === 'subject').value;
  //     const from = message.payload.headers.find(h => h.name.toLowerCase() === 'from').value;
  //     const content = extractEmailContent(message);

  //     processedMessages.push({
  //       id: message.id,
  //       subject,
  //       from,
  //       content
  //     });
  //   }

  //   processedThreads.push({
  //     id: thread.id,
  //     messages: processedMessages
  //   });

  //   console.log(`Processed thread: ${thread.id}`);
  //   console.log('---');
  // }

  // return processedThreads;
// }
async function processRecentThreads(accessToken) {
    const threads = await getRecentThreads(accessToken);
    const processedThreads = [];
  
    console.log(`Processing ${threads.length} recent threads`);
  
    for (const thread of threads) {
      console.log(`\nProcessing thread: ${thread.id}`);
      const threadDetails = await getThreadDetails(accessToken, thread.id);
      const processedMessages = [];
  
      console.log(`This thread contains ${threadDetails.messages.length} messages:`);
  
      for (const message of threadDetails.messages) {
        const subject = message.payload.headers.find(h => h.name.toLowerCase() === 'subject').value;
        const from = message.payload.headers.find(h => h.name.toLowerCase() === 'from').value;
        const to = message.payload.headers.find(h => h.name.toLowerCase() === 'to').value;
        const date = message.payload.headers.find(h => h.name.toLowerCase() === 'date').value;
        const content = extractEmailContent(message);
  
        console.log(`\n  Message ID: ${message.id}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  From: ${from}`);
        console.log(`  To: ${to}`);
        console.log(`  Date: ${date}`);
        console.log(`  Is Unread: ${message.labelIds.includes('UNREAD') ? 'Yes' : 'No'}`);
        console.log(`  Content Preview: ${content.substring(0, 100)}...`);
  
        processedMessages.push({
          id: message.id,
          subject,
          from,
          to,
          date,
          isUnread: message.labelIds.includes('UNREAD'),
          content
        });
      }
  
      processedThreads.push({
        id: thread.id,
        messages: processedMessages
      });
  
      console.log('\n---');
    }
  
    return processedThreads;
  }

module.exports = { processRecentThreads };