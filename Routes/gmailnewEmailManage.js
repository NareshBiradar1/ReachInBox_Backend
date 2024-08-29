const express = require('express');
const router = express.Router();
const {addJob} = require('../Task-Scheduler/producer');

const { manageNewEmail } = require('../Controllers/newEmailController');


router.post('/notifications', async (req, res) => {
  

    // const emailData = await manageNewEmail(req.body);

    // return emailData;

    const emailData = await addJob(req.body);
    return emailData;
    
});

module.exports = router;


