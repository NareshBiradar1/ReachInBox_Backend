const { emailQueue, newEmailsQueue, openaiResponseQueue } = require('./bullmq-config');

async function addJob(jobData) {
    await emailQueue.add(
        'task', 
        jobData, 
        {
            removeOnComplete: true, 
            removeOnFail: true      
        }
    );
    console.log('Job added to queue1:');
}

async function addJob2(jobData) {
    await newEmailsQueue.add(
        'task', 
        jobData, 
        {
            removeOnComplete: true, 
            removeOnFail: true      
        }
    );
    console.log('Job added to queue2:');
}

async function addJob3(jobData) {
    await openaiResponseQueue.add(
        'task', 
        jobData, 
        {
            removeOnComplete: true, 
            removeOnFail: true     
        }
    );
    console.log('Job added to queue3:');
}

module.exports = { addJob, addJob2, addJob3 };
