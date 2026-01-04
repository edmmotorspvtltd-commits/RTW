# Sales Order System - Visual Flowcharts

## 1. Current System Architecture

```mermaid
flowchart TD
    Start([User Opens System]) --> Login[Login Page]
    Login --> Dashboard[Dashboard]
    
    Dashboard --> NewEnq[New Enquiry]
    Dashboard --> PendingEnq[Pending Enquiries]
    Dashboard --> PendingApp[Pending Approved]
    Dashboard --> OrderConf[Order Confirm Data]
    
    NewEnq --> EnqForm[Enquiry Form]
    EnqForm --> SaveEnq[(Save to PENDING_DATA)]
    SaveEnq --> PendingEnq
    
    PendingEnq --> Approve{Approve?}
    Approve -->|Yes| MoveToPendingApp[(Move to PENDING_APPROVED)]
    Approve -->|No| Reject[(Move to CANCELLED)]
    
    MoveToPendingApp --> PendingApp
    PendingApp --> Confirm{Confirm Order?}
    Confirm -->|Yes| OrderForm[Order Confirm Form]
    Confirm -->|No| Wait[Wait]
    
    OrderForm --> FillDetails[Fill Order Details<br/>Buyer, PO, Designs, etc.]
    FillDetails --> SaveOrder[(Save to ORDER_CONFIRM_DATA)]
    SaveOrder --> OrderConf
    
    OrderConf --> ViewEdit[View/Edit Orders]
    
    style SaveEnq fill:#e3f2fd
    style MoveToPendingApp fill:#e3f2fd
    style SaveOrder fill:#e3f2fd
    style OrderConf fill:#c8e6c9
```

---

## 2. Proposed System with Master Data

```mermaid
flowchart TD
    Start([User Opens System]) --> Login[Login Page]
    Login --> Dashboard[Dashboard]
    
    Dashboard --> Masters[Master Data Management]
    Dashboard --> Orders[Order Management]
    Dashboard --> Reports[Reports]
    
    Masters --> BuyerMaster[(BUYER_MASTER Sheet)]
    Masters --> BrokerMaster[(BROKER_MASTER Sheet)]
    Masters --> PaymentMaster[(PAYMENT_TERMS_MASTER Sheet)]
    
    Orders --> NewOrder[New Order Form]
    NewOrder --> SelectBuyer[Select Buyer from Dropdown]
    SelectBuyer --> BuyerMaster
    NewOrder --> SelectBroker[Select Broker from Dropdown]
    SelectBroker --> BrokerMaster
    NewOrder --> SelectPayment[Select Payment Terms]
    SelectPayment --> PaymentMaster
    
    NewOrder --> SaveWithStatus[(Save to ORDER_CONFIRM_DATA<br/>with Status)]
    
    SaveWithStatus --> StatusTracking{Order Status}
    StatusTracking -->|Pending| StatusPending[Status: Pending]
    StatusTracking -->|Approved| StatusApproved[Status: Approved]
    StatusTracking -->|Confirmed| StatusConfirmed[Status: Confirmed]
    StatusTracking -->|In Production| StatusProduction[Status: In Production]
    StatusTracking -->|Completed| StatusCompleted[Status: Completed]
    
    Reports --> StatusReport[Order Status Report]
    Reports --> PendingReport[Pending Orders]
    Reports --> ValueReport[Order Value Summary]
    Reports --> MonthlyReport[Monthly Report]
    
    StatusReport --> FilterByStatus{Filter by Status}
    FilterByStatus --> ShowResults[Display Results]
    
    style BuyerMaster fill:#fff3e0
    style BrokerMaster fill:#fff3e0
    style PaymentMaster fill:#fff3e0
    style SaveWithStatus fill:#e3f2fd
    style Reports fill:#f3e5f5
```

---

## 3. Data Flow: Master Data Integration

```mermaid
flowchart LR
    subgraph "Master Data Sheets"
        BM[(BUYER_MASTER<br/>- ID<br/>- Name<br/>- Contact<br/>- Payment Terms)]
        BRM[(BROKER_MASTER<br/>- ID<br/>- Name<br/>- Commission<br/>- Contact)]
        PM[(PAYMENT_TERMS<br/>- ID<br/>- Terms<br/>- Days)]
    end
    
    subgraph "Order Form"
        Form[Order Confirm Form]
        DD1[Buyer Dropdown]
        DD2[Broker Dropdown]
        DD3[Payment Dropdown]
    end
    
    subgraph "Order Data"
        OCD[(ORDER_CONFIRM_DATA<br/>- RTWE No<br/>- Buyer ID<br/>- Broker ID<br/>- Payment ID<br/>- Status)]
    end
    
    BM -->|Populate| DD1
    BRM -->|Populate| DD2
    PM -->|Populate| DD3
    
    DD1 -->|Selected Buyer| Form
    DD2 -->|Selected Broker| Form
    DD3 -->|Selected Terms| Form
    
    Form -->|Save with IDs| OCD
    
    OCD -->|Lookup| BM
    OCD -->|Lookup| BRM
    OCD -->|Lookup| PM
    
    style BM fill:#fff3e0
    style BRM fill:#fff3e0
    style PM fill:#fff3e0
    style OCD fill:#e3f2fd
```

---

## 4. Status Tracking Workflow

```mermaid
flowchart TD
    Start([New Order Created]) --> Pending[Status: PENDING]
    
    Pending --> Review{Review Order}
    Review -->|Approve| Approved[Status: APPROVED]
    Review -->|Reject| Cancelled[Status: CANCELLED]
    
    Approved --> ConfirmOrder{Confirm with Buyer?}
    ConfirmOrder -->|Yes| Confirmed[Status: CONFIRMED]
    ConfirmOrder -->|Wait| Approved
    
    Confirmed --> CreateSortMaster{Create Sort Master?}
    CreateSortMaster -->|Yes| Production[Status: IN PRODUCTION]
    CreateSortMaster -->|Not Yet| Confirmed
    
    Production --> CheckCompletion{Production Done?}
    CheckCompletion -->|Yes| Completed[Status: COMPLETED]
    CheckCompletion -->|No| Production
    
    Completed --> Dispatch{Dispatched?}
    Dispatch -->|Yes| Dispatched[Status: DISPATCHED]
    Dispatch -->|No| Completed
    
    Dispatched --> End([Order Closed])
    Cancelled --> End
    
    style Pending fill:#fff9c4
    style Approved fill:#c5e1a5
    style Confirmed fill:#81c784
    style Production fill:#64b5f6
    style Completed fill:#4fc3f7
    style Dispatched fill:#4db6ac
    style Cancelled fill:#ef5350
```

---

## 5. Implementation Phases

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: Master Data (1-2 weeks)"]
        P1T1[Create BUYER_MASTER Sheet]
        P1T2[Create BROKER_MASTER Sheet]
        P1T3[Create PAYMENT_TERMS Sheet]
        P1T4[Add Master Data UI Pages]
        P1T5[Update Order Form with Dropdowns]
        
        P1T1 --> P1T2 --> P1T3 --> P1T4 --> P1T5
    end
    
    subgraph Phase2["Phase 2: Status Tracking (1 week)"]
        P2T1[Add Status Column to ORDER_CONFIRM_DATA]
        P2T2[Create Status Update UI]
        P2T3[Add Status Filters to List View]
        P2T4[Add Status Change History]
        
        P2T1 --> P2T2 --> P2T3 --> P2T4
    end
    
    subgraph Phase3["Phase 3: Reporting (2-3 weeks)"]
        P3T1[Create Order Status Report Page]
        P3T2[Add Date Range Filters]
        P3T3[Create Summary Statistics]
        P3T4[Add Export to Excel]
        P3T5[Create Monthly Report]
        
        P3T1 --> P3T2 --> P3T3 --> P3T4 --> P3T5
    end
    
    subgraph Phase4["Phase 4: Integration (3-4 weeks)"]
        P4T1[Link to Sort Master System]
        P4T2[Auto-create Sort Master Button]
        P4T3[Show Production Status]
        P4T4[PDF Generation]
        P4T5[Email Notifications]
        
        P4T1 --> P4T2 --> P4T3 --> P4T4 --> P4T5
    end
    
    Start([Start Implementation]) --> Phase1
    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Complete([Complete System])
    
    style Phase1 fill:#e8f5e9
    style Phase2 fill:#e3f2fd
    style Phase3 fill:#f3e5f5
    style Phase4 fill:#fff3e0
```

---

## 6. Google Sheets Feasibility Matrix

```mermaid
flowchart TD
    subgraph Easy["✅ EASY - Do Now"]
        E1[Master Data Tables]
        E2[Status Tracking]
        E3[Basic Dropdowns]
        E4[Simple Reports]
    end
    
    subgraph Medium["⚠️ MEDIUM - Doable"]
        M1[Advanced Reports]
        M2[PDF Generation]
        M3[Email Notifications]
        M4[Sort Master Integration]
        M5[Export to Excel]
    end
    
    subgraph Hard["❌ HARD - Avoid"]
        H1[Real-time Collaboration]
        H2[Complex Workflows]
        H3[Row-level Security]
        H4[Full ERP Features]
        H5[>50,000 Records]
    end
    
    Start([Feature Request]) --> Evaluate{Complexity?}
    Evaluate -->|Simple| Easy
    Evaluate -->|Moderate| Medium
    Evaluate -->|Complex| Hard
    
    Easy --> Implement[Implement in Google Sheets]
    Medium --> Consider{Worth the Effort?}
    Consider -->|Yes| Implement
    Consider -->|No| Skip[Skip or Simplify]
    Hard --> Skip
    
    style Easy fill:#c8e6c9
    style Medium fill:#fff9c4
    style Hard fill:#ffcdd2
```

---

## 7. Complete System Architecture (Proposed)

```mermaid
flowchart TB
    subgraph UI["User Interface Layer"]
        Login[Login Page]
        Dash[Dashboard]
        MasterUI[Master Data UI]
        OrderUI[Order Form UI]
        ReportUI[Reports UI]
    end
    
    subgraph Backend["Backend (Google Apps Script)"]
        Auth[Authentication]
        MasterAPI[Master Data API]
        OrderAPI[Order API]
        ReportAPI[Report API]
        PDFAPI[PDF Generator]
        EmailAPI[Email Service]
    end
    
    subgraph Data["Data Layer (Google Sheets)"]
        UserSheet[(USER_DATA)]
        BuyerSheet[(BUYER_MASTER)]
        BrokerSheet[(BROKER_MASTER)]
        PaymentSheet[(PAYMENT_TERMS)]
        OrderSheet[(ORDER_CONFIRM_DATA)]
        HistorySheet[(STATUS_HISTORY)]
    end
    
    Login --> Auth
    Auth --> UserSheet
    
    Dash --> MasterUI
    Dash --> OrderUI
    Dash --> ReportUI
    
    MasterUI --> MasterAPI
    MasterAPI --> BuyerSheet
    MasterAPI --> BrokerSheet
    MasterAPI --> PaymentSheet
    
    OrderUI --> OrderAPI
    OrderAPI --> OrderSheet
    OrderAPI --> HistorySheet
    OrderAPI --> PDFAPI
    OrderAPI --> EmailAPI
    
    ReportUI --> ReportAPI
    ReportAPI --> OrderSheet
    ReportAPI --> BuyerSheet
    ReportAPI --> BrokerSheet
    
    style UI fill:#e3f2fd
    style Backend fill:#fff3e0
    style Data fill:#f3e5f5
```

---

## Summary

**Key Takeaways from Flowcharts:**

1. **Current System** = Simple 3-step workflow (Enquiry → Approved → Confirmed)
2. **Proposed System** = Enhanced with Master Data + Status Tracking + Reports
3. **Master Data** = Centralized buyer/broker/payment info with dropdowns
4. **Status Tracking** = 6-stage workflow (Pending → Dispatched)
5. **Implementation** = 4 phases over 7-10 weeks
6. **Feasibility** = Most features are EASY/MEDIUM on Google Sheets

**Next Step:** Start with Phase 1 (Master Data) - highest value, lowest complexity!
