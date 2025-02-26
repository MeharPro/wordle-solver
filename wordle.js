const http = require('http');
const https = require('https');

const fetchWordleSolution = async (year, month, day) => {
  const date = `${year}-${month}-${day}`;
  const url = `https://www.nytimes.com/svc/wordle/v2/${date}.json`;

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};


const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wordle Solution Viewer</title>
      </head>
      <body>
        <h1>Wordle Solution Viewer</h1>
        <form id="wordleForm">
          <label for="year">Year:</label>
          <input type="text" id="year" name="year" required>
          <label for="month">Month:</label>
          <input type="text" id="month" name="month" required>
          <label for="day">Day:</label>
          <input type="text" id="day" name="day" required>
          <button type="submit">Fetch Wordle Solution</button>
          <p>Example: 2024 - 04 - 05</p>
        </form>
        <div id="solution"></div>

        <script>
          document.getElementById('wordleForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const year = document.getElementById('year').value;
            const month = document.getElementById('month').value;
            const day = document.getElementById('day').value;
            try {
              const response = await fetch('/wordle-solution', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ year, month, day })
              });
              if (response.ok) {
                const data = await response.json();
                document.getElementById('solution').innerText = \`Wordle solution: \${data.solution}\`;
              } else {
                throw new Error('Failed to fetch Wordle solution');
              }
            } catch (error) {
              console.error('Error fetching Wordle solution:', error);
              document.getElementById('solution').innerText = 'Error fetching Wordle solution';
            }
          });
        </script>
        <p>Made by Mehar :)</p>
      </body>
      </html>
    `);
  } else if (req.url === '/wordle-solution' && req.method === 'POST') {
    let data = '';
    req.on('data', chunk => {
      data += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { year, month, day } = JSON.parse(data);

        if (!year || !month || !day) {
          throw new Error('Year, month, or day not provided');
        }

        const solution = await fetchWordleSolution(year, month, day);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ solution: solution.solution }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error fetching Wordle solution: ${error.message}`);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
