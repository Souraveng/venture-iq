const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Now you can access it
const apiKey = process.env.GEMINI_API_KEY; 
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "Hello" }] }]
  })
})
.then(res => res.json())
.then(json => console.log(JSON.stringify(json, null, 2)))
.catch(err => console.error(err));
