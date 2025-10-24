# Newton - AI Development Guide

## Project Overview

**Newton** is a weighbridge and logistics management system for mining, transportation, and logistics companies. Manages asset tracking (trucks, trailers, drivers), orders, weighbridge operations, security checkpoints, and pre-booking.

**Core Flows:** Asset Management • Order Management • Pre-Booking • Security Checkpoints • Weighbridge Operations • Multi-Tenancy • Organizational Groups (hierarchical, mine companies only)

---

## Technology Stack

**Framework:** Next.js 15.5.4 (App Router, React 19) • TypeScript 5.9.2 (strict) • Tailwind CSS 4.1.13
**UI:** Radix UI • Framer Motion 12.23.22 • Lucide React • Sonner
**Backend:** Firebase 12.3.0 (client) • firebase-admin 13.5.0 (server, API routes only)
**Forms:** react-hook-form 7.63.0 • Zod 4.1.11
**Utils:** date-fns 4.1.0 • uuid 13.0.0 • lodash 4.17.21 • jspdf/jspdf-autotable • xlsx
**Package Manager:** Bun (`bun install`, `bun run`, `bunx`, `bun dev`)

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (authenticated)/    # Protected routes
│   ├── api/               # API routes (use firebase-admin)
│   └── login/             # Public routes
├── components/
│   ├── ui/                # Radix UI components (shadcn/ui)
│   └── [domain]/          # Domain-specific components
├── contexts/              # AuthContext, CompanyContext, LayoutContext
├── hooks/                 # Custom hooks
├── lib/
│   ├── firebase.ts        # Client SDK (auth, db, storage)
│   ├── firebase-admin.ts  # Admin SDK (API routes only)
│   ├── firebase-utils.ts  # CRUD helpers (USE THESE FIRST!)
│   └── utils.ts           # General utilities
├── services/              # Business logic (data.service.ts, scan.service.ts, etc)
└── types/index.ts         # All TypeScript types
```

---

## Firebase Files - CRITICAL Decision Tree

```
In API route? → YES → firebase-admin.ts (adminDb, adminAuth)
              ↓ NO
Need centralized data (companies/users/roles/products/groups/sites/clients/assets)?
              → YES → data.service.ts (globalData.*.value) - ALWAYS USE
              ↓ NO
Simple CRUD?  → YES → firebase-utils.ts (createDocument, updateDocument, deleteDocument)
              ↓ NO
Complex query → firebase.ts (db) for getDocs/query
```

### firebase-utils.ts - Use First (Auto-timestamps + Toasts)

```typescript
import { createDocument, updateDocument } from "@/lib/firebase-utils"

// ✅ Automatic timestamps (createdAt, updatedAt, dbCreatedAt, dbUpdatedAt) + toast
await createDocument("companies", data, "Company created")
await updateDocument("companies", id, updates, "Company updated")
```

### data.service.ts - Centralized Real-Time Data

**ALWAYS use for:** companies • users • roles • products • groups • sites • clients • assets

```typescript
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function MyComponent() {
  useSignals() // Required for reactivity

  const products = globalData.products.value  // Auto-updates
  const sites = globalData.sites.value        // Company-scoped
  const roles = globalData.roles.value        // Global (NOT company-scoped)
}
```

**Why?** Single source of truth • Real-time sync • No duplicate queries • Faster (in-memory)

### When Complex Queries ARE Appropriate

✅ Validation queries (e.g., "Is product used in orders?")
✅ Cross-collection queries (orders, weighing records)
✅ One-time fetches (different company data)
✅ Aggregation (count, sum, complex filtering)

❌ Reading centralized collections (use globalData instead)
❌ Duplicate validation (check in-memory data)
❌ List views (globalData is already real-time)

---

## Critical Development Rules

1. **ALWAYS BUILD** before declaring completion: `bun run build`
2. **ALWAYS COMMIT & PUSH** after changes (see Git Workflow below)
3. Import dependencies at top • Use existing UI components • Strict TypeScript
4. **Use centralized data.service.ts** - don't duplicate queries
5. **Use firebase-utils for CRUD** - automatic timestamps (including dbUpdatedAt)
6. **For validation:** check in-memory globalData, not Firebase queries
7. Apply glass morphism design • Use `sonner` toast • Add error handling
8. **Use Bun** (`bun`, not `npm`) • **Use Preact Signals** (`useSignals()`)
9. **NEVER HARDCODE VALUES** - use centralized constants (see Anti-Hardcoding Rules below)

### Build & Dev Server Protocol

```bash
# After ANY changes:
bun run build                          # Fix TypeScript errors
lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9  # Kill port 3000
pkill -9 -f "bun dev"                  # Kill all dev servers
bun dev --turbopack                    # MUST run on port 3000
```

### Git Workflow (MANDATORY)

```bash
git status
git diff
git log -5 --oneline                  # Follow commit style
git add <files>
git commit -m "$(cat <<'EOF'
Brief summary (imperative, ~50 chars)

Detailed explanation of what and why (not how).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
git push
```

---

## Anti-Hardcoding Rules (CRITICAL)

**NEVER hardcode values in the codebase.** All constants, configuration values, and repeated strings MUST be centralized in configuration files.

### What Constitutes Hardcoding?

❌ **Magic Numbers**: `setTimeout(3000)`, `width: 500`, `1000 * 60 * 60 * 24`
❌ **Hardcoded Strings**: `"orders"`, `"users"`, `"pending"`, `"/api/users/create"`
❌ **Hardcoded IDs**: `"r_admin"`, `"c_dev"`, `"tpl_order_created"`
❌ **Configuration Values**: `60` (days), `10 * 1024 * 1024` (file size), `24` (hours)
❌ **Repeated Values**: Same value used in multiple files without a constant

### Configuration File Structure

All constants MUST be defined in centralized files in `src/lib/`:

```
src/lib/
├── constants/
│   ├── collections.ts          # Firestore collection names
│   ├── api-routes.ts           # All API endpoint paths
│   ├── time.ts                 # Time conversion constants
│   ├── defaults.ts             # Default configuration values
│   ├── roles.ts                # Role IDs and constants
│   ├── templates.ts            # Notification template IDs
│   ├── upload.ts               # File upload limits and config
│   └── index.ts                # Re-export all constants
```

### Required Constants Files

#### 1. Collection Names (`src/lib/constants/collections.ts`)

```typescript
export const COLLECTIONS = {
  USERS: "users",
  ORDERS: "orders",
  ASSETS: "assets",
  ROLES: "roles",
  PRODUCTS: "products",
  CLIENTS: "clients",
  SITES: "sites",
  GROUPS: "groups",
  COMPANIES: "companies",
  WEIGHING_RECORDS: "weighing_records",
  PRE_BOOKINGS: "pre_bookings",
  NOTIFICATION_TEMPLATES: "notification_templates",
} as const
```

**Usage:**
```typescript
// ✅ CORRECT
import { COLLECTIONS } from "@/lib/constants"
collection(db, COLLECTIONS.ORDERS)

// ❌ WRONG
collection(db, "orders")
```

#### 2. Time Constants (`src/lib/constants/time.ts`)

```typescript
export const TIME = {
  MS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MS_PER_MINUTE: 1000 * 60,
  MS_PER_HOUR: 1000 * 60 * 60,
  MS_PER_DAY: 1000 * 60 * 60 * 24,
} as const
```

**Usage:**
```typescript
// ✅ CORRECT
import { TIME } from "@/lib/constants"
const days = Math.ceil((end - start) / TIME.MS_PER_DAY) + 1

// ❌ WRONG
const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
```

#### 3. Default Values (`src/lib/constants/defaults.ts`)

```typescript
export const DEFAULTS = {
  ORDER_HISTORY_DAYS: {
    default: 60,
    min: 1,
    max: 120,
  },
  ADVANCE_BOOKING_HOURS: 24,
  SEAL_QUANTITY: 2,
  ESCALATION_MINUTES: 15,
  RESPONSE_MINUTES: 5,
  BATCH_SIZE: 500,
  FLOATING_POINT_TOLERANCE: 0.01,
  ORDER_NUMBER_PAD_WIDTH: 4,
  ORDER_NUMBER_PAD_CHAR: "0",
} as const
```

**Usage:**
```typescript
// ✅ CORRECT
import { DEFAULTS } from "@/lib/constants"
const days = company.orderHistoryDays || DEFAULTS.ORDER_HISTORY_DAYS.default

// ❌ WRONG
const days = company.orderHistoryDays || 60
```

#### 4. API Routes (`src/lib/constants/api-routes.ts`)

```typescript
export const API_ROUTES = {
  USERS: {
    CREATE: "/api/users/create",
    DELETE: "/api/users/delete",
    BULK_DELETE: "/api/users/bulk-delete",
    UPDATE_EMAIL: "/api/users/update-email",
    CHANGE_PASSWORD: "/api/users/change-password",
    CONVERT_TO_LOGIN: "/api/users/convert-to-login",
    CONVERT_TO_CONTACT: "/api/users/convert-to-contact",
  },
  SEED: "/api/seed",
} as const
```

**Usage:**
```typescript
// ✅ CORRECT
import { API_ROUTES } from "@/lib/constants"
await fetch(API_ROUTES.USERS.CREATE, { ... })

// ❌ WRONG
await fetch("/api/users/create", { ... })
```

#### 5. Role Constants (`src/lib/constants/roles.ts`)

```typescript
export const ROLE_IDS = {
  NEWTON_ADMIN: "r_newton_admin",
  ALLOCATION_OFFICER: "r_allocation_officer",
  SITE_ADMIN: "r_site_admin",
  LOGISTICS_COORDINATOR: "r_logistics_coordinator",
  TRANSPORTER: "r_transporter",
  // ... etc
} as const
```

#### 6. Upload Configuration (`src/lib/constants/upload.ts`)

```typescript
export const UPLOAD = {
  MAX_PROFILE_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const
```

### Anti-Hardcoding Checklist

Before writing ANY code:

- [ ] Check if value exists in constants files
- [ ] If new value needed, add to appropriate constants file FIRST
- [ ] If value used >1 time, it MUST be a constant
- [ ] If value might change, it MUST be a constant
- [ ] If value has business meaning, it MUST be a constant

### Common Violations and Fixes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `collection(db, "orders")` | `collection(db, COLLECTIONS.ORDERS)` |
| `1000 * 60 * 60 * 24` | `TIME.MS_PER_DAY` |
| `fetch("/api/users/create")` | `fetch(API_ROUTES.USERS.CREATE)` |
| `orderHistoryDays \|\| 60` | `orderHistoryDays \|\| DEFAULTS.ORDER_HISTORY_DAYS.default` |
| `file.size > 10 * 1024 * 1024` | `file.size > UPLOAD.MAX_PROFILE_IMAGE_SIZE` |
| `if (role === "r_admin")` | `if (role === ROLE_IDS.NEWTON_ADMIN)` |

### Why This Matters

1. **Maintainability**: Change value once, applies everywhere
2. **Type Safety**: TypeScript autocomplete and validation
3. **Consistency**: No conflicting values across codebase
4. **Discoverability**: Easy to find all configuration
5. **Testing**: Mock constants for different test scenarios

---

## Data Operations Patterns

| Operation | Use | Example |
|-----------|-----|---------|
| **Create/Update/Delete** | firebase-utils.ts | `await createDocument(COLLECTIONS.ASSETS, data, "Created")` |
| **Centralized data** | data.service.ts | `globalData.products.value` |
| **Complex query** | firebase.ts | `getDocs(query(collection(db, COLLECTIONS.ORDERS), where(...)))` |
| **Server operations** | firebase-admin.ts (API only) | `adminDb.collection(COLLECTIONS.COMPANIES).doc(id).set(...)` |

---

## Key Patterns

### Permissions

```typescript
import { usePermission } from "@/hooks/usePermission"
import { PermissionGate } from "@/components/auth/PermissionGate"

const canView = usePermission(PERMISSIONS.ASSETS_VIEW)

<PermissionGate permission={PERMISSIONS.ADMIN_COMPANIES}>
  <AdminPanel />
</PermissionGate>
```

### Company Type Access Control

| Feature | Mine | Transporter | Logistics |
|---------|------|-------------|-----------|
| Dashboard | ✅ | ✅ | ✅ |
| Products/Clients/Sites | ✅ | ❌ | ❌ |
| Org Groups | ✅ | ❌ | ❌ |
| Users/Roles | ✅ | ✅ | ✅ |

```typescript
// Navigation auto-filters based on company.companyType
const nav = useMemo(() =>
  company?.companyType === "mine" ? allNav : allNav.filter(i => !i.requiresMine),
  [company]
)
```

### Entity List Pages (Reusable Components)

**Hooks:** `useEntityList`, `useEntityActions`, `useListViewPreference`, `useSimpleModalState`
**Components:** `EntityListPage`, `EntityCardListView`, `EntityCardSearchBar`, `EntityCard`

**Pattern:** All card-based entity pages use reusable components for permissions, search, filtering, and validation.

```typescript
const { canView, canManage, filteredItems } = useEntityList({ items, searchConfig, permissions })
const { toggleStatus, deleteEntity } = useEntityActions({ collection, usageCheck, canManage })
```

**Refactored:** Products • Clients • Sites • Roles • Companies (✅ ~1,550 lines eliminated)
**Details:** See `docs/dev.md` Phase 2.10

### Error Handling

```typescript
async function handleSubmit(data) {
  try {
    setLoading(true)
    if (!data.required) { toast.error("Missing field"); return }
    await Service.create(data)
    router.push("/success")
  } catch (error) {
    console.error("Error:", error)
    toast.error("Failed")
  } finally {
    setLoading(false)
  }
}
```

### UI Patterns

**Page:**
```typescript
"use client"
import { useAuth } from "@/contexts/AuthContext"

export default function MyPage() {
  const { user } = useAuth()
  if (!user) return <div>Login required</div>
  return <div>Page content</div>
}
```

**Form:**
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({ name: z.string().min(1) })
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})
```

**Modal Close Behavior:** All modals prevent outside clicks (Dialog/AlertDialog) - users must click X/Cancel/action button to close.

---

## List Action Icons (Lucide)

| Icon | Purpose | Styling |
|------|---------|---------|
| **FileText** | View details (not Eye - reserved for visibility) | `variant="ghost" size="sm"` |
| **Edit** | Edit item (modal/page) | `variant="ghost" size="sm"` |
| **Trash2** | Delete (with confirmation) | `variant="ghost" size="sm" text-destructive` |
| **ToggleRight/Left** | Activate/deactivate | Green (active) / Gray (inactive) |
| **Eye/EyeOff** | Toggle visibility (Roles only) | `h-5 w-5` |

**Layout:** Left (Icon + Details) → Right (Actions + Status Badge)

---

## DataTable Best Practices

### Column Ordering (CRITICAL)

**Rules:**
1. **List ALL columns** in `defaultColumnOrder` - missing columns appear randomly
2. **Match rendered columns** - use spread for conditional columns
3. **Validation requires ALL columns** - incomplete order resets to default
4. **Don't pin columns** unless required (status should NOT be pinned)

```typescript
// ✅ CORRECT - Complete + dynamic
defaultColumnOrder={[
  "registration",
  ...(company?.systemSettings?.fleetNumberEnabled ? ["fleetNumber"] : []),
  "makeModel", "status", "actions"
]}

// ❌ WRONG - Incomplete
defaultColumnOrder={["registration", "status", "actions"]} // Other 12 columns random!
```

### Context-Aware Exports

Export functions (CSV/Excel/PDF/Print) **automatically adapt:**
- Rows selected → export selected
- Columns hidden → export visible only
- No selection → export all filtered

**Implementation:** `DataTableToolbar.tsx` checks `table.getSelectedRowModel().rows.length > 0`

❌ **WRONG:** Add Export button to BulkActionsToolbar
✅ **CORRECT:** Let DataTableToolbar handle both cases

**Benefits:** Single export controls • Cleaner UX • Column visibility respected

---

## Data Model Essentials

**Timestamps (ALL entities):**
- `createdAt`, `updatedAt`: Client time (`Date.now()`)
- `dbCreatedAt`, `dbUpdatedAt`: Server timestamp (`serverTimestamp()`)

**firebase-utils handles this automatically!**

**Company Scoping:** Most entities include `companyId` for multi-tenancy
**Global Users:** `isGlobal: true` users see all companies, override permissions
**Groups:** Hierarchical (mine companies only) - `parentGroupId`, `level`, `path[]`

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Permission denied | Check Firestore rules, use correct auth context |
| Component not rendering | Check console, add `"use client"`, verify imports |
| Toast not showing | Check Toaster in root layout, use `import { toast } from "sonner"` |
| Infinite re-renders | Check useEffect deps, don't set state during render |
| Empty queries | Check collection names (case-sensitive), companyId, indexes |

---

## Quick Reference

### Create Page
1. File: `src/app/(authenticated)/[name]/page.tsx`
2. Add `"use client"` if using hooks
3. Import `useAuth`, implement permissions
4. Add to navigation

### Create Service
1. File: `src/services/[name].service.ts`
2. Export class with static methods
3. Use firebase-utils for CRUD, firebase.ts for queries
4. Return typed data from `@/types`

### Create Component
1. File: `src/components/[domain]/[Name].tsx`
2. Add `"use client"` if needed
3. Use UI components from `@/components/ui`
4. Apply Tailwind + glass morphism

### Add Entity Type
1. Interface in `src/types/index.ts`
2. Extend `Timestamped` + `CompanyScoped` if applicable
3. Update `docs/data-model.md`
4. Create service class
5. Add to seed script
6. Create UI pages

---

## Resources

- **Development Plan:** `docs/dev.md`
- **Data Model:** `docs/data-model.md`
- **User Flows:** `docs/user-flow-web.md`
- **Design System:** `docs/design.json`

---

## AI Workflow

1. Read relevant `docs/dev.md` section
2. Check `docs/data-model.md` for data structure
3. Review existing code patterns
4. **Use data.service.ts** for centralized collections - don't create queries
5. **Use firebase-utils** for ALL CRUD (auto-timestamps)
6. **Validate with in-memory globalData**, not Firebase queries
7. Add TypeScript types, error handling, loading states
8. **Call useSignals()** when accessing signals
9. Test manually, verify Firestore structure

**Checklist:**
- [ ] Add `"use client"` if using hooks/state
- [ ] Import `useSignals()` if accessing globalData
- [ ] Use existing UI components
- [ ] Follow glass morphism design
- [ ] Add loading states, error handling
- [ ] **NO HARDCODED VALUES** - use constants from `@/lib/constants`
- [ ] Test on mobile
- [ ] `bun run build` before completion
- [ ] Commit & push changes

**Remember:**
- Prefer editing existing files over creating new ones
- ALWAYS use data.service.ts for centralized collections
- ALWAYS use firebase-utils for CRUD (automatic dbUpdatedAt)
- Validate with in-memory globalData, not queries
- Only use firebase-admin.ts in API routes
- **NEVER hardcode** - use centralized constants
