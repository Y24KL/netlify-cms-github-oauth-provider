const express = require('express');
const { AuthorizationCode } = require('simple-oauth2');
const randomstring = require('randomstring');

const app = express();
const port = process.env.PORT || 3000;

const oauth2 = new AuthorizationCode({
  client: {
    id: process.env.OAUTH_CLIENT_ID,
    secret: process.env.OAUTH_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize',
  },
});

app.get('/auth', (req, res) => {
  const authorizationUri = oauth2.authorizeURL({
    redirect_uri: `${process.env.REDIRECT_URL}/callback`, // This builds the link GitHub needs
    scope: 'repo,user',
    state: randomstring.generate(),
  });
  res.redirect(authorizationUri);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const options = {
    code,
    redirect_uri: `${process.env.REDIRECT_URL}/callback`,
  };

  try {
    const accessToken = await oauth2.getToken(options);
    const token = accessToken.token.access_token;

    res.send(`
      <html><body><script>
        (function() {
          function receiveMessage(e) {
            window.opener.postMessage('authorization:github:success:{"token":"${token}","provider":"github"}', e.origin);
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })()
      </script></body></html>
    `);
  } catch (error) {
    res.status(500).json('Authentication failed');
  }
});

app.listen(port, () => {
  console.log(`Proxy listening on port ${port}`);
});
