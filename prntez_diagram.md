# prntez — Complete Process Diagrams

---

## 🗺️ Main End-to-End Flow

```mermaid
flowchart TD
    A(["📱 Customer\n(Mobile / Laptop)"])

    A -->|1. Scans QR Standee at counter| B["🌐 Browser Opens\nprntez Upload Portal\n(No app install needed)"]

    B -->|2. Selects files\nPDF / DOCX / JPG / PNG| C["📂 File Upload UI\n• Copies\n• Color / B&W\n• Paper Size A4/A3\n• Single / Duplex\n• Notes"]

    C -->|3. Live price preview| D["💰 Transparent\nPricing Display"]

    D -->|4. Chooses payment method| E{Payment Mode?}

    E -->|Cash| F1["🏦 Cash at Counter\n(Pay on pickup)"]
    E -->|bKash| F2["📲 bKash Number\n→ Customer pays\n→ Enters TrxID"]
    E -->|Nagad| F3["📲 Nagad Number\n→ Customer pays\n→ Enters TrxID"]

    F1 & F2 & F3 -->|5. Submit Job| G["🖥️ Node.js / Express\nServer\n• Chunked Upload Assembler\n• Job Record in MySQL\n• Generates #Token (e.g. #0042)"]

    G -->|6. WebSocket PUSH\n< 50ms latency| H["🔔 Shopkeeper POS\nDashboard\n• Audible Chime 🔔\n• Job appears in live queue"]

    G -->|7. Returns Job Token\n+ Tracking URL| I["📋 Customer Sees\n#0042 Token\n+ Live Status Tracker"]

    H -->|8a. Manual:\nShopkeeper clicks Print| J["🖨️ Windows Print\nSpooler Bridge\n(SumatraPDF + PowerShell)"]
    H -->|8b. Auto-Print Mode:\nHands-free| J

    J -->|9. Sends to physical printer| K["🖨️ Physical Printer\n(USB or Network)"]

    K -->|10. Shopkeeper clicks\n'Mark as Ready'| L["✅ Status: Ready for Pickup"]

    L -->|11. Real-time push to customer| I

    I -->|12. Customer collects\nusing #Token| M(["✅ Done!\nDocument in hand"])

    G -->|🧹 Auto-Purge Daemon\nRuns every 5 min| N["🗑️ Files Deleted\nfrom Server\n(on print OR 30-min expiry)"]

    style A fill:#6366f1,color:#fff,stroke:#4f46e5
    style M fill:#22c55e,color:#fff,stroke:#16a34a
    style G fill:#0ea5e9,color:#fff,stroke:#0284c7
    style H fill:#f59e0b,color:#fff,stroke:#d97706
    style J fill:#8b5cf6,color:#fff,stroke:#7c3aed
    style K fill:#ec4899,color:#fff,stroke:#db2777
    style N fill:#ef4444,color:#fff,stroke:#dc2626
```

---

## 🏗️ System Architecture (Technical Layer View)

```mermaid
flowchart LR
    subgraph CLIENT["CLIENT LAYER (React + Vite + Tailwind)"]
        CU["CustomerUpload\nPortal"]
        TJ["TrackJob\nPage"]
        SD["ShopDashboard\nPOS"]
        AD["AdminDashboard"]
    end

    subgraph SERVER["SERVER LAYER (Node.js + Express)"]
        API["REST API\n/upload /jobs /shops"]
        WS["Socket.io\nWebSocket Hub"]
        CHUNK["Chunked Upload\nAssembler"]
        CRON["Auto-Purge\nCron Daemon\n(every 5 min)"]
        AUTH["Auth &\nRate Limiter"]
        TOKEN["Daily Job\nToken Generator\n#0001 → reset daily"]
    end

    subgraph DATA["DATA LAYER"]
        DB[("MySQL / MariaDB\nShops · Jobs · Files\nCustomers · Settings")]
        FS["File System\n/uploads/\n(Isolated, not public)"]
    end

    subgraph HARDWARE["HARDWARE BRIDGE (Windows)"]
        SPOOL["Print Spooler\nSumatraPDF\n+ PowerShell CIM"]
        PRINTER["🖨️ Physical Printer\nUSB / Network"]
    end

    CU -- "HTTP POST\n(chunked binary)" --> API
    CU <-- "Job Token\n+ Status" --> API
    SD <-- "WebSocket\nbidirectional" --> WS
    TJ <-- "WebSocket\nlive status" --> WS
    AD -- "REST" --> API

    API --> CHUNK --> FS
    API --> TOKEN --> DB
    API --> AUTH
    WS --> SD
    CRON --> FS

    API <--> DB
    SD --> SPOOL --> PRINTER

    style CLIENT fill:#1e293b,color:#e2e8f0,stroke:#334155
    style SERVER fill:#0c4a6e,color:#e0f2fe,stroke:#0369a1
    style DATA fill:#14532d,color:#dcfce7,stroke:#166534
    style HARDWARE fill:#4a1942,color:#fce7f3,stroke:#86198f
```

---

## 💳 Payment & Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Uploading : Customer submits files

    Uploading --> Queued : Server assembles chunks\nassigns #Token

    Queued --> Printing : Shopkeeper clicks Print\nOR Auto-Print fires

    Printing --> Ready : Physical printer done\nShopkeeper marks Ready

    Ready --> Completed : Customer collects\nwith #Token

    Completed --> [*]

    Queued --> Expired : No action within\nconfigurable window
    Expired --> [*] : Files auto-purged 🗑️

    note right of Queued
        WebSocket pushes
        live chime 🔔 to
        Shopkeeper POS
    end note

    note right of Ready
        WebSocket pushes
        "Ready!" to
        Customer phone
    end note
```

---

## 👥 Actor Summary

| Actor | Tool | Key Actions |
|---|---|---|
| **Customer** | Mobile browser (scan QR) | Upload → Configure → Pay → Track → Collect |
| **Server** | Node.js + MySQL | Assemble chunks → Store job → Push WebSocket → Purge files |
| **Shopkeeper** | POS Dashboard (browser) | Receive chime → Review job → Print → Mark done |
| **Print Bridge** | SumatraPDF + PowerShell | Receive command → Spool to Windows printer |
| **Printer** | USB / Network | Output physical document |
| **Purge Daemon** | Cron (5 min interval) | Delete expired files from disk → Zero data residue |
