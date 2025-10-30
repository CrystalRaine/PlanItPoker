import express from 'express'
import http from 'http'
import SetupWSS from './wsSetup.ts'
// import {createProxyMiddleware} from 'http-proxy-middleware'

const app = express()
const port = 3000



// app.use((req, res, next)=>{



//     const proxyMiddleware = createProxyMiddleware({
//         target: 'http://www.example.org/api',
//         changeOrigin: true,
//     });

//     proxyMiddleware(req, res, next);
// });

app.use(express.json())
app.get('/', (req, res) => {
    res.send('Hello from Express + WebSocket server!')
})

const server = http.createServer(app)

console.log("setting up websocket");
SetupWSS(server);

server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${port}`)
})