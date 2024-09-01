const express = require('express');
const router = express.Router();
const {addJob} = require('../Task-Scheduler/producer');

const { manageNewEmail } = require('../Controllers/newEmailController');

// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env') });

// const { PubSub } = require('@google-cloud/pubsub');
// const projectId = 'galvanized-yeti-434222-f2';
// const subscriptionName = 'projects/galvanized-yeti-434222-f2/subscriptions/gmail-notifications-pull';


  

// function messageHandler(message) {
//     console.log(`Received message: ${message.data.toString()}`);
//     console.log(`Message ID: ${message.id}`);
//     console.log(`Attributes: ${JSON.stringify(message.attributes)}`);
  
//     // Acknowledge the message
//     message.ack();
//   }
  // Function to listen for messages
// async function listenForMessages() {
//     console.log("listening for messages");
//     console.log(process.env.GOOGLE_CLOUD_CLIENT_EMAIL);
//       console.log(process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'));
//       console.log(subscriptionName);

//     const pubSubClient = new PubSub({
//         projectId: 'galvanized-yeti-434222-f2',
//         credentials: {
//           client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
//           private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
//         }
//       });

      

//     // Get a reference to the subscription
//     const subscription = pubSubClient.subscription(subscriptionName);
//     console.log(subscription);
  
//     // Listen for new messages
//     subscription.on('message', messageHandler);
  
//     // Listen for errors
//     subscription.on('error', (error) => {
//       console.error(`Received error: ${error}`);
//     });
  
//     console.log(`Listening for messages on ${subscriptionName}...`);
//   }




router.post('/notifications', async (req, res) => {
  
    console.log('New email received:');
   
    const emailData = await addJob(req.body);
    return res.status(200);
    
});

// async function pullMessages() {
//     try {
//         subscriber.on('message', async (message) => {
//             console.log('Received message:', message);
        
//         });
    //   const [messages] = await subscription.pull({
    //     maxMessages: 10,
    //   });
  
    //   for (const message of messages) {
    //     const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    //     console.log(data);
        // const { historyId } = data;
  
        // Check if we've already processed this message
        // if (processedMessageIds.has(message.id)) {
        //   console.log(`Skipping duplicate message: ${message.id}`);
        //   subscription.ack(message.ackId);
        //   continue;
        // }
  
        // Check if this message has a newer history ID
        // if (historyId <= highestProcessedHistoryId) {
        //   console.log(`Skipping old history ID ${historyId}. Current highest: ${highestProcessedHistoryId}`);
        //   subscription.ack(message.ackId);
        //   continue;
        // }
  
        // try {
        //     await processNotification(data);
        //     highestProcessedHistoryId = Math.max(highestProcessedHistoryId, historyId);
        //     processedMessageIds.add(message.id);
        //     subscription.ack(message.ackId);
    
        //     // Limit the size of the Set to prevent memory issues
        //     if (processedMessageIds.size > 1000) {
        //       const oldestId = processedMessageIds.values().next().value;
        //       processedMessageIds.delete(oldestId);
        //     }
        //   } catch (error) {
        //     console.error('Error processing message:', error);
        //     // Nack the message so it can be redelivered
        //     subscription.nack(message.ackId);
        //   }
        // }
//       } catch (error) {
//         console.error('Error pulling messages:', error);
//       }

//     //   setTimeout(pullMessages, 1000); // Pull every second

// }



// setTimeout(pullMessages, 1000);

module.exports = router;


