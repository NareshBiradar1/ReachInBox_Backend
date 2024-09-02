const express = require('express');
const router = express.Router();
const {addJob} = require('../Task-Scheduler/producer');

const { manageNewEmail } = require('../Controllers/newEmailController2');





router.post('/notifications', async (req, res) => {
    console.log('New email received: ');

    const emailData = await addJob(req.body);

    return res.status(200);    
});






module.exports = router;


