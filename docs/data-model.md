# Firestore Data Model

## Notes

- Timestamp naming convention for offline-safe writes:
  - createdAt, updatedAt: client event times in milliseconds from `Date.now()`.
  - dbCreatedAt, dbUpdatedAt: server timestamps from Firestore `serverTimestamp()`.
- Keep both client and server times to preserve the true action time and the commit time.
- Client times reflect when the action happened; server times reflect when Firestore accepted the write.
- QR codes and vehicle disks are stored as plain strings.
- All deletion operations are soft deletes using `isActive` flag except for immediate induction errors.

## Core Collections

### users (documents)

| Field                   | Type                 | Required | Description                                               | Example                                            |
| ----------------------- | -------------------- | -------- | --------------------------------------------------------- | -------------------------------------------------- |
| id                      | string (doc id)      | yes      | Unique user id                                            | u_123                                              |
| email                   | string               | yes      | Sign-in identifier                                        | `john@example.com`                                 |
| displayName             | string               | yes      | Friendly name                                             | John Smith                                         |
| firstName               | string               | yes      | First name                                                | John                                               |
| lastName                | string               | yes      | Last name                                                 | Smith                                              |
| phoneNumber             | string               | yes      | Contact number for notifications                          | +27821234567                                       |
| roleId                  | string               | yes      | Role reference                                            | r_weighbridge_operator                             |
| permissionOverrides     | map<string, boolean> | no       | Per-user permission adjustments (overrides role defaults) | { "assets.delete": false, "reports.export": true } |
| profilePicture          | string               | no       | Profile image URL                                         | `https://...`                                      |
| notificationPreferences | map                  | yes      | Per-user notification settings                            | See below                                          |
| preferredEmail          | string               | no       | Alternative email for notifications                       | `john.work@example.com`                            |
| createdAt               | number               | yes      | Client event time (ms)                                    | Date.now()                                         |
| updatedAt               | number               | yes      | Last client event time (ms)                               | Date.now()                                         |
| dbCreatedAt             | timestamp            | yes      | Server creation time                                      | serverTimestamp                                    |
| dbUpdatedAt             | timestamp            | yes      | Last server update time                                   | serverTimestamp                                    |
| isActive                | boolean              | yes      | Account active status                                     | true                                               |

#### notificationPreferences structure

```javascript
{
  "asset.added": true,
  "asset.inactive": false,
  "asset.edited": true,
  "asset.deleted": true,
  "order.created": true,
  "order.allocated": true,
  "order.cancelled": false,
  "order.completed": true,
  "order.expiring": true,
  "weighbridge.overload": true,
  "weighbridge.underweight": true,
  "weighbridge.violations": true,
  "weighbridge.manualOverride": true,
  "preBooking.created": true,
  "preBooking.lateArrival": true,
  "security.invalidLicense": true,
  "security.unbookedArrival": true,
  "security.noActiveOrder": true,
  "security.sealMismatch": true,
  "security.incorrectSealsNo": true,
  "security.unregisteredAsset": true,
  "security.inactiveEntity": true,
  "security.incompleteTruck": true,
  "driver.licenseExpiring7": true,
  "driver.licenseExpiring30": true,
  "system.calibrationDue": true
}
```

### roles (documents)

| Field          | Type            | Required | Description                                        | Example                              |
| -------------- | --------------- | -------- | -------------------------------------------------- | ------------------------------------ |
| id             | string (doc id) | yes      | Unique role id                                     | r_newton_admin                       |
| name           | string          | yes      | Role display name                                  | Newton Administrator                 |
| permissionKeys | string[]        | yes      | Keys referencing entries in `settings/permissions` | ["assets.manage", "orders.create"]   |
| description    | string          | no       | Role description                                   | Full system access and configuration |
| createdAt      | number          | yes      | Client event time (ms)                             | Date.now()                           |
| updatedAt      | number          | yes      | Last client event time (ms)                        | Date.now()                           |
| dbCreatedAt    | timestamp       | yes      | Server creation time                               | serverTimestamp                      |
| dbUpdatedAt    | timestamp       | yes      | Last server update time                            | serverTimestamp                      |

### companies (documents)

| Field                      | Type            | Required | Description                                                                    | Example             |
| -------------------------- | --------------- | -------- | ------------------------------------------------------------------------------ | ------------------- |
| id                         | string (doc id) | yes      | Unique company id                                                              | c_123               |
| name                       | string          | yes      | Company name                                                                   | ABC Mining Ltd      |
| companyType                | enum            | yes      | `mine`\|`transporter`\|`logistics_coordinator`                                 | mine                |
| registrationNumber         | string          | yes      | Company registration number                                                    | 2021/123456/07      |
| vatNumber                  | string          | no       | VAT registration number                                                        | 4123456789          |
| physicalAddress            | string          | yes      | Company physical address                                                       | 123 Mining Rd, City |
| mainContactId              | string          | yes      | Reference to primary contact user id                                           | u_456               |
| secondaryContactIds        | string[]        | no       | Additional contact user ids                                                    | ["u_789", "u_012"]  |
| createdAt                  | number          | yes      | Client event time (ms)                                                         | Date.now()          |
| updatedAt                  | number          | yes      | Last client event time (ms)                                                    | Date.now()          |
| dbCreatedAt                | timestamp       | yes      | Server creation time                                                           | serverTimestamp     |
| dbUpdatedAt                | timestamp       | yes      | Last server update time                                                        | serverTimestamp     |
| isActive                   | boolean         | yes      | Company active status                                                          | true                |
| mineConfig                 | map             | no       | Mine-only configuration (sites, order settings, etc.)                          | See below           |
| transporterConfig          | map             | no       | Transporter configuration (fleet, capabilities, compliance settings)           | See below           |
| logisticsCoordinatorConfig | map             | no       | Logistics coordinator preferences (allocation rules, coverage areas, contacts) | See below           |

#### Type-specific configuration examples

```javascript
mineConfig: {
  sites: ["site_1", "site_2"],
  defaultOperatingHours: { monday: { open: "06:00", close: "18:00" } }
}

transporterConfig: {
  fleetSize: 25,
  assetCategories: ["truck", "trailer"],
  complianceDocuments: ["COC-2024", "Insurance-2025"],
  logisticsPartnerIds: ["c_999"]
}

logisticsCoordinatorConfig: {
  managedMineIds: ["c_123"],
  preferredProductIds: ["p_coal"],
  dispatchRegions: ["Northern Cape", "Gauteng"],
  escalationContacts: ["u_222"]
}
```

### clients (documents)

| Field              | Type            | Required | Description                     | Example              |
| ------------------ | --------------- | -------- | ------------------------------- | -------------------- |
| id                 | string (doc id) | yes      | Unique client id                | cl_123               |
| name               | string          | yes      | Client company name             | XYZ Corporation      |
| registrationNumber | string          | yes      | Company registration number     | 2019/111111/07       |
| vatNumber          | string          | no       | VAT registration number         | 4111111111           |
| physicalAddress    | string          | yes      | Physical address                | 789 Client Street    |
| contactName        | string          | yes      | Contact person name             | Bob Johnson          |
| contactEmail       | string          | yes      | Contact email                   | `bob@xyzcorp.com`    |
| contactPhone       | string          | yes      | Contact phone number            | +27823456789         |
| allowedSiteIds     | string[]        | no       | Allowed collection/destinations | ["site_1", "site_2"] |
| createdAt          | number          | yes      | Client event time (ms)          | Date.now()           |
| updatedAt          | number          | yes      | Last client event time (ms)     | Date.now()           |
| dbCreatedAt        | timestamp       | yes      | Server creation time            | serverTimestamp      |
| dbUpdatedAt        | timestamp       | yes      | Last server update time         | serverTimestamp      |
| isActive           | boolean         | yes      | Client active status            | true                 |

## Asset Management Collections

### assets (documents)

| Field              | Type            | Required | Description                                        | Example         |
| ------------------ | --------------- | -------- | -------------------------------------------------- | --------------- |
| id                 | string (doc id) | yes      | Unique asset id                                    | a_123           |
| assetType          | enum            | yes      | truck\|trailer\|driver                             | truck           |
| companyId          | string          | yes      | Company reference (transporter/logistics operator) | c_456           |
| qrCode             | string          | yes      | QR code data                                       | qr_string       |
| vehicleDiskData    | string          | no       | Vehicle disk data                                  | disk_string     |
| driverLicenseData  | string          | no       | Driver license data                                | license_string  |
| registrationNumber | string          | no       | Vehicle registration (trucks/trailers)             | CAW 12345       |
| licenseNumber      | string          | no       | Driver license number                              | DL123456789     |
| licenseExpiryDate  | timestamp       | no       | License expiry date                                | 2025-12-31      |
| fleetNumber        | string          | no       | Optional fleet number                              | FL-001          |
| groupId            | string          | no       | Optional group identifier                          | grp_north       |
| createdAt          | number          | yes      | Client event time (ms)                             | Date.now()      |
| updatedAt          | number          | yes      | Last client event time (ms)                        | Date.now()      |
| dbCreatedAt        | timestamp       | yes      | Server creation time                               | serverTimestamp |
| dbUpdatedAt        | timestamp       | yes      | Last server update time                            | serverTimestamp |
| isActive           | boolean         | yes      | Asset active status                                | true            |
| inactiveReason     | string          | no       | Reason for deactivation                            | License expired |
| inactiveDate       | timestamp       | no       | When asset was deactivated                         | 2024-01-15      |
| deletedReason      | string          | no       | Reason for deletion (induction errors)             | Duplicate entry |

## Order Management Collections

### orders (documents)

| Field             | Type            | Required | Description                               | Example         |
| ----------------- | --------------- | -------- | ----------------------------------------- | --------------- |
| id                | string (doc id) | yes      | Unique order id                           | o_123           |
| orderNumber       | string          | yes      | Order number (auto or manual)             | ORD-2024-001    |
| orderType         | enum            | yes      | receiving\|dispatching                    | dispatching     |
| clientCompanyId   | string          | yes      | Client company reference (mine/logistics) | c_789           |
| dispatchStartDate | timestamp       | yes      | Dispatch period start                     | 2024-01-15      |
| dispatchEndDate   | timestamp       | yes      | Dispatch period end                       | 2024-01-20      |
| totalWeight       | number          | yes      | Total weight in tons                      | 500             |
| collectionSiteId  | string          | yes      | Collection site reference (sites doc)     | site_123        |
| destinationSiteId | string          | yes      | Destination site reference (sites doc)    | site_456        |
| productId         | string          | yes      | Product reference                         | p_coal          |
| sealRequired      | boolean         | yes      | Are seals required                        | true            |
| sealQuantity      | number          | no       | Number of seals required                  | 2               |
| dailyTruckLimit   | number          | yes      | Max trucks per day                        | 10              |
| dailyWeightLimit  | number          | yes      | Max weight per day (tons)                 | 100             |
| monthlyLimit      | number          | no       | Monthly limit (tons)                      | 2000            |
| tripLimit         | number          | yes      | Max trips per truck per day               | 2               |
| tripDuration      | number          | no       | Trip duration in hours                    | 4               |
| allocations       | array           | no       | Array of allocations                      | See below       |
| status            | enum            | yes      | pending\|allocated\|completed\|cancelled  | allocated       |
| createdById       | string          | yes      | User who created order                    | u_123           |
| createdAt         | number          | yes      | Client event time (ms)                    | Date.now()      |
| updatedAt         | number          | yes      | Last client event time (ms)               | Date.now()      |
| dbCreatedAt       | timestamp       | yes      | Server creation time                      | serverTimestamp |
| dbUpdatedAt       | timestamp       | yes      | Last server update time                   | serverTimestamp |
| completedWeight   | number          | no       | Weight completed so far                   | 250             |
| completedTrips    | number          | no       | Number of trips completed                 | 25              |

#### allocations array structure

```javascript
;[
  {
    companyId: "c_456",
    allocatedWeight: 200,
    loadingDates: ["2024-01-15", "2024-01-16"],
    completedWeight: 150,
    status: "in_progress",
  },
]
```

### pre_bookings (documents)

| Field               | Type            | Required | Description                       | Example             |
| ------------------- | --------------- | -------- | --------------------------------- | ------------------- |
| id                  | string (doc id) | yes      | Unique pre-booking id             | pb_123              |
| orderId             | string          | yes      | Order reference                   | o_123               |
| assetId             | string          | yes      | Truck/asset reference             | a_456               |
| companyId           | string          | yes      | Company reference                 | c_456               |
| scheduledDate       | timestamp       | yes      | Scheduled arrival date            | 2024-01-15          |
| scheduledTime       | string          | yes      | Scheduled arrival time            | 08:00               |
| tripsPerDay         | number          | yes      | Number of trips planned           | 2                   |
| specialInstructions | string          | no       | Special instructions              | Load from bay 3     |
| status              | enum            | yes      | pending\|arrived\|late\|completed | pending             |
| arrivalTime         | timestamp       | no       | Actual arrival time               | 2024-01-15T08:15:00 |
| createdById         | string          | yes      | User who created booking          | u_789               |
| createdAt           | number          | yes      | Client event time (ms)            | Date.now()          |
| updatedAt           | number          | yes      | Last client event time (ms)       | Date.now()          |
| dbCreatedAt         | timestamp       | yes      | Server creation time              | serverTimestamp     |
| dbUpdatedAt         | timestamp       | yes      | Last server update time           | serverTimestamp     |

### products (documents)

| Field          | Type            | Required | Description                 | Example         |
| -------------- | --------------- | -------- | --------------------------- | --------------- |
| id             | string (doc id) | yes      | Unique product id           | p_coal          |
| name           | string          | yes      | Product name                | Coal Grade A    |
| code           | string          | yes      | Product code                | COAL-A          |
| categoryId     | string          | no       | Category reference          | cat_minerals    |
| specifications | string          | no       | Product specifications      | 5500 kcal/kg    |
| createdAt      | number          | yes      | Client event time (ms)      | Date.now()      |
| updatedAt      | number          | yes      | Last client event time (ms) | Date.now()      |
| dbCreatedAt    | timestamp       | yes      | Server creation time        | serverTimestamp |
| dbUpdatedAt    | timestamp       | yes      | Last server update time     | serverTimestamp |
| isActive       | boolean         | yes      | Product active status       | true            |

### sites (documents)

| Field           | Type            | Required | Description                   | Example          |
| --------------- | --------------- | -------- | ----------------------------- | ---------------- |
| id              | string (doc id) | yes      | Unique site id                | site_123         |
| name            | string          | yes      | Site name                     | Main Loading Bay |
| siteType        | enum            | yes      | collection\|destination       | collection       |
| physicalAddress | string          | yes      | Physical address              | 123 Mining Road  |
| contactUserId   | string          | yes      | Contact person user reference | u_456            |
| operatingHours  | map             | yes      | Operating hours               | See below        |
| createdAt       | number          | yes      | Client event time (ms)        | Date.now()       |
| updatedAt       | number          | yes      | Last client event time (ms)   | Date.now()       |
| dbCreatedAt     | timestamp       | yes      | Server creation time          | serverTimestamp  |
| dbUpdatedAt     | timestamp       | yes      | Last server update time       | serverTimestamp  |
| isActive        | boolean         | yes      | Site active status            | true             |

#### operatingHours structure

```javascript
{
  monday: { open: "06:00", close: "18:00" },
  tuesday: { open: "06:00", close: "18:00" },
  wednesday: { open: "06:00", close: "18:00" },
  thursday: { open: "06:00", close: "18:00" },
  friday: { open: "06:00", close: "18:00" },
  saturday: { open: "06:00", close: "14:00" },
  sunday: { open: "closed", close: "closed" }
}
```

## Weighbridge Operations Collections

### weighing_records (documents)

| Field           | Type            | Required | Description                 | Example                |
| --------------- | --------------- | -------- | --------------------------- | ---------------------- |
| id              | string (doc id) | yes      | Unique weighing record id   | w_123                  |
| orderId         | string          | yes      | Order reference             | o_123                  |
| assetId         | string          | yes      | Truck asset reference       | a_456                  |
| companyId       | string          | yes      | Company reference           | c_456                  |
| weighbridgeId   | string          | yes      | Weighbridge reference       | wb_01                  |
| status          | enum            | yes      | tare_only\|completed        | completed              |
| tareWeight      | number          | yes      | Empty weight in tons        | 8.5                    |
| grossWeight     | number          | no       | Loaded weight in tons       | 35.2                   |
| netWeight       | number          | no       | Net weight (gross - tare)   | 26.7                   |
| tareTimestamp   | timestamp       | yes      | When tare was captured      | 2024-01-15T08:30:00    |
| grossTimestamp  | timestamp       | no       | When gross was captured     | 2024-01-15T10:45:00    |
| overloadFlag    | boolean         | no       | Was truck overloaded        | false                  |
| underweightFlag | boolean         | no       | Was truck underweight       | false                  |
| sealNumbers     | string[]        | no       | Array of seal numbers       | ["SEAL001", "SEAL002"] |
| ticketNumber    | string          | yes      | Generated ticket number     | TKT-2024-00123         |
| operatorId      | string          | yes      | Weighbridge operator user   | u_999                  |
| createdAt       | number          | yes      | Client event time (ms)      | Date.now()             |
| updatedAt       | number          | yes      | Last client event time (ms) | Date.now()             |
| dbCreatedAt     | timestamp       | yes      | Server creation time        | serverTimestamp        |
| dbUpdatedAt     | timestamp       | yes      | Last server update time     | serverTimestamp        |

### weighbridges (documents)

| Field                | Type            | Required | Description                      | Example          |
| -------------------- | --------------- | -------- | -------------------------------- | ---------------- |
| id                   | string (doc id) | yes      | Unique weighbridge id            | wb_01            |
| name                 | string          | yes      | Weighbridge name                 | Main Weighbridge |
| location             | string          | yes      | Physical location                | Gate 1           |
| axleSetup            | enum            | yes      | single\|multiple                 | multiple         |
| serialPortConfig     | map             | no       | Serial port configuration        | See settings     |
| tolerancePercent     | number          | yes      | Weight tolerance percentage      | 0.5              |
| overloadThreshold    | number          | yes      | Overload threshold percentage    | 5                |
| underweightThreshold | number          | yes      | Underweight threshold percentage | 10               |
| lastCalibration      | timestamp       | no       | Last calibration date            | 2024-01-01       |
| nextCalibration      | timestamp       | no       | Next calibration due date        | 2024-02-01       |
| createdAt            | number          | yes      | Client event time (ms)           | Date.now()       |
| updatedAt            | number          | yes      | Last client event time (ms)      | Date.now()       |
| dbCreatedAt          | timestamp       | yes      | Server creation time             | serverTimestamp  |
| dbUpdatedAt          | timestamp       | yes      | Last server update time          | serverTimestamp  |
| isActive             | boolean         | yes      | Weighbridge active status        | true             |

### calibrations (documents)

| Field             | Type            | Required | Description                    | Example         |
| ----------------- | --------------- | -------- | ------------------------------ | --------------- |
| id                | string (doc id) | yes      | Unique calibration id          | cal_123         |
| weighbridgeId     | string          | yes      | Weighbridge reference          | wb_01           |
| knownWeight       | number          | yes      | Known test weight (tons)       | 10.0            |
| measuredWeight    | number          | yes      | Measured weight (tons)         | 10.02           |
| variance          | number          | yes      | Variance percentage            | 0.2             |
| adjustmentFactor  | number          | yes      | Calibration adjustment         | 0.998           |
| certificateNumber | string          | no       | Calibration certificate number | CERT-2024-001   |
| performedById     | string          | yes      | User who performed calibration | u_555           |
| createdAt         | number          | yes      | Client event time (ms)         | Date.now()      |
| dbCreatedAt       | timestamp       | yes      | Server creation time           | serverTimestamp |

### seals (documents)

| Field            | Type            | Required | Description               | Example             |
| ---------------- | --------------- | -------- | ------------------------- | ------------------- |
| id               | string (doc id) | yes      | Unique seal id            | seal_123            |
| sealNumber       | string          | yes      | Seal number               | SEAL001             |
| orderId          | string          | yes      | Order reference           | o_123               |
| weighingRecordId | string          | yes      | Weighing record reference | w_123               |
| status           | enum            | yes      | intact\|broken\|missing   | intact              |
| appliedAt        | timestamp       | yes      | When seal was applied     | 2024-01-15T09:00:00 |
| verifiedAt       | timestamp       | no       | When seal was verified    | 2024-01-15T11:00:00 |
| createdAt        | number          | yes      | Client event time (ms)    | Date.now()          |
| dbCreatedAt      | timestamp       | yes      | Server creation time      | serverTimestamp     |

## Security & Tracking Collections

### security_checks (documents)

| Field              | Type            | Required | Description               | Example             |
| ------------------ | --------------- | -------- | ------------------------- | ------------------- |
| id                 | string (doc id) | yes      | Unique security check id  | sc_123              |
| checkType          | enum            | yes      | entry\|exit               | entry               |
| assetId            | string          | yes      | Truck asset reference     | a_456               |
| driverId           | string          | yes      | Driver asset reference    | a_789               |
| trailer1Id         | string          | no       | Trailer 1 asset reference | a_111               |
| trailer2Id         | string          | no       | Trailer 2 asset reference | a_222               |
| orderId            | string          | no       | Associated order (if any) | o_123               |
| preBookingId       | string          | no       | Associated pre-booking    | pb_123              |
| scanResults        | map             | yes      | Results of all scans      | See below           |
| verificationStatus | enum            | yes      | passed\|failed\|denied    | passed              |
| denialReason       | string          | no       | Reason for denial         | No active orders    |
| securityOfficerId  | string          | yes      | Security officer user     | u_444               |
| timestamp          | timestamp       | yes      | When check occurred       | 2024-01-15T07:30:00 |
| createdAt          | number          | yes      | Client event time (ms)    | Date.now()          |
| dbCreatedAt        | timestamp       | yes      | Server creation time      | serverTimestamp     |

#### scanResults structure

```javascript
{
  driverQR: { status: "valid", data: "qr_string" },
  driverLicense: { status: "valid", expiry: "2025-12-31" },
  truckQR: { status: "valid", data: "qr_string" },
  truckDisk: { status: "valid", expiry: "2024-06-30" },
  trailer1QR: { status: "valid", data: "qr_string" },
  trailer1Disk: { status: "expired", expiry: "2023-12-31" },
  trailer2QR: { status: "not_scanned" },
  trailer2Disk: { status: "not_scanned" },
  seals: { status: "valid", numbers: ["SEAL001", "SEAL002"] }
}
```

## Configuration Collections

### settings/permissions (single document)

Document path: `settings/permissions`

| Field       | Type                                 | Required | Description                             |
| ----------- | ------------------------------------ | -------- | --------------------------------------- |
| permissions | map<string, { description: string }> | yes      | Map of permission key → metadata object |

Example structure:

```javascript
{
  permissions: {
    // Asset Management
    "assets.view": { description: "View assets" },
    "assets.add": { description: "Add new assets" },
    "assets.edit": { description: "Edit existing assets" },
    "assets.delete": { description: "Delete assets" },

    // Order Management
    "orders.view": { description: "View orders" },
    "orders.create": { description: "Create new orders" },
    "orders.allocate": { description: "Allocate orders" },
    "orders.cancel": { description: "Cancel orders" },
    "orders.viewAll": { description: "View all orders (not just assigned)" },

    // Pre-Booking
    "preBooking.view": { description: "View pre-bookings" },
    "preBooking.create": { description: "Create pre-bookings" },
    "preBooking.edit": { description: "Edit pre-bookings" },

    // Operational Flows
    "security.in": { description: "Perform security in checks" },
    "security.out": { description: "Perform security out checks" },
    "weighbridge.tare": { description: "Capture tare weight" },
    "weighbridge.gross": { description: "Capture gross weight" },
    "weighbridge.calibrate": { description: "Perform weighbridge calibration" },
    "weighbridge.override": { description: "Manual weight override" },

    // Administrative
    "admin.companies": { description: "Manage companies" },
    "admin.companies": { description: "Manage companies" },
    "admin.users": { description: "Manage users" },
    "admin.products": { description: "Manage products" },
    "admin.orderSettings": { description: "Configure order settings" },
    "admin.clients": { description: "Manage clients" },
    "admin.sites": { description: "Manage sites" },
    "admin.weighbridge": { description: "Configure weighbridge" },
    "admin.notifications": { description: "Configure notifications" },
    "admin.system": { description: "System-wide settings" },
    "admin.securityAlerts": { description: "Configure security alerts" },

    // Reports
    "reports.daily": { description: "View daily reports" },
    "reports.monthly": { description: "View monthly reports" },
    "reports.custom": { description: "Create custom reports" },
    "reports.export": { description: "Export report data" },

    // Special
    "emergency.override": { description: "Emergency override access" },
    "orders.editCompleted": { description: "Edit completed orders" },
    "records.delete": { description: "Delete records permanently" },
    "preBooking.bypass": { description: "Bypass pre-booking requirements" }
  }
}
```

### settings/system (single document)

Document path: `settings/system`

| Field                   | Type     | Required | Description                        |
| ----------------------- | -------- | -------- | ---------------------------------- |
| fleetNumberEnabled      | boolean  | yes      | Enable fleet number field          |
| fleetNumberLabel        | string   | no       | Custom label for fleet number      |
| transporterGroupEnabled | boolean  | yes      | Enable transporter group field     |
| transporterGroupLabel   | string   | no       | Custom label for transporter group |
| groupOptions            | string[] | no       | Available group options            |

### settings/order_config (single document)

Document path: `settings/order_config`

| Field                   | Type    | Required | Description                       |
| ----------------------- | ------- | -------- | --------------------------------- |
| orderNumberMode         | enum    | yes      | autoOnly\|manualAllowed           |
| orderNumberPrefix       | string  | no       | Prefix for auto-generated numbers |
| defaultDailyTruckLimit  | number  | yes      | Default daily truck limit         |
| defaultDailyWeightLimit | number  | yes      | Default daily weight limit (tons) |
| defaultMonthlyLimit     | number  | no       | Default monthly limit (tons)      |
| defaultTripLimit        | number  | yes      | Default trips per day             |
| defaultWeightPerTruck   | number  | yes      | Default weight per truck (tons)   |
| preBookingMode          | enum    | yes      | compulsory\|optional              |
| advanceBookingHours     | number  | yes      | Hours in advance for pre-booking  |
| defaultSealRequired     | boolean | yes      | Default seal requirement          |
| defaultSealQuantity     | number  | no       | Default number of seals           |

### settings/security_alerts (single document)

Document path: `settings/security_alerts`

| Field                   | Type     | Required | Description                         |
| ----------------------- | -------- | -------- | ----------------------------------- |
| primaryContactId        | string   | yes      | Primary security contact user ID    |
| secondaryContactIds     | string[] | no       | Secondary contact user IDs          |
| escalationMinutes       | number   | yes      | Minutes before escalating to next   |
| qrMismatchContacts      | string[] | no       | Specific contacts for QR mismatches |
| documentFailureContacts | string[] | no       | Contacts for document failures      |
| sealDiscrepancyContacts | string[] | no       | Contacts for seal issues            |
| requiredResponseMinutes | number   | yes      | Required response time              |

### notification_templates (documents)

| Field       | Type            | Required | Description                                 | Example         |
| ----------- | --------------- | -------- | ------------------------------------------- | --------------- |
| id          | string (doc id) | yes      | Template identifier                         | tpl_asset_added |
| name        | string          | yes      | Template name                               | Asset Added     |
| subject     | string          | yes      | Email subject line                          | New Asset Added |
| body        | string          | yes      | Email body with placeholders                | See below       |
| category    | enum            | yes      | asset\|order\|weighbridge\|security\|system | asset           |
| createdAt   | number          | yes      | Client event time (ms)                      | Date.now()      |
| updatedAt   | number          | yes      | Last client event time (ms)                 | Date.now()      |
| dbCreatedAt | timestamp       | yes      | Server creation time                        | serverTimestamp |
| dbUpdatedAt | timestamp       | yes      | Last server update time                     | serverTimestamp |

Example body with placeholders:

```text
Hello {{userName}},

A new {{assetType}} has been added to the system:
- Registration: {{registrationNumber}}
- Fleet Number: {{fleetNumber}}
- Company: {{companyName}}

Added on: {{date}} at {{time}}

Regards,
Newton System
```

## Audit & Logging Collections

### audit_logs (documents)

| Field       | Type            | Required | Description               | Example                 |
| ----------- | --------------- | -------- | ------------------------- | ----------------------- |
| id          | string (doc id) | yes      | Unique audit log id       | log_123                 |
| userId      | string          | yes      | User who performed action | u_123                   |
| action      | string          | yes      | Action performed          | order.created           |
| entityType  | string          | yes      | Entity type affected      | order                   |
| entityId    | string          | yes      | Entity ID affected        | o_456                   |
| changes     | map             | no       | What changed              | { status: "allocated" } |
| ipAddress   | string          | no       | User's IP address         | 192.168.1.100           |
| userAgent   | string          | no       | User's browser/device     | Chrome/120.0            |
| timestamp   | timestamp       | yes      | When action occurred      | 2024-01-15T10:30:00     |
| createdAt   | number          | yes      | Client event time (ms)    | Date.now()              |
| dbCreatedAt | timestamp       | yes      | Server creation time      | serverTimestamp         |

## Default Roles Configuration

The system should be initialized with these default roles:

1. **Newton Administrator** (r_newton_admin): All permissions
2. **Site Administrator** (r_site_admin): Site-level permissions
3. **Logistics Coordinator** (r_logistics_coordinator): Order and pre-booking management
4. **Allocation Officer** (r_allocation_officer): Order allocation
5. **Transporter** (r_transporter): View assigned orders only
6. **Induction Officer** (r_induction_officer): Asset management
7. **Weighbridge Supervisor** (r_weighbridge_supervisor): Weighbridge operations + calibration
8. **Weighbridge Operator** (r_weighbridge_operator): Weight capture only
9. **Security Personnel** (r_security): Security in/out operations
