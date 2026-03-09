import express from 'express'
import http from 'http'
import SetupWSS from './wsSetup.ts'
import axios from "axios";
import cors from "cors"; // You might already have this for your API

const app = express()
const port = 3000

app.use(express.json())
app.get('/', (req, res) => {
    res.send('Hello from Express + WebSocket server!')
});

app.get("/proxy-embed", async (req, res) => {
  const targetUrl = req.query.url; // Get the URL from the query parameter

  if (!targetUrl) {
    return res.status(400).send("Missing 'url' query parameter.");
  }

  try {
    const response = await axios.get(targetUrl, {
      responseType: "arraybuffer", // Important for handling various content types (images, html, etc.)
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36",
      },
      maxRedirects: 5,
    });


    delete response.headers["x-frame-options"];
    delete response.headers["X-Frame-Options"];

    const cspHeader = response.headers["content-security-policy"];
    if (cspHeader) {
      let modifiedCsp = cspHeader;

      // Example: Allow framing from any origin (less secure) or specific origins
      // It's safer to only allow framing from your own frontend domain.
      // You'll need to adjust 'frame-ancestors' directive.
      // For instance, replace 'frame-ancestors 'none'' or 'self'' with 'frame-ancestors *' (less secure)
      // or 'frame-ancestors your-frontend-domain.com'.
      modifiedCsp = modifiedCsp.replace(
        /frame-ancestors\s+[^;]+;?/gi,
        "frame-ancestors 'self' your-frontend-domain.com;" // Replace with your actual frontend domain
      );

      // Or, if you want to be very permissive for testing (use with caution):
      modifiedCsp = modifiedCsp.replace(
        /frame-ancestors\s+[^;]+;?/gi,
        "frame-ancestors *;"
      );

      res.setHeader("Content-Security-Policy", modifiedCsp);
    }

    for (const headerName in response.headers) {
      if (
        !["x-frame-options", "content-security-policy", "set-cookie", "location"].includes(
          headerName.toLowerCase()
        )
      ) {
        res.setHeader(headerName, response.headers[headerName]);
      }
    }

    res.status(response.status).send(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Proxy error for ${targetUrl}: ${error.message} - Status: ${error.response?.status}`
      );
      return res
        .status(error.response?.status || 500)
        .send(`Failed to proxy URL: ${error.message}`);
    }
    console.error(`Unknown proxy error: ${error}`);
    res.status(500).send("An unexpected error occurred during proxying.");
  }
});

const server = http.createServer(app)

console.log("setting up websocket");
SetupWSS(server);

server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${port}`)
})