const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { manageNewEmail } = require('../Controllers/newEmailController2');
const {addJob2} = require('./producer');
const { connection } = require('./bullmq-config');
const {connectDB} = require('../Database/connectDB');

// const redisClient = new Redis(); 

const getEmailWorker = new Worker('email-queue', async (job) => {
  connectDB();
  // console.log(`Worker 1 processing job ${job.id}`);

  const emailData = await manageNewEmail(job.data);

  if(emailData === "No new email to process" || emailData==null){
    return "No new email to process";
  } else{
    
    // const response = await addJob2(emailData);
    // return response;
    for (const data of emailData) {
       await addJob2(data);
    }
    return;
    
  }
  // console.log("got email data ");

  
}, {
    connection ,
    concurrency: 1,
});

getEmailWorker.on('completed', job => {
  // console.log(`Worker 1 job ${job.id} completed`);
});

getEmailWorker.on('failed', (job, err) => {
  console.error(`Worker 1 job ${job.id} failed with error ${err.message}`);
});

module.exports = {getEmailWorker};

