# Newton - AI Development Guide

## Project Overview

**Newton** is a comprehensive weighbridge and logistics management system built for mining, transportation, and logistics coordination companies. The system manages asset tracking (trucks, trailers, drivers), order processing, weighbridge operations, security checkpoints, and pre-booking flows.

### Core Business Flows
- **Asset Management**: Induction, tracking, and lifecycle management of trucks, trailers, and drivers
- **Order Management**: Creation, allocation, and tracking of receiving/dispatching orders
- **Pre-Booking**: Scheduled asset allocation to orders
- **Security Checkpoints**: Entry/exit verification with QR/barcode scanning
- **Weighbridge Operations**: Tare/gross weight capture, seal verification, ticket generation
- **Multi-Tenancy**: Company-scoped data with role-based permissions
- **Organizational Groups**: Hierarchical group structure for mine companies (unlimited nesting)

---

## Technology Stack

### Core Framework
- **Next.js 15.5.4** - App Router with React 19
- **TypeScript 5.9.2** - Strict mode enabled
- **Tailwind CSS 4.1.13** - Utility-first styling

### UI Components
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.23.22** - Animations
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend & Database
- **Firebase 12.3.0** - Client SDK for auth, Firestore, storage
- **firebase-admin 13.5.0** - Server SDK (API routes only)

### Forms & Validation
- **react-hook-form 7.63.0** - Form state management
- **Zod 4.1.11** - Schema validation

### Utilities
- **date-fns 4.1.0** - Date manipulation
- **uuid 13.0.0** - ID generation
- **lodash 4.17.21** - Utility functions
- **jspdf & jspdf-autotable** - PDF generation
- **xlsx** - Excel export

### Package Manager
- **Bun** - Fast all-in-one JavaScript runtime and package manager
  - Use `bun install` instead of `npm install`
  - Use `bun run` instead of `npm run`
  - Use `bunx` instead of `npx`
  - Scripts: `bun dev`, `bun build`, `bun start`

---

## Project Structure

```
Newton/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (authenticated)/      # Protected routes (requires auth)
│   │   │   ├── page.tsx          # Dashboard (/)
│   │   │   ├── settings/         # User settings
│   │   │   └── layout.tsx        # Authenticated layout wrapper
│   │   ├── api/                  # API routes
│   │   │   └── seed/             # Database seeding endpoint
│   │   ├── login/                # Login page
│   │   ├── seed/                 # Seed UI page
│   │   └── layout.tsx            # Root layout
│   ├── components/               # React components
│   │   ├── ui/                   # Radix UI components (shadcn/ui)
│   │   ├── layout/               # Layout components (header, nav, etc)
│   │   └── users/                # Domain-specific components
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx       # User authentication state
│   │   ├── CompanyContext.tsx    # Company data state
│   │   └── LayoutContext.tsx     # UI layout state
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Core utilities and configurations
│   │   ├── firebase.ts           # Client SDK exports (auth, db, storage)
│   │   ├── firebase-admin.ts     # Admin SDK (server-side only)
│   │   ├── firebase-utils.ts     # CRUD helpers with timestamps & toasts
│   │   └── utils.ts              # General utilities (cn, etc)
│   ├── services/                 # Business logic layer
│   │   ├── console.service.ts    # Logging utilities
│   │   ├── data.service.ts       # Data operations
│   │   ├── scan.service.ts       # Barcode/QR scanning
│   │   ├── search.service.ts     # Search functionality
│   │   └── utility.service.ts    # General utilities
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # All domain types (User, Company, etc)
│   └── config/                   # Configuration files
├── docs/                         # Documentation
│   ├── data-model.md             # Complete data model spec
│   ├── dev.md                    # AI-optimized development plan
│   ├── user-flow-web.md          # User flow specifications
│   └── design.json               # UI design system
├── data/                         # Seed data (optional JSON files)
└── public/                       # Static assets
```

---

## Key Files & Their Purposes

### Firebase Files (CRITICAL - Read This!)

#### 1. `src/lib/firebase.ts` - Client SDK Exports
**Use in:** Client components, services, hooks
**Exports:** `auth`, `db`, `storage`, `app`
**Purpose:** Direct access to Firebase client SDK

```typescript
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Use for complex queries
const q = query(collection(db, "assets"), where("companyId", "==", companyId))
const snapshot = await getDocs(q)
```

#### 2. `src/lib/firebase-utils.ts` - CRUD Helpers (USE THESE FIRST!)
**Use in:** Client components, services for simple CRUD operations
**Exports:** `createDocument`, `updateDocument`, `deleteDocument`, `createCollectionListener`, `userOperations`
**Purpose:** Simplified CRUD with automatic timestamps, toast notifications, and error handling

```typescript
import { createDocument, updateDocument } from "@/lib/firebase-utils"

// Simple CRUD - automatically adds timestamps and shows toast
const id = await createDocument("companies", companyData, "Company created")
await updateDocument("companies", id, updates, "Company updated")
```

**Why use firebase-utils?**
- ✅ Automatic timestamp handling per data model spec:
  - `createdAt`, `updatedAt`: Client event times (`Date.now()`)
  - `dbCreatedAt`, `dbUpdatedAt`: Server timestamps (`serverTimestamp()`)
- ✅ Built-in toast notifications (success/error)
- ✅ Error handling included
- ✅ Consistent data structure across app
- ✅ Less code to write

**Generic Collection Listener (for real-time data):**
```typescript
import { createCollectionListener } from "@/lib/firebase-utils"
import { signal } from "@preact/signals-react"

const mySignal = signal([])

const listener = createCollectionListener("companies", mySignal, {
  companyScoped: false,
  onFirstLoad: () => console.log("Data loaded")
})

const unsubscribe = listener() // Start listening
// Later: unsubscribe() to cleanup
```

#### 3. `src/lib/firebase-admin.ts` - Admin SDK (Server-Side Only)
**Use in:** API routes (`src/app/api/**/*.ts`) ONLY
**Exports:** `adminDb`, `adminAuth`, `app`
**Purpose:** Server-side operations with elevated permissions

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
└─ NO → Do you need centralized data (companies, users, roles, products, groups, sites, clients)?
    ├─ YES → Use data.service.ts (globalData.companies.value, etc.) - ALWAYS use this
    └─ NO → Are you doing simple CRUD (create/update/delete)?
        ├─ YES → Use firebase-utils.ts (createDocument, updateDocument, etc.)
        └─ NO → Use firebase.ts (db) for complex queries
```

**CRITICAL: Centralized Data Service**
**ALWAYS use `data.service.ts` for these collections - DO NOT create duplicate queries or listeners:**

- **Companies**: `globalData.companies.value` (all companies including inactive, real-time)
- **Users**: `globalData.users.value` (company-scoped, real-time)
- **Roles**: `globalData.roles.value` (global - shared across all companies, real-time)
- **Products**: `globalData.products.value` (company-scoped, real-time)
- **Groups**: `globalData.groups.value` (company-scoped, real-time)
- **Sites**: `globalData.sites.value` (company-scoped, real-time)
- **Clients**: `globalData.clients.value` (company-scoped, real-time)
- **Assets**: `globalData.assets.value` (company-scoped, real-time)

**Why use data.service.ts?**
- ✅ Single source of truth - all components share the same data
- ✅ Real-time updates automatically propagate to all components
- ✅ Company-scoped filtering handled automatically
- ✅ Smart loading state tracking
- ✅ Automatic cleanup on company switch
- ✅ No duplicate Firebase queries - reduces Firestore read costs
- ✅ In-memory data operations are much faster than Firebase queries

**Usage Pattern:**
```typescript
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function MyComponent() {
  useSignals() // Required for reactivity

  const products = globalData.products.value
  const sites = globalData.sites.value
  const groups = globalData.groups.value
  const assets = globalData.assets.value

  // Component auto re-renders when data changes
}
```

**For CRUD operations**, ALWAYS use firebase-utils (includes automatic timestamps):
```typescript
import { createDocument, updateDocument } from "@/lib/firebase-utils"

// ✅ CORRECT - Automatic timestamps (createdAt, updatedAt, dbCreatedAt, dbUpdatedAt)
await createDocument("products", productData, "Product created")
await updateDocument("sites", siteId, { isActive: false }, "Site updated")

// ❌ WRONG - Manual updateDoc misses automatic dbUpdatedAt timestamp
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
await updateDoc(doc(db, "sites", siteId), {
  isActive: false,
  updatedAt: Date.now() // Missing dbUpdatedAt!
})
```

**When Complex Firebase Queries ARE Appropriate:**
Complex queries with `getDocs` are acceptable for:
- ✅ **Validation queries**: Checking relationships before deletion (e.g., "Is this product used in any orders?")
- ✅ **Cross-collection queries**: Querying collections not in data.service.ts (e.g., orders, weighing records)
- ✅ **One-time fetches**: Loading data for specific entities (e.g., fetching users for a different company)
- ✅ **Aggregation queries**: Counting, summing, or complex filtering across large datasets

**When Complex Queries are NOT Appropriate:**
- ❌ **Reading centralized data**: Never query companies, users, roles, products, groups, sites, clients, or assets directly - use `globalData` instead
- ❌ **Duplicate validation**: Don't query to check uniqueness of fields in centralized collections - check in-memory data instead
- ❌ **List views**: Don't query for list pages - use `globalData` which is already real-time

### Type Definitions (`src/types/index.ts`)

All domain types are defined here:
- **Core Types:** `User`, `Company`, `Role`, `Asset`, `Order`, `PreBooking`
- **Operational:** `WeighingRecord`, `Weighbridge`, `SecurityCheck`, `Seal`
- **Supporting:** `Product`, `Site`, `Client`, `Group`, `NotificationTemplate`, `AuditLog`
- **Base Interfaces:** `Timestamped`, `CompanyScoped`

Every entity includes timestamps and most are company-scoped.

**Group Interface:**
The `Group` type supports unlimited hierarchical nesting for organizational structure (mine companies only):
- `parentGroupId?: string` - Reference to parent group (undefined for root groups)
- `level: number` - Depth in hierarchy (0 for root)
- `path: string[]` - Array of ancestor IDs for easy querying and breadcrumbs
- Sites can be assigned to groups via `groupId` field

### Context Providers

#### `AuthContext.tsx`
Provides:
- `user: User | null` - Current authenticated user
- `loading: boolean` - Auth state loading
- `signIn(email, password)` - Login function
- `signOut()` - Logout function
- `refreshUser()` - Refresh user data from Firestore

Usage:
```typescript
import { useAuth } from "@/contexts/AuthContext"

const { user, loading } = useAuth()
```

#### `CompanyContext.tsx`
Provides company-specific data and state management:
- `company: Company | null` - Current user's active company
- `companies: Company[]` - List of active companies (filtered from global data)
- `switchCompany(companyId)` - Switch user's active company

**Important:** Uses centralized `data.service.ts` for real-time data synchronization.

Usage:
```typescript
import { useCompany } from "@/contexts/CompanyContext"

const { company, companies, switchCompany } = useCompany()
```

#### `LayoutContext.tsx`
Manages UI layout state (sidebar, modals, etc).

### Centralized Data Service (NEW - Phase 1)

#### `data.service.ts`
Singleton service that manages all real-time Firebase data using Preact Signals:

```typescript
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function MyComponent() {
  useSignals() // Required for reactivity

  const companies = globalData.companies.value  // All companies (including inactive)
  const users = globalData.users.value          // Company-scoped users
  const roles = globalData.roles.value          // Global roles (shared across all companies)
  const loading = globalData.loading.value      // Global loading state

  // Component automatically re-renders when signals change
}
```

**Key Features:**
- **Single Source of Truth**: All components access the same reactive data
- **Real-time Sync**: Firebase `onSnapshot` listeners keep data updated
- **Smart Loading**: Tracks when all collections load (no arbitrary timeouts)
- **Company Scoping**: Users automatically filtered by active company (roles are global)
- **Automatic Cleanup**: Unsubscribes listeners on company switch or unmount

**Architecture:**
- Companies: Loads ALL (including inactive) for admin pages
- Roles: **GLOBAL** - NOT filtered by `companyId` (shared across all companies)
- Users: Company-scoped, filtered by `companyId`
- Loading: Set to `false` only when all 3 collections receive first snapshot

**When to Use:**
- ✅ Use for: Companies list, users list, roles list in any component
- ✅ Reactive: Data updates automatically across all components
- ❌ Don't use for: Entity-specific queries (use services instead)

---

## Development Guidelines

### Critical Rules

1. **ALWAYS BUILD BEFORE DECLARING COMPLETION** - Run `bun run build` after implementing features to verify all TypeScript types are correct and there are no compilation errors. Never say a task is completed without successfully building first.
2. **ALWAYS COMMIT AND PUSH CHANGES** - After making any code changes, run `git add`, `git commit`, and `git push` to save changes to the repository. Follow the Git Workflow Protocol below.
3. **Always import required dependencies at the top of files**
4. **Use existing UI components from `src/components/ui/`**
5. **Follow TypeScript strictly - add proper types for all functions**
6. **Use existing services pattern from `src/services/`**
7. **Apply glass morphism design from `design.json`**
8. **Use existing auth context from `src/contexts/AuthContext.tsx`**
9. **Use centralized `data.service.ts` for companies, users, and roles** (don't duplicate queries)
10. **Use `sonner` toast for user feedback** (firebase-utils already includes this)
11. **Add proper error handling with try-catch blocks**
12. **This project uses Bun** - Use `bun` instead of `npm`, and `bunx` instead of `npx`
13. **Use Preact Signals for reactive state** - Call `useSignals()` in components that access signals

### Build Verification Protocol

**MANDATORY**: Before claiming any task is complete, you MUST:
1. Run `bun run build` to verify the code compiles
2. Fix any TypeScript errors that appear
3. Ensure the build completes successfully
4. **Stop and restart the dev server** after running the build
   - **CRITICAL**: Dev server MUST ALWAYS run on port 3000 (never 3002 or any other port)
   - Kill ALL processes using port 3000: `lsof -i :3000` then `kill -9 <PID>`
   - Kill all other dev server processes: `pkill -9 -f "bun dev"`
   - Verify port 3000 is free: `lsof -i :3000` (should return no results)
   - Run `bun dev --turbopack` to start a fresh server on port 3000
   - Verify it started on port 3000 (not 3002 or any other port)
   - This ensures all code changes are properly loaded
   - Failure to restart can cause 500 Internal Server Errors
5. Only then declare the task as completed

This is non-negotiable and must be followed for every feature implementation, no matter how small.

### Git Workflow Protocol

**MANDATORY**: After making any code changes, you MUST commit and push to GitHub:

1. **Check git status** to see what files have changed:
   ```bash
   git status
   ```

2. **Review the changes** to ensure they are correct:
   ```bash
   git diff
   ```

3. **Check recent commit messages** to follow the repository's commit message style:
   ```bash
   git log -5 --oneline
   ```

4. **Add the changed files** to staging:
   ```bash
   git add <file-paths>
   ```

5. **Create a descriptive commit** following the repository's style:
   ```bash
   git commit -m "$(cat <<'EOF'
   Brief summary of changes (imperative mood, ~50 chars)

   Detailed explanation of what changed and why. Explain the problem
   being solved and how this change addresses it. Focus on the "why"
   rather than the "what" (code shows the what).

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

6. **Push to the remote repository**:
   ```bash
   git push
   ```

**Commit Message Guidelines:**
- **First line**: Brief summary in imperative mood (e.g., "Add feature" not "Added feature")
- **Body**: Explain what changed and why (not how - the code shows that)
- **Length**: First line ~50 chars, body wrapped at 72 chars
- **Footer**: Include Claude Code attribution (already in template above)

**When to Commit:**
- ✅ After implementing a feature or fix
- ✅ After refactoring code
- ✅ After fixing bugs or issues
- ✅ After updating documentation
- ✅ After any meaningful change that builds successfully
- ❌ Don't commit broken/non-compiling code
- ❌ Don't commit without testing first

**Example Commit Messages:**
```
Add VIN validation to asset induction wizard

Implements synchronous VIN validation using in-memory assets from
globalData.assets.value. This replaces the async Firebase query
approach for consistency with other validation methods and improved
performance.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

```
Fix expiry date calculation in asset field mapper

Corrects the date parsing logic to properly handle DD/MM/YYYY format
and calculate days until expiry. Previous implementation was using
incorrect month indexing causing off-by-one errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

This workflow ensures all changes are saved to version control and pushed to the remote repository for backup and collaboration.

### Client vs Server Components

- **Client Components:** Mark with `"use client"` directive at top
  - Use for: Forms, interactivity, hooks, browser APIs
  - Can use: `useState`, `useEffect`, `useAuth`, etc.

- **Server Components:** Default in Next.js 15
  - Use for: Static content, data fetching, SEO
  - Cannot use: Client hooks or browser APIs

### Data Operations Pattern

#### Creating Documents
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

#### Complex Queries
```typescript
// ✅ GOOD - Use firebase.ts for complex queries
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"

const q = query(
  collection(db, "assets"),
  where("companyId", "==", companyId),
  where("isActive", "==", true),
  orderBy("createdAt", "desc")
)
const snapshot = await getDocs(q)
```

#### Server-Side Operations (API Routes)
```typescript
// ✅ GOOD - Use firebase-admin in API routes
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

await adminDb.collection("companies").doc(id).set({
  ...data,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: FieldValue.serverTimestamp(),
  dbUpdatedAt: FieldValue.serverTimestamp(),
})
```

### Service Layer Pattern

Create service classes for each domain:

```typescript
// src/services/company.service.ts
import type { Company } from "@/types"
import { createDocument, updateDocument } from "@/lib/firebase-utils"

export class CompanyService {
  static async create(data: Omit<Company, "id" | keyof Timestamped>): Promise<string> {
    return await createDocument("companies", data, "Company created")
  }

  static async update(id: string, data: Partial<Company>): Promise<void> {
    await updateDocument("companies", id, data, "Company updated")
  }

  static async listAccessibleCompanies(user: User): Promise<Company[]> {
    // Implementation
  }
}
```

### Permission System

#### Check Permissions
```typescript
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"

const canView = usePermission(PERMISSIONS.ASSETS_VIEW)
const canAdd = usePermission(PERMISSIONS.ASSETS_ADD)
```

#### Permission Gate Component
```typescript
import { PermissionGate } from "@/components/auth/PermissionGate"

<PermissionGate permission={PERMISSIONS.ADMIN_COMPANIES}>
  <AdminPanel />
</PermissionGate>
```

### Company Type-Based Access Control

Newton implements feature-level access control based on company type. Navigation and features are dynamically filtered:

#### Access Matrix by Company Type

**Mine Companies** (Full Access):
- ✅ Dashboard
- ✅ Companies
- ✅ Products
- ✅ Clients
- ✅ Sites (with Group assignment)
- ✅ Organizational Groups (via Company settings)
- ✅ Users
- ✅ Roles
- ✅ Notifications
- ✅ Settings

**Transporter Companies** (Limited Access):
- ✅ Dashboard
- ✅ Companies (view own)
- ❌ Products (hidden)
- ❌ Clients (hidden)
- ❌ Sites (hidden)
- ❌ Organizational Groups (hidden)
- ✅ Users
- ✅ Roles
- ✅ Notifications
- ✅ Settings

**Logistics Coordinator Companies** (Limited Access):
- ✅ Dashboard
- ✅ Companies (view own)
- ❌ Products (hidden)
- ❌ Clients (hidden)
- ❌ Sites (hidden)
- ❌ Organizational Groups (hidden)
- ✅ Users
- ✅ Roles
- ✅ Notifications
- ✅ Settings

#### Implementation Details

Navigation filtering is automatic based on `company.companyType`:
```typescript
// Navigation items marked with requiresMine: true are filtered out
// for transporter and logistics coordinator companies
const navigation = useMemo(() => {
  if (!company) return baseNavigation
  if (company.companyType === "mine") return baseNavigation
  return baseNavigation.filter(item => !item.requiresMine)
}, [company])
```

### Organizational Groups (Mine Companies Only)

Mine companies can create unlimited hierarchical organizational groups for better structure:

**Features:**
- Unlimited nesting (groups → subgroups → sub-subgroups → etc.)
- Tree UI with expand/collapse
- Inline add/edit/delete functionality
- Sites can be assigned to groups
- Accessed via Company Settings → Groups tab

**Usage:**
```typescript
// Group data structure
interface Group {
  id: string
  name: string
  description?: string
  parentGroupId?: string  // Link to parent
  level: number           // Depth in hierarchy
  path: string[]          // Array of ancestor IDs
  isActive: boolean
  companyId: string
}
```

**Component:**
```typescript
import { GroupsTreeManager } from "@/components/groups/GroupsTreeManager"

// In CompanyFormModal, Groups tab (mine companies only)
<GroupsTreeManager companyId={company.id} />
```

### Error Handling Pattern

Always use try-catch with toast feedback:

```typescript
async function handleSubmit(data: FormData) {
  try {
    setLoading(true)

    // Validate
    if (!data.required) {
      toast.error("Required field missing")
      return
    }

    // Perform operation
    await SomeService.create(data)

    // Success handled by firebase-utils
    router.push("/success-page")
  } catch (error) {
    console.error("Error creating:", error)
    toast.error("Failed to create")
  } finally {
    setLoading(false)
  }
}
```

### UI Patterns

#### Page Structure
```typescript
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function MyPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [user?.companyId])

  async function fetchData() {
    // Implementation
  }

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
        <p className="text-muted-foreground">Description</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Form Structure
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
})

type FormData = z.infer<typeof schema>

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

#### Modal/Dialog Behavior

**IMPORTANT: Modal Close Behavior**
All modals (Dialog and AlertDialog) in Newton are configured to **prevent closing when clicking outside**. Users must explicitly:
- Click the close button (X icon)
- Click the Cancel button
- Click any action button that closes the modal

This prevents accidental data loss when users click outside the modal while filling forms.

**Implementation:**
- **Dialog component**: Includes `onEscapeKeyDown={(e) => e.preventDefault()}` and `onPointerDownOutside={(e) => e.preventDefault()}` to prevent ESC key and outside clicks from closing the modal.
- **AlertDialog component**: Already prevents outside clicks by design (Radix UI default behavior for critical alerts).

This is already built into the base components - no additional configuration needed when using them.

```typescript
// Dialog and AlertDialog automatically prevent outside clicks
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {/* Modal content */}
  </DialogContent>
</Dialog>

// Users must use explicit close actions
<Button onClick={() => setIsOpen(false)}>Cancel</Button>
```

---

## Current Implementation Status

### ✅ Completed (Phase 1)
- Authentication system with Firebase Auth
- User context and session management
- Basic layout and navigation (sidebar & top nav)
- UI component library (Radix UI + Tailwind)
- Type definitions for all entities
- Firebase client and admin SDK setup
- CRUD helper utilities with auto-timestamps
- Seed script infrastructure
- Toast notification system
- Theme system (light/dark mode)
- **Centralized Data Service** with Preact Signals for reactive state management
- **Real-time Firebase listeners** with smart loading state tracking
- **Company management** with full CRUD operations
- **Company switcher** with dual-role support (Transporter/Logistics Coordinator)
- **User management** with role assignment
- **Permission system foundation** (ready for implementation)

### 📋 Planned (Phase 2+)
- Asset management module
- Order management module
- Pre-booking system
- Security checkpoint flows
- Weighbridge operations
- Reporting system

---

## Data Model Key Points

### Timestamps (Mandatory on All Entities)
Every document MUST include:
- `createdAt: number` - Client event time (milliseconds since epoch)
- `updatedAt: number` - Client event time (milliseconds since epoch)
- `dbCreatedAt: FieldValue.serverTimestamp()` - Server timestamp
- `dbUpdatedAt: FieldValue.serverTimestamp()` - Server timestamp

**firebase-utils automatically handles this - use it!**

### Company Scoping
Most entities include `companyId: string` for multi-tenancy:
- Users belong to one company
- Assets belong to one company (transporter)
- Orders belong to one company (mine/coordinator)
- Data is always filtered by `companyId` for non-global users

### Global Users
Users with `isGlobal: true` can:
- See all companies
- Manage system-wide settings
- Override permissions
- Access admin functions

Regular users only see their company's data.

---

## Common Patterns & Conventions

### Naming Conventions
- **Files:** `kebab-case.tsx`, `PascalCase.tsx` for components
- **Components:** `PascalCase`
- **Functions:** `camelCase`
- **Types:** `PascalCase`
- **Constants:** `SCREAMING_SNAKE_CASE`

### Import Order
1. React/Next imports
2. Third-party libraries
3. Internal utilities (@/lib)
4. Internal types (@/types)
5. Internal components (@/components)
6. Internal services (@/services)
7. Relative imports (./components)

### File Organization
```typescript
"use client" // If needed

// Imports
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"

// Types/Interfaces (local to file)
interface Props {
  userId: string
}

// Component/Function
export default function MyComponent({ userId }: Props) {
  // Hooks
  const [state, setState] = useState()

  // Functions
  async function handleClick() {
    // Implementation
  }

  // Render
  return <div>...</div>
}

// Helper functions (not exported)
function helperFunction() {
  // Implementation
}
```

### List Action Icons Pattern
Newton uses a consistent icon pattern across all list pages (companies, roles, users, assets, etc.):

**Layout Structure:**
- **Left**: Icon + Item details
- **Right**: Action buttons + Status badge

**Standard Action Icons (Lucide React):**
- **FileText** - View details (navigate to details page)
  - **Why FileText**: Avoids confusion with Eye icon which is reserved for visibility toggles
  - Used in: Assets, Users
- **Edit** - Edit item (open modal or navigate to edit page)
  - Used in: Companies, Roles, Users
  - **Not used in Assets** - editing happens on details page
- **Trash2** - Delete item (with text-destructive styling)
  - Always opens confirmation dialog before deletion
  - Used in: All list pages
- **ToggleRight/ToggleLeft** - Toggle active/inactive status
  - ToggleRight (green) for active, ToggleLeft (gray) for inactive
  - Used in: Companies, Roles, Users
- **Eye/EyeOff** - Toggle visibility (company-specific)
  - Eye (visible), EyeOff (hidden)
  - **Used exclusively** in Roles page for showing/hiding roles per company
  - **This is why Eye should NOT be used for view actions**

**Button Styling:**
- Variant: `ghost`
- Size: `sm`
- Icon size: `h-4 w-4`
- Destructive icons: Add `text-destructive` class

**Status Badge:**
- Placement: Right-most element after all action buttons
- Common variants: `success` (Active), `secondary` (Inactive), `destructive` (Expired/Deleted)

**Examples:**
```typescript
// Assets list
<Button variant="ghost" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>
  <FileText className="h-4 w-4" />
</Button>
<Button variant="ghost" size="sm" onClick={handleDelete}>
  <Trash2 className="h-4 w-4 text-destructive" />
</Button>
<Badge variant="success">Active</Badge>

// Companies list
<Button variant="ghost" size="sm" onClick={toggleStatus}>
  <ToggleRight className="h-5 w-5 text-green-600" />
</Button>
<Button variant="ghost" size="sm" onClick={handleEdit}>
  <Edit className="h-4 w-4" />
</Button>
<Button variant="ghost" size="sm" onClick={handleDelete}>
  <Trash2 className="h-4 w-4 text-destructive" />
</Button>
<Badge variant="success">Active</Badge>

// Roles list (with visibility toggle)
<Button variant="ghost" size="sm" onClick={toggleVisibility}>
  <Eye className="h-5 w-5" />
</Button>
<Button variant="ghost" size="sm" onClick={handleEdit}>
  <Edit className="h-4 w-4" />
</Button>
<Button variant="ghost" size="sm" onClick={handleDelete}>
  <Trash2 className="h-4 w-4 text-destructive" />
</Button>
<Badge variant="success">Active</Badge>
```

---

## Testing Approach

### Manual Testing Checklist
For each feature:
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Loading states work
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Mobile responsive
- [ ] Permissions enforced
- [ ] Data validates correctly
- [ ] Toast notifications show
- [ ] Firestore data structure correct

### Testing in Browser Console
```javascript
// Test service methods
AssetService.getByCompany("company_id").then(console.log)

// Check user context
// Open React DevTools and inspect AuthContext
```

### Firestore Verification
1. Open Firebase Console
2. Navigate to Firestore Database
3. Check collection structure matches `docs/data-model.md`
4. Verify timestamps exist (createdAt, updatedAt, dbCreatedAt, dbUpdatedAt)
5. Verify `isActive` flags and `companyId` fields

---

## Common Issues & Solutions

### "Permission denied" in Firestore
- Check Firestore rules allow read/write for authenticated users
- For development: Allow all authenticated users (temporary)

### Components not rendering
- Check browser console for errors
- Verify all imports are correct
- Add `"use client"` directive for client components
- Verify all props passed correctly

### Toast notifications not showing
- Check Toaster component in root layout
- Use `import { toast } from "sonner"` not other library
- Check browser console for errors

### Infinite re-renders
- Check `useEffect` dependencies array
- Don't set state during render
- Don't create new objects/arrays in render without memoization

### Firebase queries return empty
- Collection names are case-sensitive
- Document structure must match expectations
- User must have correct `companyId`
- Create indexes for multiple `where` clauses

---

## Quick Reference

### Create a New Page
1. Create file in `src/app/(authenticated)/[name]/page.tsx`
2. Add `"use client"` if using hooks/state
3. Import `useAuth` for user data
4. Implement permission checks
5. Add to navigation in `AppLayout.tsx`

### Create a New Service
1. Create file in `src/services/[name].service.ts`
2. Export class with static methods
3. Use firebase-utils for CRUD
4. Use firebase.ts for complex queries
5. Add proper error handling
6. Return typed data from @/types

### Create a New Component
1. Create file in `src/components/[domain]/[Name].tsx`
2. Add `"use client"` if needed
3. Define TypeScript interface for props
4. Use UI components from `@/components/ui`
5. Apply Tailwind classes for styling
6. Export as default or named export

### Add a New Entity Type
1. Add interface in `src/types/index.ts`
2. Extend `Timestamped` and `CompanyScoped` if applicable
3. Update `docs/data-model.md` with specification
4. Create service class in `src/services/`
5. Add to seed script if needed
6. Create UI pages for CRUD

---

## Resources

- **Development Plan:** `docs/dev.md` - Detailed phase-by-phase implementation
- **Data Model:** `docs/data-model.md` - Complete entity specifications
- **User Flows:** `docs/user-flow-web.md` - Business process flows
- **Design System:** `docs/design.json` - UI design specifications

---

## Getting Started for AI

When working on a new task:

1. **Read** the relevant section in `docs/dev.md`
2. **Check** `docs/data-model.md` for data structure requirements
3. **Review** existing similar code for patterns
4. **Use** `data.service.ts` for centralized collections (companies, users, roles, products, groups, sites, clients, assets) - don't create new queries
5. **Use** firebase-utils for ALL CRUD operations (automatic timestamps)
6. **For validation**, check in-memory data from `globalData` instead of making Firebase queries
7. **Follow** the service layer pattern
8. **Add** proper TypeScript types
9. **Include** error handling and loading states
10. **Use** `useSignals()` when accessing Preact Signals
11. **Test** manually with the provided checklists
12. **Verify** Firestore data structure in Firebase Console

**Remember:**
- **Prefer editing existing files** over creating new ones
- **Always use `data.service.ts`** for centralized collections (companies, users, roles, products, groups, sites, clients, assets) - these are centrally managed with real-time listeners
- **ALWAYS use firebase-utils** for CRUD operations (automatic timestamps including dbUpdatedAt)
- **For validation**, check in-memory `globalData` instead of making Firebase queries
- Fall back to firebase.ts for legitimate complex queries (relationship validation, cross-collection queries)
- Only use firebase-admin.ts in API routes

**New Component Checklist:**
- [ ] Add `"use client"` directive if using hooks/state
- [ ] Import `useSignals()` if accessing `globalData` signals
- [ ] Use existing UI components from `@/components/ui`
- [ ] Follow glass morphism design patterns
- [ ] Add proper loading states with `LoadingSpinner`
- [ ] Handle errors with toast notifications
- [ ] Test on mobile viewport
