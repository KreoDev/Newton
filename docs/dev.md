# Newton Development Implementation Plan (AI-Optimized)

## How to Use This Plan

This document is designed for AI-assisted development. Each phase contains:

1. **Specific file paths** to create or modify
2. **Step-by-step implementation instructions** with clear requirements
3. **Data structures and types** to use
4. **Testing checklist** to verify implementation

**Important Notes for AI Implementation:**

- Always import required dependencies at the top of files
- Use existing UI components from `src/components/ui/`
- Follow TypeScript strictly - add proper types for all functions
- Use existing services pattern from `src/services/`
- Apply glass morphism design from `design.json`
- Use existing auth context from `src/contexts/AuthContext.tsx`
- **Firebase file usage (IMPORTANT):**
  - `src/lib/firebase.ts` - Client SDK exports (auth, db, storage) - use in client components and services
  - `src/lib/firebase-utils.ts` - **USE THESE FIRST** - Helper functions for CRUD with built-in toast notifications:
    - `createDocument(collectionName, data, successMessage?)` - Adds doc with timestamps and toast
    - `updateDocument(collectionName, id, data, successMessage?)` - Updates doc with toast
    - `deleteDocument(collectionName, id, successMessage?)` - Deletes doc with toast
    - Pre-configured operations: `userOperations`, `assetOperations`, `roleOperations`, etc.
    - **Timestamps:** Automatically adds per data-model spec: `createdAt`/`updatedAt` (client times via `Date.now()`), `dbCreatedAt`/`dbUpdatedAt` (server times via `serverTimestamp()`)
  - `src/lib/firebase-admin.ts` - Admin SDK (adminDb, adminAuth) - **ONLY use in API routes** (`src/app/api/`)
- Use `sonner` toast for user feedback (firebase-utils already includes this)
- Add proper error handling with try-catch blocks
- **Search functionality (IMPORTANT):**
  - `src/services/search.service.ts` - Core search logic with nested field support, weighting, transformers
  - `src/hooks/useOptimizedSearch.ts` - React hook for optimized search with debouncing and performance features
  - `src/config/search-configs.ts` - Centralized search configurations for all entities
  - **Always use optimized search** - For any page with search/filter functionality, use `useOptimizedSearch` hook with appropriate config from `search-configs.ts`
  - Features: debouncing (300ms), exact match, case sensitivity, result limiting, search highlighting, requestIdleCallback for non-blocking search

---

## Firebase Architecture & Usage Guide

### Three Firebase Files - When to Use Each

#### 1. `src/lib/firebase.ts` - Client SDK Exports

**Use in:** Client components, services, hooks **Exports:** `auth`, `db`, `storage`, `app` **Purpose:** Direct access to Firebase client SDK

```typescript
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Use for complex queries
const q = query(collection(db, "assets"), where("companyId", "==", companyId))
const snapshot = await getDocs(q)
```

#### 2. `src/lib/firebase-utils.ts` - CRUD Helpers (USE THESE FIRST!)

**Use in:** Client components, services when doing simple CRUD operations **Exports:** `createDocument`, `updateDocument`, `deleteDocument`, `userOperations`, `assetOperations`, etc. **Purpose:** Simplified CRUD with automatic timestamps, toast notifications, and error handling

```typescript
import { createDocument, updateDocument } from "@/lib/firebase-utils"
import { assetOperations } from "@/lib/firebase-utils"

// Simple CRUD - automatically adds timestamps and shows toast
const id = await createDocument("companies", companyData, "Company created")
await updateDocument("companies", id, updates, "Company updated")

// Pre-configured operations
await assetOperations.create(assetData)
await assetOperations.update(assetId, updates)
await assetOperations.delete(assetId)
```

**Why use firebase-utils?**

- ✅ Automatic timestamp handling per data model spec:
  - `createdAt`, `updatedAt`: Client event times (`Date.now()`)
  - `dbCreatedAt`, `dbUpdatedAt`: Server timestamps (`serverTimestamp()`)
- ✅ Built-in toast notifications (success/error)
- ✅ Error handling included
- ✅ Consistent data structure across app
- ✅ Less code to write

#### 3. `src/lib/firebase-admin.ts` - Admin SDK (Server-Side Only)

**Use in:** API routes (`src/app/api/**/*.ts`) and server-side operations ONLY **Exports:** `adminDb`, `adminAuth`, `app` **Purpose:** Server-side operations with elevated permissions

```typescript
import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

// Only use in API routes - has admin privileges
await adminDb.collection("companies").doc(id).set(data)
await adminAuth.createUser({ email, password })
```

### Decision Tree: Which Firebase File to Use?

```
Are you in an API route (src/app/api/)?
├─ YES → Use firebase-admin.ts (adminDb, adminAuth)
└─ NO → Are you doing simple CRUD (create/update/delete single document)?
    ├─ YES → Use firebase-utils.ts (createDocument, updateDocument, etc.)
    └─ NO → Use firebase.ts (db) for complex queries, real-time listeners, etc.
```

---

## Search Infrastructure & Usage Guide

### Optimized Search System

Newton uses a centralized, optimized search infrastructure for consistent, performant search across all entities.

#### Three Search Files - How They Work Together

**1. `src/services/search.service.ts` - Core Search Logic**

- Performs weighted field matching
- Supports nested field access (e.g., "user.firstName")
- Custom field transformers (e.g., convert numbers to searchable strings)
- Exact match, case sensitivity options
- Result limiting and ranking

**2. `src/hooks/useOptimizedSearch.ts` - React Hook**

Features:
- 300ms debouncing to prevent excessive re-renders
- requestIdleCallback for non-blocking search
- Loading states (isSearching)
- Memoized results
- Auto-cleanup on unmount

**3. `src/config/search-configs.ts` - Centralized Configurations**

Contains search configs for all entities:
- `users`, `roles`, `companies`, `clients`, `assets`, `assetTypes`
- `orders`, `preBookings`, `products`, `sites`
- `weighingRecords`, `weighbridges`, `securityChecks`
- `transporters`, `documentTypes`

Each config specifies:
- **fields**: Array of `{ path, weight, transformer? }` objects
- **debounceMs**: Debounce delay (typically 200-300ms)
- **minSearchLength**: Minimum characters before search activates
- **maxResults**: Maximum results to return

#### How to Use Optimized Search

**Step 1:** Import the hook and config:

```typescript
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
```

**Step 2:** Use the hook in your component:

```typescript
const { searchTerm, setSearchTerm, filteredItems, isSearching } =
  useOptimizedSearch(dataArray, SEARCH_CONFIGS.entityName)
```

**Step 3:** Render search UI:

```typescript
<Input
  placeholder="Search..."
  value={searchTerm}
  onChange={e => setSearchTerm(e.target.value)}
/>

{isSearching ? (
  <div>Searching...</div>
) : (
  <div>
    {filteredItems.map(item => (
      <div key={item.id}>{/* Render item */}</div>
    ))}
  </div>
)}
```

#### Example: Companies Page with Optimized Search

```typescript
"use client"

import { useState, useEffect } from "react"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import type { Company } from "@/types"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filterType, setFilterType] = useState<string>("all")

  // Optimized search hook
  const { searchTerm, setSearchTerm, filteredItems: searchedCompanies, isSearching } =
    useOptimizedSearch(companies, SEARCH_CONFIGS.companies)

  // Additional filters (type filter)
  const filteredCompanies = searchedCompanies.filter(company =>
    filterType === "all" || company.companyType === filterType
  )

  return (
    <div>
      {/* Search input */}
      <Input
        placeholder="Search by name or registration..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {/* Type filter */}
      <select value={filterType} onChange={e => setFilterType(e.target.value)}>
        <option value="all">All Types</option>
        <option value="mine">Mine</option>
        <option value="transporter">Transporter</option>
      </select>

      {/* Results with loading state */}
      {isSearching ? (
        <div>Loading...</div>
      ) : (
        <div>
          {filteredCompanies.map(company => (
            <div key={company.id}>{company.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### When to Use Optimized Search

✅ **Always use for:**
- Any page with search functionality
- Lists with 10+ items
- User-facing search interfaces
- Data tables with filtering

❌ **Don't use for:**
- Static data (< 5 items)
- One-time filter operations
- Server-side only operations

#### Search Config Structure

Example from `search-configs.ts`:

```typescript
export const SEARCH_CONFIGS = {
  companies: {
    fields: [
      { path: "name", weight: 2 },                    // High priority
      { path: "registrationNumber", weight: 2 },      // High priority
      { path: "companyType", weight: 1 },             // Lower priority
      { path: "physicalAddress", weight: 1 },
      { path: "vatNumber", weight: 1 },
    ],
    debounceMs: 300,           // Wait 300ms after typing stops
    minSearchLength: 2,        // Require 2+ characters
    maxResults: 500,           // Return max 500 results
  } as SearchConfig,

  assets: {
    fields: [
      { path: "registrationNumber", weight: 2 },
      { path: "licenseNumber", weight: 2 },
      { path: "qrCode", weight: 1 },
      { path: "fleetNumber", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 1000,
  } as SearchConfig,

  orders: {
    fields: [
      { path: "orderNumber", weight: 3 },             // Highest priority
      { path: "orderType", weight: 1 },
      { path: "status", weight: 1 },
      {
        path: "totalWeight",
        weight: 1,
        transformer: (weight: number) => weight ? `${weight} tons` : "",
      },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,
}
```

#### Custom Transformers

For complex fields that need special handling:

```typescript
{
  path: "fields",
  weight: 1,
  transformer: (fields: Array<{ label: string; fieldType: string }>) => {
    if (!Array.isArray(fields)) return ""
    return fields.map(f => `${f.label} ${f.fieldType}`).join(" ")
  }
}
```

This transforms array/object fields into searchable strings.

#### Performance Benefits

- **Debouncing:** Prevents excessive re-renders during typing
- **requestIdleCallback:** Non-blocking search (doesn't freeze UI)
- **Weighted matching:** Most relevant results appear first
- **Memoization:** Cached results until data/search term changes
- **Configurable limits:** Prevent rendering thousands of results

### Examples by Use Case

**Use Case: Create a new company**

```typescript
// ✅ GOOD - Use firebase-utils
import { createDocument } from "@/lib/firebase-utils"
const id = await createDocument("companies", companyData, "Company created")

// ❌ AVOID - Too much manual work
import { db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
const docRef = await addDoc(collection(db, "companies"), {
  ...companyData,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: serverTimestamp(),
  dbUpdatedAt: serverTimestamp(),
})
toast.success("Company created")
```

**Use Case: Complex query with filters**

```typescript
// ✅ GOOD - Use firebase.ts for complex queries
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"

const q = query(collection(db, "assets"), where("companyId", "==", companyId), where("isActive", "==", true), orderBy("createdAt", "desc"))
const snapshot = await getDocs(q)
```

**Use Case: Seed script (server-side)**

```typescript
// ✅ GOOD - Use firebase-admin in API routes
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

await adminDb
  .collection("companies")
  .doc(id)
  .set({
    ...data,
    createdAt: Date.now(), // Client event time
    updatedAt: Date.now(), // Client event time
    dbCreatedAt: FieldValue.serverTimestamp(), // Server timestamp
    dbUpdatedAt: FieldValue.serverTimestamp(), // Server timestamp
  })
```

---

## Technology Stack Reference

### Already Installed & Available

- **Next.js 15.5.4** (App Router) - Use "use client" for client components
- **React 19** - Modern hooks available
- **TypeScript 5.9.2** - Strict mode enabled
- **Tailwind CSS 4.1.13** - Use for all styling
- **Radix UI** - Pre-configured components in `src/components/ui/`
- **Framer Motion 12.23.22** - Use for animations
- **Lucide React** - Icon library
- **Firebase 12.3.0** - Client SDK
- **firebase-admin 13.5.0** - Server SDK (API routes only)
- **react-hook-form 7.63.0** - Form handling
- **zod 4.1.11** - Validation schemas
- **date-fns 4.1.0** - Date manipulation
- **uuid 13.0.0** - ID generation
- **lodash 4.17.21** - Utility functions
- **sonner** - Toast notifications (use `import { toast } from "sonner"`)

### Schema Alignment Prerequisite

Before implementing any feature work, synchronise `src/types/index.ts` with `docs/data-model.md`:

- Ensure every interface includes all required fields (e.g., `Company.orderConfig`, `Company.systemSettings`, `Company.securityAlerts`, `User.notificationPreferences`, timestamp fields).
- Respect `companyId` on every company-scoped entity; use discriminated unions where the model defines enums.
- Add `isActive` flags where required and mark optional fields correctly.
- Re-export any shared map structures (e.g., notification preference keys) to keep UI forms consistent with schema.

This guarantees the remainder of the plan compiles against the documented data shape.

---

## Phase 1: Core Infrastructure & Permissions

### Overview

Set up permission system, enhance company management, and improve user management with full role-based access control.

---

### Task 1.1: Permission System Core

Update existing permission infrastructure to match `docs/data-model.md` and `src/types/index.ts`.

#### Step 1: Define Permission Metadata

**File:** `docs/data-model.md` already lists permission keys. Mirror that list in `src/lib/permissions.ts` and expose helper types:

```typescript
import type { PermissionKey } from "@/types"

export const PERMISSIONS: Record<string, PermissionKey> = {
  // follow data-model.md ordering (Asset, Orders, PreBooking, Operational, Administrative, Reports, Special)
}

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  // descriptions pulled from data-model
}
```

Use the union from the `PermissionKey` type exported in `src/types/index.ts` so definitions stay single-sourced.

#### Step 2: Role Permissions Hook

**File:** `src/hooks/usePermission.ts`

- Fetch the active role via Firestore using `companyId` and `roleId` (`roles/${user.roleId}`) and cast to the `Role` interface.
- Evaluate permissions in this order: `user.isGlobal` → `user.permissionOverrides` → `role.permissionKeys` (supports `"*"`).
- Cache role results per `roleId` with `useState` and `useEffect`.

#### Step 3: Permission Gate Component

**File:** `src/components/auth/PermissionGate.tsx`

- Client component that renders children if `usePermission(permission)` is true, otherwise renders an optional `fallback`.

#### Step 4: Permission Service (Shared Runtime)

**File:** `src/services/permission.service.ts`

- Implement `evaluatePermission(user: User, role: Role | null, permission: PermissionKey)` plus helper methods `evaluateMultiple`, `hasAnyPermission`, `hasAllPermissions`.
- Apply the same evaluation order as the hook for deterministic behaviour across server/client logic.

#### Step 5: Seed Global Permissions Document

**File:** `src/app/api/seed/route.ts`

Add `seedPermissions` to create the singleton document `settings/permissions` exactly as described in `docs/data-model.md` (map of permission key → description). Return `1` so seeded counts display correctly.

Call this function during the seed routine after clearing collections and before seeding roles.

#### Step 6: Seed Default Roles per Company

**File:** `src/app/api/seed/route.ts`

Replace `DEFAULT_ROLES` with an array that aligns with the data model defaults and includes every required field:

```typescript
const DEFAULT_ROLES: Array<Omit<Role, "createdAt" | "updatedAt" | "dbCreatedAt" | "dbUpdatedAt">> = [
  {
    id: "r_newton_admin",
    companyId: DEFAULT_COMPANY_ID,
    name: "Newton Administrator",
    permissionKeys: ["*"],
    description: "Full system access and configuration",
    isActive: true,
  },
  // ... remaining roles with permissionKeys drawn from PERMISSIONS
]
```

When seeding additional companies (Phase 2 and beyond), clone these defaults with the target `companyId` so each tenant receives its own role set.

Persist each role with timestamps using `FieldValue.serverTimestamp()` and `Date.now()` to satisfy the data model's timestamp requirements.

---

### Task 1.2: Enhance Seed Script with Permissions and Roles

**File to Update:** `src/app/api/seed/route.ts`

Add these functions to the seed script:

```typescript
// Add this function to seed permissions
async function seedPermissions(sendProgress: (data: ProgressData) => void) {
  const permissionsData = {
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
      "preBooking.bypass": { description: "Bypass pre-booking requirements" },
    },
  }

  await adminDb.doc("settings/permissions").set(permissionsData)

  sendProgress({
    stage: "seeding_permissions",
    message: "Seeded permissions document",
    completed: true,
  })

  return 1
}

// Update the DEFAULT_ROLES array with complete permission mappings
const DEFAULT_ROLES = [
  {
    id: "r_newton_admin",
    name: "Newton Administrator",
    permissionKeys: ["*"],
    description: "Full system access and configuration",
  },
  {
    id: "r_site_admin",
    name: "Site Administrator",
    permissionKeys: ["assets.view", "assets.add", "assets.edit", "orders.view", "orders.viewAll", "preBooking.view", "weighbridge.tare", "weighbridge.gross", "security.in", "security.out", "reports.daily", "reports.monthly", "reports.export", "admin.sites", "admin.weighbridge"],
    description: "Site-level management and operations",
  },
  {
    id: "r_logistics_coordinator",
    name: "Logistics Coordinator",
    permissionKeys: ["assets.view", "orders.view", "orders.create", "orders.allocate", "orders.viewAll", "preBooking.view", "preBooking.create", "preBooking.edit", "reports.daily", "reports.monthly", "reports.export"],
    description: "Order and pre-booking management",
  },
  {
    id: "r_allocation_officer",
    name: "Allocation Officer",
    permissionKeys: ["orders.view", "orders.allocate", "orders.viewAll", "preBooking.view", "reports.daily"],
    description: "Order allocation and distribution",
  },
  {
    id: "r_transporter",
    name: "Transporter",
    permissionKeys: ["assets.view", "orders.view", "preBooking.view", "reports.daily"],
    description: "View assigned orders and assets only",
  },
  {
    id: "r_induction_officer",
    name: "Induction Officer",
    permissionKeys: ["assets.view", "assets.add", "assets.edit", "assets.delete", "reports.daily"],
    description: "Asset induction and management",
  },
  {
    id: "r_weighbridge_supervisor",
    name: "Weighbridge Supervisor",
    permissionKeys: ["weighbridge.tare", "weighbridge.gross", "weighbridge.calibrate", "weighbridge.override", "reports.daily", "reports.monthly", "reports.export", "admin.weighbridge"],
    description: "Weighbridge operations and calibration",
  },
  {
    id: "r_weighbridge_operator",
    name: "Weighbridge Operator",
    permissionKeys: ["weighbridge.tare", "weighbridge.gross", "reports.daily"],
    description: "Weight capture operations only",
  },
  {
    id: "r_security",
    name: "Security Personnel",
    permissionKeys: ["security.in", "security.out", "reports.daily"],
    description: "Security checkpoint operations",
  },
]

// Update seedRoles function (already exists, just ensure it uses DEFAULT_ROLES)
```

Then update the main GET function to call seedPermissions:

```typescript
// In the GET function, add after clearing collections:
results.seeded.permissions = await seedPermissions(sendProgress)
```

---

### Task 1.3: Create Company Management Pages

#### Step 1: Company List

**File:** `src/app/(authenticated)/admin/companies/page.tsx`

- Fetch companies via `CompanyService.listAccessibleCompanies(user)` which internally:
  - Returns all companies for global users.
  - Returns only `user.companyId` for non-global users.
- Display key fields aligned with the data model: name, companyType, registrationNumber, isActive, primary contact, and badges indicating which embedded configs (`orderConfig`, `systemSettings`, `securityAlerts`) are populated.
- Provide filters (search by name/registration, filter by companyType) to support **Flow 7: Company (Mine) Configuration** discovery needs from `docs/user-flow-web.md`.
- Wrap content in `PermissionGate` for `PERMISSIONS.ADMIN_COMPANIES`.

#### Step 2: Company Creation / Editing Modal

**File:** `src/components/companies/CompanyFormModal.tsx`

- Form captures **all** required fields:
  - Core: `name`, `companyType`, `registrationNumber`, `vatNumber`, `physicalAddress`.
  - Contacts: `mainContactId`, `secondaryContactIds` (multi-select of users in same company).
  - Embedded config objects (use nested forms with sensible defaults):
    - `orderConfig` (order number mode, limits, seal requirements, etc.).
    - `systemSettings` (fleet number toggle/label, group toggle/label, group options array).
    - `securityAlerts` (primary/secondary contacts, escalation settings, response times).
    - Optional `mineConfig`, `transporterConfig`, `logisticsCoordinatorConfig` depending on `companyType` so Flow 8/9 requirements are met.
- Provide helper text/tooltips referencing the relevant flow steps (e.g., seal rules from Flow 12, security escalation from Flow 18).
- Submit via `CompanyService.create`/`CompanyService.update`, which use `firebase-utils` to add timestamps automatically.

#### Step 3: Company Service Layer

**File:** `src/services/company.service.ts`

Implement methods that respect the data model:

```typescript
import type { Company } from "@/types"

export class CompanyService {
  static async listAccessibleCompanies(user: User): Promise<Company[]> {
    // global users: fetch all; others: fetch by user.companyId
  }

  static async create(data: Omit<Company, "id" | keyof Timestamped>): Promise<string> {
    // use createDocument("companies", data)
  }

  static async update(id: string, data: Partial<Company>): Promise<void> {
    // use updateDocument
  }

  static async getCompanyUsers(companyId: string): Promise<User[]> {
    // helper for contact selectors
  }
}
```

Validate payloads against Zod schemas mirroring the data model to keep nested objects well-typed.

#### Step 4: Navigation Update

**File:** `src/components/layout/AppLayout.tsx`

Add an Admin section only visible when `usePermission(PERMISSIONS.ADMIN_COMPANIES)` is true:

```typescript
const adminNavigation = [
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
]
```

Render this group conditionally inside the sidebar and header menus.

#### Step 5: Company Details Drawer (Optional but Recommended)

Provide a quick panel to display nested configurations read-only so testers can verify seeds. (Implementation deferred to later phase but referenced here for completeness.)

---

### Task 1.4: Update Navigation to Include Admin Routes

**File to Update:** `src/components/layout/AppLayout.tsx`

Find the `navigation` array and update it:

```typescript
const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Settings", href: "/settings", icon: Settings },
  // Add these new items:
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
]
```

Import the new icons at the top:

```typescript
import { Home, Settings, Menu, X, LogOut, ChevronDown, Building2, Users } from "lucide-react"
```

---

## Phase 1 Testing Checklist

### Pre-Testing Setup

1. ✅ Run seed script: Navigate to `/seed` and click "Seed Database"
2. ✅ Verify seed completed successfully (check browser console)
3. ✅ Login with: `dev@newton.co.za` / `NewtonDev123!` (or your configured password)

### Permission System Tests

#### Test 1.1: Permission Constants

- [ ] Open browser console
- [ ] Import and check permissions: All permission keys are defined
- [ ] Expected: No TypeScript errors in IDE

#### Test 1.2: Permission Hook

- [ ] Navigate to any page
- [ ] Open React DevTools
- [ ] Check user context has `isGlobal: true`
- [ ] Expected: Dev user should have all permissions (isGlobal=true)

#### Test 1.3: Permission Gate

- [ ] Check if admin menu items are visible in sidebar
- [ ] Expected: "Companies" and "Users" links should be visible

#### Test 1.4: Seed Data Verification

- [ ] Open Firebase Console → Firestore Database
- [ ] Check `settings/permissions` document exists
- [ ] Expected: Document contains all permission keys with descriptions
- [ ] Check `roles` collection has 9 documents
- [ ] Expected: All default roles (r_newton_admin, r_site_admin, etc.) exist
- [ ] Verify each role has proper `permissionKeys` array

### Company Management Tests

#### Test 1.5: Company Listing

- [ ] Navigate to `/admin/companies`
- [ ] Expected: Page loads without errors
- [ ] Expected: See at least 1 company (Dev Company from seed)
- [ ] Expected: Search box and filter dropdown are visible
- [ ] Expected: "Add Company" button is visible

#### Test 1.6: Company Search

- [ ] Type "Dev" in search box
- [ ] Expected: Dev Company appears in results
- [ ] Type "XYZ" (non-existent)
- [ ] Expected: "No companies found" message

#### Test 1.7: Company Type Filter

- [ ] Select "Mine" from filter dropdown
- [ ] Expected: Only mine companies shown
- [ ] Select "Transporter" from filter
- [ ] Expected: Only transporter companies shown (may be 0)
- [ ] Select "All Types"
- [ ] Expected: All companies shown

#### Test 1.8: Add Company

- [ ] Click "Add Company" button
- [ ] Expected: Modal opens with form
- [ ] Leave required fields empty, click "Create Company"
- [ ] Expected: Error toast "Please fill in all required fields"
- [ ] Fill in all fields:
  - Name: "Test Transporter Co"
  - Type: Select "Transporter"
  - Registration: "2024/TEST/001"
  - VAT: "4000000001"
  - Address: "123 Test Street, Test City"
- [ ] Click "Create Company"
- [ ] Expected: Success toast "Company created successfully"
- [ ] Expected: Modal closes
- [ ] Expected: New company appears in list

#### Test 1.9: Permission Restriction (Non-Global User)

- [ ] Create a new user (we'll do this in Phase 2, skip for now)
- [ ] Or manually set your user's `isGlobal` to false in Firestore
- [ ] Refresh page
- [ ] Navigate to `/admin/companies`
- [ ] Expected: See message "You don't have permission to manage companies"

### Data Validation Tests

#### Test 1.10: Firestore Data Structure

- [ ] Open Firebase Console → Firestore
- [ ] Navigate to `companies` collection
- [ ] Click on any company document
- [ ] Verify fields exist:
  - `id` (document ID)
  - `name` (string)
  - `companyType` (string: mine/transporter/logistics_coordinator)
  - `registrationNumber` (string)
  - `physicalAddress` (string)
  - `mainContactId` (string)
  - `secondaryContactIds` (array)
  - `createdAt` (number)
  - `updatedAt` (number)
  - `dbCreatedAt` (timestamp)
  - `dbUpdatedAt` (timestamp)
  - `isActive` (boolean: true)

#### Test 1.11: Console Errors

- [ ] Open browser console (F12)
- [ ] Navigate through all pages created
- [ ] Expected: No red errors in console
- [ ] Expected: No TypeScript compilation errors

### Performance Tests

#### Test 1.12: Page Load Times

- [ ] Clear browser cache
- [ ] Navigate to `/admin/companies`
- [ ] Check Network tab in DevTools
- [ ] Expected: Page loads in < 2 seconds
- [ ] Expected: No failed network requests (red items)

### Mobile Responsiveness Tests

#### Test 1.13: Mobile View

- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
- [ ] Select iPhone or Android device
- [ ] Navigate to `/admin/companies`
- [ ] Expected: Layout adapts to mobile screen
- [ ] Expected: All buttons are accessible
- [ ] Expected: Modal is readable on mobile

---

## Phase 1 Success Criteria

✅ **All tests passing** - No errors in console or UI ✅ **Permission system working** - Hooks return correct values ✅ **Company CRUD functional** - Can list and create companies ✅ **Data persisted correctly** - Firestore contains correct data structure ✅ **UI matches design system** - Glass morphism applied, consistent styling ✅ **Mobile responsive** - Works on mobile viewport

### Known Limitations (Expected for Phase 1)

- Cannot edit or delete companies yet (add in later phase if needed)
- Company details page not implemented yet
- User management not fully enhanced yet (Phase 1 Task 1.3 pending)
- No company-specific configurations UI yet (mineConfig, transporterConfig, etc.)

---

## Phase 2: Asset Management Module

### Overview

Implement complete asset management system including induction flow, asset listing, deletion with transaction checking, and expiry tracking.

---

### Task 2.1: Asset Service Layer

**File:** `src/services/asset.service.ts`

```typescript
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { createDocument, updateDocument, deleteDocument } from "@/lib/firebase-utils"
import type { Asset } from "@/types"

export class AssetService {
  static async getById(id: string): Promise<Asset | null> {
    try {
      const docRef = doc(db, "assets", id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) return null

      return { id: docSnap.id, ...docSnap.data() } as Asset
    } catch (error) {
      console.error("Error fetching asset:", error)
      throw error
    }
  }

  static async getByCompany(companyId: string): Promise<Asset[]> {
    try {
      const q = query(collection(db, "assets"), where("companyId", "==", companyId), where("isActive", "==", true), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Asset[]
    } catch (error) {
      console.error("Error fetching assets:", error)
      throw error
    }
  }

  static async getByQRCode(qrCode: string): Promise<Asset | null> {
    try {
      const q = query(collection(db, "assets"), where("qrCode", "==", qrCode), limit(1))
      const snapshot = await getDocs(q)

      if (snapshot.empty) return null

      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Asset
    } catch (error) {
      console.error("Error fetching asset by QR:", error)
      throw error
    }
  }

  static async create(data: Omit<Asset, "id" | "createdAt" | "updatedAt" | "dbCreatedAt" | "dbUpdatedAt">): Promise<string> {
    try {
      // Use firebase-utils helper - automatically adds timestamps and shows toast
      const id = await createDocument("assets", data, "Asset created successfully")
      return id
    } catch (error) {
      console.error("Error creating asset:", error)
      throw error
    }
  }

  static async update(id: string, data: Partial<Asset>): Promise<void> {
    try {
      // Use firebase-utils helper - automatically adds timestamps and shows toast
      await updateDocument("assets", id, data, "Asset updated successfully")
    } catch (error) {
      console.error("Error updating asset:", error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      // Use firebase-utils helper - shows toast
      await deleteDocument("assets", id, "Asset deleted successfully")
    } catch (error) {
      console.error("Error deleting asset:", error)
      throw error
    }
  }

  static async inactivate(id: string, reason: string): Promise<void> {
    try {
      // Use firebase-utils helper for update
      await updateDocument(
        "assets",
        id,
        {
          isActive: false,
          inactiveReason: reason,
          inactiveDate: new Date().toISOString(),
        },
        "Asset inactivated successfully"
      )
    } catch (error) {
      console.error("Error inactivating asset:", error)
      throw error
    }
  }

  static async checkHasTransactions(assetId: string): Promise<{ hasTransactions: boolean; count: number }> {
    try {
      // Check weighing_records
      const weighingQuery = query(collection(db, "weighing_records"), where("assetId", "==", assetId), limit(1))
      const weighingSnapshot = await getDocs(weighingQuery)

      // Check security_checks
      const securityQuery = query(collection(db, "security_checks"), where("assetId", "==", assetId), limit(1))
      const securitySnapshot = await getDocs(securityQuery)

      const hasTransactions = !weighingSnapshot.empty || !securitySnapshot.empty
      const count = weighingSnapshot.size + securitySnapshot.size

      return { hasTransactions, count }
    } catch (error) {
      console.error("Error checking transactions:", error)
      throw error
    }
  }

  static validateLicenseExpiry(expiryDate: string): { isValid: boolean; daysUntilExpiry: number } {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      isValid: daysUntilExpiry > 0,
      daysUntilExpiry,
    }
  }

  static async getExpiringAssets(companyId: string, daysThreshold: number = 30): Promise<Asset[]> {
    try {
      const q = query(collection(db, "assets"), where("companyId", "==", companyId), where("isActive", "==", true))
      const snapshot = await getDocs(q)

      const assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Asset[]

      // Filter by expiry date (client-side since Firestore can't do date comparisons easily)
      return assets.filter(asset => {
        if (!asset.licenseExpiryDate) return false

        const { daysUntilExpiry } = this.validateLicenseExpiry(asset.licenseExpiryDate)
        return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold
      })
    } catch (error) {
      console.error("Error fetching expiring assets:", error)
      throw error
    }
  }
}
```

---

### Task 2.2: Asset Listing Page

**File:** `src/app/(authenticated)/assets/page.tsx`

```typescript
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Truck, Trailer, User as UserIcon, AlertTriangle } from "lucide-react"
import { AssetService } from "@/services/asset.service"
import type { Asset } from "@/types"
import Link from "next/link"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"

export default function AssetsPage() {
  const { user } = useAuth()
  const canView = usePermission(PERMISSIONS.ASSETS_VIEW)
  const canAdd = usePermission(PERMISSIONS.ASSETS_ADD)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")

  // Optimized search hook
  const { searchTerm, setSearchTerm, filteredItems: searchedAssets, isSearching } =
    useOptimizedSearch(assets, SEARCH_CONFIGS.assets)

  useEffect(() => {
    fetchAssets()
  }, [user?.companyId])

  async function fetchAssets() {
    if (!user?.companyId) return

    try {
      setLoading(true)
      const data = await AssetService.getByCompany(user.companyId)
      setAssets(data)
    } catch (error) {
      console.error("Error fetching assets:", error)
      toast.error("Failed to load assets")
    } finally {
      setLoading(false)
    }
  }

  // Additional filters (type filter)
  const filteredAssets = searchedAssets.filter(asset => {
    const matchesType = filterType === "all" || asset.assetType === filterType
    return matchesType
  })

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "truck":
        return <Truck className="h-5 w-5" />
      case "trailer":
        return <Trailer className="h-5 w-5" />
      case "driver":
        return <UserIcon className="h-5 w-5" />
      default:
        return <Truck className="h-5 w-5" />
    }
  }

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null

    const { isValid, daysUntilExpiry } = AssetService.validateLicenseExpiry(expiryDate)

    if (!isValid) {
      return <Badge variant="destructive">Expired</Badge>
    }

    if (daysUntilExpiry <= 7) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expires in {daysUntilExpiry}d
        </Badge>
      )
    }

    if (daysUntilExpiry <= 30) {
      return <Badge variant="warning">Expires in {daysUntilExpiry}d</Badge>
    }

    return null
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to view assets.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage trucks, trailers, and drivers</p>
        </div>
        {canAdd && (
          <Link href="/assets/induct">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Induct Asset
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by registration, license, fleet number, or QR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-md px-3 py-2">
              <option value="all">All Types</option>
              <option value="truck">Trucks</option>
              <option value="trailer">Trailers</option>
              <option value="driver">Drivers</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading || isSearching ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No assets found</div>
          ) : (
            <div className="space-y-4">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">{getAssetIcon(asset.assetType)}</div>
                    <div>
                      <h3 className="font-semibold">{asset.registrationNumber || asset.licenseNumber || asset.qrCode}</h3>
                      <p className="text-sm text-muted-foreground">
                        {asset.assetType.charAt(0).toUpperCase() + asset.assetType.slice(1)}
                        {asset.fleetNumber && ` • Fleet: ${asset.fleetNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getExpiryStatus(asset.licenseExpiryDate)}
                    <Badge variant={asset.isActive ? "success" : "secondary"}>{asset.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### Task 2.3: Asset Induction Page (Simplified for MVP)

**File:** `src/app/(authenticated)/assets/induct/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AssetService } from "@/services/asset.service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { v4 as uuidv4 } from "uuid"

export default function AssetInductPage() {
  const router = useRouter()
  const { user } = useAuth()
  const canAdd = usePermission(PERMISSIONS.ASSETS_ADD)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    assetType: "truck" as "truck" | "trailer" | "driver",
    qrCode: "",
    registrationNumber: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    vehicleDiskData: "",
    driverLicenseData: "",
    fleetNumber: "",
    groupId: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.companyId) {
      toast.error("Company ID not found")
      return
    }

    if (!formData.qrCode) {
      toast.error("QR Code is required")
      return
    }

    // Validate based on asset type
    if (formData.assetType === "driver" && !formData.licenseNumber) {
      toast.error("License number is required for drivers")
      return
    }

    if ((formData.assetType === "truck" || formData.assetType === "trailer") && !formData.registrationNumber) {
      toast.error("Registration number is required for vehicles")
      return
    }

    // Validate expiry date if provided
    if (formData.licenseExpiryDate) {
      const { isValid, daysUntilExpiry } = AssetService.validateLicenseExpiry(formData.licenseExpiryDate)

      if (!isValid) {
        toast.error("License/disk has expired. Cannot induct.")
        return
      }

      if (daysUntilExpiry <= 7) {
        toast.warning(`Warning: License/disk expires in ${daysUntilExpiry} days`)
      }
    }

    try {
      setLoading(true)

      // Check if QR code already exists
      const existing = await AssetService.getByQRCode(formData.qrCode)
      if (existing) {
        toast.error("QR Code already exists in the system")
        return
      }

      const assetData = {
        companyId: user.companyId,
        assetType: formData.assetType,
        qrCode: formData.qrCode,
        isActive: true,
        ...(formData.registrationNumber && { registrationNumber: formData.registrationNumber }),
        ...(formData.licenseNumber && { licenseNumber: formData.licenseNumber }),
        ...(formData.licenseExpiryDate && { licenseExpiryDate: formData.licenseExpiryDate }),
        ...(formData.vehicleDiskData && { vehicleDiskData: formData.vehicleDiskData }),
        ...(formData.driverLicenseData && { driverLicenseData: formData.driverLicenseData }),
        ...(formData.fleetNumber && { fleetNumber: formData.fleetNumber }),
        ...(formData.groupId && { groupId: formData.groupId }),
      }

      // AssetService.create uses firebase-utils internally, toast shown automatically
      await AssetService.create(assetData)
      router.push("/assets")
    } catch (error) {
      console.error("Error inducting asset:", error)
      toast.error("Failed to induct asset")
    } finally {
      setLoading(false)
    }
  }

  function generateQRCode() {
    setFormData({ ...formData, qrCode: `QR-${uuidv4()}` })
    toast.info("QR Code generated (simulated)")
  }

  if (!canAdd) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to induct assets.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Induct Asset</h1>
          <p className="text-muted-foreground">Add a new truck, trailer, or driver to the system</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
          <CardDescription>Enter the details for the new asset. QR code scanning will be implemented in a future update.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Asset Type *</Label>
              <RadioGroup value={formData.assetType} onValueChange={(value: any) => setFormData({ ...formData, assetType: value })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="truck" id="truck" />
                  <Label htmlFor="truck" className="font-normal">
                    Truck
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trailer" id="trailer" />
                  <Label htmlFor="trailer" className="font-normal">
                    Trailer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="driver" id="driver" />
                  <Label htmlFor="driver" className="font-normal">
                    Driver
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qrCode">QR Code *</Label>
              <div className="flex gap-2">
                <Input id="qrCode" value={formData.qrCode} onChange={e => setFormData({ ...formData, qrCode: e.target.value })} placeholder="Scan or enter QR code" />
                <Button type="button" variant="outline" onClick={generateQRCode}>
                  Generate
                </Button>
              </div>
            </div>

            {(formData.assetType === "truck" || formData.assetType === "trailer") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input id="registrationNumber" value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="CAW 12345" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleDiskData">Vehicle Disk Data</Label>
                  <Input id="vehicleDiskData" value={formData.vehicleDiskData} onChange={e => setFormData({ ...formData, vehicleDiskData: e.target.value })} placeholder="Scanned disk data" />
                </div>
              </>
            )}

            {formData.assetType === "driver" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input id="licenseNumber" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="DL123456789" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driverLicenseData">Driver License Data</Label>
                  <Input id="driverLicenseData" value={formData.driverLicenseData} onChange={e => setFormData({ ...formData, driverLicenseData: e.target.value })} placeholder="Scanned license data" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="licenseExpiryDate">License/Disk Expiry Date</Label>
              <Input id="licenseExpiryDate" type="date" value={formData.licenseExpiryDate} onChange={e => setFormData({ ...formData, licenseExpiryDate: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fleetNumber">Fleet Number (Optional)</Label>
                <Input id="fleetNumber" value={formData.fleetNumber} onChange={e => setFormData({ ...formData, fleetNumber: e.target.value })} placeholder="FL-001" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupId">Group (Optional)</Label>
                <Input id="groupId" value={formData.groupId} onChange={e => setFormData({ ...formData, groupId: e.target.value })} placeholder="grp_north" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/assets">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Inducting..." : "Induct Asset"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### Task 2.4: Update Navigation

**File to Update:** `src/components/layout/AppLayout.tsx`

Add Assets to navigation:

```typescript
import { Home, Settings, Menu, X, LogOut, ChevronDown, Building2, Users, Package } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Assets", href: "/assets", icon: Package },
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]
```

---

### Task 2.5: Enhanced Seed Script for Assets

**File to Update:** `src/app/api/seed/route.ts`

Update the seed script to create more diverse assets. Update the `seedAssets` function to generate assets if no JSON file exists:

```typescript
async function seedAssets(sendProgress: (data: ProgressData) => void) {
  const dataPath = path.join(process.cwd(), "data", "assets-data.json")

  let assets: Array<{ id: string; [key: string]: any }> = []

  if (fs.existsSync(dataPath)) {
    assets = JSON.parse(fs.readFileSync(dataPath, "utf8"))
  } else {
    // Generate sample assets if file doesn't exist
    sendProgress({
      stage: "seeding_assets",
      message: "No assets data file found. Generating sample assets...",
    })

    const now = new Date()
    const transporters = ["t_dev_1", "t_dev_2"]

    // Generate trucks
    for (let i = 1; i <= 10; i++) {
      const expiryDate = new Date(now)
      expiryDate.setDate(expiryDate.getDate() + (i <= 2 ? 5 : i <= 5 ? 20 : 180)) // Some expiring soon

      assets.push({
        id: `asset_truck_${i}`,
        assetType: "truck",
        companyId: transporters[i % 2],
        qrCode: `QR-TRUCK-${String(i).padStart(3, "0")}`,
        registrationNumber: `GP ${String(10000 + i).slice(-5)}`,
        vehicleDiskData: `DISK-TRUCK-${i}`,
        licenseExpiryDate: expiryDate.toISOString().split("T")[0],
        fleetNumber: `FL-T${String(i).padStart(3, "0")}`,
        groupId: i % 2 === 0 ? "grp_north" : "grp_south",
        isActive: true,
      })
    }

    // Generate trailers
    for (let i = 1; i <= 8; i++) {
      const expiryDate = new Date(now)
      expiryDate.setDate(expiryDate.getDate() + (i <= 2 ? 10 : 200))

      assets.push({
        id: `asset_trailer_${i}`,
        assetType: "trailer",
        companyId: transporters[i % 2],
        qrCode: `QR-TRAILER-${String(i).padStart(3, "0")}`,
        registrationNumber: `GP ${String(20000 + i).slice(-5)}`,
        vehicleDiskData: `DISK-TRAILER-${i}`,
        licenseExpiryDate: expiryDate.toISOString().split("T")[0],
        fleetNumber: `FL-TR${String(i).padStart(3, "0")}`,
        groupId: i % 2 === 0 ? "grp_north" : "grp_south",
        isActive: true,
      })
    }

    // Generate drivers
    for (let i = 1; i <= 12; i++) {
      const expiryDate = new Date(now)
      expiryDate.setDate(expiryDate.getDate() + (i <= 3 ? 6 : 365))

      assets.push({
        id: `asset_driver_${i}`,
        assetType: "driver",
        companyId: transporters[i % 2],
        qrCode: `QR-DRIVER-${String(i).padStart(3, "0")}`,
        licenseNumber: `DL${String(1000000 + i)}`,
        driverLicenseData: `LICENSE-DRIVER-${i}`,
        licenseExpiryDate: expiryDate.toISOString().split("T")[0],
        isActive: true,
      })
    }
  }

  sendProgress({
    stage: "seeding_assets",
    message: `Found/Generated ${assets.length} assets to seed`,
    progress: { current: 0, total: assets.length },
  })

  let count = 0
  const batchSize = 500
  let batch = adminDb.batch()
  let batchCount = 0

  for (const asset of assets) {
    const { id, ...data } = asset
    batch.set(adminDb.collection("assets").doc(id), {
      ...data,
      companyId: data.companyId ?? DEFAULT_COMPANY_ID,
      createdAt: data.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      dbCreatedAt: FieldValue.serverTimestamp(),
      dbUpdatedAt: FieldValue.serverTimestamp(),
      isActive: data.isActive ?? true,
    })

    batchCount += 1
    count += 1

    if (batchCount >= batchSize) {
      await batch.commit()
      batch = adminDb.batch()
      batchCount = 0
      sendProgress({
        stage: "seeding_assets",
        message: `Seeded ${count} / ${assets.length} assets...`,
        collection: "assets",
        progress: { current: count, total: assets.length },
      })
    }
  }

  if (batchCount > 0) {
    await batch.commit()
  }

  sendProgress({
    stage: "seeding_assets",
    message: `Completed seeding ${count} assets`,
    collection: "assets",
    count,
    completed: true,
  })

  return count
}
```

---

## Phase 2 Testing Checklist

### Pre-Testing Setup

1. ✅ Run seed script again: Navigate to `/seed` and click "Seed Database"
2. ✅ Verify assets were created (should see ~30 assets in console)
3. ✅ Login with dev user

### Asset Service Tests

#### Test 2.1: Asset Service Methods

- [ ] Open browser console
- [ ] Test in console:

```javascript
// This is just for manual testing reference
AssetService.getByCompany("t_dev_1").then(assets => console.log("Assets:", assets))
```

- [ ] Expected: Should return array of assets
- [ ] Expected: Each asset has correct structure (id, assetType, qrCode, etc.)

### Asset Listing Tests

#### Test 2.2: Asset Listing Page Load

- [ ] Navigate to `/assets`
- [ ] Expected: Page loads without errors
- [ ] Expected: See list of assets (trucks, trailers, drivers)
- [ ] Expected: Each asset shows icon, registration/license, and status badges

#### Test 2.3: Asset Search

- [ ] In search box, type "GP"
- [ ] Expected: Only assets with "GP" in registration show
- [ ] Type "DRIVER"
- [ ] Expected: Only drivers show
- [ ] Clear search
- [ ] Expected: All assets show again

#### Test 2.4: Asset Type Filter

- [ ] Select "Trucks" from dropdown
- [ ] Expected: Only truck assets shown
- [ ] Select "Drivers" from dropdown
- [ ] Expected: Only driver assets shown
- [ ] Select "All Types"
- [ ] Expected: All assets shown

#### Test 2.5: Expiry Badges

- [ ] Look for assets with expiry badges
- [ ] Expected: Assets expiring within 7 days show red "Expires in Xd" badge with warning icon
- [ ] Expected: Assets expiring within 30 days show yellow "Expires in Xd" badge
- [ ] Expected: Assets expiring beyond 30 days show no expiry badge

### Asset Induction Tests

#### Test 2.6: Navigate to Induction

- [ ] Click "Induct Asset" button on assets page
- [ ] Expected: Navigate to `/assets/induct`
- [ ] Expected: Form loads with asset type selector

#### Test 2.7: Induct a Truck

- [ ] Select "Truck" asset type
- [ ] Click "Generate" for QR Code
- [ ] Expected: QR code field populated with UUID
- [ ] Expected: Toast message "QR Code generated"
- [ ] Fill in:
  - Registration Number: "TEST 12345"
  - Vehicle Disk Data: "TEST-DISK-001"
  - Expiry Date: (select date 60 days from now)
  - Fleet Number: "FL-TEST-001"
  - Group: "grp_test"
- [ ] Click "Induct Asset"
- [ ] Expected: Success toast "Asset inducted successfully"
- [ ] Expected: Redirect to `/assets`
- [ ] Expected: New asset appears in list

#### Test 2.8: Induct a Driver

- [ ] Click "Induct Asset" button
- [ ] Select "Driver" asset type
- [ ] Generate QR code
- [ ] Fill in:
  - License Number: "DL9999999"
  - Driver License Data: "TEST-LICENSE-001"
  - Expiry Date: (select date 10 days from now)
- [ ] Click "Induct Asset"
- [ ] Expected: Warning toast "License/disk expires in 10 days"
- [ ] Expected: Asset created successfully
- [ ] Expected: New driver appears in assets list with expiry warning badge

#### Test 2.9: Duplicate QR Code Validation

- [ ] Click "Induct Asset" button
- [ ] Select "Truck"
- [ ] Enter QR code: "QR-TRUCK-001" (existing from seed)
- [ ] Fill other required fields
- [ ] Click "Induct Asset"
- [ ] Expected: Error toast "QR Code already exists in the system"
- [ ] Expected: Asset not created

#### Test 2.10: Expired License Validation

- [ ] Click "Induct Asset"
- [ ] Select "Driver"
- [ ] Generate QR code
- [ ] Enter License Number: "DLEXPIRED"
- [ ] Set Expiry Date: (select date in the past, e.g., yesterday)
- [ ] Click "Induct Asset"
- [ ] Expected: Error toast "License/disk has expired. Cannot induct."
- [ ] Expected: Asset not created

#### Test 2.11: Required Field Validation

- [ ] Click "Induct Asset"
- [ ] Select "Truck"
- [ ] Leave QR Code empty
- [ ] Click "Induct Asset"
- [ ] Expected: Error toast "QR Code is required"
- [ ] Enter QR code but leave Registration Number empty
- [ ] Click "Induct Asset"
- [ ] Expected: Error toast "Registration number is required for vehicles"

### Permission Tests

#### Test 2.12: View Permission

- [ ] (If you have a non-admin user, test with that, otherwise skip)
- [ ] Change user's role to one without ASSETS_VIEW permission
- [ ] Navigate to `/assets`
- [ ] Expected: See message "You don't have permission to view assets"

#### Test 2.13: Add Permission

- [ ] Change user's role to have ASSETS_VIEW but not ASSETS_ADD
- [ ] Navigate to `/assets`
- [ ] Expected: Page loads, assets visible
- [ ] Expected: "Induct Asset" button is NOT visible
- [ ] Try navigate to `/assets/induct` directly
- [ ] Expected: See message "You don't have permission to induct assets"

### Data Validation Tests

#### Test 2.14: Firestore Asset Structure

- [ ] Open Firebase Console → Firestore
- [ ] Navigate to `assets` collection
- [ ] Click on a truck asset
- [ ] Verify fields:
  - `id` (document ID)
  - `assetType` (string: "truck")
  - `companyId` (string)
  - `qrCode` (string)
  - `registrationNumber` (string)
  - `vehicleDiskData` (string, optional)
  - `licenseExpiryDate` (string, optional)
  - `fleetNumber` (string, optional)
  - `groupId` (string, optional)
  - `isActive` (boolean: true)
  - `createdAt` (number)
  - `updatedAt` (number)
  - `dbCreatedAt` (timestamp)
  - `dbUpdatedAt` (timestamp)

#### Test 2.15: Navigation Integration

- [ ] Check sidebar
- [ ] Expected: "Assets" link is visible and clickable
- [ ] Click "Assets"
- [ ] Expected: Navigate to assets page
- [ ] Page shows as active in navigation

### UI/UX Tests

#### Test 2.16: Loading States

- [ ] Clear browser cache
- [ ] Navigate to `/assets`
- [ ] Expected: See "Loading..." text briefly
- [ ] Expected: Assets load and display

#### Test 2.17: Empty State

- [ ] In Firestore, temporarily make all assets belong to a different company
- [ ] Refresh `/assets` page
- [ ] Expected: See "No assets found" message
- [ ] Restore assets to correct company

#### Test 2.18: Toast Notifications

- [ ] Perform various actions
- [ ] Expected: Success actions show green toast (top-right)
- [ ] Expected: Error actions show red toast
- [ ] Expected: Warning actions show yellow/orange toast
- [ ] Expected: Toasts auto-dismiss after ~5 seconds

### Mobile Responsiveness Tests

#### Test 2.19: Mobile Asset List

- [ ] Open DevTools, toggle device toolbar
- [ ] Select mobile device (iPhone 12)
- [ ] Navigate to `/assets`
- [ ] Expected: List adapts to mobile width
- [ ] Expected: Asset items stack vertically
- [ ] Expected: All content readable without horizontal scroll

#### Test 2.20: Mobile Induction Form

- [ ] On mobile viewport, navigate to `/assets/induct`
- [ ] Expected: Form fields stack vertically
- [ ] Expected: All buttons are accessible
- [ ] Expected: Date picker works on mobile
- [ ] Expected: Can complete entire induction flow on mobile

### Performance Tests

#### Test 2.21: Large Dataset Performance

- [ ] With 30+ assets loaded
- [ ] Type in search box
- [ ] Expected: Filtering happens instantly (no lag)
- [ ] Switch between type filters
- [ ] Expected: Instant response

#### Test 2.22: Page Load Performance

- [ ] Open Network tab in DevTools
- [ ] Navigate to `/assets`
- [ ] Expected: Page loads in < 2 seconds
- [ ] Expected: Assets fetch completes in < 1 second
- [ ] Check for unnecessary duplicate requests
- [ ] Expected: Single Firestore query for assets

---

## Phase 2 Success Criteria

✅ **All tests passing** - No console errors ✅ **Asset CRUD functional** - Can list and create assets ✅ **Search and filters working** - Can find assets easily ✅ **Validation working** - Expired licenses blocked, duplicates prevented ✅ **Expiry tracking working** - Badges show correctly based on expiry dates ✅ **Permission enforcement** - Only authorized users can view/add assets ✅ **Mobile responsive** - Works on mobile devices ✅ **Data structure correct** - Firestore documents match data model

### Known Limitations (Expected for Phase 2)

- QR code scanning not fully implemented (generate button simulates it)
- Barcode scanning not implemented (manual entry)
- Asset editing not implemented yet
- Asset deletion/inactivation not implemented yet (add in Phase 2.2)
- No transaction history view
- No asset utilization reports
- Notification system not sending actual emails yet

---

## Phase 3: Order Management Module

(Coming in next iteration - will follow same detailed structure)

---

## General Debugging Tips

### Common Issues and Solutions

**Issue: "Permission denied" errors in Firestore**

- Solution: Check Firestore rules allow read/write for authenticated users
- Temporary fix for development: Set rules to allow all authenticated users

**Issue: Components not rendering**

- Check: Browser console for errors
- Check: All imports are correct
- Check: "use client" directive at top of client components
- Check: All props passed correctly

**Issue: Toast notifications not showing**

- Check: Toaster component rendered in root layout
- Check: `import { toast } from "sonner"` not from other library
- Check: Browser console for errors

**Issue: Page shows blank/white screen**

- Check: Browser console - likely a runtime error
- Check: All async operations have error handling
- Check: All required props provided

**Issue: Infinite re-renders**

- Check: useEffect dependencies array
- Check: Not setting state in render
- Check: Not creating new objects/arrays in render without memo

**Issue: Firebase queries return empty**

- Check: Collection names match exactly (case-sensitive)
- Check: Document structure matches expectations
- Check: User has correct companyId
- Check: Indexes created if using multiple where clauses

---

## Development Workflow

### For Each New Feature:

1. **Read the task** completely
2. **Create files** in specified locations
3. **Import dependencies** needed
4. **Add types** for all functions/components
5. **Implement functionality** with error handling
6. **Test locally** as you go
7. **Use checklist** to verify completion
8. **Check console** for errors
9. **Test on mobile** viewport
10. **Commit** when feature complete

### Code Quality Checklist:

- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All async operations have try-catch
- [ ] All user actions show feedback (toast)
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Mobile responsive
- [ ] Follows design system (glass morphism)
- [ ] Permission checks in place
- [ ] Data validated before submission

---

This completes Phase 1 and Phase 2 of the AI-optimized implementation plan. Each phase now has:

- ✅ Specific step-by-step instructions
- ✅ Complete code structure guidance
- ✅ Detailed testing checklists
- ✅ Success criteria
- ✅ Debugging tips

Would you like me to continue with Phase 3 (Order Management) in this same detailed format?
