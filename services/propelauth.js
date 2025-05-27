import { initBaseAuth } from '@propelauth/node';

const propelAuth = initBaseAuth({
    authUrl: process.env.PROPEL_AUTH_AUTH_URL,
    apiKey: process.env.PROPEL_AUTH_API_KEY,
});

export default propelAuth;