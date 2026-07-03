# Dojo Hub MES — AI UI Generation Prompts (v4)

---

## PERSON A — Business Executive Role

Design the Business Executive role for Dojo Hub MES, a Manufacturing Execution System. The Executive oversees the entire operation: they manage Manager accounts, create Production Lines and assign them to Managers, and monitor live activity and historical statistics.

### SCREENS:

**1. LOGIN (shared across all roles)**
Allows any user to sign in. Requires an email and password. No registration option.

**2. EXECUTIVE HOME**
The Executive's main screen after login. Combines business summary with live operational data in one place. Must show:
- A count of currently active jobs, open (unresolved) faults, and Managers currently on duty
- A live list of active production jobs, each showing the job name, the assigned Manager, and how many processes are complete versus total
- A live attention feed of unresolved issues — faults reported by operators and paused processes — each showing what it is, which job and process it belongs to, and when it was reported. Sorted newest first.
The Executive can observe this data but cannot take action on faults or jobs from this screen.

**3. MANAGER ACCOUNTS**
Allows the Executive to view, create, and deactivate Manager accounts. Each Manager entry shows their name, email, how many Production Lines they are assigned to, and whether they are active or inactive. The Executive can add a new Manager (requiring name and email) and deactivate existing ones.

**4. PRODUCTION LINES**
Allows the Executive to view, create, and manage Production Lines. Each line shows its name, description, the Manager it is assigned to, its target date, and its current status. Each line has an "Assign Manager" action that opens an in-page picker modal listing all active Managers — the Executive selects one from the list to assign them to that line. The Executive can also create a new Production Line by providing a name, description, target product or output, and target date. Existing lines can be edited or archived.

**5. STATISTICS HUB**
An entry point to five analytical views: Job History, Fault & Downtime Analytics, Scrap Analytics, Operator Activity, and Production Output. The Executive can select a date range and export data as CSV. Each analytical view is reachable from here.

**6. STATISTICS DETAIL VIEW**
A reusable screen used for all five analytical views. Shows a title, the selected date range, and the data for that view presented using charts and graphs as the primary means of display — tables may be used as a secondary supplement where appropriate. Summary figures relevant to the view are shown prominently. The Fault & Downtime view should be used as the example: it visualises fault frequency over time, a breakdown by severity (Critical vs Minor), and a breakdown by process. A sortable table below the charts lists individual fault records showing date, process, job, severity, status (resolved or not resolved), and action taken. Data is exportable as CSV.

---

## PERSON B — Manager Role

Design the Manager role for Dojo Hub MES. The Manager is assigned a Production Line by the Executive. They build a Production Job for that line by selecting and sequencing processes from a shared library, then assigning operators to each process. They monitor live job activity, manage operator accounts, and respond to faults.

### SCREENS:

**1. MANAGER HOME + LIVE DASHBOARD (one combined screen)**
The Manager's main screen after login. Must show everything needed to understand job status and react to live events:
- Their assigned Production Line(s) with the option to open or build the associated job
- A live view of active jobs showing overall progress and the state of each individual process (Available, Running, Paused, or Completed)
- An attention feed of unresolved issues: faults and paused processes, each showing severity, which process and job it belongs to, timestamp, and a way to open the full fault detail. Sorted newest first.
- An Emergency Stop control, always visible and accessible from this screen, that halts all active processes immediately when confirmed.

**2. PROCESS LIBRARY**
A browsable list of all processes that have been created. Each entry shows the process name and indicates which optional sections are configured for it (Guidelines, Checklist, Scraps, Note, Quantities). The Manager can search and browse the library. Selecting a process opens its detail view. There is a clearly accessible option to create a new process.

**3. PROCESS DETAIL / PREVIEW**
Shows the full contents of a selected process in read-only form. Displays only the sections that are actually configured — sections that are not enabled do not appear. Sections that may be present: Guidelines (the instruction text), Checklist (the list of items), Record Scraps (the configured scrap type names), Optional Note (indicated as available at runtime), Record Quantities (the configured unit of measurement). The Manager can edit the process from here. When this view is opened from inside the Job Builder's picker modal, an option to select and add the process to the current job is shown.

**4. CREATE NEW PROCESS (accessed only from the Process Library)**
Allows the Manager to create a new reusable process. Requires a process name. Offers five optional sections the Manager can enable:
- **Guidelines:** a space to write step-by-step instructions for the operator
- **Checklist:** either upload an existing checklist file or create one by adding text items one by one
- **Record Scraps:** define one or more scrap type names that operators can log during this process
- **Optional Note:** enables a free-text note field for the operator at runtime — no further configuration needed
- **Record Quantities:** allows the Manager to set an expected quantity and select a unit (e.g. units, kg, litres)
Saving the process adds it to the library. Process creation is never accessible from inside the Job Builder — the library is the only place to create processes.

**5. JOB BUILDER (two steps)**
Allows the Manager to build a Production Job for their assigned Production Line. The process happens in two sequential steps:

*Step 1 — Sequence Processes:* The Manager adds processes from the library and arranges them in order. Adding processes opens an in-page picker modal showing the full process library — the Manager can multi-select multiple processes at once and add them all in one action. Within the same modal, there is a "Create new process" link that navigates to the Create New Process screen for cases where the needed process does not yet exist. The Manager can reorder the selected processes. At least one process must be added before advancing to step 2.

*Step 2 — Assign Operators:* Each process in the sequence must have one operator assigned before the job can be activated. The Manager selects an operator for each process from the list of existing operator accounts. The job cannot be activated until every process has an assigned operator.

**6. FAULT DETAIL / RESOLVE**
Opened from an attention feed item. Shows the full details of a reported fault: which process and job it belongs to, who reported it, when, the severity as selected by the operator (Critical or Minor), the operator's note, and any photo attached. The Manager can record what action was taken and mark the fault as resolved. The Manager can also choose to pause the affected process or trigger an Emergency Stop from here.

**7. OPERATOR ACCOUNTS**
Allows the Manager to create and manage operator accounts. Each account shows the operator's name, phone number, and active/inactive status. The Manager can add a new operator (requiring name and phone number, with an initial PIN set at creation), deactivate existing accounts, and reset a PIN. There are no skills or competency fields on operator accounts.

**8. EMERGENCY STOP CONFIRMATION**
Triggered from the always-visible Emergency Stop control. Requires the Manager to explicitly confirm before anything is halted — the confirmation must make clear that all active processes will stop immediately. After confirmation, a follow-up screen lists all halted processes and allows the Manager to resume each one individually. There is no bulk resume option.

---

## PERSON C — Operator Role

Design the Operator role for Dojo Hub MES. This is a **mobile phone application**. Operators are factory floor workers who may be in noisy, busy environments. Every screen must prioritize clarity and ease of use: large readable text, large touch-friendly buttons, and minimal steps to complete any action. There are only five screens.

### SCREENS:

**1. ASSIGNED PROCESS LIST**
The first screen after login. Shows all processes currently assigned to this operator as a list. Each entry shows the name of the job or batch it belongs to, the name of the process, and its current status (Available, Running, Paused, or Completed). There is an accessible way to navigate to the Account Settings screen from here. Tapping a process opens the Process Detail screen.

**2. PROCESS DETAIL**
Shows the details of the selected process, including any guidelines and checklist items configured for it. Provides the following actions depending on the process state:
- If Available: a Start action
- If Running: Pause and End actions
- If Paused: a Resume action
- Always visible when Available or Running: a Report Issue action
When pausing, the operator is taken to the Pause Reasons screen. When reporting an issue, the operator is taken to the Report Issue screen. Ending a process marks it as Completed.

**3. REPORT ISSUE**
Allows the operator to report a fault without stopping work. The operator must indicate whether the issue is Critical or Minor. They can optionally add a descriptive note and optionally attach a photo. Submitting the report sends it to the Manager and returns the operator to the Process Detail screen. The process does not pause automatically — the operator continues working unless the Manager intervenes.

**4. PAUSE REASONS**
Shown when the operator taps Pause. The operator selects one reason from a predefined list: Taking a break, Waiting for materials, Equipment issue, Shift handover, Other. Only one reason can be selected. The operator can optionally add a note. Confirming the pause halts the process and returns to the Process Detail screen in a paused state.

**5. ACCOUNT SETTINGS**
Allows the operator to change their PIN or log out. Changing the PIN requires entering the current PIN, a new PIN, and confirming the new PIN. Logging out shows a confirmation step before signing the operator out.
