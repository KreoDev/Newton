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
└─ NO → Do you need companies, users, or roles data?
    ├─ YES → Use data.service.ts (globalData.companies.value, etc.)
    └─ NO → Are you doing simple CRUD (create/update/delete)?
        ├─ YES → Use firebase-utils.ts (createDocument, updateDocument, etc.)
        └─ NO → Use firebase.ts (db) for complex queries
```

**Important Notes:**
- **ALWAYS use `data.service.ts`** for companies, users, and roles - don't create duplicate queries
- **Companies list**: `globalData.companies.value` (includes inactive for admin)
- **Users list**: `globalData.users.value` (company-scoped, real-time)
- **Roles list**: `globalData.roles.value` (global, shared across all companies, real-time)
- Remember to call `useSignals()` in components that access these signals

### Type Definitions (`src/types/index.ts`)

All domain types are defined here:
- **Core Types:** `User`, `Company`, `Role`, `Asset`, `Order`, `PreBooking`
- **Operational:** `WeighingRecord`, `Weighbridge`, `SecurityCheck`, `Seal`
- **Supporting:** `Product`, `Site`, `Client`, `NotificationTemplate`, `AuditLog`
- **Base Interfaces:** `Timestamped`, `CompanyScoped`

Every entity includes timestamps and most are company-scoped.

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
2. **Always import required dependencies at the top of files**
3. **Use existing UI components from `src/components/ui/`**
4. **Follow TypeScript strictly - add proper types for all functions**
5. **Use existing services pattern from `src/services/`**
6. **Apply glass morphism design from `design.json`**
7. **Use existing auth context from `src/contexts/AuthContext.tsx`**
8. **Use centralized `data.service.ts` for companies, users, and roles** (don't duplicate queries)
9. **Use `sonner` toast for user feedback** (firebase-utils already includes this)
10. **Add proper error handling with try-catch blocks**
11. **This project uses Bun** - Use `bun` instead of `npm`, and `bunx` instead of `npx`
12. **Use Preact Signals for reactive state** - Call `useSignals()` in components that access signals

### Build Verification Protocol

**MANDATORY**: Before claiming any task is complete, you MUST:
1. Run `bun run build` to verify the code compiles
2. Fix any TypeScript errors that appear
3. Ensure the build completes successfully
4. Only then declare the task as completed

This is non-negotiable and must be followed for every feature implementation, no matter how small.

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
4. **Use** `data.service.ts` for companies, users, and roles data (don't create new queries)
5. **Use** firebase-utils for simple CRUD operations
6. **Follow** the service layer pattern
7. **Add** proper TypeScript types
8. **Include** error handling and loading states
9. **Use** `useSignals()` when accessing Preact Signals
10. **Test** manually with the provided checklists
11. **Verify** Firestore data structure in Firebase Console

**Remember:**
- **Prefer editing existing files** over creating new ones
- **Always use `data.service.ts`** for companies, users, and roles - these are centrally managed with real-time listeners
- Use firebase-utils for CRUD operations (automatic timestamps + toasts)
- Fall back to firebase.ts for complex queries only
- Only use firebase-admin.ts in API routes

**New Component Checklist:**
- [ ] Add `"use client"` directive if using hooks/state
- [ ] Import `useSignals()` if accessing `globalData` signals
- [ ] Use existing UI components from `@/components/ui`
- [ ] Follow glass morphism design patterns
- [ ] Add proper loading states with `LoadingSpinner`
- [ ] Handle errors with toast notifications
- [ ] Test on mobile viewport
