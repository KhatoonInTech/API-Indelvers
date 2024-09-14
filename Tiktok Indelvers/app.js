require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const {
    Authorization,
    getAccessToken
} = require("./authHelper");

const port = process.env.PORT || 4000;
process.env.NODE_NO_WARNINGS = 1;

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index');
});
app.get('/auth/terms-of-service', (req, res) => {
    res.render('terms-of-service');
});
app.get('/auth/privacy-policy', (req, res) => {
    res.render('privacy-policy');
});

app.get('/auth', (req, res) => {
    res.redirect(Authorization());
   
 });
app.get('https://www.linkedin.com/in/khatoonintech',(req,res) => {
    const { code } = req.query;
    console.log(`code: ${code}`)
    if (!code) {
        return res.status(400).send('Authorization code not found');
    }
});
app.get('/redirect', async (req, res) => {
    

    try {
        const accessToken = await getAccessToken(code);

        const userInfo = await axios.get('https://open-api.tiktok.com/user/info/', {
            params: {
                access_token: accessToken,
                fields: ['open_id', 'union_id', 'avatar_url', 'display_name']
            }
        });

        console.log('User Information:', userInfo.data);

        res.render('success', { userInfo: userInfo.data.data.user });
    } catch (error) {
        console.error('Error in TikTok authentication:', error.response ? error.response.data : error.message);
        res.status(500).send('Error in TikTok authentication');
    }
});

app.listen(port, () => {
    console.log(`Server started and listening on http://localhost:${port}`);
    //console.log(`Redirect URI: ${process.env.REDIRECT_URI}`);
});