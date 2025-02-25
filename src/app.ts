
import express, { Request, Response } from 'express';
import axios from 'axios';
import cron from 'node-cron';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3020;

dotenv.config();

app.use(express.json());
app.use(cors());

const CLOUDFLARE_API_KEY: string = process.env.CLOUDFLARE_API_KEY || '';
const CLOUDFLARE_ZONE_ID: string = process.env.CLOUDFLARE_ZONE_ID || '';
const TELEX_WEBHOOK_URL: string = process.env.TELEX_WEBHOOK_URL || '';


const LATENCY_QUERY = `
  query {
    viewer {
      zones(filter: { zoneTag: "${CLOUDFLARE_ZONE_ID}" }) {
        httpRequests1dGroups(limit: 1, filter: { date_geq: "2025-02-25", date_leq: "2025-02-26" }) {
          sum {
            countryMap {
              clientCountryName
              requests
            }
            bytes
            cachedBytes
            requests
            cachedRequests
          }
          dimensions {
            date
          }
        }
      }
    }
  }
`;

const fetchLatencyData = async () => {
    try {
        const response = await axios.post(
            'https://api.cloudflare.com/client/v4/graphql',
            {
                query: LATENCY_QUERY,
            },
            {
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const latencyData = response.data;
        console.log('Latency Data:', latencyData);

        await sendToTelex(latencyData);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error details:', error.response?.data);
        } else {
            console.error('Unexpected error:', error);
        }
    }
};

const sendToTelex = async (data: any) => {
    try {
        const telexResponse = await axios.post(
            TELEX_WEBHOOK_URL,
            {
                event_name: "Cloudflare Latency Check",
                message: `Cloudflare Latency Data: ${JSON.stringify(data)}`,
                status: "success",
                username: "jayudoye"
              }, {
                headers: {
                  accept: "application/json",
                  "Content-Type": "application/json"
                }
              });

        console.log('Data sent to Telex:', telexResponse.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Telex API Error:', error.response?.data);
        } else {
            console.error('Unexpected Telex API Error:', error);
        }
    }
};

cron.schedule('*/10 * * * *', () => {
    console.log('Fetching latency data...');
    fetchLatencyData();
});

app.get('/latency', async (req: Request, res: Response) => {
    try {
        await fetchLatencyData();
        res.send('Latency data fetched and sent to Telex successfully.');
    } catch (error) {
        res.status(500).send('Error fetching latency data');
    }
});

app.get("/integration.json", (req, res) => {
    const filePath = path.join(process.cwd(), "integrationSpec.json");
    fs.readFile(filePath, "utf8", (error, data) => {
      if (error) {
        return res.status(500).json({ error: "can't read the Integration file" });
      }
      try {
        const json = JSON.parse(data);
        res.status(200).json(json);
      } catch (error) {
        res.status(500).json({ error: "error from json" });
      }
    });
  });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
