# Cloudflare CDN Latency Alerts Integration

## 📚 **Overview**

The **Cloudflare CDN Latency Alerts** integration is an **output integration** designed for the **Telex** platform. It continuously **monitors Cloudflare CDN response times** and identifies **geo-specific latency issues** using the **Cloudflare Analytics API**. The integration helps teams to detect performance degradations at specific Cloudflare data centers (co locations) and receive timely alerts.

---

## 🚀 **Key Features**

- 🌐 **Geo-Specific Latency Monitoring**: Tracks latency by city (`coloCity`) for Cloudflare points of presence (PoPs).
- ⏱ **Latency Threshold Alerts**: Sends alerts when edge response times exceed configurable thresholds.
- 📊 **Daily Aggregated Metrics**: Fetches daily metrics for HTTP requests and response times.
- 💬 **Flexible Output Channels**: Supports easy integration with platforms like **Slack**, **email**, or custom webhooks.
- 🔒 **Secure Authentication**: Uses **Cloudflare API Tokens** for secure access to analytics data.

---

## 🏗 **Integration Architecture**

- **Framework**: `Node.js` with `Express.js`
- **Language**: `TypeScript`
- **Cloud Service**: `Cloudflare Analytics API`
- **Platform**: `Telex (Output Integration)`

---

## 🔧 **Prerequisites**

1. **Node.js** (v16+ recommended) and **npm** installed.
2. **Cloudflare API Token** with permissions to access analytics data.
3. A valid **Cloudflare Account ID**.
4. **Telex** account for integration deployment.

---

## ⚡ **Installation**

### 1. **Clone the Repository:**
```bash
git clone https://github.com/telexintegrations/cloudflare-cdn-latency-alerts.git
cd cloudflare-cdn-latency-alerts
```

### 2. **Install Dependencies:**
```bash
npm install
```

### 3. **Environment Configuration:**
Create a `.env` file in the root directory:
```dotenv
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
TELEX_WEBHOOK_URL=your_telex_webhook_url
LATENCY_THRESHOLD=500  # Set latency threshold in ms
```

---

## 🏃 **Running the Integration**

### **Development Mode (with hot-reloading):**
```bash
npm run dev
```

### **Production Mode:**
```bash
npm run build
npm start
```

The server will start at `http://localhost:3000` (or the port defined in `src/app.ts`).

---

## 🔌 **Telex Integration Settings**

Configure your **Telex** integration settings by adding the following in your `integration.json`:

```json
{
  "name": "Cloudflare CDN Latency Alerts",
  "type": "output",
  "category": "cloud services",
  "description": "Monitors Cloudflare CDN response times and geo-specific latency issues using the Cloudflare Analytics API.",
  "settings": {
    "Cloudflare API Token": "{{CLOUDFLARE_API_TOKEN}}",
    "Cloudflare Account ID": "{{CLOUDFLARE_ACCOUNT_ID}}",
    "Telex Webhook URL": "{{TELEX_WEBHOOK_URL}}",
    "Latency Threshold (ms)": "{{LATENCY_THRESHOLD}}"
  }
}
```

---

## ⏰ **Cron Scheduling**

This integration uses **node-cron** for periodic checks:

- **Hourly Schedule Example:**
```typescript
import cron from 'node-cron';
cron.schedule('0 * * * *', () => {
  console.log('🔄 Running hourly latency check...');
  checkLatencyAndAlert();
});
```
- The `0 * * * *` cron expression runs **hourly** at minute zero.

---

## 📡 **Cloudflare Analytics API Query**

The integration sends a **GraphQL query** to fetch latency data:

```graphql
{
  viewer {
    accounts(filter: {accountTag: "ACCOUNT_ID"}) {
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
}
```

- **`coloCity`**: City where Cloudflare PoP is located.
- **`edgeResponseTimeMs`**: Aggregated response time in milliseconds.
- **`requests`**: Total number of requests processed.

---

## 📩 **Alerting Mechanism**

When latency exceeds the defined threshold, the integration sends alerts via configured output channels (e.g., Slack, email).

### **Sample Alert Payload:**
```json
{
  "city": "New York",
  "edgeResponseTimeMs": 480,
  "requests": 1500,
  "message": "⚠️ High latency detected in New York (480ms). Threshold: 400ms."
}
```


---

## 🛠 **Testing the Integration**

### ✅ **Unit Tests:**
```bash
npm run test
```

## 🎨 **Project Structure**

```
cloudflare-cdn-latency-alerts/
├── src/
│   └── app.ts
├── .gitignore
├── LICENSE
├── README.md
├── integrationSpec.json
├── package-lock.json
├── package.json
└── tsconfig.json
```

---

## 📝 **Contributing**

1. 🍴 Fork the repository.
2. 💡 Create your feature branch: `git checkout -b feature/YourFeatureName`
3. 💾 Commit your changes: `git commit -m 'Add YourFeatureName'`
4. 📤 Push to the branch: `git push origin feature/YourFeatureName`
5. 🔄 Submit a **Pull Request**.

---

## 🛡 **Security Considerations**

- Use **API tokens** with **minimum required scopes**.
- Secure `.env` files and avoid committing them to version control.
- Validate incoming webhook payloads if integrating with third-party platforms.

---

## 📜 **License**

This project is licensed under the **MIT License**.

---

## 🙋 **Support & Feedback**

- For issues, open a ticket in the **GitHub Issues** section.
- For discussions and feature requests, open a **GitHub Discussion**.

**Thank you 🚀🌐**