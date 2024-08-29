const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { manageNewEmail } = require('../Controllers/newEmailController');
const {addJob2} = require('./producer');
const { connection } = require('./bullmq-config');


// const redisClient = new Redis(); 

const sendEmailWorker = new Worker('email-queue', async (job) => {
  console.log(`Worker 1 processing job ${job.id}`);
  // generate thread and save in opeaai queue

  const emailData = await manageNewEmail(job.data);
  console.log("got email data " , emailData);

  const response = await addJob2(emailData);
  return response;
  
}, { 
    connection ,
    concurrency: 10,
});

sendEmailWorker.on('completed', job => {
  console.log(`Worker 1 job ${job.id} completed`);
});

sendEmailWorker.on('failed', (job, err) => {
  console.error(`Worker 1 job ${job.id} failed with error ${err.message}`);
});

module.exports = {sendEmailWorker};

