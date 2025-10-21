# Newton Development Implementation Plan

## Document Purpose

This document provides a comprehensive, phase-by-phase implementation guide for the Newton Weighbridge System. It covers ALL features from `docs/user-flow-web.md` and `docs/data-model.md` in a MECE (Mutually Exclusive, Collectively Exhaustive) manner.

**Important Notes:**
- This document does NOT include implementation code - only file names, class names, method names, and functional requirements
- Phases are ordered by logical dependencies - prerequisites must be completed first
- Everything currently in the codebase constitutes Phase 1 (✅ COMPLETED)
- For asset induction, reference `/Users/joe/iDev/hybrid_appz/NewtonWeighbridges/src/services/scan.service.ts` and use expo-sadl for driver license field extraction
- Real production data available in `/Users/joe/iDev/hybrid_appz/Newton/data/assets-data.json`

---

## Technology Stack

### Core Framework
- **Next.js 15.5.4** with App Router
- **React 19**
- **TypeScript 5.9.2** (strict mode)
- **Tailwind CSS 4.1.13**
- **Bun** package manager

### Key Libraries
- **Firebase 12.3.0** (client SDK)
- **firebase-admin 13.5.0** (server SDK, API routes only)
- **Radix UI** (component primitives)
- **Framer Motion 12.23.22** (animations)
- **react-hook-form 7.63.0** + **Zod 4.1.11** (forms & validation)
- **Preact Signals** (reactive state)
- **expo-sadl** (South African driver's license parsing)
- **Sonner** (toast notifications)

### Firebase Architecture
- **`src/lib/firebase.ts`**: Client SDK exports (`auth`, `db`, `storage`) - use in components/services
- **`src/lib/firebase-utils.ts`**: CRUD helpers with auto-timestamps - USE THESE FIRST
- **`src/lib/firebase-admin.ts`**: Admin SDK (`adminDb`, `adminAuth`) - API routes ONLY

### Critical Patterns

- **ALWAYS use centralized `src/services/data.service.ts`** for companies, users, roles, products, groups, sites, clients, and assets (NO duplicate queries or listeners)
- **ALWAYS use `updateDocument`, `createDocument`, `deleteDocument`** from `@/lib/firebase-utils` for ALL CRUD operations (automatic timestamps)
- **For validation**, check in-memory data from `globalData.{collection}.value` instead of making Firebase queries
- Use `useOptimizedSearch` hook from `src/hooks/useOptimizedSearch.ts` with configs from `src/config/search-configs.ts`
- All loading states must use components from `src/components/ui/loading-spinner.tsx`
- Follow timestamp convention: `createdAt`/`updatedAt` (client), `dbCreatedAt`/`dbUpdatedAt` (server) - firebase-utils handles this automatically
- Soft deletes via `isActive` flag; hard delete only for immediate induction errors
- Use Preact Signals with `useSignals()` hook when accessing `globalData`

---

## Phase 1: Core Infrastructure ✅ COMPLETED

### Status: PRODUCTION READY

All foundational systems are implemented and tested. The following components are live:

### 1.1 Authentication & Authorization ✅
**User Flow**: Flow 1 - User Login

**Completed Components:**
- `src/contexts/AuthContext.tsx` - User session management
- `src/hooks/usePermission.ts` - Permission checking hook (returns `{ hasPermission, loading }`)
- `src/components/auth/PermissionGate.tsx` - Conditional rendering based on permissions
- `src/services/permission.service.ts` - Permission evaluation logic
- `src/lib/permissions.ts` - Permission constants and labels

**Completed Features:**
- Firebase Authentication integration
- Role-based permission system with dual permissions (view + manage)
- Global admin support (isGlobal users)
- Permission overrides per user with three states: View Only, Full Access, No Access
- Permission-based navigation filtering (menu items hidden for unauthorized users)
- Loading states for permission checks
- Permission evaluation priority: Global users → Permission overrides → Role permissions → Wildcard

### 1.2 Company Management ✅
**User Flows**: Flows 7, 8, 9 - Company Configuration (Mine, Transporter, Logistics Coordinator)

**Completed Components:**
- `src/app/(authenticated)/admin/companies/page.tsx` - Company listing with search/filter
- `src/components/companies/CompanyFormModal.tsx` - Tabbed creation/edit modal
- `src/services/company.service.ts` - Company CRUD operations
- `src/contexts/CompanyContext.tsx` - Company state & switcher

**Completed Features:**
- Full CRUD for companies (mine, transporter, logistics_coordinator)
- Dual-role support (transporter can also be LC, and vice versa)
- Company switcher for multi-company users
- Tabbed form with 4 sections:
  - **Basic Info**: Name, type, registration, contacts (main + secondaries)
  - **Order Config**: Order number settings, limits, pre-booking, seals (mine companies only)
  - **Fleet Settings**: Fleet number, transporter groups (transporter/dual-role LC)
  - **Security Alerts**: Escalation contacts and timing
- Inactive company filtering (hidden from switcher, visible in admin pages)
- Real-time updates via Preact Signals

**Note:** Roles are **global** and shared across all companies. They do not have a `companyId` field.

### 1.3 User Management ✅
**User Flow**: Flow 10 - User Management Configuration

**Completed Components:**
- `src/app/(authenticated)/admin/users/page.tsx` - User listing with advanced data table
- `src/components/users/AddUserModal.tsx` - User creation
- `src/components/users/ChangePasswordModal.tsx` - Password management
- `src/components/users/ChangeEmailModal.tsx` - Email updates
- `src/components/users/ProfilePictureUpload.tsx` - Profile picture upload with Firebase Storage
- `src/components/users/UsersTable.tsx` - Advanced data table with pagination, sorting, filtering, export
- `src/app/(authenticated)/settings/page.tsx` - User settings with profile picture upload
- `src/services/user.service.ts` - User operations (if exists, or use firebase-utils directly)

**Completed Features:**
- User creation with Firebase Auth
- Role assignment
- Email/password management
- **Profile picture upload**: Users can upload profile pictures (JPG/PNG, max 10MB) via settings page
  - Uploads to Firebase Storage at `profile-pictures/{userId}/{timestamp}-{filename}`
  - Automatic deletion of old profile pictures when new one uploaded
  - Real-time display in AppLayout header/avatar
  - Validation: file type (JPG/PNG), file size (max 10MB)
- **Advanced Users Table**:
  - Pagination with customizable page sizes (10, 20, 30, 40, 50, 100)
  - Row selection with bulk actions support
  - Column resizing and reordering (drag handles)
  - Export to CSV/Excel
  - All table preferences persist to localStorage
  - Global search across all columns
  - Filter by user type (Login/Contact) and role
- Company-scoped user listing
- **Permission Override System**: Complete three-state permission override system
  - View Only: Sets `.view` permission to true, manage permission to false
  - Full Access: Sets manage permission to true (includes view access)
  - No Access: Sets both permissions to false
  - Use Role Default: Removes override (inherits from role)
  - UI shows current overrides with badges
  - Permissions organized by category (Asset Management, Order Management, Administrative)
- Permission-based cross-company viewing (`admin.users.viewAllCompanies`)

**Partial Implementation:**
- Notification preferences UI needs full implementation (see Phase 2.6)
- Global admin toggle UI needs implementation (currently requires database edit)

### 1.4 Centralized Data Management ✅
**Technical Infrastructure**

**Completed Components:**
- `src/services/data.service.ts` - Singleton reactive data service
- `src/lib/firebase-utils.ts` - `createCollectionListener` factory
- `src/contexts/CompanyContext.tsx` - Integration with global data service

**Completed Features:**
- Preact Signals-based reactive state
- Real-time Firebase listeners for **all centralized collections**:
  - **Companies**: All companies (including inactive) - no company scoping
  - **Users**: Company-scoped, filtered by `companyId`
  - **Roles**: Global (shared across all companies) - no company scoping
  - **Products**: Company-scoped, filtered by `companyId`
  - **Groups**: Company-scoped, filtered by `companyId`
  - **Sites**: Company-scoped, filtered by `companyId`
  - **Clients**: Company-scoped, filtered by `companyId`
  - **Assets**: Company-scoped, filtered by `companyId`
- Smart loading state tracking (no arbitrary timeouts)
- Automatic cleanup on company switch/unmount
- Single source of truth for all data - **NO duplicate queries allowed**
- All components access the same reactive data via `globalData.{collection}.value`
- In-memory validation using already-loaded data (no additional Firebase queries)

**Usage Pattern:**

```typescript
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function MyComponent() {
  useSignals() // Required for reactivity

  const products = globalData.products.value
  const assets = globalData.assets.value
  const sites = globalData.sites.value

  // Component auto re-renders when data changes
}
```

**For CRUD Operations:**

```typescript
import { createDocument, updateDocument, deleteDocument } from "@/lib/firebase-utils"

// ALWAYS use firebase-utils (automatic timestamps)
await createDocument("products", productData, "Product created")
await updateDocument("sites", siteId, { isActive: false })
await deleteDocument("clients", clientId, "Client deleted")
```

**For Validation (In-Memory):**

```typescript
import { data as globalData } from "@/services/data.service"

// Check for duplicates in already-loaded data
const existingAsset = globalData.assets.value.find(a => a.registration === regNum)
if (existingAsset) {
  // Handle duplicate
}
```

**Important Notes:**

- **Roles are global** (shared across companies), so they are NOT filtered by `companyId`
- **Companies show all** (including inactive) for admin pages
- **All other collections** (users, products, groups, sites, clients, assets) are company-scoped
- Never make additional Firebase queries for data that's already in `globalData`
- Use in-memory filtering/searching for better performance and lower Firestore costs

### 1.5 Search Infrastructure ✅
**Technical Infrastructure**

**Completed Components:**
- `src/services/search.service.ts` - Core weighted search logic
- `src/hooks/useOptimizedSearch.ts` - React hook with debouncing
- `src/config/search-configs.ts` - Centralized search configurations

**Completed Features:**
- 300ms debouncing
- requestIdleCallback for non-blocking search
- Weighted field matching
- Nested field support
- Custom transformers
- Result limiting

### 1.6 Loading States System ✅
**Technical Infrastructure**

**Completed Components:**
- `src/components/ui/loading-spinner.tsx` - `LoadingSpinner`, `InlineSpinner`, `SkeletonLoader`
- Updated `usePermission.ts` to return loading state
- Updated `AppLayout.tsx` with auth loading screen

**Completed Features:**
- Glass morphism design
- Multiple sizes (sm, md, lg, xl)
- Full-screen and inline modes
- Contextual messages
- Button loading states

### 1.7 Advanced Data Table System ✅
**Technical Infrastructure**

**Completed Components:**
- `src/components/ui/data-table/DataTable.tsx` - Main reusable table component
- `src/components/ui/data-table/DataTableHeader.tsx` - Draggable, sortable, resizable headers
- `src/components/ui/data-table/DataTableToolbar.tsx` - Search and export controls
- `src/components/ui/data-table/DataTablePagination.tsx` - Pagination controls
- `src/components/ui/data-table/DataTableColumnToggle.tsx` - Column visibility toggle
- `src/components/ui/data-table/index.ts` - Barrel export
- `src/stores/table-config.store.ts` - Zustand store for table state persistence

**Completed Features:**
- **TanStack Table v8** integration for headless data management
- **Pagination**: Customizable page sizes (10, 20, 30, 40, 50, 100 rows)
- **Row Selection**: Checkboxes with bulk action support via callback
- **Column Operations**:
  - Drag-to-reorder using Pragmatic Drag-and-Drop
  - Resize columns by dragging borders
  - Toggle column visibility
  - Sort by clicking headers (asc/desc/none)
- **Export**: CSV and Excel (.xlsx) using xlsx library
- **Search**: Global filter across all columns with debouncing
- **State Persistence**: All preferences saved to localStorage per table:
  - Column order
  - Column visibility
  - Column sizes
  - Sort state
  - Pagination state
- **Type Safety**: Full TypeScript generics for data and column types
- **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- **Glass Morphism Design**: Matches design.json specifications
- **Header Styling**: Clean headers without borders - use `!border-0 !shadow-none` on header buttons to remove all borders and shadows

**Important Styling Notes:**
- Table header buttons (sort/drag) should NOT have visible borders
- Add `!border-0 !shadow-none` classes to all buttons in `DataTableHeader.tsx`
- This ensures clean, borderless column headers matching the Actions column appearance

**Usage Pattern:**
```typescript
<DataTable
  tableId="unique-table-id"
  columns={columns}
  data={data}
  defaultColumnOrder={["col1", "col2"]}
  searchPlaceholder="Search..."
  enablePagination={true}
  enableRowSelection={true}
  enableColumnResizing={true}
  enableExport={true}
  onRowSelectionChange={(selectedRows) => {
    console.log("Selected:", selectedRows)
  }}
/>
```

### 1.8 Alert Dialog System ✅
**Technical Infrastructure**

**Completed Components:**
- `src/hooks/useAlert.tsx` - Zustand-based alert state management hook
- `src/components/ui/alert-provider.tsx` - Global alert dialog component
- `src/components/ui/dialog.tsx` - Base Dialog component with outside click prevention
- `src/components/ui/alert-dialog.tsx` - Base AlertDialog component with outside click prevention
- Updated `src/app/layout.tsx` - Added AlertProvider to root layout
- Updated `src/lib/firebase-utils.ts` - Removed automatic toasts (components handle alerts)

**Completed Features:**
- Global alert dialog system with 5 variants (success, error, warning, info, confirm)
- Glass morphism design matching design.json
- Icon-based visual feedback (CheckCircle2, XCircle, AlertTriangle, AlertCircle)
- Framer Motion animations (spring enter, fade exit)
- Async operation support in confirmation callbacks
- Automatic loading state during async operations
- Accessible (keyboard navigation, ARIA labels, focus management)
- Responsive mobile-friendly design
- **Outside click prevention**: All modals (Dialog and AlertDialog) prevent closing when clicking outside to avoid accidental data loss

**Modal Close Behavior:**
All modals require explicit user action to close:
- Click the close button (X icon)
- Click the Cancel button
- Click any action button that closes the modal
- **Clicking outside the modal does NOT close it** (prevents accidental data loss)

**Usage Pattern:**
```typescript
import { useAlert } from "@/hooks/useAlert"

export default function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useAlert()

  // Success alert
  showSuccess("Title", "Description")

  // Error alert
  showError("Error Title", "Error description")

  // Confirmation dialog
  showConfirm(
    "Delete Item",
    "Are you sure? This cannot be undone.",
    async () => {
      await deleteItem()
      showSuccess("Deleted", "Item removed successfully.")
    },
    undefined,
    "Delete",
    "Cancel"
  )
}
```

**Design Specifications:**
- Backdrop: Linear gradient with blur (16px)
- Content: Glass surface with backdrop-blur (24px)
- Icons: 8x8 with colored background circles
- Animations: Spring-based (damping: 18, stiffness: 220)
- Z-index: 50 (above all other content)
- Max width: 28rem (sm:max-w-md)

**Migration Status:**
- ✅ Core infrastructure complete
- ✅ All 23 component files migrated from toast to alerts (100% complete)
- ✅ 8 admin page files migrated
- ✅ 15 modal component files migrated

### 1.9 Seed Script ✅
**Development Infrastructure**

**Completed Components:**
- `src/app/api/seed/route.ts` - Seed API endpoint
- `src/app/seed/page.tsx` - Seed UI

**Completed Features:**
- Seed permissions document (`settings/permissions`)
- Seed 9 default global roles (shared across all companies)
- Seed default company with proper contact IDs
- Seed default user with correct permissions
- Proper timestamp handling (client + server)

**Important:** Roles are seeded as **global** resources (no `companyId` field). They are shared across all companies.

### 1.10 Admin Dashboard ✅
**Navigation & UX**

**Completed Components:**
- `src/app/(authenticated)/admin/page.tsx` - Admin dashboard landing page
- Updated `src/components/layout/AppLayout.tsx` - Added Admin menu item with exact path matching

**Completed Features:**
- **Card-based overview** of all admin sections:
  - Companies (Building2 icon, blue theme)
  - Users (Users icon, green theme)
  - Roles (Shield icon, purple theme)
  - Products (Package icon, orange theme) - Mine companies only
  - Sites (MapPin icon, red theme) - Mine companies only
  - Clients (UserCog icon, cyan theme) - Mine companies only
  - Notifications (Bell icon, yellow theme)
- Each card shows:
  - Color-coded icon with matching background
  - Section title and description
  - Count of items
  - Hover effects with shadow and border animation
  - Click anywhere on card to navigate
- **Quick stats overview** showing active counts for all sections
- **Permission-based filtering**: Only shows sections user can access
- **Company type filtering**: Mine-specific sections hidden for transporter/LC companies
- **Access warning** for non-global users explaining limited access
- **Admin menu item** in main navigation:
  - Icon: LayoutDashboard
  - Shows for users with ANY admin permission
  - Exact path matching prevents highlighting when on admin sub-routes

**Acceptance Criteria:**
- ✅ Dashboard shows all accessible admin sections as cards
- ✅ Permission-based filtering works (sections hidden without access)
- ✅ Company type filtering works (mine-only sections conditional)
- ✅ Card counts accurate and real-time
- ✅ Navigation to sub-pages works from cards
- ✅ Admin menu item shows in sidebar
- ✅ Exact path matching prevents double-highlight

---

## Phase 2: Administrative Configuration ✅ COMPLETED

### Status: PRODUCTION READY

All administrative configuration modules have been implemented and tested. Products, Clients, Sites, Roles, User Management, and Notification Templates are fully functional with complete CRUD operations, permission controls, and usage validation.

### Overview
Implement all administrative configuration modules required BEFORE orders can be created. These are the master data tables that orders depend on.

---

### 2.1 Product Management ✅
**User Flow**: Flow 11 - Product Management Configuration

**Goal**: Simple catalog of minerals (Gold, Platinum, Diamond, Iron Ore, Chrome, etc.) for use in orders.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/products/page.tsx`
- `src/components/products/ProductFormModal.tsx`

**Implementation Pattern:**

- **Data Access**: Use `globalData.products.value` from `data.service.ts` (already loaded, real-time)
- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils
- **Search**: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.products`
- **No service file needed** - simple CRUD operations only
- **No Firebase queries** - all data already in memory via data.service.ts

**UI Requirements:**
- Simple list view with search by name/code
- Filter: Active/Inactive
- Modal form with fields:
  - Product name* (string, e.g., "Gold Ore")
  - Product code* (string, e.g., "AU-001")
  - Specifications (optional textarea, e.g., "Grade A")
  - isActive (checkbox)
- Usage validation: Query orders collection before delete
- Show badge if product used in orders

**Data Model:**
Reference `docs/data-model.md` → `products` collection

**Acceptance Criteria:**
- ✅ Products can be created with name, code, specifications
- ✅ Products can be edited/deactivated
- ✅ Search by name or code works
- ✅ Products in use cannot be deleted
- ✅ Inactive products don't appear in order dropdowns

---

### 2.2 Client Management ✅
**User Flow**: Flow 13 - Client Management Configuration

**Goal**: Manage client companies (buyers/receivers of materials).

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/clients/page.tsx`
- `src/components/clients/ClientFormModal.tsx`

**Implementation Pattern:**

- **Data Access**: Use `globalData.clients.value` from `data.service.ts` (already loaded, real-time)
- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils
- **Search**: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.clients`
- **No service file needed** - simple CRUD operations only
- **No Firebase queries** - all data already in memory via data.service.ts

**UI Requirements:**
- List view with search by name/registration/VAT
- Filter: Active/Inactive
- Modal form with fields:
  - Client name* (string)
  - Company registration number* (string)
  - VAT number (optional)
  - Physical address* (string)
  - Contact person name* (string)
  - Contact email* (email validation)
  - Contact phone* (phone validation)
  - Allowed sites (multi-select dropdown of active sites)
  - isActive (checkbox)
- Usage validation: Query orders collection before delete
- Show badge if client has orders

**Data Model:**
Reference `docs/data-model.md` → `clients` collection

**Acceptance Criteria:**
- ✅ Clients can be created with all contact info
- ✅ Phone number validation works (react-hook-form + Zod)
- ✅ Email validation works
- ✅ Clients can link to multiple allowed sites
- ✅ Clients in use cannot be deleted
- ✅ Inactive clients don't appear in order dropdowns

---

### 2.3 Site Management ✅
**User Flow**: Flow 14 - Site Management Configuration

**Goal**: Configure collection sites (loading places) and destination sites.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/sites/page.tsx`
- `src/components/sites/SiteFormModal.tsx`
- `src/components/sites/OperatingHoursEditor.tsx`

**Implementation Pattern:**

- **Data Access**: Use `globalData.sites.value` from `data.service.ts` (already loaded, real-time)
- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils
- **Search**: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.sites`
- **No service file needed** - simple CRUD operations only
- **No Firebase queries** - all data already in memory via data.service.ts
- Operating hours validation: Implement in OperatingHoursEditor component

**UI Requirements:**
- List view with tabs/filter: All, Collection, Destination
- Search by site name/address
- Modal form with fields:
  - Site name* (string)
  - Site type* (radio: collection | destination)
  - Physical address* (string)
  - Contact person* (dropdown from users - must have phone)
  - Operating hours* (day-by-day time picker):
    - Monday-Sunday: open time, close time
    - "Closed" checkbox per day
    - "24 Hours" checkbox per day (sets open: "00:00", close: "23:59")
    - Default: 06:00-18:00 (Mon-Fri), 06:00-14:00 (Sat), Closed (Sun)
  - isActive (checkbox)
- Validate contact has phone number (per user-flow-web.md Flow 14)
- If no phone, show inline error and link to user edit
- Show operating hours in list view (collapsed/expandable)
- Prevent deletion if site used in orders

**Data Model:**
Reference `docs/data-model.md` → `sites` collection

**Operating Hours Structure:**
```typescript
{
  monday: { open: "06:00", close: "18:00" },
  tuesday: { open: "06:00", close: "18:00" },
  // ...
  sunday: { open: "closed", close: "closed" }
}
```

**Acceptance Criteria:**
- ✅ Sites can be created as collection or destination
- ✅ Operating hours can be set per day
- ✅ Contact person must have phone number
- ✅ Sites in use cannot be deleted
- ✅ Inactive sites don't appear in order dropdowns
- ✅ Operating hours validation prevents invalid times

---

### 2.4 Organizational Groups ✅
**User Flow**: Internal organizational structure for mine companies

**Goal**: Create hierarchical organizational groups with unlimited nesting for better site organization. Only available for mine companies.

**Files Created:**
- `src/components/groups/GroupsTreeManager.tsx` - Tree-based group management UI

**Files Modified:**
- `src/types/index.ts` - Added `Group` interface
- `src/components/companies/CompanyFormModal.tsx` - Added Groups tab (mine companies only)
- `src/components/sites/SiteFormModal.tsx` - Added group assignment dropdown (mine companies only)
- `src/components/layout/AppLayout.tsx` - Navigation filtering based on company type

**Implementation Pattern:**

- **Data Access**: Use `globalData.groups.value` from `data.service.ts` (already loaded, real-time)
- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils
- **No Firebase queries** - all data already in memory via data.service.ts
- **Hierarchical structure**: Using `parentGroupId`, `level`, and `path` fields for unlimited nesting

**UI Requirements:**

**Groups Tab (in Company Edit Modal):**
- Visible only for mine companies when editing
- Tree-based UI with unlimited nesting levels
- Visual hierarchy diagram showing current structure
- Inline add/edit/delete operations
- Features:
  - **Add Main Group** button (creates root-level group)
  - **Add Subgroup** button per group (creates child group)
  - **Edit** inline form per group
  - **Delete** with validation (prevents deletion if has children)
  - Expand/collapse tree nodes
  - Real-time updates via Firebase listeners

**Groups Form Fields:**
- Group name* (string, required)
- Description (optional textarea)

**Hierarchy Diagram:**
- ASCII tree visualization (├─, └─, │)
- Shows group names and descriptions
- Monospace font for alignment
- Displayed above interactive tree view

**Site Assignment:**
- Group dropdown in SiteFormModal
- Shows hierarchical structure with indentation
- Only visible for mine companies
- Optional field (sites can exist without group assignment)

**Data Model:**
```typescript
interface Group extends Timestamped, CompanyScoped {
  id: string
  name: string
  description?: string
  parentGroupId?: string // undefined for root groups
  level: number // 0 for root, increments for each level
  path: string[] // Array of ancestor IDs for querying
  isActive: boolean
}
```

**Validation Rules:**
- Group name required (friendly error: "Please enter a group name")
- Cannot delete group with children (must delete/reassign children first)
- Cannot set `undefined` values in Firestore (omit optional fields if empty)

**Company Type-Based Access Control:**
- **Mine companies**: Full access to Products, Clients, Sites, Groups
- **Transporter companies**: No access to Products, Clients, Sites, Groups
- **Logistics Coordinator companies**: No access to Products, Clients, Sites, Groups
- Navigation items (Products, Clients, Sites) hidden for non-mine companies
- Groups tab only visible for mine companies

**Acceptance Criteria:**
- ✅ Groups can be created with unlimited nesting
- ✅ Groups display in tree structure with expand/collapse
- ✅ Visual hierarchy diagram shows current structure
- ✅ Inline editing works for all groups
- ✅ Cannot delete groups with children
- ✅ Sites can be assigned to groups (mine companies only)
- ✅ Groups tab only visible for mine companies
- ✅ Navigation filtered based on company type
- ✅ Validation messages are user-friendly
- ✅ No Firestore undefined value errors

---

### 2.5 Comprehensive User Management ✅
**User Flow**: Flow 10 - User Management Configuration (expanded)

**Goal**: Complete user administration including company transfers, role management, and permission overrides.

**Files to Modify:**
- `src/app/(authenticated)/admin/users/page.tsx` - Enhanced user listing
- `src/components/users/EditUserModal.tsx` - Complete user editing
- `src/components/users/MoveUserModal.tsx` - Transfer users between companies
- `src/components/users/RoleManager.tsx` - Add/remove user roles
- `src/components/users/PermissionOverrideEditor.tsx` - Granular permission overrides

**Implementation Pattern:**

- **Data Access**: Use `globalData.users.value` and `globalData.roles.value` from `data.service.ts` (already loaded, real-time)
- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils
- **No service file needed** - simple updates to user documents
- **No Firebase queries** - all data already in memory via data.service.ts

**UI Requirements:**

**Enhanced User List Page:**
- Company filter dropdown (global admins only):
  - "All Companies" (show all users across system)
  - Individual company selector (show users for specific company)
  - Default: Current user's company
- Search by name, email, phone
- Table columns:
  - Profile picture (thumbnail)
  - Name
  - Email
  - Company name (visible to global admins)
  - Roles (badges)
  - Active status (toggle)
  - Actions dropdown:
    - Edit User
    - Change Password
    - Change Email
    - Move to Another Company (global admins only)
    - Manage Roles
    - Edit Permissions
    - Deactivate/Reactivate
- Add User button

**Edit User Modal:**
- All basic fields from Phase 1 (name, email, phone, profile picture)
- Company dropdown (global admins only - for moves)
- Active/Inactive toggle
- Save button

**Move User Modal (Global Admins Only):**
- Current company (read-only display)
- New company dropdown (all active companies)
- Confirmation checkbox: "I understand this will remove all current roles and reset permissions for this user"
- Warning message: "Moving a user will:
  - Remove all roles from current company
  - Reset permission overrides
  - Remove from notification lists
  - Clear company-specific settings"
- Move button

**On Move:**
- Update `user.companyId` to new company
- Clear `user.roles` array
- Clear `user.permissionOverrides` object
- Clear `user.notificationPreferences` (will reset to defaults)
- Create audit log entry

**Role Manager Modal:**
- User name and current company (header)
- Available roles section:
  - List of all global roles (from globalData.roles.value)
  - Each role shows:
    - Role name
    - Description
    - Add/Remove button (toggle)
- Current roles section:
  - Chips/badges of assigned roles
  - Remove icon on each chip
- "Quick Assign" presets (optional):
  - Standard combinations like "Basic User", "Manager", "Administrator"
- Save button (updates user.roles array)

**Note:** Roles are global and shared across all companies (no `companyId` field).

**Permission Override Editor:**
- User name and current company (header)
- Permission tree view (by category):

  **Asset Management:**
  - No Access / View Only / Add & Edit / Full Access (dropdown per permission)

  **Order Management:**
  - No Access / View Only / Create Orders / Allocate Orders / Full Access

  **Pre-Booking Management:**
  - No Access / View Only / Create & Edit / Full Access

  **Operational Flow Permissions:**
  - Security In - Enable/Disable (toggle)
  - Security Out - Enable/Disable
  - Weighbridge Tare Weight - Enable/Disable
  - Weighbridge Gross Weight - Enable/Disable

  **Administrative Permissions:**
  - User Management - No Access / View Only / Full Access
  - Product Management - No Access / View Only / Full Access
  - Order Settings - No Access / View Only / Full Access
  - Client Management - No Access / View Only / Full Access
  - Site Management - No Access / View Only / Full Access
  - Notification Infrastructure - No Access / View Only / Full Access
  - System-Wide Settings - No Access / View Only / Full Access
  - Security Alert Configuration - No Access / View Only / Full Access

  **Transporter-Specific:**
  - View Only Assigned Orders - Enable/Disable
  - View Other Transporters' Data - Enable/Disable

- For each permission:
  - Show inherited value from roles (grayed out, non-editable)
  - Dropdown to override: "Use Role Default" | custom value
  - Visual indicator when overridden (e.g., yellow badge)
- Reset to Defaults button (clear all overrides)
- Save button (updates user.permissionOverrides object)

**Data Model:**
Reference `docs/data-model.md` → `users` collection:
- `companyId: string` - Can be updated for company moves
- `roles: string[]` - Array of role IDs
- `permissionOverrides: Record<string, any>` - Custom permissions that override role defaults
- `isActive: boolean` - Can be toggled
- `notificationPreferences: object` - See Phase 2.6

**Acceptance Criteria:**
- ✅ Users can be viewed per specific company
- ✅ Users can be edited (all fields)
- ✅ Global admins can move users between companies
- ✅ User roles can be added and removed
- ✅ Permission overrides can be set per user
- ✅ Moving users clears company-specific data
- ✅ Permission inheritance from roles is visible
- ✅ Overrides are visually distinguished from role defaults
- ✅ All changes are audited

---

### 2.6 Role Management ✅
**User Flow**: Administrative configuration for role-based access control

**Goal**: Create, edit, and manage global roles with permission assignments. Roles are shared across all companies with company-specific visibility control.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/roles/page.tsx`
- `src/components/roles/RoleFormModal.tsx`
- `src/components/roles/PermissionSelector.tsx`
- `src/services/role.service.ts` (optional, or use firebase-utils directly)

**Implementation Pattern:**

- **Data Access**: Use `globalData.roles.value` from `data.service.ts` (already loaded, real-time, **GLOBAL** - not company-scoped)
- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils
- **Search**: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.roles`
- **No service file needed** - simple CRUD operations only
- **No Firebase queries** - all data already in memory via data.service.ts

**Important:**
- Roles are **global** and do NOT have a `companyId` field. They are shared across all companies.
- **Company-Specific Visibility**: Roles have a `hiddenForCompanies` array that tracks which companies have hidden that role.
  - `isActive: false` → Role is globally inactive (hidden from all companies)
  - `hiddenForCompanies: ["c_123"]` → Role is active globally but hidden for company c_123
- When displaying roles for user management, filter out:
  - Roles where `isActive === false`
  - Roles where `hiddenForCompanies.includes(user.companyId)`

**UI Requirements:**

**Role List Page:**
- Search by role name
- Filter: Active/Inactive
- Table columns:
  - Role name
  - Description
  - Number of users assigned
  - Active status (toggle)
  - Actions (Edit, Delete)
- Add Role button

**Create/Edit Role Modal:**
- Role name* (text input)
- Description (textarea)
- Permission selection:
  - **Asset Management:**
    - assets.view (View assets)
    - assets.add (Add assets)
    - assets.edit (Edit assets)
    - assets.delete (Delete assets)

  - **Order Management:**
    - orders.view (View orders)
    - orders.create (Create orders)
    - orders.allocate (Allocate orders)
    - orders.edit (Edit orders)
    - orders.cancel (Cancel orders)

  - **Pre-Booking Management:**
    - prebookings.view (View pre-bookings)
    - prebookings.create (Create pre-bookings)
    - prebookings.edit (Edit pre-bookings)
    - prebookings.cancel (Cancel pre-bookings)

  - **Operational Flow Permissions:**
    - operations.securityIn (Security checkpoint - entry)
    - operations.securityOut (Security checkpoint - exit)
    - operations.weighbridgeTare (Weighbridge tare weight)
    - operations.weighbridgeGross (Weighbridge gross weight)

  - **Administrative Permissions:**
    - admin.users (User management)
    - admin.companies (Company management)
    - admin.roles (Role management)
    - admin.products (Product management)
    - admin.clients (Client management)
    - admin.sites (Site management)
    - admin.weighbridges (Weighbridge management)
    - admin.notifications (Notification templates)
    - admin.systemSettings (System-wide settings)
    - admin.securityAlerts (Security alert configuration)

  - **Transporter-Specific:**
    - transporter.viewOnlyAssigned (View only assigned orders)
    - transporter.viewOtherTransporters (View other transporters' data)
- Permissions displayed as checkboxes grouped by category
- Select All / Deselect All per category
- isActive (checkbox)
- Save button

**Delete Role Flow:**
- Check if role is assigned to any users:
  - Query `users` collection where `roleId` = role.id
- If users exist:
  - Show error: "Cannot delete role - {count} user(s) are assigned to this role"
  - Option: "Reassign Users" button (opens reassignment modal)
- If no users:
  - Show confirmation dialog: "Are you sure you want to delete this role?"
  - On confirm: Hard delete from Firestore
  - Log deletion in audit_logs
  - Show success toast: "Role deleted successfully"

**Reassign Users Modal (Optional Enhancement):**
- Display: "This role is assigned to {count} user(s)"
- New role dropdown (all active roles except current)
- "Reassign All" button
- On confirm:
  - Update all users' `roleId` to new role
  - Delete old role
  - Show success: "{count} user(s) reassigned and role deleted"

**Default Roles (Seed Script):**
Create 9 default global roles (once, not per company):
1. **Newton Administrator** - Full system access
2. **Site Administrator** - Site-level management and operations
3. **Logistics Coordinator** - Order and pre-booking management
4. **Allocation Officer** - Order allocation and distribution
5. **Transporter** - View assigned orders and assets only
6. **Induction Officer** - Asset induction and management
7. **Weighbridge Supervisor** - Weighbridge operations and calibration
8. **Weighbridge Operator** - Weight capture operations only
9. **Security Personnel** - Security checkpoint operations

**Data Model:**
Reference `docs/data-model.md` → `roles` collection:
- **Note:** Roles are GLOBAL - no `companyId` field
- `name: string` - Role display name
- `description: string` - Role description
- `permissionKeys: string[]` - Array of permission keys
- `isActive: boolean` - Active status

**Permission Keys Structure:**
Stored in `settings/permissions` document (global):
```typescript
{
  "assets.view": { label: "View Assets", category: "Asset Management" },
  "assets.add": { label: "Add Assets", category: "Asset Management" },
  "orders.create": { label: "Create Orders", category: "Order Management" },
  // ... all permission keys
}
```

**Acceptance Criteria:**
- ✅ Roles can be created with name, description, and permissions
- ✅ Roles can be edited (all fields)
- ✅ Roles can be deleted only if no users assigned
- ✅ Permission selector grouped by category
- ✅ Default roles created in seed script
- ✅ Role data reactive via globalData.roles.value
- ✅ Active/inactive toggle works
- ✅ Search and filters work
- ✅ Usage validation prevents deletion of assigned roles
- ✅ All changes audited

---

### 2.7 Notification Templates ✅
**User Flow**: Flow 15 - Notification System Infrastructure

**Goal**: Configure email templates for all system notifications.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/notifications/page.tsx`
- `src/components/notifications/TemplateEditor.tsx`
- `src/components/notifications/TemplatePreview.tsx`
- `src/components/notifications/TemplateCategoryTabs.tsx`
- `src/lib/template-placeholders.ts` (helper functions)

**Implementation Pattern:**

- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils
- **Search**: Use existing `useOptimizedSearch` hook with search config
- **No service file needed** - simple CRUD operations only
- **Helper functions** in `template-placeholders.ts`:
  - `parsePlaceholders(template: string, data: Record<string, any>)` - Replace {{placeholders}}
  - `sendTestEmail(templateId: string, userEmail: string)` - Send test email

**Template Categories (per data-model.md):**
- **Asset**: asset.added, asset.inactive, asset.edited, asset.deleted
- **Order**: order.created, order.allocated, order.cancelled, order.completed, order.expiring
- **Weighbridge**: weighbridge.overload, weighbridge.underweight, weighbridge.violations, weighbridge.manualOverride
- **Security**: security.invalidLicense, security.unbookedArrival, security.noActiveOrder, security.sealMismatch, security.incorrectSealsNo, security.unregisteredAsset, security.inactiveEntity, security.incompleteTruck
- **Pre-Booking**: preBooking.created, preBooking.lateArrival
- **Driver**: driver.licenseExpiring7, driver.licenseExpiring30

**UI Requirements:**
- Category tabs (Asset, Order, Weighbridge, Security, PreBooking, Driver)
- List of templates per category
- Editor modal with fields:
  - Template name* (string, read-only for system templates)
  - Email subject* (string with placeholder support)
  - Email body* (rich text editor with placeholder support)
  - Available placeholders (sidebar):
    - {{userName}}, {{companyName}}, {{date}}, {{time}}
    - {{type}}, {{registrationNumber}}, {{fleetNumber}}
    - {{orderNumber}}, {{productName}}, {{weight}}
    - {{reason}} (for deletions/inactivations)
    - {{daysUntilExpiry}}, {{expiryDate}}
    - {{sealNumbers}}, {{weighbridgeName}}
  - Logo upload (company logo for emails)
  - Preview pane (live rendering with sample data)
- "Send Test Email" button (uses user's email)
- Reset to default button (for system templates)

**Seed Requirements:**
Create default templates for all notification types in seed script

**Data Model:**
Reference `docs/data-model.md` → `notification_templates` collection

**Acceptance Criteria:**
- ✅ All notification types have default templates
- ✅ Templates can be edited with placeholders
- ✅ Preview shows rendered HTML
- ✅ Test emails send successfully
- ✅ Placeholders correctly replaced
- ✅ Company logo appears in emails
- ✅ Templates persist per company

---

### 2.8 User Notification Preferences ✅
**User Flow**: Flow 10 - User Management Configuration (Notification Settings)

**Goal**: Allow users to opt-in/opt-out of notification types.

**Files to Modify:**
- `src/app/(authenticated)/admin/users/page.tsx` (add Notifications tab/modal)
- `src/components/users/NotificationPreferencesEditor.tsx` (new component)
- Update `src/components/users/AddUserModal.tsx` to include default preferences

**Implementation Pattern:**

- **Data Access**: Use `globalData.users.value` from `data.service.ts` (already loaded, real-time)
- **CRUD Operations**: Use `updateDocument()` from firebase-utils to update `notificationPreferences` field
- **No service file needed** - simple field update on user document
- **Helper function**: `getDefaultNotificationPreferences()` in lib for default preferences on user creation

**UI Requirements:**
- Notification Preferences modal/section in user edit
- Grouped checkboxes by category:

  **Asset Notifications:**
  - ☑ Asset Added
  - ☐ Asset Made Inactive
  - ☑ Asset Edited
  - ☑ Asset Deleted

  **Order Notifications:**
  - ☑ Order Created
  - ☑ Order Allocated (always sent if directly allocated)
  - ☐ Order Cancelled
  - ☑ Order Completed
  - ☑ Order Expiring Soon

  **Weighbridge Notifications:**
  - ☑ Overload Detected
  - ☑ Underweight Detected
  - ☑ Weight Limit Violations
  - ☑ Manual Weight Override Used

  **Pre-Booking & Scheduling:**
  - ☑ Pre-Booking Created
  - ☑ Pre-Booking Late Arrival (24+ hours)

  **Security & Compliance:**
  - ☑ Invalid/Expired License
  - ☑ Unbooked Truck Arrival
  - ☑ Truck Arrival No Active Order
  - ☑ Incorrect Seals
  - ☑ Seal Number Mismatch
  - ☑ Unregistered Asset Attempting Entry
  - ☑ Inactive Entity Attempted Entry
  - ☑ Truck Left Without Completing Process

  **Asset & Driver Alerts:**
  - ☑ Driver License Expiring (7 days)
  - ☑ Driver License Expiring (30 days)

  **Preferred Email:**
  - Email address field (defaults to user email)

- "Select All" / "Deselect All" per category
- Note: "Users always receive notifications when orders are allocated directly to them"

**Data Model:**
Reference `docs/data-model.md` → `users.notificationPreferences`

**Acceptance Criteria:**
- ✅ All notification types can be toggled
- ✅ Preferences persist in user document
- ✅ Default preferences set on user creation
- ✅ Preferred email can be different from login email
- ✅ Direct order allocations always send regardless of setting

---

### 2.9 System-Wide Settings ✅
**User Flow**: Flow 16 - System-Wide Settings Configuration

**Goal**: Configure global UI/feature toggles that affect all users.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/settings/page.tsx`
- `src/components/settings/SystemSettingsForm.tsx`

**Implementation Pattern:**

- **Data Access**: Use `globalData.companies.value` from `data.service.ts` (already loaded, real-time)
- **CRUD Operations**: Use `updateDocument()` from firebase-utils to update `systemSettings` field on company document
- **No service file needed** - simple field update on company document

**UI Requirements:**
- Single-page form with sections:

  **Fleet Management:**
  - ☑ Enable Fleet Number field (checkbox)
  - Fleet Number Label (text input, default: "Fleet No.")

  **Transporter Groups:**
  - ☑ Enable Transporter Group field (checkbox)
  - Transporter Group Label (text input, default: "Group")
  - Group Options (tag input, comma-separated)
    - Example: North, South, East, West

  **UI Simplification:**
  - ☐ Hide advanced features (checkbox)
  - ☐ Simplified dashboard (checkbox)

  **Role-Specific Views:**
  - Dashboard widgets per role (drag-and-drop configurator - future enhancement)

- Save button (updates company.systemSettings)
- Preview mode toggle to show/hide fields based on settings

**Data Model:**
Reference `docs/data-model.md` → `companies.systemSettings`

**Acceptance Criteria:**
- ✅ Settings can be updated and saved
- ✅ Fleet number field shows/hides based on setting
- ✅ Custom labels appear in asset forms
- ✅ Group options populate dropdowns
- ✅ Settings persist per company
- ✅ Changes reflect immediately in UI (reactive)

**Note:** System-wide settings (Fleet Management and Transporter Groups) were implemented in Phase 1 as part of Company Management (CompanyFormModal.tsx - Fleet tab).

---

## Phase 3: Asset Management 🔄 IMPLEMENTED - PENDING USER TESTING

### Status: Implementation Complete - Awaiting Testing & Validation

All core asset management features have been implemented, including comprehensive permission enforcement for all action buttons. The system is ready for comprehensive user testing before marking as production-ready.

### Overview
Complete asset induction, management, and deletion flows using wizard-based approach with expo-sadl integration for driver license parsing. All pages enforce granular asset permissions (view, add, edit, delete).

#### Important: Android App Schema Compatibility

The Asset data model uses field names that match the Android app's data structure for seamless data sharing:

- Use `type` field (NOT `assetType`) - values: "truck" | "trailer" | "driver"
- Seed data in `data/assets-data.json` comes directly from the Android app
- Field mappings: `registration`, `licenceNumber` → `licenseNumber`, `img` (base64 driver photos)
- All expo-sadl fields are captured including: vehicleDescription, driverNationality, driverCountryOfBirth, driverSecurityCode, driverCitizenshipStatus

#### Validation Rules (Enforced)

**QR Code (ntCode) Validation:**
- Must start with "NT" prefix (South African NaTIS standard)
- Must be unique across all assets (no duplicates allowed)
- Source: `/Users/joe/iDev/hybrid_appz/NewtonWeighbridges/src/services/scan.service.ts:281`

**Vehicle Validation:**
- `registration` must be unique (no duplicate registration numbers)
- `vin` must be unique (no duplicate VINs)

**Driver Validation:**
- `idNumber` must be unique (no duplicate ID numbers)

**Implementation Pattern:**

- **Data Access**: Use `globalData.assets.value` from `data.service.ts` (already loaded, real-time, company-scoped)
- **Validation Methods** (in `AssetService`):
  - `AssetService.validateNTCode(ntCode: string, excludeId?: string)` - **Synchronous** NT prefix + in-memory uniqueness check
  - `AssetService.validateRegistration(registration: string, excludeId?: string)` - **Synchronous** in-memory uniqueness check
  - `AssetService.validateVIN(vin: string, excludeId?: string)` - **Synchronous** in-memory uniqueness check
  - `AssetService.validateIDNumber(idNumber: string, excludeId?: string)` - **Synchronous** in-memory uniqueness check
- **No companyId parameter needed** - data already filtered by company in `globalData.assets.value`
- **No Firebase queries** - all validation done against in-memory data for performance
- **Returns**: `{ isValid: boolean, error?: string }`
- **Error Handling**:
  - **Validation errors** (user input issues) use `alert.showError()` from `useAlert()` hook - prominent full-screen dialog
  - **Operational errors** (backend/network failures) use `toast.error()` - less intrusive notification
  - All wizard steps use alert dialogs for validation to ensure users never miss critical errors

#### Permission Enforcement (✅ COMPLETE)

All asset management pages enforce granular permission checks to ensure users only see action buttons they have permissions for.

**Implemented Files:**

- `src/app/(authenticated)/assets/page.tsx` - Asset list with permission checks
- `src/app/(authenticated)/assets/[id]/page.tsx` - Asset details with permission checks

**Permission Hooks Used:**

- `usePermission(PERMISSIONS.ASSETS_VIEW)` - View assets
- `usePermission(PERMISSIONS.ASSETS_ADD)` - Add/induct new assets
- `usePermission(PERMISSIONS.ASSETS_EDIT)` - Edit, mark inactive, reactivate
- `usePermission(PERMISSIONS.ASSETS_DELETE)` - Delete assets

**Action Button Visibility:**

- **"Induct Asset" button**: Only visible with `assets.add` permission
- **"Edit" button**: Only visible with `assets.edit` permission
- **"Edit Fleet/Group" button**: Only visible with `assets.edit` permission
- **"Mark Inactive" button**: Only visible with `assets.edit` permission
- **"Reactivate" button**: Only visible with `assets.edit` permission
- **"Delete" button**: Only visible with `assets.delete` permission
- **"View" button**: Always visible (anyone with page access can view details)

**Result**: Users with view-only permissions only see the view/details button. Edit and delete actions are completely hidden for unauthorized users.

---

### 3.1 Asset Type Configuration ✅
**Supporting Infrastructure**

**Goal**: Configure asset types that determine which fields appear in wizard.

**Implemented Files:**
- `src/types/asset-types.ts` - TypeScript definitions for ParsedAssetData, VehicleData, DriverData
- `src/lib/asset-field-mappings.ts` - expo-sadl field mappings and utilities

**Asset Types (from data/assets-data.json):**
- **Truck**: registration, engineNo, make, model, colour, licenceDiskNo, firstQRCode, secondQRCode, expiryDate, vin
- **Trailer**: registration, make, model, colour, licenceDiskNo, firstQRCode, secondQRCode, expiryDate
- **Driver**: licenceNumber, idNumber, name, surname, initials, gender, birthDate, expiryDate, issueDate, driverRestrictions, ntCode, licenceType, img (base64 photo)

**expo-sadl Field Mappings:**
Per South African driver's license standard:
- `DecodedLicenseInfo` from expo-sadl provides: idNumber, name, surname, initials, gender, birthDate, licenceNumber, expiryDate, img (base64), and more
- Vehicle disk parsing not yet implemented (placeholder for future)

**Implemented Methods:**
- `AssetFieldMapper.toAssetDocument(parsedData, companyId, additionalFields)` - Convert parsed data to Asset document with **ALL barcode fields saved as top-level properties**
- `AssetFieldMapper.getExpiryInfo(expiryDate)` - Returns expiry status, color, days until expiry
- `AssetFieldMapper.formatExpiryDate(timestamp)` - Format dates from expo-sadl

**Barcode Field Saving (✅ COMPLETE - Matches Android App):**
- **Vehicle fields saved**: registration, make, model, vin, colour, engineNo, licenceDiskNo, vehicleDescription, description, dateOfExpiry
- **Driver fields saved**: idNumber, name, surname, initials, birthDate, gender, licenceNumber, licenceType, issueDate, expiryDate, vehicleCodes
- **All fields** extracted from barcode scans are now saved as top-level document properties for consistent display across the app
- Fixes "undefined undefined" display issues caused by missing fields

**Acceptance Criteria:**
- ✅ expo-sadl successfully decodes driver licenses
- ✅ All driver fields mapped to Asset type
- ✅ **All vehicle fields saved** (make, model, vin, colour, engineNo, licenceDiskNo, etc.)
- ✅ **All driver fields saved** (name, surname, birthDate, licenceType, issueDate, etc.)
- ✅ Expiry validation with color-coded statuses (green/yellow/orange/red)
- ✅ Base64 driver photos stored in img field

---

### 3.2 Asset Induction Wizard ✅

**User Flow**: Flow 2 - Complete Asset Induction Process

**Goal**: Multi-step wizard to induct new assets with QR/barcode scanning and validation.

**Implemented Files:**
- `src/app/(authenticated)/assets/induct/page.tsx` - Main induction page
- `src/components/assets/InductionWizard.tsx` - Wizard container with step navigation
- `src/components/assets/wizard-steps/Step1CompanySelect.tsx` - Company selection
- `src/components/assets/wizard-steps/Step2QRScan.tsx` - First QR scan with NT validation
- `src/components/assets/wizard-steps/Step3QRVerification.tsx` - Second QR scan verification
- `src/components/assets/wizard-steps/Step4LicenseScan.tsx` - License/disk barcode scan
- `src/components/assets/wizard-steps/Step5LicenseVerification.tsx` - Second scan verification
- `src/components/assets/wizard-steps/Step6AssetTypeDetection.tsx` - Auto-detect type
- `src/components/assets/wizard-steps/Step7FieldConfirmation.tsx` - Edit extracted fields
- `src/components/assets/wizard-steps/Step8OptionalFields.tsx` - Fleet number & group
- `src/components/assets/wizard-steps/Step9Review.tsx` - Final review & submit
- `src/services/asset.service.ts` - Asset CRUD operations + validation methods
- Assets added to `src/services/data.service.ts` (real-time reactive state)

**Implementation Notes:**
- Desktop scanner integration (text input fields with auto-focus and Enter key support)
- No camera components (web app uses desktop scanners)
- QR validation enforces NT prefix requirement
- Two-scan verification pattern for both QR and license

**Wizard Steps (per Flow 2):**

**Step 1: Company Selection**
- Dropdown: Select company (companyType = transporter OR logistics_coordinator with isAlsoTransporter = true)
- Only companies that are transporters or logistics coordinators marked as transporters are shown
- Next button

**Step 2: QR Code Scan (First)**
- Text input field with auto-focus (for desktop scanner)
- Scan QR code (firstQRCode)
- Validation: Check not already in system
- If duplicate: Error + return to start
- Retry button
- Next button (or press Enter)

**Step 3: QR Code Verification (Second)**
- Text input field with auto-focus (for desktop scanner)
- Scan QR code again (secondQRCode)
- Validation: Must match firstQRCode
- If mismatch: Error + return to Step 2
- Next button (or press Enter)

**Step 4: License/Disk Scan (First)**
- Text input field with auto-focus (for desktop scanner)
- Scan license disc barcode (vehicle) OR driver license barcode
- Auto-parse via AssetFieldMapper wrapper around scan.service.ts
- Display extracted fields
- Next button (or press Enter)

**Step 5: License/Disk Verification (Second)**
- Text input field with auto-focus (for desktop scanner)
- Scan same barcode again
- Validation: Must match first scan data
- If mismatch: Error + return to Step 4
- Next button (or press Enter)

**Step 6: Asset Type Detection**
- Automatically identify type:
  - If `VehicleInformation` → Truck or Trailer (user selects)
  - If `PersonInformation` → Driver (auto-selected, no choice)
- Display detected type with icon
- User confirms or overrides (vehicles only)
- Next button

**Step 7: Field Confirmation & Validation**
- Display all auto-extracted fields in editable form
- Editable fields (pre-filled from barcode data)
- Expiry date validation:
  - If expired: Red banner "EXPIRED - Process Blocked" + error message
  - Block next button completely (per Flow 2: "If Invalid (Expired): Process Blocked")
  - Send notification to users with "security.invalidLicense" enabled
  - "Return to Start" button provided
- If valid but <30 days: Yellow warning banner (allows continue)
- If valid but <7 days: Orange warning banner (allows continue)
- Next button (disabled if expired)

**Step 8: Optional Fields (Trucks Only)**
- **IMPORTANT**: This step only shows for **trucks**. Trailers and drivers skip this step automatically.
- Fleet Number (text input) - only if `systemSettings.fleetNumberEnabled` AND asset type is "truck"
- Group (dropdown from active groups) - only if `systemSettings.transporterGroupEnabled` AND asset type is "truck"
- Skip button / Next button
- Auto-skips if:
  - Asset type is trailer or driver (these fields don't apply)
  - Both fields disabled in company settings

**Step 9: Review & Submit**
- Summary cards showing:
  - Company
  - Asset type (with icon)
  - QR code
  - All extracted fields (ID/License/Registration/Make/Model/etc)
  - Expiry date with color-coded badge
  - Optional fields (Fleet Number, Group)
- Edit button on each section (returns to relevant step)
- Submit button (creates asset and sends notifications)

**On Successful Submit:**
- Call `AssetService.create(assetData)` - Saves ALL barcode fields as top-level properties
- Send notification to users with "asset.added" enabled
- **Show success alert dialog** with asset type and identifier (requires user acknowledgment before closing wizard)
- Success message format: "{AssetType} ({Identifier}) has been successfully inducted and added to the system."
- After user clicks "OK", wizard closes and returns to asset listing

**Implemented Methods:**
- `AssetService.create(parsedData, companyId, additionalFields)` - Create asset
- `AssetService.validateNTCode(ntCode, excludeId?)` - Check NT prefix + uniqueness
- `AssetService.checkExpiry(expiryDate)` - Validate expiry with status
- `AssetService.sendExpiryNotifications(asset, daysUntilExpiry)` - Trigger notifications (placeholder)

**Data Model:**
Reference `docs/data-model.md` → `assets` collection

**Acceptance Criteria:**
- ✅ Wizard navigates through all 9 steps
- ✅ QR code scanned twice and verified (text input with desktop scanner)
- ✅ QR code validated with NT prefix requirement
- ✅ License/disk scanned twice and verified (text input with desktop scanner)
- ✅ Asset type auto-detected correctly (driver via expo-sadl, vehicle manual selection)
- ✅ Expired licenses block save completely (disabled Next button, alert dialog shown)
- ✅ Valid licenses allow save with color-coded warnings (<7 days orange, <30 days yellow, >30 days green)
- ✅ **Fleet number/group fields ONLY for trucks** (trailers and drivers skip Step 8)
- ✅ Fleet number/group fields conditional on company settings (auto-skip if both disabled)
- ✅ **Validation errors use alert dialogs** (not toast notifications - impossible to miss)
- ✅ **ALL barcode fields saved** (make, model, vin, colour for vehicles; name, surname, birthDate for drivers)
- ✅ **Success alert dialog shown** on completion (requires user acknowledgment before closing)
- 🔄 Notifications implementation pending (Phase 2.6)
- ✅ Duplicate QR codes prevented (NT code validation in Step 2, alert dialog shown)

---

### 3.3 Asset Listing & Search ✅

**User Flow**: Implicit (view existing assets)

**Goal**: Display all assets with search, filter, and expiry warnings.

**Implemented Files:**
- `src/app/(authenticated)/assets/page.tsx` - Asset listing page with inline search/filters
- Assets integrated with `src/services/data.service.ts` (real-time reactive state)

**Implemented Methods:**
- `AssetService.getByCompany(companyId)` - All assets
- `AssetService.getByType(companyId, type)` - Filter by type
- `AssetService.getExpiringAssets(companyId, daysThreshold)` - Assets expiring soon
- `AssetService.getExpiredAssets(companyId)` - Expired assets

**Implemented Features:**
- Search bar (filters registration, license number, ntCode, fleet number, name, surname)
- Filters:
  - Asset type (All, Truck, Trailer, Driver)
  - Status (All, Active, Inactive, Expired)
- Dynamic asset icons:
  - Drivers: Photo avatar (if img exists) or User icon
  - Trucks: 🚚 emoji
  - Trailers: 🚛 emoji
- Asset cards showing:
  - Icon/avatar
  - Registration (vehicles) or Name + License (drivers)
  - Fleet number badge
  - Status badges (Active/Inactive)
  - Type label
  - Newton QR code (ntCode)
  - Expiry date with color-coded badge
- Expiry badge colors:
  - Green: >30 days
  - Yellow: 7-30 days
  - Orange: <7 days
  - Red: Expired
- Click "View" button navigates to asset details page

**Acceptance Criteria:**
- ✅ Assets listed with all relevant fields
- ✅ Search works across registration, license, QR, fleet number, driver names
- ✅ Filters work correctly (type, status, expiry)
- ✅ Expiry badges show correct color (green/yellow/orange/red)
- ✅ Active/inactive filtering works
- ✅ Driver photos displayed as avatars
- ✅ Click view button navigates to asset details page

---

### 3.4 Asset Details & Edit ✅

**User Flow**: Implicit (view/edit existing asset)

**Goal**: View full asset details and edit QR codes or barcode data (license/disk renewal).

**Implemented Files:**
- `src/app/(authenticated)/assets/[id]/page.tsx` - Comprehensive asset details page
- `src/components/assets/AssetEditModal.tsx` - QR code and barcode update modal with success alerts

**Implemented Methods:**
- `AssetService.getById(id)` - Fetch single asset
- `AssetService.update(id, data)` - Update asset (saves ALL barcode fields when updating)
- `AssetService.reactivate(id)` - Reactivate inactive assets

**Implemented Features:**
- **Asset Header:**
  - Asset type with large icon/emoji
  - Status badges (Active/Inactive/Expired)
  - Action buttons (Edit, Inactivate, Delete)

- **Basic Information Card:**
  - Newton QR Code (ntCode)
  - Company name
  - Fleet number (if assigned)
  - Group (if assigned)
  - Created/updated timestamps

- **Vehicle Details Card** (for trucks/trailers):
  - Registration number
  - Make & Model
  - Vehicle Type (vehicleDescription)
  - Description
  - Colour
  - License Disk Number
  - Expiry Date with color-coded badge
  - Engine Number
  - VIN

- **Driver Personal Information Card** (for drivers):
  - Driver photo (if available)
  - ID Number
  - Full Name (initials/name + surname)
  - Gender, Date of Birth, Age
  - Country, Place Issued, ID Type

- **Driver License Information Card** (for drivers):
  - License Number, Type
  - Expiry Date with color-coded badge
  - Issue Date, License Issue Number
  - Vehicle Codes, Vehicle Class Codes
  - PrDP Code, Category, Valid Until
  - Endorsement
  - Driver/Vehicle/General Restrictions
  - Status badge (Expired/Valid)

**Asset Edit Modal Features:**
- **Two update options:**
  1. **Update QR Code**: For damaged/replaced Newton QR codes
     - Verify existing barcode (match asset)
     - Scan new QR code
     - Success alert: "QR code for {identifier} has been successfully updated."

  2. **Update Barcode**: For renewed licenses/disks
     - Verify existing QR code (match asset)
     - Scan new barcode (license/disk)
     - Validate: Registration/ID must match existing asset
     - Prevent expired license/disk updates (shows error, blocks save)
     - Allow older expiry dates with confirmation (user can override)
     - **Saves ALL barcode fields** (make, model, vin, colour, engineNo, licenceDiskNo, vehicleDescription, description for vehicles)
     - Success alert: "{UpdateType} for {identifier} has been successfully updated with the new barcode data."

- All updates require user acknowledgment via success alert dialog before closing modal

**Acceptance Criteria:**
- ✅ Asset details display correctly based on asset type (truck/trailer/driver)
- ✅ All vehicle fields shown for trucks/trailers (make, model, vin, colour, etc.)
- ✅ All driver personal info and license details shown for drivers
- ✅ Driver photos displayed in personal information section
- ✅ Expiry dates shown with color-coded badges
- ✅ Action buttons for edit, inactivate, delete
- ✅ **Asset edit modal complete** with QR and barcode update options
- ✅ **ALL barcode fields saved** when updating vehicle/driver data
- ✅ **Success alerts shown** for QR code updates and barcode updates
- ✅ Expired licenses/disks blocked from being saved (validation with error alert)
- ✅ Older expiry dates allowed with user confirmation
- 🔄 Notification triggers pending (Phase 2.6)

---

### 3.5 Asset Deletion & Inactivation ✅

**User Flow**: Flow 3 - Asset Deletion (Induction Error Correction)

**Goal**: Delete assets with no transactions, or inactivate if transactions exist.

**Implemented Files:**
- `src/components/assets/DeleteAssetModal.tsx` - Deletion with transaction checks (NO QR verification)
- `src/components/assets/InactivateAssetModal.tsx` - Asset inactivation with reason

**Implemented Methods:**
- `AssetService.checkHasTransactions(assetId)` - Returns `{ hasTransactions: boolean, count: number }`
- `AssetService.delete(id, reason)` - Hard delete (only if no transactions)
- `AssetService.inactivate(id, reason)` - Soft delete (set isActive = false)
- `AssetService.reactivate(id)` - Reactivate inactive assets

**UI Requirements:**

**Delete Flow (Simplified - NO QR Verification):**
- User clicks "Delete" on asset
- Modal opens → **Immediately checks for transactions** (automatic):
  - Query `weighing_records` where `assetId` = id
  - Query `security_checks` where `assetId`, `driverId`, `trailer1Id`, or `trailer2Id` = id
- Shows loading state: "Checking if this asset is in use..."

  **If No Transactions:**
  - Show green success banner: "No Transactions Found - This asset can be safely deleted"
  - Show reason input modal:
    - "Why are you deleting this asset?" (textarea, required)
    - Delete button (red, destructive)
  - On confirm:
    - Hard delete from Firestore
    - Log deletion in audit_logs with reason
    - Send notification to users with "asset.deleted" enabled
    - Show success toast: "Asset deleted successfully"
    - Redirect to asset list

  **If Transactions Exist:**
  - Show red error banner: "Cannot Delete Asset"
  - Message: "This asset has {count} transaction(s) and cannot be deleted."
  - Explanation: "Instead of deleting, you can mark this asset as inactive. This will hide it from operational dropdowns while preserving all transaction history."
  - **NO delete button shown** (deletion completely blocked)
  - Available buttons:
    - "Cancel" button (closes modal)
    - "Mark as Inactive Instead" button (closes delete modal and opens inactivate modal)
  - If user clicks "Mark as Inactive":
    - Close delete modal
    - Open inactivate modal (see below)

**Inactivate Flow:**
- Show reason input modal:
  - "Why are you marking this asset inactive?" (textarea, required)
  - Examples: "License expired", "Vehicle sold", "Driver resigned"
  - Inactivate button (yellow, warning)
- On confirm:
  - Update Firestore: `isActive = false`, `inactiveReason = reason`, `inactiveDate = now()`
  - Send notification to users with "asset.inactive" enabled
  - Show success toast: "Asset marked as inactive"
  - Redirect to asset list

**Data Model:**
Reference `docs/data-model.md` → `assets` collection fields: `isActive`, `inactiveReason`, `inactiveDate`, `deletedReason`

**Acceptance Criteria:**
- ✅ **NO QR scan required** (simplified UX - automatic transaction check)
- ✅ Transaction check prevents deletion (queries weighing_records and security_checks)
- ✅ **Assets with transactions CANNOT be deleted** (delete button not shown)
- ✅ Hard delete only if no transactions
- ✅ Inactivation available as alternative (seamless modal switch)
- ✅ Reason required for both actions (textarea input, alert dialog for validation)
- ✅ Validation errors use alert dialogs (not toast notifications)
- 🔄 Notifications pending (Phase 2.6)
- ✅ Deletion reason stored before hard delete (deletedReason field)
- ✅ Inactivation stores reason, date, and sets isActive = false
- ✅ Reactivate button available on inactive asset details page
- ✅ Inactive assets filtered from main listing (unless "inactive" status filter selected)

---

## Permission Enforcement Guidelines for Future Phases

### Overview

**MANDATORY**: All list pages, detail pages, and action buttons in future phases MUST implement permission checks to ensure users only see actions they are authorized to perform. This section provides templates and patterns to follow for consistent permission enforcement across all upcoming features.

### Permission Patterns

#### Pattern 1: Admin Pages (Dual Permission)

Use for admin/configuration pages where users can have either view-only or full management permissions.

```typescript
import { useViewPermission } from "@/hooks/useViewPermission"
import { PERMISSIONS } from "@/lib/permissions"

const { canView, canManage, isViewOnly, loading: permissionLoading } = useViewPermission(
  PERMISSIONS.MODULE_VIEW,  // View-only permission
  PERMISSIONS.MODULE        // Full management permission
)

// Action buttons
{canManage ? (
  <>
    <Button onClick={handleToggle}>
      <ToggleRight />
    </Button>
    <Button onClick={handleEdit}>
      <Edit />
    </Button>
    <Button onClick={handleDelete}>
      <Trash2 />
    </Button>
  </>
) : isViewOnly ? (
  <Button onClick={handleView}>
    <FileText />
  </Button>
) : null}
```

#### Pattern 2: Operational Pages (Granular Permissions)

Use for operational pages where actions are more granular (view, add, edit, delete).

```typescript
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"

const { hasPermission: canView } = usePermission(PERMISSIONS.MODULE_VIEW)
const { hasPermission: canAdd } = usePermission(PERMISSIONS.MODULE_ADD)
const { hasPermission: canEdit } = usePermission(PERMISSIONS.MODULE_EDIT)
const { hasPermission: canDelete } = usePermission(PERMISSIONS.MODULE_DELETE)

// Add button
{canAdd && (
  <Button onClick={handleAdd}>
    <Plus /> Add
  </Button>
)}

// Edit button
{canEdit && (
  <Button onClick={handleEdit}>
    <Edit /> Edit
  </Button>
)}

// Delete button
{canDelete && (
  <Button onClick={handleDelete}>
    <Trash2 /> Delete
  </Button>
)}

// View button (always shown)
<Button onClick={handleView}>
  <FileText /> View
</Button>
```

### Phase 4: Order Management - Permission Requirements

When implementing Order Management, the following permission checks MUST be implemented:

**Required Permissions:**

- `orders.view` - View order list and details
- `orders.add` - Create new orders
- `orders.edit` - Edit existing orders, update status
- `orders.delete` - Delete orders (with transaction check)
- `orders.allocate` - Allocate assets to orders

**Files to Implement:**

1. **Order List Page** (`src/app/(authenticated)/orders/page.tsx`)
   - Use Pattern 2 (Granular Permissions)
   - "Create Order" button: Requires `orders.add`
   - "Edit" button: Requires `orders.edit`
   - "Delete" button: Requires `orders.delete`
   - "View" button: Always visible
   - "Allocate Assets" button: Requires `orders.allocate`

2. **Order Details Page** (`src/app/(authenticated)/orders/[id]/page.tsx`)
   - "Edit" button: Requires `orders.edit`
   - "Update Status" button: Requires `orders.edit`
   - "Allocate Assets" button: Requires `orders.allocate`
   - "Delete" button: Requires `orders.delete`

3. **Order Creation Wizard** (`src/components/orders/OrderCreationWizard.tsx`)
   - Entire wizard: Requires `orders.add`
   - Redirect if permission missing

### Phase 5: Pre-Booking System - Permission Requirements

**Required Permissions:**

- `prebooking.view` - View pre-booking list and details
- `prebooking.add` - Create new pre-bookings
- `prebooking.edit` - Edit existing pre-bookings
- `prebooking.delete` - Delete pre-bookings
- `prebooking.approve` - Approve/reject pre-booking requests

**Files to Implement:**

1. **Pre-Booking List Page**
   - "Create Pre-Booking" button: Requires `prebooking.add`
   - "Edit" button: Requires `prebooking.edit`
   - "Approve/Reject" buttons: Requires `prebooking.approve`
   - "Delete" button: Requires `prebooking.delete`
   - "View" button: Always visible

2. **Pre-Booking Details Page**
   - "Edit" button: Requires `prebooking.edit`
   - "Approve" button: Requires `prebooking.approve`
   - "Reject" button: Requires `prebooking.approve`
   - "Delete" button: Requires `prebooking.delete`

### Phase 6: Weighbridge Operations - Permission Requirements

**Required Permissions:**

- `weighbridge.view` - View weighbridge records
- `weighbridge.tare` - Capture tare weight
- `weighbridge.gross` - Capture gross weight
- `weighbridge.edit` - Edit weighbridge records
- `weighbridge.void` - Void transactions
- `weighbridge.override` - Override validation rules

**Files to Implement:**

1. **Weighbridge List Page**
   - "Start Tare" button: Requires `weighbridge.tare`
   - "Edit" button: Requires `weighbridge.edit`
   - "Void" button: Requires `weighbridge.void`
   - "View" button: Always visible

2. **Weighbridge Operation Page**
   - Tare weight capture: Requires `weighbridge.tare`
   - Gross weight capture: Requires `weighbridge.gross`
   - Override validations: Requires `weighbridge.override`

### Phase 7: Security Checkpoints - Permission Requirements

**Required Permissions:**

- `security.view` - View security check records
- `security.checkin` - Process entry checks
- `security.checkout` - Process exit checks
- `security.override` - Override validation rules

**Files to Implement:**

1. **Security Dashboard**
   - "Check In" button: Requires `security.checkin`
   - "Check Out" button: Requires `security.checkout`
   - Override options: Requires `security.override`
   - "View" button: Always visible

2. **Security Check Details Page**
   - "Override" button: Requires `security.override`

### Phase 8: Reporting - Permission Requirements

**Required Permissions:**

- `reports.view` - View existing reports
- `reports.generate` - Generate new reports
- `reports.export` - Export reports to PDF/Excel
- `reports.schedule` - Schedule automated reports

**Files to Implement:**

1. **Reports Dashboard**
   - "Generate Report" button: Requires `reports.generate`
   - "Export" button: Requires `reports.export`
   - "Schedule" button: Requires `reports.schedule`

### Implementation Checklist

For each new page or feature in future phases, ensure:

- [ ] Permission hooks imported and used at component level
- [ ] All action buttons wrapped in permission checks
- [ ] View-only users can see details but not action buttons
- [ ] Loading states handled during permission checks
- [ ] No TypeScript errors with permission types
- [ ] Tested with different user roles (admin, manager, operator, viewer)
- [ ] Documentation updated in CLAUDE.md with new permissions

### Testing Permission Enforcement

For each new feature:

1. **Test with Admin Role**: All buttons should be visible
2. **Test with Manager Role**: Edit/delete buttons visible, not admin functions
3. **Test with Operator Role**: Can add/edit, cannot delete
4. **Test with Viewer Role**: Only view buttons visible, no edit/delete/add
5. **Test with No Permission**: Page should redirect or show "Access Denied"

### Common Mistakes to Avoid

- ❌ **Don't:** Hard-code button visibility without permission checks
- ❌ **Don't:** Use role checks (e.g., `user.role === "admin"`) instead of permission checks
- ❌ **Don't:** Forget to check permissions on detail pages (not just list pages)
- ❌ **Don't:** Show action buttons that will fail on click due to missing permissions
- ✅ **Do:** Use permission hooks for all action visibility
- ✅ **Do:** Use consistent patterns (Pattern 1 or Pattern 2)
- ✅ **Do:** Test with multiple user roles before declaring complete
- ✅ **Do:** Check permissions at the component level, not just API level

---

## Phase 4: Order Management

### Overview
Implement order creation, allocation, and tracking. Orders depend on products, clients, sites being configured (Phase 2).

**Implementation Pattern (Apply to All Phase 4 Features):**

- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils for all order operations
- **Data Access for Related Entities**: Use `globalData` from `data.service.ts` for:
  - `globalData.products.value` - Product lookup for order creation
  - `globalData.clients.value` - Client selection
  - `globalData.sites.value` - Site selection
  - `globalData.assets.value` - Asset allocation
- **Order Service**: Create `OrderService` with business logic methods for:
  - Order creation/validation
  - Order allocation
  - Status transitions
  - Validation against business rules
- **Real-time Updates**: Orders collection should use Firebase listeners for real-time status updates
- **Search**: Use `useOptimizedSearch` hook with appropriate search config

---

### 4.1 Order Creation
**User Flow**: Flow 4 - Order Creation

**Goal**: Create receiving/dispatching orders with complex configuration.

**Files to Create/Modify:**
- `src/app/(authenticated)/orders/new/page.tsx`
- `src/components/orders/OrderCreationWizard.tsx`
- `src/components/orders/wizard-steps/Step1OrderNumber.tsx`
- `src/components/orders/wizard-steps/Step2BasicInfo.tsx`
- `src/components/orders/wizard-steps/Step3Sites.tsx`
- `src/components/orders/wizard-steps/Step4Product.tsx`
- `src/components/orders/wizard-steps/Step5Limits.tsx`
- `src/components/orders/wizard-steps/Step6TripConfig.tsx`
- `src/components/orders/wizard-steps/Step7Allocation.tsx`
- `src/components/orders/wizard-steps/Step8Review.tsx`
- `src/services/order.service.ts`
- Add to `src/config/search-configs.ts` (orders config)

**Wizard Steps (per Flow 4):**

**Step 1: Order Number Configuration**
- Check `company.orderConfig.orderNumberMode`:

  **If "autoOnly":**
  - Display auto-generated order number (read-only)
  - Format: `{orderConfig.orderNumberPrefix}YYYY-NNNN` (e.g., DEV-2024-0001)
  - Next button

  **If "manualAllowed":**
  - Radio buttons:
    - ◉ Use Auto-Generated: `{prefix}YYYY-NNNN`
    - ◯ Enter Manual Order Number: (text input)
  - If manual selected:
    - Text input for order number
    - On blur: Check for duplicates
    - If duplicate: Show error "Order Number Already Exists"
    - Block next until unique
  - Next button

**Step 2: Basic Information**
- Order Type* (radio):
  - ◯ Receiving
  - ◉ Dispatching
- Client* (dropdown from active clients)
- Dispatch Date Range* (date range picker):
  - Start Date
  - End Date
  - Validation: End >= Start
- Total Weight* (number input, tons)
  - Validation: > 0
- Next button

**Step 3: Sites**
- Collection Site* (dropdown from active sites where siteType = 'collection')
  - Display: Site name, address, operating hours (collapsed)
- Destination Site* (dropdown from active sites where siteType = 'destination')
  - Display: Site name, address
- Validation: Collection ≠ Destination
- Next button

**Step 4: Product**
- Product* (dropdown from active products)
  - Display: Product name, code, category
- Next button

**Step 5: Seal Requirements**
- Seal Required* (checkbox)
  - Pre-filled from `company.orderConfig.defaultSealRequired`
- Seal Quantity (number input)
  - Pre-filled from `company.orderConfig.defaultSealQuantity`
  - Disabled if "Seal Required" unchecked
  - Validation: If checked, quantity > 0
- Next button

**Step 6: Limits**
- Daily Truck Limit* (number input)
  - Pre-filled from `company.orderConfig.defaultDailyTruckLimit`
  - Validation: > 0
- Daily Weight Limit* (number input, tons)
  - Pre-filled from `company.orderConfig.defaultDailyWeightLimit`
  - Validation: > 0
- Monthly Limit (number input, tons, optional)
  - Pre-filled from `company.orderConfig.defaultMonthlyLimit`
- Next button

**Step 7: Trip Configuration**
- Radio buttons:

  **Option 1: Maximum Trips Per Day**
  - Number input (pre-filled from `company.orderConfig.defaultTripLimit`, default 1)
  - Validation: >= 1
  - Applied uniformly across all order days

  **Option 2: Trip Duration (hours)**
  - Number input (hours, e.g., 4)
  - System calculates possible trips based on:
    - Collection site operating hours (from sites.operatingHours)
    - Order date range (start to end)
    - Formula: `possibleTrips = floor(operatingHours / tripDuration)`
  - Display calculated trips per day
  - Display total trips for order
  - Note: "If trip duration exceeds daily operating window, it spans to next operating day"
  - Validation: Trip duration > 0 and <= 24

- Display summary:
  - "This order allows {tripsPerDay} trips per day"
  - "Total trips across {days} days: {totalTrips}"

- Next button

**Step 8: Allocation Method**
- Radio buttons:

  **Option 1: Assign to Logistics Coordinator**
  - Dropdown: Select company (companyType = 'logistics_coordinator')
  - Note: "LC will distribute weight to transporters later"
  - On save:
    - Create order with `allocations = []`
    - Send notification to LC contacts (always sent)
    - Send notification to users with "order.allocated" enabled

  **Option 2: Assign to Transporter Companies**
  - Add Transporter button:
    - Opens mini-modal:
      - Company dropdown (companyType = 'transporter')
      - Allocated weight (number input, tons)
      - Loading dates (multi-date picker from order date range)
      - Add button
  - List of added transporters:
    - Company name
    - Allocated weight
    - Loading dates (comma-separated)
    - Remove button
  - Validation: Sum(allocatedWeights) = totalWeight
  - If mismatch: Show error "Weight allocation doesn't match total ({sum}/{total})"
  - Block next until match
  - On save:
    - Create order with `allocations` array
    - Send notification to each transporter (always sent)
    - Send notification to users with "order.allocated" enabled

- Next button (disabled if allocation invalid)

**Step 9: Review & Submit**
- Summary sections:
  - Order Number
  - Order Type, Client
  - Date Range
  - Total Weight
  - Collection Site, Destination Site
  - Product
  - Seal Requirements
  - Limits (daily truck, daily weight, monthly)
  - Trip Config
  - Allocations (if any)
- Edit button for each section (returns to step)
- Submit button

**On Submit:**
- Call `OrderService.create(orderData)`
- Set order status:
  - If allocated to LC or transporters: `status = 'allocated'`
  - Otherwise: `status = 'pending'`
- Send notifications:
  - To users with "order.created" enabled
  - To allocated companies (always)
  - To users with "order.allocated" enabled
- Show success message
- Redirect to order details page

**Methods/Functions:**
- `OrderService.create(data: OrderInput)` - Create order
- `OrderService.generateOrderNumber(prefix: string)` - Auto-generate with sequence
- `OrderService.validateOrderNumber(orderNumber: string)` - Check uniqueness
- `OrderService.calculatePossibleTrips(siteId: string, tripDuration: number, dateRange: DateRange)` - Trip calculation
- `OrderService.validateAllocation(allocations: Allocation[], totalWeight: number)` - Weight sum validation

**Data Model:**
Reference `docs/data-model.md` → `orders` collection

**Acceptance Criteria:**
- ✅ Order number auto-generation works
- ✅ Manual order number validated for duplicates
- ✅ All required fields validated
- ✅ Date range validation works
- ✅ Sites cannot be same
- ✅ Trip calculations correct
- ✅ Weight allocation sums to total
- ✅ Allocations saved correctly
- ✅ Notifications sent to correct recipients
- ✅ Order status set correctly

---

### 4.2 Order Allocation (Post-Creation)
**User Flow**: Flow 5 - Order Allocation Process (Post-Creation)

**Goal**: Allow Logistics Coordinators to redistribute weight to transporters.

**Files to Create/Modify:**
- `src/app/(authenticated)/orders/allocate/[id]/page.tsx`
- `src/components/orders/AllocationWizard.tsx`
- `src/components/orders/TransporterAllocationForm.tsx`
- Modify `OrderService` with allocation methods

**UI Requirements:**
- Only accessible by users in LC companies
- Only shows orders where `allocations = []` OR order assigned to LC company
- Allocation form:
  - Display order summary (read-only):
    - Order number
    - Total weight
    - Date range
    - Product
  - Add Transporter section:
    - Company dropdown (companyType = 'transporter')
    - Allocated weight (number input)
    - Loading dates (multi-date picker)
    - Add button
  - List of allocations:
    - Company name
    - Weight allocated
    - Loading dates
    - Edit / Remove buttons
  - Total allocated weight display
  - Progress bar: {allocated}/{total} tons
  - Validation: Sum = total weight
- Submit button (disabled until valid)
- On submit:
  - Update order.allocations array
  - Update order.status = 'allocated'
  - Send notifications to each transporter (always sent)
  - Send notification to users with "order.allocated" enabled
  - Show success message

**Methods/Functions:**
- `OrderService.allocate(orderId: string, allocations: Allocation[])` - Update order
- `OrderService.validateAllocation(allocations: Allocation[], totalWeight: number)` - Weight sum

**Data Model:**
Reference `docs/data-model.md` → `orders.allocations`

**Acceptance Criteria:**
- ✅ Only LCs can access allocation page
- ✅ Weight sum validated
- ✅ Loading dates within order date range
- ✅ Allocations saved correctly
- ✅ Order status updated to 'allocated'
- ✅ Notifications sent

---

### 4.3 Order Listing & Search
**User Flow**: Implicit (view existing orders)

**Goal**: Display all orders with search, filter, and status tracking.

**Files to Create/Modify:**
- `src/app/(authenticated)/orders/page.tsx`
- `src/components/orders/OrderListTable.tsx`
- `src/components/orders/OrderCard.tsx`
- `src/components/orders/OrderFilters.tsx`
- `src/components/orders/OrderStatusBadge.tsx`

**Methods/Functions:**
- `OrderService.getByCompany(companyId: string)` - All orders for company
- `OrderService.getByStatus(companyId: string, status: OrderStatus)` - Filter by status
- `OrderService.getMyAllocatedOrders(userId: string)` - Orders allocated to user's company
- `OrderService.getExpiringOrders(companyId: string, daysThreshold: number)` - Orders expiring soon

**UI Requirements:**
- Search bar (useOptimizedSearch with config for orderNumber, productName, clientName)
- Filters:
  - Status (All, Pending, Allocated, Completed, Cancelled)
  - Order Type (All, Receiving, Dispatching)
  - Date Range (custom date picker)
  - Allocated to Me (checkbox for transporters)
- Table view:
  - Order Number
  - Type
  - Client
  - Product
  - Total Weight
  - Allocated Weight / Completed Weight
  - Progress bar
  - Dispatch Date Range
  - Status badge
  - Actions (View, Allocate if LC, Cancel)
- Status badge colors:
  - Gray: Pending
  - Blue: Allocated
  - Green: Completed
  - Red: Cancelled
- Expiring soon badge (<7 days from end date)
- Click row to view details

**Acceptance Criteria:**
- ✅ Orders listed with all fields
- ✅ Search by order number/product/client works
- ✅ Filters work correctly
- ✅ Transporters see only allocated orders
- ✅ LCs see all orders they manage
- ✅ Status badges show correct color
- ✅ Progress bar accurate

---

### 4.4 Order Details & Tracking
**User Flow**: Implicit (view order details)

**Goal**: View full order details and track progress.

**Files to Create/Modify:**
- `src/app/(authenticated)/orders/[id]/page.tsx`
- `src/components/orders/OrderDetailsCard.tsx`
- `src/components/orders/OrderProgressChart.tsx`
- `src/components/orders/AllocationsList.tsx`
- `src/components/orders/PreBookingsList.tsx`
- `src/components/orders/WeighingRecordsList.tsx`

**UI Requirements:**
- Order details card:
  - Order number (large, prominent)
  - Status badge
  - Type, client, dates
  - Product, weight, seals
  - Limits (daily truck, weight, trip)
  - Collection/destination sites
  - Created by, created date
- Progress section:
  - Total weight: {completed}/{total} tons
  - Progress bar
  - Completed trips: {trips}
  - Daily usage chart (bar chart showing trucks/weight per day)
- Allocations section:
  - List of transporters
  - Weight allocated to each
  - Weight completed by each
  - Progress per transporter
- Pre-bookings section:
  - List of booked trucks
  - Scheduled dates/times
  - Status (pending/arrived/late/completed)
  - Link to pre-booking details
- Weighing records section:
  - List of completed weighings
  - Ticket number, asset, driver, weight
  - Timestamp
  - Link to ticket PDF
- Actions:
  - Allocate (if LC and pending)
  - Create Pre-Booking (if transporter)
  - Cancel Order (if permitted)
  - Export to PDF

**Methods/Functions:**
- `OrderService.getById(id: string)` - Fetch order
- `OrderService.getProgress(id: string)` - Calculate completion stats
- `OrderService.getPreBookings(orderId: string)` - Related pre-bookings
- `OrderService.getWeighingRecords(orderId: string)` - Related weighing records
- `OrderService.cancel(id: string, reason: string)` - Cancel order

**Acceptance Criteria:**
- ✅ Order details display completely
- ✅ Progress chart accurate
- ✅ Allocations show correct data
- ✅ Pre-bookings listed
- ✅ Weighing records listed
- ✅ Cancel flow requires reason
- ✅ Cancelled orders send notifications

---

## Phase 5: Pre-Booking System

### Overview
Implement truck pre-booking and scheduling for orders.

**Implementation Pattern (Apply to All Phase 5 Features):**

- **CRUD Operations**: Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils for all pre-booking operations
- **Data Access for Related Entities**: Use `globalData` from `data.service.ts` for:
  - `globalData.assets.value` - Asset (truck/trailer/driver) selection
  - Orders collection access (may need Firebase queries for unallocated orders)
- **PreBooking Service**: Create `PreBookingService` with business logic methods for:
  - Pre-booking creation/validation
  - Time slot validation
  - Status transitions
  - Late arrival detection
- **Real-time Updates**: Pre-bookings collection should use Firebase listeners for real-time status updates
- **Search**: Use `useOptimizedSearch` hook with appropriate search config

---

### 5.1 Pre-Booking Creation
**User Flow**: Flow 6 - Pre-Booking Process

**Goal**: Allow LCs/transporters to schedule truck arrivals.

**Files to Create/Modify:**
- `src/app/(authenticated)/pre-bookings/new/page.tsx`
- `src/components/pre-bookings/PreBookingWizard.tsx`
- `src/components/pre-bookings/wizard-steps/Step1OrderSelect.tsx`
- `src/components/pre-bookings/wizard-steps/Step2DateSelect.tsx`
- `src/components/pre-bookings/wizard-steps/Step3TruckSearch.tsx`
- `src/components/pre-bookings/wizard-steps/Step4TripConfig.tsx`
- `src/components/pre-bookings/wizard-steps/Step5Review.tsx`
- `src/components/pre-bookings/TruckAvailabilityCalendar.tsx`
- `src/services/pre-booking.service.ts`
- Add to `src/config/search-configs.ts` (pre-bookings config)

**Wizard Steps (per Flow 6):**

**Step 1: Order Selection**
- Dropdown: Active orders
  - Filter: Orders with available weight (allocatedWeight > completedWeight)
  - Display: Order number, product, remaining weight
- Display order details:
  - Date range
  - Collection site (with operating hours)
  - Trip limits
- Next button

**Step 2: Date & Time Selection**
- Calendar view showing order date range
- Available dates highlighted (within order range)
- Click date to select
- Time picker (must be within collection site operating hours)
- Validation:
  - Date within order.dispatchStartDate and order.dispatchEndDate
  - Time within site.operatingHours for selected day
  - If time outside hours: Error "Site operates {open}-{close} on {day}"
- Next button

**Step 3: Truck Search & Selection**
- Filters:
  - Transporter Company (dropdown)
  - Truck Type (dropdown: All, Truck only, Truck+Trailer)
  - Availability (checkbox: "Show only available")
- Search by registration/fleet number
- List of trucks:
  - Registration, fleet number
  - Type (icon)
  - Company name
  - Availability badge:
    - Green: Available
    - Yellow: Booked (show other bookings)
    - Red: Inactive/Expired
- Select truck (radio button)
- Next button (disabled if no truck selected)

**Step 4: Trip Configuration**
- Trips per day (number input)
  - Default from order.tripLimit
  - Validation: Cannot exceed order.tripLimit
  - Validation: Total capacity (trips × truck capacity) <= remaining weight
- Display calculated capacity:
  - "This truck will carry approximately {capacity} tons across {trips} trips"
- Special instructions (textarea, optional)
- Next button

**Step 5: Review & Submit**
- Summary:
  - Order number
  - Scheduled date & time
  - Truck (registration)
  - Trips per day
  - Special instructions
- Edit buttons
- Submit button

**On Submit:**
- Call `PreBookingService.create(preBookingData)`
- Set status = 'pending'
- Send notification to users with "preBooking.created" enabled
- Send notification 24 hours before scheduled time
- Show success message
- Redirect to pre-bookings list

**Methods/Functions:**
- `PreBookingService.create(data: PreBookingInput)` - Create pre-booking
- `PreBookingService.checkTruckAvailability(assetId: string, date: string, time: string)` - Returns boolean
- `PreBookingService.validateTripsAgainstLimit(orderId: string, tripsPerDay: number)` - Validate against order limit
- `PreBookingService.scheduleReminder(preBookingId: string, scheduledTime: Date)` - Schedule 24h reminder

**Data Model:**
Reference `docs/data-model.md` → `pre_bookings` collection

**Acceptance Criteria:**
- ✅ Orders with available weight shown
- ✅ Date/time validated against site hours
- ✅ Truck availability checked
- ✅ Trip limit validated
- ✅ Pre-booking created successfully
- ✅ Notifications sent
- ✅ 24h reminder scheduled

---

### 5.2 Pre-Booking Listing
**User Flow**: Implicit (view pre-bookings)

**Goal**: Display all pre-bookings with status tracking.

**Files to Create/Modify:**
- `src/app/(authenticated)/pre-bookings/page.tsx`
- `src/components/pre-bookings/PreBookingListTable.tsx`
- `src/components/pre-bookings/PreBookingCalendar.tsx`
- `src/components/pre-bookings/PreBookingStatusBadge.tsx`

**Methods/Functions:**
- `PreBookingService.getByCompany(companyId: string)` - All pre-bookings
- `PreBookingService.getByDate(date: string)` - Daily schedule
- `PreBookingService.getLateArrivals()` - Arrivals >24h late
- `PreBookingService.updateStatus(id: string, status: PreBookingStatus, arrivalTime?: Date)` - Update status

**UI Requirements:**
- View toggle: List / Calendar
- List view:
  - Search by order number / truck registration
  - Filters:
    - Status (All, Pending, Arrived, Late, Completed)
    - Date range
  - Table columns:
    - Order number
    - Truck (registration)
    - Scheduled date/time
    - Actual arrival time (if arrived)
    - Status badge
    - Actions (View, Mark Arrived, Cancel)
- Calendar view:
  - Monthly calendar
  - Date cells show count of bookings
  - Click date to see day's bookings
  - Color-coded by status
- Status badge colors:
  - Blue: Pending
  - Green: Arrived (on time)
  - Yellow: Late (<24h)
  - Red: Late (>24h)
  - Gray: Completed
- Late arrival detection:
  - If arrival >24h after scheduled: Send notification to users with "preBooking.lateArrival" enabled

**Acceptance Criteria:**
- ✅ Pre-bookings listed correctly
- ✅ Calendar view shows daily counts
- ✅ Search and filters work
- ✅ Status updates work
- ✅ Late arrival notifications sent
- ✅ Mark arrived button updates status

## Phase 6: Dashboard

### Overview
Implement role-based dashboards with different views for mine companies, transporter companies, and logistics coordinator companies. Each company type sees relevant metrics and data.

---

### 6.1 Dashboard for Mine Companies
**User Flow**: Implicit - landing page after login for mine users

**Goal**: Provide mine operators with operational overview and order/weighing metrics.

**Files to Create/Modify:**
- `src/app/(authenticated)/page.tsx` (update with role-based rendering)
- `src/components/dashboard/MineDashboard.tsx`
- `src/components/dashboard/widgets/` (shared widget components)

**Dashboard Sections:**

**Key Metrics (Top Cards):**
- Today's total weight (tons)
- Today's trip count
- Active orders count
- Pending pre-bookings count

**Active Orders Widget:**
- Table of active orders:
  - Order number
  - Client
  - Product
  - Progress bar (% complete by weight)
  - Trips today
  - Status
- Link to view order details

**Today's Weighing Activity Widget:**
- Recent weighing records table (last 10):
  - Time
  - Ticket number
  - Truck registration
  - Gross/Tare/Net weight
  - Order number
- Link to view all weighing records

**7-Day Trends Widget:**
- Line chart: Daily weight totals (last 7 days)
- Bar chart: Daily trip counts (last 7 days)

**Alerts & Notifications Widget:**
- Recent security alerts (overloads, underweights, seal mismatches)
- Orders expiring soon (within 7 days)
- Count of pending alerts with link to details

**Acceptance Criteria:**
- ✅ Dashboard loads quickly (<2 seconds)
- ✅ All metrics display correctly
- ✅ Charts render properly
- ✅ Links navigate to correct pages
- ✅ Real-time updates (via Preact Signals)
- ✅ Mobile responsive layout

---

###7.2 Dashboard for Transporter Companies
**User Flow**: Implicit - landing page after login for transporter users

**Goal**: Provide transporters with asset utilization, assigned orders, and trip tracking.

**Files to Create/Modify:**
- `src/components/dashboard/TransporterDashboard.tsx`

**Dashboard Sections:**

**Key Metrics (Top Cards):**
- Total active trucks
- Trucks on trips today
- Today's trips completed
- Today's weight hauled (tons)

**Assigned Orders Widget:**
- Table of orders allocated to this transporter:
  - Order number
  - Collection site
  - Destination
  - Allocated weight
  - Weight completed
  - Progress bar
  - Trips remaining (estimated)
- Link to view order details

**Fleet Activity Widget:**
- Table of today's truck activity:
  - Truck registration
  - Driver name
  - Current order (if on trip)
  - Trips today
  - Weight hauled today
  - Last weighing time
- Real-time status indicators (in transit, at site, idle)

**Pre-Bookings Calendar Widget:**
- Upcoming pre-bookings (next 7 days):
  - Date
  - Truck registration
  - Order number
  - Collection site
  - Driver assigned
- Link to create new pre-booking

**Performance Metrics Widget:**
- Pie chart: Weight by product (current month)
- Bar chart: Trips per truck (top 10 trucks, current month)

**Acceptance Criteria:**
- ✅ Dashboard loads quickly
- ✅ Fleet activity updates in real-time
- ✅ Pre-bookings display correctly
- ✅ Performance charts render
- ✅ Links navigate correctly
- ✅ Mobile responsive

---

### 6.3 Dashboard for Logistics Coordinator Companies
**User Flow**: Implicit - landing page after login for LC users

**Goal**: Provide coordinators with order allocation overview, transporter performance, and pending allocations.

**Files to Create/Modify:**
- `src/components/dashboard/LogisticsCoordinatorDashboard.tsx`

**Dashboard Sections:**

**Key Metrics (Top Cards):**
- Orders assigned to me (pending allocation)
- Active orders under my coordination
- Transporters managed
- Today's total weight across all transporters

**Pending Allocations Widget:**
- Table of orders awaiting distribution to transporters:
  - Order number
  - Client
  - Product
  - Total weight
  - Dispatch date range
  - Days until dispatch start
  - Action: "Allocate" button
- Highlights orders approaching dispatch date (yellow/red)

**Active Allocations Widget:**
- Table of orders allocated to transporters:
  - Order number
  - Transporter name
  - Allocated weight
  - Weight completed
  - Progress bar
  - Status
- Filter by transporter

**Transporter Performance Widget:**
- Table of transporters under coordination:
  - Company name
  - Active orders
  - Total weight allocated (current month)
  - Total weight delivered (current month)
  - Average completion time (days)
  - On-time delivery rate (%)
- Sortable columns

**Pre-Booking Overview Widget:**
- Calendar view of upcoming pre-bookings across all transporters
- Color-coded by transporter company
- Filter by date range and transporter

**Acceptance Criteria:**
- ✅ Dashboard loads quickly
- ✅ Pending allocations prominently displayed
- ✅ Performance metrics accurate
- ✅ Calendar interactive and filterable
- ✅ Links navigate correctly
- ✅ Mobile responsive

---

### 6.4 Global Admin Dashboard (Optional Enhancement)
**Goal**: System-wide overview for global administrators.

**Dashboard Sections:**

**System Health Metrics:**
- Total companies in system
- Total active users
- Total active assets
- Total active orders

**Activity Feed:**
- Recent system-wide actions:
  - Company created/updated
  - User added
  - Asset inducted
  - Order created
  - Security alerts
- Timestamp and user info for each action

**Company Performance:**
- Table of all companies:
  - Company name
  - Type (mine/transporter/LC)
  - Active orders
  - Active assets
  - Users count
- Link to switch to company view

**Acceptance Criteria:**
- ✅ Global metrics accurate
- ✅ Activity feed real-time
- ✅ Company switcher integrated
- ✅ Mobile responsive

---

## Phase 7: Notifications

### Overview
Implement automated email notification system triggered by events throughout the application.

---

### 7.1 Notification Sending Service
**User Flow**: Flow 16 - Notification System Infrastructure (backend)

**Goal**: Automated email sending based on events.

**Files to Create/Modify:**
- `src/services/notification.service.ts`
- `src/lib/email-sender.ts`
- `src/app/api/notifications/send/route.ts` (API endpoint)
- Configure email provider (e.g., SendGrid, AWS SES, Resend)

**Trigger Points (from all phases):**

**Asset Events:**
- asset.added - When asset created in induction
- asset.inactive - When asset marked inactive
- asset.edited - When asset updated
- asset.deleted - When asset hard deleted

**Order Events:**
- order.created - When order created
- order.allocated - When order allocated to company/LC
- order.cancelled - When order cancelled
- order.completed - When order reaches 100% weight
- order.expiring - 7 days before dispatchEndDate

**Weighbridge Events:**
- weighbridge.overload - When overload detected
- weighbridge.underweight - When underweight detected
- weighbridge.violations - When daily limit exceeded
- weighbridge.manualOverride - When weight manually overridden

**Security Events:**
- security.invalidLicense - Expired license scanned
- security.unbookedArrival - No pre-booking found
- security.noActiveOrder - No active order for company
- security.sealMismatch - Seals don't match
- security.incorrectSealsNo - Wrong seal count
- security.unregisteredAsset - Asset not in system
- security.inactiveEntity - Inactive asset scanned
- security.incompleteTruck - Truck exits without weighing

**Pre-Booking Events:**
- preBooking.created - New pre-booking made
- preBooking.lateArrival - Arrival >24h late

**Driver Events:**
- driver.licenseExpiring7 - License expires in 7 days
- driver.licenseExpiring30 - License expires in 30 days

**Methods/Functions:**
- `NotificationService.send(eventType: string, data: object)` - Main send function
  - Look up template by event type
  - Filter recipients by notification preferences
  - Parse placeholders
  - Send email
- `NotificationService.getRecipients(eventType: string, companyId: string)` - Find users with notification enabled
- `NotificationService.parsePlaceholders(template: string, data: object)` - Replace {{placeholders}}
- `EmailSender.sendEmail(to: string[], subject: string, body: string, cc?: string[])` - Actual email send
- Schedule functions:
  - `NotificationService.scheduleOrderExpiry()` - Cron job (daily) to check orders expiring in 7 days
  - `NotificationService.scheduleDriverLicenseExpiry()` - Cron job (daily) to check licenses expiring in 7/30 days

**Email Provider Setup:**
- Use environment variables for API keys
- Recommended: Resend (modern, developer-friendly)
- Configuration in `src/lib/email-config.ts`

**Acceptance Criteria:**
- ✅ All event types trigger notifications
- ✅ Recipients filtered by preferences
- ✅ Direct allocations always send (override preference)
- ✅ Placeholders replaced correctly
- ✅ Emails delivered successfully
- ✅ Scheduled notifications run daily
- ✅ Notification history logged (for debugging)

---

### 7.2 Notification History
**User Flow**: Implicit (admin debugging)

**Goal**: View log of all sent notifications.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/notifications/history/page.tsx`
- `src/components/notifications/NotificationHistoryTable.tsx`
- Create `notification_logs` collection (optional, or use audit_logs)

**UI Requirements:**
- Search by recipient email
- Filters:
  - Date range
  - Event type (dropdown)
  - Status (sent, failed, pending)
- Table columns:
  - Timestamp
  - Event type
  - Recipients (comma-separated)
  - Subject
  - Status
  - Error (if failed)
  - View button (opens modal with email body)
- Retry button for failed notifications

**Methods/Functions:**
- `NotificationService.logNotification(eventType: string, recipients: string[], status: string, error?: string)` - Log to Firestore
- `NotificationService.getHistory(filters: object)` - Fetch logs
- `NotificationService.retryFailed(id: string)` - Resend failed notification

**Acceptance Criteria:**
- ✅ All notifications logged
- ✅ Search and filters work
- ✅ Failed notifications can be retried
- ✅ Email body viewable

---

---

## Phase 8: Audit Logging

### Overview
Comprehensive audit logging system to track all user actions for compliance, debugging, and security.

---

### 8.1 Audit Logging Implementation
**User Flow**: Implicit (compliance and debugging)

**Goal**: Track all user actions for compliance.

**Files to Create/Modify:**
- `src/services/audit.service.ts`
- `src/app/api/audit/route.ts` (API endpoint)
- `src/app/(authenticated)/admin/audit-logs/page.tsx`
- `src/components/audit/AuditLogTable.tsx`

**Logged Actions:**
- User login/logout
- Company created/updated/deactivated
- User created/updated/deactivated
- Role created/updated
- Product created/updated/deactivated
- Client created/updated/deactivated
- Site created/updated/deactivated
- Weighbridge created/updated/deactivated
- Asset inducted/updated/deleted/inactivated
- Order created/allocated/cancelled/completed
- Pre-booking created/cancelled
- Security check (entry/exit)
- Weighing record (tare/gross)
- Notification sent
- Permission override used

**Audit Log Structure (per data-model.md):**
```typescript
{
  id: string
  companyId: string
  userId: string
  action: string // e.g., "order.created"
  entityType: string // e.g., "order"
  entityId: string
  changes: object // { field: newValue }
  ipAddress: string
  userAgent: string
  timestamp: Date
  createdAt: number
  dbCreatedAt: serverTimestamp
}
```

**UI Requirements:**
- Search by user, action, entity type
- Filters:
  - Date range
  - User (dropdown)
  - Action type (dropdown)
  - Entity type (dropdown)
- Table columns:
  - Timestamp
  - User (name)
  - Action
  - Entity type
  - Entity ID (link to entity)
  - Changes (expandable JSON)
  - IP address
- Export to Excel/PDF
- Retention policy UI (e.g., delete logs older than X days)

**Methods/Functions:**
- `AuditService.log(action: string, entityType: string, entityId: string, changes: object, userId: string)` - Create log
- `AuditService.getLogs(filters: object)` - Fetch logs
- `AuditService.getEntityHistory(entityType: string, entityId: string)` - History of single entity
- `AuditService.deleteOldLogs(retentionDays: number)` - Cleanup (scheduled)

**Implementation Pattern:**
- Intercept all `createDocument`, `updateDocument`, `deleteDocument` calls
- Extract changed fields by comparing old vs new
- Capture IP and user agent from request
- Write to `audit_logs` collection asynchronously (don't block user action)

**Acceptance Criteria:**
- ✅ All CRUD actions logged
- ✅ Changes tracked accurately
- ✅ IP and user agent captured
- ✅ Search and filters work
- ✅ Export works
- ✅ Entity history viewable
- ✅ Retention policy enforced

---


## Appendix A: File Structure Summary

```
Newton/
├── src/
│   ├── app/
│   │   ├── (authenticated)/
│   │   │   ├── page.tsx (Dashboard)
│   │   │   ├── settings/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── companies/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── products/page.tsx
│   │   │   │   ├── clients/page.tsx
│   │   │   │   ├── sites/page.tsx
│   │   │   │   ├── weighbridges/page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── page.tsx (template editor)
│   │   │   │   │   └── history/page.tsx
│   │   │   │   ├── settings/page.tsx (system-wide)
│   │   │   │   └── audit-logs/page.tsx
│   │   │   ├── assets/
│   │   │   │   ├── page.tsx (list)
│   │   │   │   ├── induct/page.tsx (wizard)
│   │   │   │   └── [id]/page.tsx (details)
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx (list)
│   │   │   │   ├── new/page.tsx (creation wizard)
│   │   │   │   ├── allocate/[id]/page.tsx
│   │   │   │   └── [id]/page.tsx (details)
│   │   │   ├── pre-bookings/
│   │   │   │   ├── page.tsx (list + calendar)
│   │   │   │   └── new/page.tsx (wizard)
│   │   │   ├── operations/
│   │   │   │   ├── security-in/page.tsx
│   │   │   │   ├── security-out/page.tsx
│   │   │   │   ├── weighbridge-tare/page.tsx
│   │   │   │   ├── weighbridge-gross/page.tsx
│   │   │   │   └── calibration/page.tsx
│   │   │   └── reports/
│   │   │       ├── daily/page.tsx
│   │   │       ├── monthly/page.tsx
│   │   │       └── custom/page.tsx
│   │   ├── api/
│   │   │   ├── seed/route.ts
│   │   │   ├── weighbridge/read-weight/route.ts
│   │   │   ├── notifications/send/route.ts
│   │   │   └── audit/route.ts
│   │   ├── login/page.tsx
│   │   └── seed/page.tsx
│   ├── components/
│   │   ├── ui/ (Radix UI components)
│   │   ├── layout/ (AppLayout, Header, Sidebar)
│   │   ├── auth/ (PermissionGate)
│   │   ├── companies/ (CompanyFormModal, etc.)
│   │   ├── users/ (AddUserModal, NotificationPreferencesEditor, etc.)
│   │   ├── products/ (ProductFormModal, CategoryManager, etc.)
│   │   ├── clients/ (ClientFormModal, etc.)
│   │   ├── sites/ (SiteFormModal, OperatingHoursEditor, etc.)
│   │   ├── weighbridges/ (WeighbridgeFormModal, SerialPortConfig, etc.)
│   │   ├── notifications/ (TemplateEditor, TemplatePreview, etc.)
│   │   ├── assets/ (InductionWizard, wizard-steps/, QRScanner, etc.)
│   │   ├── orders/ (OrderCreationWizard, wizard-steps/, etc.)
│   │   ├── pre-bookings/ (PreBookingWizard, TruckAvailabilityCalendar, etc.)
│   │   ├── security/ (SecurityCheckWizard, wizard-steps/, etc.)
│   │   ├── weighbridge/ (TareWeightForm, GrossWeightForm, SerialPortReader, etc.)
│   │   └── reports/ (DailyReportGenerator, MonthlyCharts, CustomReportBuilder, etc.)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── CompanyContext.tsx
│   │   └── LayoutContext.tsx
│   ├── hooks/
│   │   ├── usePermission.ts
│   │   └── useOptimizedSearch.ts
│   ├── lib/
│   │   ├── firebase.ts (client SDK)
│   │   ├── firebase-admin.ts (server SDK)
│   │   ├── firebase-utils.ts (CRUD helpers)
│   │   ├── permissions.ts (constants)
│   │   ├── asset-field-mappings.ts (expo-sadl integration)
│   │   ├── template-placeholders.ts (notification placeholders)
│   │   ├── email-sender.ts (email provider integration)
│   │   └── utils.ts
│   ├── services/
│   │   ├── console.service.ts
│   │   ├── data.service.ts (centralized reactive data)
│   │   ├── search.service.ts
│   │   ├── utility.service.ts
│   │   ├── scan.service.ts
│   │   ├── company.service.ts
│   │   ├── permission.service.ts
│   │   ├── product.service.ts
│   │   ├── client.service.ts
│   │   ├── site.service.ts
│   │   ├── weighbridge.service.ts
│   │   ├── notification-template.service.ts
│   │   ├── asset.service.ts
│   │   ├── order.service.ts
│   │   ├── pre-booking.service.ts
│   │   ├── security-check.service.ts
│   │   ├── weighing-record.service.ts
│   │   ├── calibration.service.ts
│   │   ├── report.service.ts
│   │   ├── notification.service.ts
│   │   └── audit.service.ts
│   ├── types/
│   │   ├── index.ts (all domain types)
│   │   └── asset-types.ts
│   └── config/
│       └── search-configs.ts
├── docs/
│   ├── data-model.md
│   ├── user-flow-web.md
│   ├── dev.md (THIS FILE)
│   └── design.json
├── data/
│   └── assets-data.json (production sample data)
└── public/

```

---

## Appendix B: Testing Checklist Template

For each phase, use this checklist:

### Pre-Implementation
- [ ] Phase prerequisites completed (all dependencies ready)
- [ ] Data model reviewed and understood
- [ ] User flow reviewed
- [ ] Required files and components identified
- [ ] Service layer methods designed

### During Implementation
- [ ] TypeScript types defined
- [ ] All required fields from data-model.md included
- [ ] Timestamps added correctly (client + server)
- [ ] Company scoping applied (companyId)
- [ ] Soft delete pattern used (isActive)
- [ ] Permission checks implemented
- [ ] Loading states added
- [ ] Error handling with try-catch
- [ ] Toast notifications integrated
- [ ] Search functionality (if applicable)
- [ ] Firestore security rules updated (if needed)

### Post-Implementation
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All CRUD operations work
- [ ] Form validation works
- [ ] Permissions enforced correctly
- [ ] Notifications sent correctly
- [ ] Mobile responsive
- [ ] Loading states display
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Firestore data structure matches data-model.md
- [ ] Audit logs created (if applicable)
- [ ] Manual testing completed
- [ ] User flow verified end-to-end

---

## Appendix C: Common Patterns Reference

### Pattern: CRUD with firebase-utils
```typescript
// Create
import { createDocument } from "@/lib/firebase-utils"
const id = await createDocument("collection_name", data, "Success message")

// Update
import { updateDocument } from "@/lib/firebase-utils"
await updateDocument("collection_name", id, updates, "Updated successfully")

// Delete (soft)
await updateDocument("collection_name", id, { isActive: false }, "Deactivated")

// Delete (hard)
import { deleteDocument } from "@/lib/firebase-utils"
await deleteDocument("collection_name", id, "Deleted successfully")
```

### Pattern: Reactive Data Service
```typescript
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function MyComponent() {
  useSignals() // REQUIRED for reactivity

  const companies = globalData.companies.value
  const users = globalData.users.value
  const loading = globalData.loading.value

  // Component re-renders automatically when signals change
}
```

### Pattern: Optimized Search
```typescript
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"

const { searchTerm, setSearchTerm, filteredItems, isSearching } =
  useOptimizedSearch(dataArray, SEARCH_CONFIGS.entityName)
```

### Pattern: Permission Check
```typescript
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"

const { hasPermission, loading } = usePermission(PERMISSIONS.PERMISSION_NAME)

if (loading) return <LoadingSpinner />
if (!hasPermission) return <AccessDenied />
```

### Pattern: Wizard Navigation
```typescript
const [step, setStep] = useState(1)
const [formData, setFormData] = useState({})

const nextStep = () => setStep(prev => prev + 1)
const prevStep = () => setStep(prev => prev - 1)
const updateFormData = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}
```

### Pattern: Notification Trigger
```typescript
import { NotificationService } from "@/services/notification.service"

// Trigger notification
await NotificationService.send("asset.added", {
  type: "truck",
  registrationNumber: "CA123456",
  companyName: company.name,
  // ... other placeholders
})
```

### Pattern: Audit Log
```typescript
import { AuditService } from "@/services/audit.service"

// Log action
await AuditService.log(
  "order.created",
  "order",
  orderId,
  { status: "allocated", totalWeight: 500 },
  user.id
)
```

---

## Appendix D: Phase Dependencies Diagram

```
Phase 1 (DONE)
    ↓
Phase 2 (Admin Config) ← Must complete BEFORE orders
    ├→ Products
    ├→ Clients
    ├→ Sites
    ├→ Weighbridges
    ├→ Notification Templates
    ├→ User Notification Prefs
    └→ System Settings
    ↓
Phase 3 (Assets) ← Can be parallel with Phase 4
    ├→ Asset Types
    ├→ Induction Wizard
    ├→ Asset List
    ├→ Asset Details
    └→ Deletion/Inactivation
    ↓
Phase 4 (Orders) ← Depends on Phase 2, can be parallel with Phase 3
    ├→ Order Creation
    ├→ Order Allocation
    ├→ Order List
    └→ Order Details
    ↓
Phase 5 (Pre-Bookings) ← Depends on Phase 4
    ├→ Pre-Booking Creation
    └→ Pre-Booking List
    ↓
Phase 6 (Operations) ← Depends on Phases 3, 4, 5
    ├→ Security In
    ├→ Security Out
    ├→ Weighbridge Tare
    ├→ Weighbridge Gross
    └→ Calibration
    ↓
Phase 7 (Reports) ← Depends on Phase 6 (data accumulation)
    ├→ Daily Reports
    ├→ Monthly Reports
    └→ Custom Reports
    ↓
Phase 8 (Notifications & Audit) ← Integrates with ALL phases
    ├→ Notification Sending
    ├→ Notification History
    └→ Audit Logging
    ↓
Phase 9 (Enhancements) ← Optional future features
    ├→ Dashboard Widgets
    ├→ Mobile App
    ├→ ALPR
    ├→ GPS Tracking
    ├→ WhatsApp
    └→ API
```

---

## Document Change Log

| Date       | Version | Changes                                      |
|------------|---------|----------------------------------------------|
| 2025-01-06 | 2.0.0   | Complete rewrite - MECE coverage, no code    |
| 2024-XX-XX | 1.0.0   | Initial version (partial implementation code)|

---

**END OF DOCUMENT**
