# Firestore Data Model

## Notes

- Timestamp naming convention for offline-safe writes:
  - createdAt, updatedAt: client event times in milliseconds from `Date.now()`.
  - dbCreatedAt, dbUpdatedAt: server timestamps from Firestore `serverTimestamp()`.
- Keep both client and server times to preserve the true action time and the commit time.
- Client times reflect when the action happened; server times reflect when Firestore accepted the write.

### users (documents)

| Field       | Type            | Required | Description                 | Example          |
| ----------- | --------------- | -------- | --------------------------- | ---------------- |
| id          | string (doc id) | yes      | Unique user id              | u_123            |
| email       | string          | yes      | Sign-in identifier          | alex@example.com |
| displayName | string          | yes      | Friendly name               | Alex Lee         |
| firstName   | string          | yes      | First name                  | Alex             |
| lastName    | string          | yes      | Last name                   | Lee              |
| roleId      | string          | yes      | Role reference              | admin            |
| createdAt   | number          | yes      | Client event time (ms)      | Date.now()       |
| updatedAt   | number          | yes      | Last client event time (ms) | Date.now()       |
| dbCreatedAt | timestamp       | yes      | Server creation time        | serverTimestamp  |
| dbUpdatedAt | timestamp       | yes      | Last server update time     | serverTimestamp  |

### roles (documents)

| Field          | Type            | Required | Description                                        | Example                       |
| -------------- | --------------- | -------- | -------------------------------------------------- | ----------------------------- |
| id             | string (doc id) | yes      | Unique role id                                     | r_admin                       |
| name           | string          | yes      | Role name (admin, manager, user)                   | admin                         |
| permissionKeys | string[]        | yes      | Keys referencing entries in `settings/permissions` | ["tasks.read","users.manage"] |
| createdAt      | number          | yes      | Client event time (ms)                             | Date.now()                    |
| updatedAt      | number          | yes      | Last client event time (ms)                        | Date.now()                    |
| dbCreatedAt    | timestamp       | yes      | Server creation time                               | serverTimestamp               |
| dbUpdatedAt    | timestamp       | yes      | Last server update time                            | serverTimestamp               |

### settings (collection) — permissions document

Document path: `settings/permissions`

| Field       | Type                                 | Required | Description                             |
| ----------- | ------------------------------------ | -------- | --------------------------------------- |
| permissions | map<string, { description: string }> | yes      | Map of permission key → metadata object |

### tasks (documents)

| Field       | Type                                | Required | Description                 | Example                         |
| ----------- | ----------------------------------- | -------- | --------------------------- | ------------------------------- |
| id          | string (doc id)                     | yes      | Task id                     | t_123                           |
| title       | string                              | yes      | Short title                 | Onboard new hire                |
| description | string                              | no       | Detailed notes              | Create accounts and add to team |
| status      | enum(`todo`\|`in_progress`\|`done`) | yes      | Workflow status             | in_progress                     |
| assigneeId  | string or null                      | no       | Assigned user id            | u_456                           |
| createdById | string                              | yes      | Creator user id             | u_123                           |
| createdAt   | number                              | yes      | Client event time (ms)      | Date.now()                      |
| updatedAt   | number                              | yes      | Last client event time (ms) | Date.now()                      |
| dbCreatedAt | timestamp                           | yes      | Server creation time        | serverTimestamp                 |
| dbUpdatedAt | timestamp                           | yes      | Last server update time     | serverTimestamp                 |
