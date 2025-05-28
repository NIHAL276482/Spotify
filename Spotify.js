const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.get('/', async (req, res) => {
  const spotifyUrl = req.query.url;

  if (!spotifyUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Step 1: Fetch Spotmate homepage
    const homepage = await axios.get('https://spotmate.online', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    });

    const $ = cheerio.load(homepage.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');

    const setCookie = homepage.headers['set-cookie'];
    let sessionCookie = '';
    if (setCookie) {
      for (const cookie of setCookie) {
        if (cookie.startsWith('spotmateonline_session=')) {
          sessionCookie = cookie.split(';')[0];
          break;
        }
      }
    }

    // Step 2: POST to convert endpoint
    const convertRes = await axios.post(
      'https://spotmate.online/convert',
      { urls: spotifyUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'cookie': sessionCookie,
          'sec-ch-ua-platform': '"Android"',
          'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          'dnt': '1',
          'sec-ch-ua-mobile': '?1',
          'origin': 'https://spotmate.online',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://spotmate.online/en',
          'accept-language': 'en-US,en;q=0.9'
        }
      }
    );

    res.json(convertRes.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
