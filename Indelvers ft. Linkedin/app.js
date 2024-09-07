const express = require('express');
var cluster = require('cluster');
var bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const {
    Authorization
} = require("./authHelper");
require("dotenv").config();

var port = 4000;
process.env.NODE_NO_WARNINGS = 1;

var cCPUs = 1;
if (cluster.isMaster) {
    // Create a Worker for each CPU
    for (var i = 0; i < cCPUs; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' is online.');
    });
} else {
    var app = express();
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views')); // Set the views directory

    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });

    app.get('/', (req, res) => {
        res.render('index'); // Render the index.ejs file
    });

    app.get('/api/linkedin/authorize', (req, res) => {
        return res.redirect(Authorization());
    });

    app.get('/api/linkedin/redirect', async (req, res) => {
        // Use the access token from the .env file
        const accessToken = process.env.ACCESS_TOKEN;

        try {
            // Retrieve user info using the access token
            const userInfo = await axios.get('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });

            // Log the user information to the console
            console.log('User Information:', userInfo.data);

            res.render('success', { userInfo: userInfo.data }); // Render the success.ejs file with user info
        } catch (error) {
            console.error('Error fetching user info:', error);
            res.status(500).send('Error fetching user info');
        }
    });
}