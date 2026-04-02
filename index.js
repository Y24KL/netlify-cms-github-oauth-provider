const express = require('express');
const axios = require('axios');
const app = express();

const port = process.env.PORT || 3000;

app.get('/auth', (req, res) => {
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.OAUTH_CLIENT_ID}&scope=repo,user`);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' },
    });

    const { access_token } = response.data;

    res.send(`
      <html><body><script>
        (function() {
          function recieveMessage(e) {
            window.opener.postMessage('authorization:github:success:{"token":"${access_token}","provider":"github"}', e.origin);
          }
          window.addEventListener("message", recieveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })()
      </script></body></html>
    `);
  } catch (error) {
    res.send(error.message);
  }
});

app.listen(port, () => console.log(`Proxy listening on port ${port}`));
