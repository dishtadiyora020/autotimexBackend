import './config/loadEnv.js';
import './config/db.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes/index.js';
import { notFoundResponse } from './middleware/responses.js';
import { fileURLToPath } from 'url';

const app = express();

app.use(cors());

app.use(
    express.json({
        limit: '1024mb'
    })
);
app.use(
    express.urlencoded({
        limit: '1024mb',
        extended: true
    })
);
app.set('trust proxy', true);
app.use('/api', routes);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'public')));
app.all('*', (req, res) => {
    return notFoundResponse(res, { message: "Route not found" });
});

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
    console.log(`Server is listening... && Base URI: http://localhost:${PORT}`);
});
