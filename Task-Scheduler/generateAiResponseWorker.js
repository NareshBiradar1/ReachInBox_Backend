const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { connection } = require('./bullmq-config');
const {connectDB} = require('../Database/connectDB');
const { generateResponse } = require('../Services/OpenAIService');
// const redisClient = new Redis();
 
const generateResponseWorker = new Worker('newEmails-queue', async (job) => {
  connectDB();
  console.log(`Worker 2 processing job ${job.id}`);
  const aiResponse  = await generateResponse(job.data);

  // aiResponse.then((response) => {
  //   console.log('AI response:', response);
  // });

  if(aiResponse==null){
    console.log('AI response:', 'No response');
  }
  else{
    console.log('AI response:', aiResponse);
  }

  

  
}, { 
  connection ,
  concurrency: 1,
});

generateResponseWorker.on('completed', job => {
  console.log(`Worker 2 job ${job.id} completed`);
});

generateResponseWorker.on('failed', (job, err) => {
  console.error(`Worker 3 job ${job.id} failed with error ${err.message}`);
});

module.exports = {generateResponseWorker};