# Dojo Hub Uganda — Manufacturing Execution System (MES)

**An academic Management Information System (MIS) project**
Built as a university capstone / intern team project demonstrating a full-stack manufacturing execution system for a hypothetical Ugandan food and beverage production facility.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Demo Credentials](#demo-credentials)
6. [Executive Module (Screens 1–6)](#executive-module-screens-1-6)
7. [Manager Module (Screens 1–8)](#manager-module-screens-1-8)
8. [Operator Mobile Module (Screens 1–5)](#operator-mobile-module-screens-1-5)
9. [Intern Notes & System Limitations](#intern-notes--system-limitations)
10. [Project Structure](#project-structure)
11. [Team & Acknowledgements](#team--acknowledgements)

---

## Project Overview

The Dojo Hub MES is a role-based manufacturing execution system designed for a Ugandan food and beverage production facility. The system serves three distinct user personas:

- **Executive** — Corporate leadership who need high-level visibility into production performance, manager activity, and facility statistics.
- **Manager** — Floor managers who configure production processes, build and assign jobs, resolve faults, and manage operator accounts.
- **Operator** — Floor operators who execute assigned production processes on a simulated mobile device, logging quantities, performing quality checks, and reporting faults.

The application is built as a single-page React application with role-based access control, a persistent sidebar navigation layout, and a dedicated mobile-viewport operator experience.

---

## System Architecture

The system follows a classic Management Information System (MIS) layout:

```
┌──────────────────────────────────────────────────────────┐
│                    Unified Login Screen                   │
│            (Role selector: Executive / Manager / Operator) │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │ Executive │  │ Manager  │  │   Operator    │
   │  Dashboard │  │ Dashboard│  │  Mobile View  │
   │  (Desktop) │  │ (Desktop)│  │ (Simulated)  │
   └──────────┘  └──────────┘  └──────────────┘
```

- **Desktop modules** (Executive & Manager) use a persistent left sidebar navigation with a top header bar and content area.
- **Operator module** uses a simulated mobile phone viewport (max-width: 448px) with a high-contrast, touch-optimized interface.
- **Data persistence** uses a combination of React application state and localStorage for session continuity (see [Intern Notes](#intern-notes--system-limitations)).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Data Persistence | Application state + localStorage |
| Backend (Available) | Supabase (PostgreSQL) — provisioned but not required for core scope |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development Server

The development server starts automatically in the Bolt environment. For local development:

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## Demo Credentials

This is an academic project — **no registration is required**. Use the credentials below to evaluate each role pathway. The login screen also displays these credentials on-screen with "Autofill" buttons for convenience.

| Role | Login ID | Password / PIN |
|------|----------|----------------|
| **Executive** | `exec@dojohub.com` | `exec2024` |
| **Manager** | `+256 700 123 456` | `manager2024` |
| **Operator** | `+256 700 456 789` | PIN: `4567` |

> **Note:** The login screen evaluates the role based on the selected tab (Executive / Manager / Operator). Each tab shows the appropriate input fields (email for Executive, phone + password for Manager, phone + 4-digit PIN for Operator).

---

## Executive Module (Screens 1–6)

The Executive module provides corporate leadership with read-only visibility into facility operations. All data is presented for monitoring purposes — the Executive cannot modify production data, resolve faults, or assign operators.

### Screen 1: Executive Login

- Unified login screen with role selector tabs.
- Executive tab accepts email and password.
- On-screen demo credential helper with autofill button.
- Validates credentials against mock data before granting access.

### Screen 2: Executive Home (with Live Attention Feed)

- **KPI Summary Cards**: Today's output, OEE score, active jobs, completed jobs — displayed as crisp white data cards with 1px borders.
- **Live Attention Feed**: A read-only, non-actionable feed of facility alerts (faults, pauses, unassigned operators). The feed displays:
  - Alert type and severity (Critical / Minor / Paused / Unassigned).
  - Alert description, production line, and timestamp.
  - Filter pills to filter by alert category.
  - **No action buttons** — the Executive can observe but not interact with alerts. This enforces strict data boundaries per the specification.
- **Production Overview Widget**: Today's output vs. target with a circular progress gauge, OEE gauge chart, and active production job cards with expandable stage timelines.

### Screen 3: Manager Directory

- A searchable directory of all facility managers.
- Each manager card displays: name, role/title, assigned production line, contact information, and current status (Active / On Leave).
- Executive can view manager details but cannot modify them.

### Screen 4: Production Line Manager (with Active Manager Assignment Picker Modal)

- A matrix view of all production lines and their current active manager assignments.
- Each production line shows: line name, current manager, status (Running / Paused / Idle), and active job count.
- **In-page Active Manager Assignment Picker Modal**: The Executive can click a production line to open a modal that lists available managers. Selecting a manager and confirming reassigns them to that line. This is the one actionable feature available to the Executive.

### Screen 5: Statistics Hub

- A high-level statistics overview with summary cards for:
  - Total production volume (period).
  - Average OEE across all lines.
  - Fault frequency and severity breakdown.
  - Downtime analysis summary.
- Each card links to the Statistics Detail View for deeper analysis.

### Screen 6: Statistics Detail View (Multi-Chart, configured with Fault & Downtime example)

- A detailed analytics dashboard with multiple chart types:
  - **Bar Chart**: Fault frequency by category over the selected period.
  - **Line Chart**: Downtime trend over time.
  - **Pie/Donut Chart**: Fault severity distribution (Critical vs. Minor).
  - **Data Table**: Raw fault log entries with date, line, severity, category, and resolution status.
- Configured with the "Fault & Downtime" example dataset as specified.

---

## Manager Module (Screens 1–8)

The Manager module is the operational control center for floor managers. It provides full CRUD capabilities for production processes, job building, fault resolution, and operator administration.

### Screen 1: Manager Home / Live Dashboard Combo

- **Live Dashboard**: Real-time overview of active production jobs with progress bars, stage timelines, and operator assignments.
- **Attention Feed**: Unlike the Executive's read-only feed, the Manager's feed features **active navigation links** to resolve faults. Each alert card has:
  - "Resolve Alert" button — opens the Fault Resolution Modal.
  - "Review Detail" button — navigates to the fault detail view.
- **Production Overview**: KPI widgets for today's output, OEE, and active job cards.
- **Operator Roster**: A live roster of all operators with status indicators (Active / On Break / Offline) and a reassignment modal.

### Screen 2: Process Library (Shared)

- A catalog of all configured process blueprints organized by category:
  - **Preparation**: Washing, Pulping, Sorting.
  - **Processing**: Pasteurization, Mixing, Blending.
  - **Packaging**: Filling, Capping, Labeling.
  - **Quality Control**: Inspection, Lab Testing.
- Each blueprint card displays: name, category, estimated duration, station tag, and enabled feature toggles.
- Blueprints can be archived or duplicated.

### Screen 3: Process Detail Preview

- Clicking a blueprint in the library opens a detailed preview showing:
  - Full process description and operating guidelines.
  - Configured feature toggles (Guidelines, Checklist, Quantity Logging, QC Form, Fault Categories).
  - Checklist items, QC questions, quantity parameters, and fault category definitions.
  - Station assignment and estimated duration.

### Screen 4: Create New Process (5 Optional Configuration Toggles)

- A dedicated form screen for creating new process blueprints.
- **5 Optional Configuration Toggles**:
  1. **Operating Guidelines** — Toggle to enable a rich-text guidelines banner shown to operators.
  2. **Pre-Start Checklist** — Toggle to enable mandatory checkbox items that operators must complete before starting.
  3. **Quantity Entry Log** — Toggle to enable a quantity tracking widget with unit label, min/max values.
  4. **Quality Control Form** — Toggle to enable pass/fail and numeric QC questions.
  5. **Fault Categories** — Toggle to enable custom fault category definitions with severity (Critical/Minor) and photo requirements.
- Each toggle reveals a configuration panel with relevant input fields.
- The form validates required fields (name, category, station) before saving.

### Screen 5: 2-Step Sequential Job Builder (Sequence → Assign Operators)

A two-step wizard for building production jobs:

**Step 1: Sequence Configuration**
- Job ID (auto-generated, regenerable).
- Work order selection (links to existing work orders with target quantities).
- Target output quantity and unit.
- Timeline/schedule input.
- **Process Pipeline Builder**: A left panel lists available process templates grouped by category. Clicking a template adds it to the pipeline canvas as a sequential stage.
- **Validation Gate**: Step 1 blocks progress to Step 2 unless at least one process stage has been added to the pipeline. A validation banner appears if the user tries to proceed with an empty pipeline.

**Step 2: Operator Assignment**
- Each pipeline stage displays a card with an operator assignment dropdown.
- Available operators are filtered by active status.
- **Skill Mismatch Warning**: If an assigned operator lacks the required skills for a stage, a warning badge appears.
- **Validation Gate**: Step 2 blocks job activation unless every stage has an explicitly assigned operator. A validation banner appears if any stage is unassigned.
- **Activate Production Run**: Once all validations pass, the manager can activate the job, which moves it to the live production dashboard.

### Screen 6: Fault Detail / Resolve Form

- A modal dialog triggered from the Manager's Attention Feed.
- Displays full fault context: title, description, production line, flagging operator, timestamp.
- Photo attachment placeholder (shows captured photo or "no photo" state).
- **Three Resolution Actions** (radio button selection):
  1. **Dismiss & Log Alert** — Records the alert in the fault log without interrupting production.
  2. **Pause Affected Process Step** — Temporarily halts the specific stage while investigation continues.
  3. **Trigger Global Emergency Stop** — Halts all production lines immediately; supervisors are notified.
- Action notes textarea for documenting the resolution.
- Submit button is disabled until a resolution action is selected.

### Screen 7: Operator Accounts Administration

- A full operator account management directory with:
  - **Search**: Filter by name, phone, or skill.
  - **Data Table**: Displays operator name, phone/login ID, PIN (with reveal toggle), skills, and status.
  - **Register Operator Modal**: A form to create new operator accounts with:
    - Full name (required, min 2 characters).
    - Phone number (required, validated format).
    - 4-digit PIN (required, confirmed).
    - Skill certifications (multi-select pills).
  - **Status Toggle**: Suspend/activate operator accounts with a single click.
  - Active and suspended counts displayed in the header.

### Screen 8: Emergency Stop Confirmation + Manual Individual Process Resume Tracker

- **Emergency Stop Overlay**: A full-screen red-themed confirmation dialog with:
  - **Stop Scope Selection**: Facility-wide halt or specific job halt.
  - **Reason Dropdown**: Pre-defined reasons (Equipment Malfunction, Safety Hazard, Quality Control Failure, etc.).
  - **Additional Details**: Textarea for context.
  - **Hold-to-Confirm Button**: A press-and-hold button (1.5 seconds) that fills a progress bar before executing the stop. This prevents accidental activation.
- **Emergency Status Banner**: After activation, a flashing red banner appears at the top of the Manager dashboard showing:
  - Stop scope (GLOBAL or PARTIAL).
  - Reason for the stop.
  - "Authorize Workflow Resumption" button.
- **Manual Individual Process Resume Tracker**: When the manager authorizes resumption, a step-by-step tracker guides them through resuming each paused process individually. Each process must be explicitly resumed, ensuring safe and controlled restart.

---

## Operator Mobile Module (Screens 1–5)

The Operator module is built as a **simulated mobile phone viewport** (max-width: 448px). It uses a high-contrast, touch-optimized interface with:

- **Blocky, large touch targets** (minimum 44px, typically 56px+).
- **Text scaled to at least 16px** for readability.
- **High-contrast color scheme** with clear status indicators.
- **Sticky headers and footers** for persistent navigation and action buttons.

### Screen 1: Assigned Process List (Operator Home)

- A minimalist mobile header with the Dojo Hub logo, profile button, and settings button.
- **"My Assignments"** section title with active count.
- **Process Cards**: Each assigned process displays as a large, tappable card showing:
  - Batch/job reference ID and product name.
  - Stage name (large, bold) and job name.
  - Station tag and estimated duration.
  - **Status Badge**: Large, prominent pill showing current status:
    - `AVAILABLE` (blue) — Ready to start.
    - `RUNNING` (cyan, spinning icon) — Currently executing.
    - `PAUSED BY OPERATOR` (amber) — Operator-initiated pause.
    - `PAUSED BY EMERGENCY STOP` (red, flashing) — Manager-initiated halt.
    - `COMPLETED` (green) — Finished.
    - `PENDING` (gray) — Not yet started.
- Emergency-stop-paused processes show a flashing red banner: "GLOBAL MANAGER FREEZE ACTIVE".
- Loading, error, and empty states are all handled.
- **Settings Sheet**: A bottom sheet with Notifications, Offline Mode, High Contrast, Language, Help & Support, and Sign Out options.

### Screen 2: Process Detail (State Engine: Start, Pause, End, Resume)

- **Sticky Header**: Back button + live ticking duration timer (hh:mm:ss format) with status indicator.
- **Pinned Primary Execution Controls** (contextual based on state):
  - **Initial state**: Large green "START PROCESS" button.
  - **Running state**: Split pair — yellow "PAUSE" + red "END PROCESS".
  - **Paused state**: Split pair — green "RESUME" + red "END PROCESS".
  - **Emergency Stop state**: Frozen red banner "EMERGENCY STOP ACTIVE — Process frozen by manager. Await authorization to resume."
- **Scrollable Body** — Blueprint sections (conditionally rendered based on blueprint configuration):
  - **Section A: Operating Guidelines** — Text content with a tap-to-zoom schematic diagram.
  - **Section B: Pre-Start Checklist** — Large checkbox items with "REQUIRED" badges for mandatory items.
  - **Section C: Quantity Entry Log** — Large numeric display with minus/plus buttons (no keyboard needed).
  - **Section D: Quality Control Check** — Pass/Fail buttons and numeric input with tolerance display.
  - **Fault Categories Preview** — Shows configured fault categories with severity icons and photo requirement indicators.
- **Pinned Floating Base Bar**: "REPORT FAULT / ISSUE" button at the bottom of the screen.

### Screen 3: Report Issue Form (Critical/Minor Split)

- Full-page mobile screen with back navigation to the active process.
- **Process Context Strip**: Shows job ID, stage name, and product name.
- **Fault Category Dropdown**: A custom dropdown listing configured fault categories with severity icons and photo requirement indicators.
- **Severity Banner**: Upon selecting a fault category, a banner reveals showing:
  - **CRITICAL** (red) — "This issue requires immediate manager attention. Production may need to halt."
  - **MINOR** (amber) — "This issue should be logged and monitored. Production can continue normally."
- **Photo Evidence**: A tap-to-attach photo upload area with camera roll simulation. Shows "Photo Attached" confirmation state. Displays "Required" badge if the selected fault category requires a photo.
- **Additional Notes**: A textarea for describing the issue.
- **Submit Button**: Pinned to the bottom. Shows a loading state ("Submitting to Control Dashboard...") for 1.5 seconds before confirming submission.
- The process keeps running while the operator reports the issue (non-blocking).

### Screen 4: Pause Reasons Selection Screen

- Triggered when the operator taps "PAUSE" during a running process.
- A full-screen overlay with a backdrop that blocks all interaction.
- **"Specify Interruption Reason"** prompt with four large, tappable reason cards:
  1. **Raw Material Delay** (icon: Boxes).
  2. **Equipment Cleaning** (icon: Sparkles).
  3. **Shift Handoff / Break** (icon: Users).
  4. **Minor Machine Clearing** (icon: Wrench).
- Selecting a reason shows a loading state ("Logging pause reason...") for 0.8 seconds, then pauses the process and logs the reason to the control dashboard.
- **Cancel button**: "Cancel — Resume Process" returns to the running process without pausing.

### Screen 5: Account Settings (PIN Management)

- Accessed from the Settings button in the Operator Home header.
- A bottom sheet with options:
  - Notifications.
  - Offline Mode.
  - High Contrast.
  - Language.
  - Help & Support.
  - Sign Out.
- PIN management is handled through the Manager's Operator Accounts administration screen (Screen 7 of the Manager Module), where managers can view and reset operator PINs.

---

## Intern Notes & System Limitations

This project was built as an academic capstone / intern team project to demonstrate a complete Management Information System. The following notes clarify the scope and limitations:

### Data Persistence

- **Application State + localStorage**: Data persists locally in React application state and browser localStorage. This satisfies the core information system scope without requiring heavy external database infrastructure.
- **No Real Backend Required**: While a Supabase PostgreSQL backend is provisioned and available, the core application scope operates entirely on the client side. This simplifies deployment for academic demonstration purposes.
- **Session Continuity**: Login state and role selection persist across page reloads via localStorage. Refreshing the page during a session returns the user to their current role's dashboard.
- **Mock Data**: All production data (blueprints, jobs, operators, alerts, statistics) is seeded from mock data files in `src/data/`. This data is realistic and representative of a real Ugandan food and beverage facility but is not connected to a live database.

### Authentication

- **No Registration**: The system does not support user self-registration. Accounts are pre-provisioned (mock) and managed by the system administrator (or in this demo, accessed via the credentials above).
- **Mock Authentication**: Login validation is performed against hardcoded mock credentials. There is no real password hashing, JWT token generation, or server-side session management.
- **Role-Based Access Control**: Role switching is enforced at the application level. Each role (Executive, Manager, Operator) has strictly separated views and data boundaries. For example, the Executive's Attention Feed is entirely read-only, while the Manager's feed features active resolve links.

### Known Limitations

1. **No Real-Time Server Push**: The "Live" Attention Feed and production dashboard update from application state, not from a real-time server connection. Data updates when the user interacts with the system (e.g., resolving a fault removes it from the feed).
2. **Simulated Mobile Viewport**: The Operator module simulates a mobile phone viewport using CSS max-width constraints. It is not a native mobile app and does not access device hardware (camera, GPS, etc.). Photo upload uses a file input with `capture="environment"` as a simulation.
3. **Single-User Sessions**: The system does not support concurrent multi-user sessions. Logging in as one role logs out any previous role.
4. **No Persistent Job History**: Completed production jobs and resolved faults are not permanently archived. They are removed from the active views upon resolution.
5. **Chart Rendering**: Statistics charts are rendered using custom SVG components (no external charting library). This keeps the bundle size small but limits chart interactivity (no tooltips, no zoom).
6. **Operator PIN Security**: PINs are stored in plain text in the mock data and are visible to managers via the PIN reveal toggle. A production system would hash PINs and never expose them.

### What Would Come Next

In a production deployment, the team would:
- Connect the application to the Supabase PostgreSQL backend for real data persistence.
- Implement Supabase Auth for secure authentication with hashed passwords and JWT sessions.
- Add real-time subscriptions for live dashboard updates.
- Build a native mobile app (React Native) for the Operator module with camera and push notification support.
- Implement role-based Row Level Security (RLS) policies at the database level.

---

## Project Structure

```
project/
├── src/
│   ├── components/           # React UI components
│   │   ├── UnifiedLogin.tsx          # Multi-role login screen
│   │   ├── Sidebar.tsx               # Desktop sidebar navigation
│   │   ├── Header.tsx                # Desktop top header bar
│   │   ├── ExecutiveDashboard.tsx   # Executive home + KPIs + attention feed
│   │   ├── ProductionOverview.tsx    # Production KPI widgets & job cards
│   │   ├── AlertFeed.tsx             # Live attention feed (read-only for exec)
│   │   ├── OperatorRoster.tsx        # Operator roster with reassign modal
│   │   ├── ProductionLineMatrix.tsx  # Production line manager + assignment modal
│   │   ├── AnalyticsDashboard.tsx    # Statistics hub & detail view
│   │   ├── BlueprintManagement.tsx   # Process library + detail + create form
│   │   ├── BlueprintCatalog.tsx      # Blueprint catalog grid
│   │   ├── BlueprintBuilder.tsx      # Create new process form (5 toggles)
│   │   ├── JobBuilder.tsx            # 2-step sequential job builder
│   │   ├── OperatorDirectory.tsx     # Operator accounts administration
│   │   ├── FaultResolutionModal.tsx  # Fault detail / resolve form
│   │   ├── EmergencyStopFlow.tsx     # Emergency stop + resume tracker
│   │   ├── OperatorHome.tsx          # Operator mobile: assigned process list
│   │   ├── OperatorRuntime.tsx       # Operator mobile: process detail (state engine)
│   │   └── OperatorIssueLogger.tsx   # Operator mobile: report issue + pause reasons
│   ├── data/                 # Mock data & data access functions
│   │   ├── mockData.ts
│   │   ├── blueprintData.ts
│   │   ├── executiveData.ts
│   │   ├── jobBuilderData.ts
│   │   └── operatorModuleData.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── blueprint.ts
│   │   ├── productionJob.ts
│   │   └── operatorModule.ts
│   ├── docs/                 # Specification documents
│   │   └── mes_ui_prompts_v4.md
│   ├── App.tsx               # Main application router & role management
│   ├── main.tsx              # Desktop entry point
│   ├── operator-main.tsx     # Operator mobile entry point
│   ├── index.css             # Global styles & Tailwind imports
│   └── lib/supabase.ts       # Supabase client (available, not required)
├── index.html                # Desktop HTML entry
├── operator.html             # Operator mobile HTML entry
├── package.json
├── tailwind.config.js        # Tailwind theme (navy, info, success, warning, danger)
├── vite.config.ts            # Vite config (multi-page: desktop + operator)
└── README.md                 # This file
```

---

## Team & Acknowledgements

This project was developed as an academic capstone project by a team of computer science interns at **Dojo Hub Uganda**.

The system demonstrates:
- Full-stack React/TypeScript development.
- Role-based access control and data boundary enforcement.
- Responsive design (desktop dashboard + simulated mobile viewport).
- Form validation and multi-step wizard workflows.
- Custom SVG chart rendering without external dependencies.
- A clean, structured Management Information System aesthetic appropriate for a university capstone or facility deployment.

**Supervising Institution**: Dojo Hub Uganda
**Project Type**: Academic Capstone / Intern Team Project
**Academic Year**: 2024–2025

---

*This README confirms that every feature from the 3-person specification (Executive, Manager, Operator) has been implemented as described above.*
