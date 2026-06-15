# 🌌 Cosmic URL Shortener & Analytics

A full-stack URL shortener application designed with a dark, space-themed control center aesthetic. This application allows users to create short links, print vector QR codes, upload bulk sheets, track click graphs, and audit security login history.

---

## 🛰️ How the Application Works (Architecture)

The application uses a standard full-stack structure:

1. **Frontend (React & CSS):** 
   Runs in the browser on port `5173`. It provides the login screens, forms to shorten links, data tables, and click charts.
2. **Backend Server (Node.js & Express):**
   Runs on port `5000`. It acts as the API coordinator. It validates incoming links, handles user registration, saves records, and executes immediate `302` page redirects when a short link is clicked.
3. **Database Connector (Prisma & SQLite):**
   Stores all data locally in a `dev.db` database file. Prisma acts as the query translator, which allows you to switch between PostgreSQL and MongoDB easily.

---

## 📋 Features Overview

* **Cleareance Logins (RBAC):** Register as a standard **Officer (User)** or a **Command Admin**.
* **URL Shortening:** Submit any web address to generate a unique shortcode (with custom aliases and expiry timers).
* **Vector QR Code:** Downloads high-res QR codes connected to local network IPs so mobile phones can scan them.
* **Bulk Upload (CSV):** Drop a spreadsheet file containing a list of links to compress them in batches.
* **Live Telemetry (Charts):** Visualizes visitor daily clicks, browsers (Chrome/Safari), and device types (Desktop/Mobile).
* **Mainframe Logs:** Displays login and logout audit sessions. Standard users see masked logs to protect privacy, while Admins view everything.
* **Administrative Blocks:** Admins can revoke access to suspends users who share sensitive links.

---

## 📝 Assumptions Made

1. **Local Database:** Prisma is set to SQLite (`dev.db` file) so the app runs out-of-the-box on any computer. You can switch to **PostgreSQL** or **MongoDB** by changing the database connection URL in `.env`.
2. **Security & Passwords:** All user passwords are encrypted using `bcryptjs` hashing. Sessions are secured using JSON Web Tokens (JWT).
3. **Cross-Device Testing:** The app server is configured to accept connections from other devices on the same Wi-Fi network, allowing easy mobile QR code scanning.

---

## 📸 Telemetry Snapshots (Application Interface)

Below are snapshots from the active system command deck. You can capture these from your own local running instance and save them to `docs/images/` with the designated filenames to render them:

### 1. Main Landing Bridge (Before Login)
*File location: `docs/images/01_landing_page.png`*
![Main Dashboard Landing Bridge](docs/images/01_landing_page.png)

### 2. Analytics Control Deck (Desktop/Mobile Ratios & Telemetry)
*File location: `docs/images/02_analytics_deck.png`*
![Analytics Control Deck](docs/images/02_analytics_deck.png)

### 3. Command Admin Registry (Access Revocation Control)
*File location: `docs/images/03_admin_revoke_panel.png`*
![Admin Revocation Control](docs/images/03_admin_revoke_panel.png)

### 4. Restricted Officer Alert (Suspended Account Lockout)
*File location: `docs/images/04_revoked_account_warning.png`*
![Restricted Lockout Screen](docs/images/04_revoked_account_warning.png)

### 5. Command Admin Log Audits (Full Telemetry Details)
*File location: `docs/images/05_admin_telemetry_logs.png`*
![Admin Log Audits](docs/images/05_admin_telemetry_logs.png)

### 6. Standard Officer Log Masking (Confidential Data Filter)
*File location: `docs/images/06_user_confidential_logs.png`*
![User Confidential Logs](docs/images/06_user_confidential_logs.png)

---

## 📦 How to Setup & Run the Application

You can clone this repository and run the application inside your local network. Follow these steps in your command terminal:

### 1. Install Packages
Installs all dependencies for both the frontend client and the backend server:
```bash
npm run install:all
```

### 2. Prepare the Database
Creates your local database file and runs database tables setup:
```bash
npm run db:migrate
```

### 3. Launch the Application
Launches both servers concurrently:
```bash
npm run dev
```
* **Frontend website:** Open `http://localhost:5173`
* **Backend API server:** Runs on `http://localhost:5000`

### 🌐 Local Network & Cross-Device Access
Both the Vite dev server and Express backend are pre-configured to bind and expose endpoints across your local network IP (using the `--host` flag). This means:
1. Anyone on your local network (Wi-Fi or LAN) can view and interact with the application.
2. If you generate a vector QR code in the dashboard, you can scan it directly with your mobile phone to experience the redirection mechanics in real-time.

---

This project is a part of a hackathon run by https://katomaran.com
