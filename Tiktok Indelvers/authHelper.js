const crypto = require('crypto');
const axios = require('axios');

function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

const verifier = base64URLEncode(crypto.randomBytes(32));
const challenge = base64URLEncode(sha256(verifier));

const Authorization = () => {
    return encodeURI(`https://www.tiktok.com/v2/auth/authorize?` +
        `client_key=${process.env.CLIENT_KEY}` +
        `&scope=user.info.basic` +
        `&response_type=code` +
        `&redirect_uri=${process.env.REDIRECT_URI}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`);
}

const getAccessToken = async (code) => {
    try {
        const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', null, {
            params: {
                client_key: process.env.CLIENT_KEY,
                client_secret: process.env.CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                code_verifier: verifier
            }
        });

        const { access_token } = response.data.data;
        return access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch access token');
    }
}

module.exports = {
    Authorization,
    getAccessToken,
    verifier
}