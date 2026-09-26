# prntez — Product Overview & Feature Specification Document
> **Next-Generation Real-Time Cloud Printing & Counter POS Platform**  
> *Transforming document printing into an instant, contactless, and privacy-first experience.*

---

## 1. Executive Summary

**prntez** is a modern, web-based cloud printing and counter POS (Point of Sale) platform designed to eliminate the friction, security vulnerabilities, and chaotic queues typical of traditional print shops, cyber cafes, and copy centers. 

By replacing messy workflows like USB flash drives, WhatsApp document sharing, and personal email forwarding with a **scan-and-print QR workflow**, prntez allows customers to upload documents straight from their mobile devices with exact print specifications. On the other side of the counter, shopkeepers receive jobs instantly in real time through an automated POS dashboard equipped with silent hardware printing, auto-pricing, and automated file purging.

---

## 2. What Problem Are We Solving?

Every day, millions of students, professionals, and citizens visit local print shops to print assignments, resumes, tickets, government IDs, and legal documents. The existing process is plagued by serious inefficiencies:

### 🛑 The Customer Pain Points
1. **The "WhatsApp / Email Me" Nightmare:** Customers are forced to save a random stranger's phone number or send files via personal Gmail accounts, exposing personal contact information.
2. **USB Virus Infections:** Plugging personal pendrives into unmaintained shop computers frequently corrupts files or infects drives with malware and trojans.
3. **Severe Privacy & Data Leak Risks:** Sensitive documents (national identity cards, bank statements, contracts, personal photos) remain permanently saved in the shop's `Downloads` folder, accessible to anyone who uses that computer next.
4. **Queue Confusion & Misunderstandings:** Verbal instructions like *"print pages 3 to 12 in color, 2 copies, double-sided"* get misunderstood, leading to wasted paper, arguments, and lost time.
5. **No Status Visibility:** Customers must crowd the counter asking *"is mine done yet?"* with no way to know their queue position.

### 🛑 The Shopkeeper Pain Points
1. **Counter Clutter & Time Waste:** Shopkeepers spend 70% of their time helping customers connect to Wi-Fi, downloading WhatsApp attachments, unzipping archives, and finding files instead of actually printing.
2. **Hard Drive Clutter & System Slowdowns:** Thousands of unorganized files pile up in local folders, eating gigabytes of storage until the computer crashes.
3. **Calculation Errors & Uncollected Payments:** Manually calculating prices for multi-page documents with mixed color, duplexing, and varying paper sizes causes revenue leakage.
4. **Lack of Digital Identity:** Small print shops operate purely offline with no customer retention, analytics, digital order history, or modern branding.

---

## 3. The prntez Solution

prntez replaces this entire broken loop with an elegant **3-step contactless workflow**:

```
[ Customer Scans Counter QR Code ]
               │
               ▼
[ Uploads Document via Browser + Selects Custom Print Options ]
               │
               ▼
[ Shopkeeper's POS Rings Real-Time Chime & Auto-Prints ]
               │
               ▼
[ Customer Collects Document with 4-Digit Job Code — Files Auto-Purge ]
```

1. **Zero App Installation:** Works instantly on any mobile phone or browser (iOS, Android, Windows, Mac).
2. **Privacy by Design:** Uploaded documents are automatically purged from the server immediately upon printing or when a timer (e.g. 30 minutes) expires.
3. **Real-Time WebSockets Sync:** No page refreshes; shopkeepers and customers receive instant order notifications, chimes, and live tracking.
4. **Automated Hardware Spooling:** Connects directly to local desktop printers via silent background spooling, eliminating the need to manually open and print files one by one.

---

## 4. Comprehensive Feature Breakdown

### A. Customer-Facing Features (`CustomerUpload` & `TrackJob`)

| Feature | Description |
| :--- | :--- |
| **Instant QR Shop Landing** | Scanning a shop's unique QR standee automatically opens the upload portal tailored to that specific shop. |
| **Broad File Format Support** | Accepts PDF documents, Word documents (`.docx`), and high-resolution images (`.jpg`, `.png`). |
| **Clipboard Paste Support** | Customers on laptops/tablets can hit `Ctrl+V` to paste screenshots or copied images directly into the upload queue. |
| **Smart PDF Page Detection** | Automatically detects the exact page count of uploaded PDFs and verifies paper size (A4, A3, Legal, Letter). |
| **Per-File Print Customization** | Customers configure: <br>• Number of copies <br>• Color mode (Black & White vs Color) <br>• Paper size (A4, A3, Letter, Legal) <br>• Print sides (Single-sided vs Double-sided / Duplex) <br>• Special file instructions/notes |
| **Dynamic Transparent Pricing** | Displays live pricing calculations in real-time, factoring in duplex discounts and paper sizes before submission. |
| **Chunked & Resumable Uploads** | Large files (up to 50MB+) upload smoothly in chunks with progress indicators, preventing mobile connection drops. |
| **Multiple Payment Modes** | Supports **Cash at Counter**, **bKash**, and **Nagad** with one-tap shopkeeper number copying and TrxID input. |
| **4-Digit Easy Job Token (`#0001`)** | Generates a clean 4-digit token resetting daily per shop for quick counter call-outs. |
| **Live Order Tracking** | Real-time visual progress tracker: `Uploaded` ➔ `Printing` ➔ `Ready for Pickup` ➔ `Completed`. |
| **Returning Customer Auto-Fill** | Remembers customer name, phone number, and recent orders locally for 10-second repeat checkout. |
| **Personal Cloud Library (Registered Users)** | Customers can create an account to store frequently printed documents (resumes, ID copies) and re-print anytime without re-uploading. |

---

### B. Shopkeeper POS Dashboard (`ShopDashboard`)

| Feature | Description |
| :--- | :--- |
| **Live Real-Time Queue** | Powered by Socket.io; new orders appear instantaneously at the top of the queue with an audible chime alert. |
| **Hardware Silent Print Bridge** | Direct integration with native Windows printing (via SumatraPDF / PowerShell) for silent, background printing without browser popups. |
| **One-Click "Print All"** | Prints all files within a job according to their exact individual specifications (copies, color, duplex) in one click. |
| **Autonomous "Auto-Print" Mode** | When enabled, incoming customer jobs automatically spool directly to the physical printer hands-free. |
| **Multi-Printer Routing** | Detects all connected USB and network printers; lets shopkeeper assign default printers or switch per job. |
| **Print Simulation Mode** | Allows shopkeepers to test their setup, train staff, and simulate jobs without wasting ink or paper if no physical printer is connected. |
| **Custom Pricing Engine** | Shop owners can set custom rates: <br>• B&W rate per page <br>• Color rate per page <br>• Duplex discounts <br>• Multi-size surcharges (A3, Legal) |
| **Branded QR Standee Generator** | Automatically generates a high-resolution, printable PDF counter standee with shop name, address, logo, and QR code. |
| **Privacy & Storage Auto-Purge** | Files can be deleted immediately upon printing or automatically wiped after 30 minutes, keeping the shop's computer clean and compliant. |
| **Built-In Document Tools** | Integrated utilities for fast counter tasks: Quick PDF merger, file view/previewer, and page calculator. |
| **Shop Points & Rewards System** | Gamified loyalty program rewarding shopkeepers with points for every job completed, redeemable for platform perks. |
| **Business Analytics & Insights** | Interactive metrics dashboard displaying total revenue, page counts, peak operating hours, and top document types. |

---

### C. Administrator & Platform Hub (`AdminDashboard`)

| Feature | Description |
| :--- | :--- |
| **Shop Management & Verification** | View all registered shops, approve pending shop registrations, monitor active status, or suspend delinquent accounts. |
| **Global Platform Controls** | Toggle platform maintenance mode, update default file expiry timers, adjust max file size limits, and manage supported extensions. |
| **Platform Pulse & Metrics** | Real-time global overview: total print shops, registered customers, total jobs processed, and cumulative pages printed. |
| **AdSense & Monetization Suite** | Enable/disable Google AdSense banners or custom internal partner promotional cards shown across upload and dashboard screens. |
| **Rate Limiting & Abuse Prevention** | Built-in IP rate-limiting protects against denial-of-service attempts, spam uploads, and unauthorized brute-force logins. |

---

## 5. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  React (Vite) + Tailwind CSS + Lucide Icons + Socket.io │
└──────────────┬────────────────────────────┬─────────────┘
               │ HTTP / Chunked Upload       │ WebSockets (Bidirectional)
               ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│                     SERVER LAYER                        │
│          Node.js + Express REST API + Socket.io         │
├─────────────────────────────────────────────────────────┤
│ • Auth & Rate Limiting    • Daily Job Code Sequence     │
│ • File Chunk Assembler    • Auto-Cleanup Cron Daemon    │
└──────────────┬────────────────────────────┬─────────────┘
               │                            │
       SQL Queries                 File System & Spooler
               ▼                            ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│      DATABASE LAYER       │  │     STORAGE & BRIDGE     │
│       MySQL / MariaDB     │  │ • Local Isolated Uploads │
│ (Shops, Customers, Jobs,  │  │ • Auto-Purge Janitor     │
│ Files, Settings, Rewards) │  │ • Windows Spooler Bridge │
└───────────────────────────┘  └──────────────────────────┘
```

### Core Technical Highlights
- **Real-Time Low Latency:** WebSockets provide sub-50ms synchronization between customer phones and the shopkeeper’s screen.
- **Resilient Upload Engine:** Files are transferred using chunked binary streams, allowing large multi-megabyte documents to survive poor mobile data connections.
- **Privacy Janitor:** An automated background daemon executes every 5 minutes to purge files exceeding their expiry window, leaving zero residual trace of user documents.
- **Zero Heavy External Dependencies:** The native printing spooler utilizes lightweight headless execution via SumatraPDF and PowerShell CIM instances on Windows.

---

## 6. Business Value & Market Opportunity

### Target Market Segments
1. **University & College Printing Hubs:** Massive student volume printing lecture slides, assignments, and theses before class deadlines.
2. **Court & Legal Document Centers:** Lawyers, paralegals, and citizens requiring quick, accurate printing of affidavits and deeds.
3. **Commercial Business Districts:** White-collar professionals printing meeting briefs, reports, and contracts on the go.
4. **Neighborhood Copy & Stationary Stores:** Small family-run shops looking to modernize, increase throughput, and eliminate manual headaches.

### Value Creation
- **4x Faster Counter Throughput:** Reduces customer service time from 3–5 minutes down to under 30 seconds.
- **Zero Setup Costs:** Shops don't need expensive proprietary hardware; any existing PC or laptop with an internet browser and connected printer works immediately.
- **100% Privacy Assurance:** Gives customers confidence that confidential documents won't linger on shared shop computers.

---

## 7. Summary & Future Roadmap

**prntez** bridges the gap between digital mobile devices and physical print counters. It solves long-standing bottlenecks in document transfer, queue management, calculation, and security.

### Upcoming Milestones
- 📲 **Automated WhatsApp / SMS Notification:** Automatic text alert when an order status flips to "Done".
- 💳 **Integrated Digital Escrow Payments:** In-app gateway payment clearing directly to shopkeeper mobile wallets.
- 🏢 **Multi-Terminal Kiosk Mode:** Self-service printing kiosks supporting automatic coin or digital payment validation.
- 📱 **Mobile POS App:** Native Android/iOS companion application for shopkeepers who manage their counter via smartphone or tablet.

---
*prntez — Simple, Fast, Secure Cloud Printing.*
