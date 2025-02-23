import express from 'express';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';
import cron from 'node-cron';
import fs from "fs";
import path from "path";

const app = express();

app.use(express.json());
app.use(cors());

dotenv.config();

const CLOUDFLARE_API_TOKEN: string = process.env.CLOUDFLARE_API_TOKEN || '';
const CLOUDFLARE_ACCOUNT_ID: string = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const TELEX_WEBHOOK_URL: string = process.env.TELEX_WEBHOOK_URL || '';
const LATENCY_THRESHOLD: number = Number(process.env.LATENCY_THRESHOLD) || 500;

interface LatencyIssue {
  dimensions: {
    coloCity: string;
  };
  sum: {
    edgeResponseTimeMs: number;
    requests: number;
  };
};

async function fetchLatencyData(): Promise<LatencyIssue[]> {
  const query = `{
    viewer {
      accounts(filter: {accountTag: "${CLOUDFLARE_ACCOUNT_ID}"}) {
        httpRequests1dGroups {
          dimensions {
            coloCity
          }
          sum {
            edgeResponseTimeMs
            requests
          }
        }
      }
    }
  }`;

  try {
    const response = await axios.post(
      'https://api.cloudflare.com/client/v4/graphql',
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );
    return response.data.data.viewer.accounts[0].httpRequests1dGroups;
  } catch (error) {
    console.error('Error fetching latency data:', error);
    return [];
  }
};

async function sendTelexAlert(issues: LatencyIssue[]): Promise<void> {
  const message = {
    text: `Cloudflare CDN Latency Alert \nHigh latency detected in the following locations:\n${issues
      .map(
        (issue) =>
          `• ${issue.dimensions.coloCity}: ${(issue.sum.edgeResponseTimeMs / issue.sum.requests).toFixed(2)}ms`
      )
      .join('\n')}`,
  };

  try {
    await axios.post(TELEX_WEBHOOK_URL, message);
    console.log('Latency alert sent to Telex successfully.');
  } catch (error) {
    console.error('Error sending latency alert to Telex:', error);
  }
};

async function checkLatencyAndAlert(): Promise<void> {
  const data = await fetchLatencyData();
  const latencyIssues = data.filter(
    (entry) => entry.sum.edgeResponseTimeMs / entry.sum.requests > LATENCY_THRESHOLD
  );

  if (latencyIssues.length > 0) {
    await sendTelexAlert(latencyIssues);
  } else {
    console.log('No latency issues detected.');
  }
};

cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled latency check...');
  await checkLatencyAndAlert();
});

app.get('/', (req, res) => {
  res.send('This integration monitors CDN latency and Alerts!');
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

app.post('/webhook', async (req: Request, res: Response) => {
  await checkLatencyAndAlert();
  res.status(200).send('Latency check triggered.');
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(port, () => {
  console.log(`Server is starting on port ${port}...`);
});