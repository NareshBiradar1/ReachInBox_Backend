const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const axios = require('axios');

const { getGoogleOAuthUrl, saveUser } = require('../Controllers/gmailAuthController');

router.get('/auth/gmail/:userId', (req,res)=>{
    console.log("Request received for gmail authentication");
    const userId = req.params.userId;                
    
    const url = getGoogleOAuthUrl(userId);

    console.log("Gmail authentication url", url);

    return res.status(200).json({
        success: true,
        message: "Gmail authentication url",
        googleOAuthUrl: url
    });
    

});

router.get('/authenticated', async (req,res)=>{
    console.log("authenticated endpoint hit");

    const { code , state } = req.query;
    const userId = state;

    console.log("Code received from Google", code);
    console.log("User ID received from Google", state);

    if (!code) {
        return res.status(400).json({
            error: 'Authorization unsuccessful',
            message: 'No authorization code received from Google'
        });
    }

    await saveUser(code, userId , Date.now());

    const redirectUrl = 'http://localhost:3001/home';
    return res.redirect(redirectUrl);
});

module.exports = router;