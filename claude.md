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

## Data Operations Patterns

| Operation | Use | Example |
|-----------|-----|---------|
| **Create/Update/Delete** | firebase-utils.ts | `await createDocument("assets", data, "Created")` |
| **Centralized data** | data.service.ts | `globalData.products.value` |
| **Complex query** | firebase.ts | `getDocs(query(collection(db, "orders"), where(...)))` |
| **Server operations** | firebase-admin.ts (API only) | `adminDb.collection("companies").doc(id).set(...)` |

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

**All entity card-based pages use reusable components to eliminate duplication:**

**Hooks:**
- `useEntityList`: Consolidates permissions, search, filtering logic
- `useEntityActions`: Unified toggle/delete with validation and permission checks
- `useListViewPreference`: Universal view preference (card/table) for all entity lists
- `useSimpleModalState`: Simplified modal state management

**Components:**
- `EntityListPage`: Standard page wrapper with header, permissions, ViewOnlyBadge
- `EntityCardListView`: Card list container with loading/empty states
- `EntityCardSearchBar`: Search + filter UI (always uses DropdownMenu)
- `EntityCard`: Standard card layout (icon + title + subtitle + metadata + actions + badge)

**Usage Example:**
```typescript
import { useEntityList } from "@/hooks/useEntityList"
import { useEntityActions } from "@/hooks/useEntityActions"
import { EntityListPage } from "@/components/ui/entity-list/EntityListPage"
import { EntityCardListView } from "@/components/ui/entity-card-list/EntityCardListView"

export default function ProductsPage() {
  useSignals()
  const products = globalData.products.value
  const loading = globalData.loading.value

  // Permissions, search, filtering
  const { canView, canManage, isViewOnly, searchTerm, setSearchTerm,
          filterStatus, setFilterStatus, filteredItems } = useEntityList({
    items: products,
    searchConfig: SEARCH_CONFIGS.products,
    viewPermission: PERMISSIONS.ADMIN_PRODUCTS_VIEW,
    managePermission: PERMISSIONS.ADMIN_PRODUCTS,
    globalDataLoading: loading,
  })

  // Toggle/delete with permissions
  const { toggleStatus, deleteEntity } = useEntityActions({
    collection: "products",
    entityName: "Product",
    usageCheckQuery: async (product) => {
      // Check if used in orders
      const ordersQuery = query(collection(db, "orders"), where("productId", "==", product.id))
      const ordersSnapshot = await getDocs(ordersQuery)
      return {
        inUse: !ordersSnapshot.empty,
        count: ordersSnapshot.size,
        message: `Used in ${ordersSnapshot.size} orders`
      }
    },
    canManage,
  })

  return (
    <EntityListPage
      title="Products"
      description={(isViewOnly) => isViewOnly ? "View products" : "Manage products"}
      addButtonLabel="Add Product"
      onAddClick={() => setShowCreateModal(true)}
      canView={canView}
      canManage={canManage}
      isViewOnly={isViewOnly}
      permissionLoading={permissionLoading}
    >
      <EntityCardListView
        items={filteredItems}
        loading={loading}
        searchBar={<EntityCardSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} ... />}
        renderCard={(product) => <EntityCard icon={...} title={...} actions={...} />}
      />
    </EntityListPage>
  )
}
```

**Refactored Pages (using reusable components):**
- ✅ Products: `/admin/products` - Search name/code, filter status, usage check (orders)
- ✅ Clients: `/admin/clients` - Search name/reg/contact, filter status, usage check (orders)
- ✅ Sites: `/admin/sites` - Search name/address, filter by type (collection/destination), usage check (orders)
- ✅ Roles: `/admin/roles` - Search name/desc, filter status, visibility toggle, system role protection, usage check (users)
- ✅ Companies: `/admin/companies` - Search name/reg, filter by type, access control, active company protection

**DataTable Pages (already consistent):**
- ✅ Orders: FilterableColumnHeader on status, default pageSize=20
- ✅ Users: FilterableColumnHeader on status, bulk actions, default pageSize=20
- ✅ Assets: FilterableColumnHeader on status (Active/Inactive/Expired), 3 tabs, bulk actions, default pageSize=20

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
- [ ] Test on mobile
- [ ] `bun run build` before completion
- [ ] Commit & push changes

**Remember:**
- Prefer editing existing files over creating new ones
- ALWAYS use data.service.ts for centralized collections
- ALWAYS use firebase-utils for CRUD (automatic dbUpdatedAt)
- Validate with in-memory globalData, not queries
- Only use firebase-admin.ts in API routes
