## Application Overview

This flowchart represents a role-based task management application built with Next.js and Firestore. The application uses a single shared dashboard at route `/dashboard` for all users. What each user sees and can do is determined by their `roles` and `permissions` collections. Task-related pages are unified under `/tasks`.

See the Firestore model in the data model: [Data Model](./data-model.md).

### Development principle: Unified pages, permission-driven UX

- Never build separate pages per role. Create one page per domain (e.g., `/dashboard`, `/tasks`, `/users`).
- Gate visibility and actions with permissions. The URL stays the same; the UI and capabilities change.
- Evaluate permissions on both the client (to show/hide/disable UI) and the backend/security rules (to enforce).
- Keep role metadata in `roles` and user entitlements in `permissions` and/or role grants in `users`.
- Design components to render optional modules/widgets based on permission checks; avoid branching routes.
- Favor stable deep links that work for all roles; the content adapts to the viewer.

- **Admin**: View all tasks, create/edit/delete any task, manage users.
- **Manager**: View team tasks, assign tasks to team members, update task progress.
- **User**: View own tasks and update task status.

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}, "themeCSS": ".screen .label b:first-child,.screen .label tspan:first-child{font-size:20px;}"}}%%
flowchart TD
  A([Start]) --> B{Authenticated?}
  B -- No --> D[Login]
  D --> B

  B -- Yes --> R{User Roles<br/>Firestore: users, roles, settings/permissions}
  subgraph " "
    direction LR
    RA["<div style='min-width:320px'><b>Admin Dashboard</b><br/><b>Route:</b> /dashboard<br/>—<br/>Overview & navigation to tasks/users<br/>—<br/><b>Firestore:</b> users, tasks, roles</div>"]
    RM["<div style='min-width:320px'><b>Manager Dashboard</b><br/><b>Route:</b> /dashboard<br/>—<br/>Team overview & shortcuts<br/>—<br/><b>Firestore:</b> tasks, users</div>"]
    RU["<div style='min-width:320px'><b>User Dashboard</b><br/><b>Route:</b> /dashboard<br/>—<br/>Personal overview & shortcuts<br/>—<br/><b>Firestore:</b> tasks</div>"]
  end
  R -- Admin --> RA
  R -- Manager --> RM
  R -- User --> RU

  RA --> RA1["<div style='min-width:320px'><b>Tasks List (Admin)</b><br/><b>Route:</b> /tasks<br/>—<br/>View, filter, and sort all tasks<br/>—<br/><b>Firestore:</b> tasks</div>"]
  RA --> RA3["<div style='min-width:320px'><b>User Management</b><br/><b>Route:</b> /users<br/>—<br/>Invite/disable users, assign roles<br/>—<br/><b>Firestore:</b> users, roles</div>"]
  subgraph " "
    direction LR
    RA1
    RA3
  end
  RA1 --> RA2["<div style='min-width:320px'><b>Task Editor (Admin)</b><br/><b>Route:</b> /tasks/edit<br/>—<br/>Create, edit, and delete any task<br/>—<br/><b>Firestore:</b> tasks</div>"]
  RA2 --> E([End])
  RA3 --> E([End])

  RM --> RM1["<div style='min-width:320px'><b>Tasks List (Manager)</b><br/><b>Route:</b> /tasks<br/>—<br/>View team tasks; filter by assignee/status<br/>—<br/><b>Firestore:</b> tasks</div>"]
  RM1 --> RM2["<div style='min-width:320px'><b>Assign Tasks</b><br/><b>Route:</b> /tasks/assign<br/>—<br/>Assign/unassign tasks to team members<br/>—<br/><b>Firestore:</b> tasks, users</div>"]
  RM1 --> RM3["<div style='min-width:320px'><b>Update Task Progress</b><br/><b>Route:</b> /tasks/update<br/>—<br/>Change status, add comments<br/>—<br/><b>Firestore:</b> tasks</div>"]
  RM3 --> E

  RU --> RU1["<div style='min-width:320px'><b>My Tasks</b><br/><b>Route:</b> /tasks<br/>—<br/>View own tasks; filter & sort<br/>—<br/><b>Firestore:</b> tasks</div>"]
  RU1 --> RU2["<div style='min-width:320px'><b>Update Task Status</b><br/><b>Route:</b> /tasks/update<br/>—<br/>Mark complete, add notes, change status<br/>—<br/><b>Firestore:</b> tasks</div>"]
  RU2 --> E

  style RA fill:#d0ebff,stroke:#228be6,stroke-width:2px,color:#228be6
  style RM fill:#f3d9fa,stroke:#862e9c,stroke-width:2px,color:#862e9c
  style RU fill:#e8fff0,stroke:#37b24d,stroke-width:2px,color:#37b24d
  style D fill:#ffe8e8,stroke:#ff7b7b,stroke-width:2px,color:#ff7b7b
  style R fill:#f0e9ff,stroke:#7048e8,stroke-width:2px,color:#7048e8
  classDef default fill:#f7f7fb,stroke:#6c6f93,stroke-width:1.5px,color:#2f2f46,rx:8,ry:8
  classDef screen font-size:16px
  class RA,RM,RU,RA1,RA2,RA3,RM1,RM2,RM3,RU1,RU2 screen
  %% Node label structure (HTML labels enabled):
  %% Line 1: <b>Screen Name</b>
  %% Line 2: <b>Route:</b> /path
  %% Line 3: — (separator)
  %% Line 4: Short description (what happens on the screen)
  %% Line 5: — (separator)
  %% Line 6: <b>Firestore:</b> collection, collection2
```
