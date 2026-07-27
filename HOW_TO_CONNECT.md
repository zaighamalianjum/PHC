# 🍃 How to Connect Your React Frontend to Your MongoDB Database

This guide is custom-written to show you how to easily set up, connect, and run this application offline or in the cloud using **MongoDB**! 

We have updated the Node.js API Server (`Server.js`) to **automatically create your database and collections, and seed them with all default patients, medicines, cities, and configurations** on the very first boot as soon as you supply your MongoDB connection string!

---

## 🗺️ System Connections Overview

Once deployed, the three pieces of your application will communicate as follows:

```
┌────────────────────────┐      HTTP / JSON Requests  ┌─────────────────────────┐
│     React Frontend     │  ────────────────────────>  │    Express API Server   │
│   (Runs on Port 3000)  │  <────────────────────────  │   (Runs on Port 5000)   │
└────────────────────────┘                            └─────────────────────────┘
                                                                   ▲
                                                                   │ (Connects via MongoDB URI)
                                                                   ▼
                                                      ┌─────────────────────────┐
                                                      │        MongoDB          │
                                                      │  (Local or Cloud Atlas) │
                                                      └─────────────────────────┘
```

1. **MongoDB Database:** Houses permanent clinical data collections (`patients`, `items`, `invoice_headers`, `invoice_details`, etc.).
2. **Node.js Express Server (`Server.js`):** Runs in the background on your computer. It connects to MongoDB and supplies data endpoints (like `/api/patients`).
3. **React Frontend:** The user-friendly interface. It communicates with the background Node API to load and submit transactions instantly.

---

## 🧱 STEP 1: Get Your MongoDB Connection String

You can use either **MongoDB Compass (Local)** or **MongoDB Atlas (Cloud)**:

### 🔹 Option A: If using MongoDB Local (Compass / Community Server)
If you have MongoDB installed on your computer:
- Your connection string is usually:
  ```env
  mongodb://localhost:27017/PharmacyPOSDB
  ```

### 🔹 Option B: If using MongoDB Atlas (Cloud)
If you created a free cluster on MongoDB Atlas:
1. Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. Click **Connect** on your Database Cluster.
3. Choose **Drivers** or **Connect your application**.
4. Copy the connection string. It will look like this:
   ```env
   mongodb+srv://your_username:your_password@cluster0.abcde.mongodb.net/PharmacyPOSDB?retryWrites=true&w=majority
   ```
   *(Note: Remember to replace `<password>` with your real database password and define `PharmacyPOSDB` in the path!)*

---

## ⚙️ STEP 2: Configure Your Connection String inside the App

You have two easy ways to supply your MongoDB connection string to the server:

### 🔹 Way 1: Create a `.env` File (Recommended)
Create a file named `.env` in your main `PHCC` folder on your computer and paste your connection string:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/PharmacyPOSDB
```
*(Or insert your MongoDB Atlas connection string there!)*

### 🔹 Way 2: Hardcode Directly inside `Server.js`
Alternatively, you can open **`Server.js`** in your code editor, locate **line 21**, and paste your connection string directly:
```javascript
// Server.js - Line 21
const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_CONNECTION_STRING_HERE';
```

---

## 🛠️ STEP 3: Install MongoDB Driver Modules Locally

Open your command prompt or terminal inside your downloaded project folder (`PHCC`) and run:

```bash
npm install mongodb cors express dotenv
```

---

## 🔗 STEP 4: Integrate the React Frontend

To have your React pages talk to the Node API server without complex setup:

### A. Add the API Proxy inside `vite.config.ts`
We configure Vite's development server to automatically forward all requests starting with `/api` to our Node backend at port `5000`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
```

### B. Fetch Records inside your UI Pages
Instead of fetching local mock items, you fetch live rows.

#### Loading patient lists:
```typescript
import { useEffect, useState } from 'react';

function PatientList() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatients(data))
      .catch(err => console.error("Error loading:", err));
  }, []);

  // Return your JSX list map here...
}
```

---

## 🚀 STEP 5: Launch and Enjoy Automatic Database Seeding!

Open **two separate terminal windows** inside your `PHCC` folder on your computer:

### 1️⃣ Terminal 1: Run the API Server
```bash
node Server.js
```
*When run for the first time, you will see output like this:*
```text
⏳ Connecting to MongoDB at: mongodb://localhost:27017/PharmacyPOSDB...
✅ Success! Connected safely to MongoDB (Database: PharmacyPOSDB)!
🌱 Seeding initial patients list to MongoDB...
🌱 Seeding initial medicines inventory list to MongoDB...
🌱 Seeding default system configurations to MongoDB...
🌱 Seeding initial cities metadata to MongoDB...
⭐ All collections verified and auto-populated with demo data in MongoDB successfully!
🚀 MongoDB API backend server is active at: http://localhost:5000
```
*(Your database, tables, and seed files are now automatically generated by MongoDB!)*

### 2️⃣ Terminal 2: Run the React App
```bash
npm run dev
```
*You should see:* `Vite dev server running at http://localhost:3000`

Now, open **`http://localhost:3000`** in your web browser and enjoy your clinic EMR and Pharmacy POS system connected directly to MongoDB! 🌟
