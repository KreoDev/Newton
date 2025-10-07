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
- Use centralized `src/services/data.service.ts` for companies, users, and roles (NO duplicate queries)
- Use `useOptimizedSearch` hook from `src/hooks/useOptimizedSearch.ts` with configs from `src/config/search-configs.ts`
- All loading states must use components from `src/components/ui/loading-spinner.tsx`
- Follow timestamp convention: `createdAt`/`updatedAt` (client), `dbCreatedAt`/`dbUpdatedAt` (server)
- Soft deletes via `isActive` flag; hard delete only for immediate induction errors

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
- Role-based permission system
- Global admin support (isGlobal users)
- Permission overrides per user
- Loading states for permission checks

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

### 1.3 User Management ✅
**User Flow**: Flow 10 - User Management Configuration

**Completed Components:**
- `src/app/(authenticated)/admin/users/page.tsx` - User listing
- `src/components/users/AddUserModal.tsx` - User creation
- `src/components/users/ChangePasswordModal.tsx` - Password management
- `src/components/users/ChangeEmailModal.tsx` - Email updates
- `src/services/user.service.ts` - User operations (if exists, or use firebase-utils directly)

**Completed Features:**
- User creation with Firebase Auth
- Role assignment
- Email/password management
- Profile picture support
- Company-scoped user listing
- Permission override UI (basic)

**Partial Implementation:**
- Notification preferences UI needs full implementation (see Phase 2.6)
- Granular permission editing UI needs enhancement

### 1.4 Centralized Data Management ✅
**Technical Infrastructure**

**Completed Components:**
- `src/services/data.service.ts` - Singleton reactive data service
- `src/lib/firebase-utils.ts` - `createCollectionListener` factory
- `src/contexts/CompanyContext.tsx` - Integration with global data service

**Completed Features:**
- Preact Signals-based reactive state
- Real-time Firebase listeners for companies, users, roles
- Smart loading state tracking (no arbitrary timeouts)
- Automatic cleanup on company switch/unmount
- Single source of truth for all company/user/role data

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

### 1.7 Seed Script ✅
**Development Infrastructure**

**Completed Components:**
- `src/app/api/seed/route.ts` - Seed API endpoint
- `src/app/seed/page.tsx` - Seed UI

**Completed Features:**
- Seed permissions document (`settings/permissions`)
- Seed 9 default roles per company
- Seed default company with proper contact IDs
- Seed default user with correct permissions
- Proper timestamp handling (client + server)

---

## Phase 2: Administrative Configuration

### Overview
Implement all administrative configuration modules required BEFORE orders can be created. These are the master data tables that orders depend on.

---

### 2.1 Product Management
**User Flow**: Flow 11 - Product Management Configuration

**Goal**: Simple catalog of minerals (Gold, Platinum, Diamond, Iron Ore, Chrome, etc.) for use in orders.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/products/page.tsx`
- `src/components/products/ProductFormModal.tsx`

**Implementation Pattern:**
- Use `createDocument()`, `updateDocument()` from firebase-utils directly in components
- No service file needed - simple CRUD operations only
- Search: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.products`

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

### 2.2 Client Management
**User Flow**: Flow 13 - Client Management Configuration

**Goal**: Manage client companies (buyers/receivers of materials).

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/clients/page.tsx`
- `src/components/clients/ClientFormModal.tsx`

**Implementation Pattern:**
- Use `createDocument()`, `updateDocument()` from firebase-utils directly in components
- No service file needed - simple CRUD operations only
- Search: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.clients`

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

### 2.3 Site Management
**User Flow**: Flow 14 - Site Management Configuration

**Goal**: Configure collection sites (loading places) and destination sites.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/sites/page.tsx`
- `src/components/sites/SiteFormModal.tsx`
- `src/components/sites/OperatingHoursEditor.tsx`

**Implementation Pattern:**
- Use `createDocument()`, `updateDocument()` from firebase-utils directly in components
- No service file needed - simple CRUD operations only
- Search: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.sites`
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

### 2.4 Comprehensive User Management
**User Flow**: Flow 10 - User Management Configuration (expanded)

**Goal**: Complete user administration including company transfers, role management, and permission overrides.

**Files to Modify:**
- `src/app/(authenticated)/admin/users/page.tsx` - Enhanced user listing
- `src/components/users/EditUserModal.tsx` - Complete user editing
- `src/components/users/MoveUserModal.tsx` - Transfer users between companies
- `src/components/users/RoleManager.tsx` - Add/remove user roles
- `src/components/users/PermissionOverrideEditor.tsx` - Granular permission overrides

**Implementation Pattern:**
- Use `updateDocument("users", userId, updates)` from firebase-utils for all updates
- No service file needed - simple updates to user document
- Access current data via `globalData.users.value` (from data.service.ts)
- Role data via `globalData.roles.value` (from data.service.ts)

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
  - List of all roles for user's company (from globalData.roles.value)
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

### 2.5 Role Management
**User Flow**: Administrative configuration for role-based access control

**Goal**: Create, edit, and manage roles with permission assignments for all users within a company.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/roles/page.tsx`
- `src/components/roles/RoleFormModal.tsx`
- `src/components/roles/PermissionSelector.tsx`
- `src/services/role.service.ts` (optional, or use firebase-utils directly)

**Implementation Pattern:**
- Use `createDocument()`, `updateDocument()`, `deleteDocument()` from firebase-utils directly in components
- No service file needed - simple CRUD operations only
- Access role data via `globalData.roles.value` (from data.service.ts)
- Search: Use existing `useOptimizedSearch` hook with `SEARCH_CONFIGS.roles`

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

  - **Reporting:**
    - reports.view (View reports)
    - reports.export (Export reports)

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
Per company, create 9 default roles:
1. **Newton Administrator** - Full system access
2. **Weighbridge Operator** - Weighbridge operations only
3. **Security Officer** - Security checkpoints only
4. **Asset Manager** - Asset management only
5. **Order Coordinator** - Order creation and allocation
6. **Logistics Coordinator** - Pre-booking and order allocation
7. **Transporter User** - View assigned orders, create pre-bookings
8. **Report Viewer** - View and export reports only
9. **Basic User** - View-only access

**Data Model:**
Reference `docs/data-model.md` → `roles` collection:
- `name: string` - Role display name
- `description: string` - Role description
- `permissionKeys: string[]` - Array of permission keys
- `isActive: boolean` - Active status
- `companyId: string` - Company-scoped

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

### 2.7 Notification Templates
**User Flow**: Flow 15 - Notification System Infrastructure

**Goal**: Configure email templates for all system notifications.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/notifications/page.tsx`
- `src/components/notifications/TemplateEditor.tsx`
- `src/components/notifications/TemplatePreview.tsx`
- `src/components/notifications/TemplateCategoryTabs.tsx`
- `src/lib/template-placeholders.ts` (helper functions)

**Implementation Pattern:**
- Use `createDocument()`, `updateDocument()` from firebase-utils directly in components
- No service file needed - simple CRUD operations only
- Helper functions in `template-placeholders.ts`:
  - `parsePlaceholders(template: string, data: Record<string, any>)` - Replace {{placeholders}}
  - `sendTestEmail(templateId: string, userEmail: string)` - Send test email
- Search: Use existing `useOptimizedSearch` hook with search config

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
    - {{assetType}}, {{registrationNumber}}, {{fleetNumber}}
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

### 2.8 User Notification Preferences
**User Flow**: Flow 10 - User Management Configuration (Notification Settings)

**Goal**: Allow users to opt-in/opt-out of notification types.

**Files to Modify:**
- `src/app/(authenticated)/admin/users/page.tsx` (add Notifications tab/modal)
- `src/components/users/NotificationPreferencesEditor.tsx` (new component)
- Update `src/components/users/AddUserModal.tsx` to include default preferences

**Implementation Pattern:**
- Use `updateDocument("users", userId, { notificationPreferences: prefs })` directly
- No service file needed - simple field update
- Default preferences: Create helper function `getDefaultNotificationPreferences()` in component or lib

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

### 2.9 System-Wide Settings
**User Flow**: Flow 16 - System-Wide Settings Configuration

**Goal**: Configure global UI/feature toggles that affect all users.

**Files to Create/Modify:**
- `src/app/(authenticated)/admin/settings/page.tsx`
- `src/components/settings/SystemSettingsForm.tsx`

**Implementation Pattern:**
- Use `updateDocument("companies", companyId, { systemSettings })` directly
- No service file needed - simple field update on company document
- Access current settings via `CompanyContext` or `globalData.companies.value`

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

---

## Phase 3: Asset Management

### Overview
Implement complete asset induction, management, and deletion flows. Use wizard-based approach with expo-sadl integration for driver license parsing.

---

### 3.1 Asset Type Configuration
**Supporting Infrastructure**

**Goal**: Configure asset types that determine which fields appear in wizard.

**Files to Create/Modify:**
- `src/types/asset-types.ts` (TypeScript definitions)
- `src/lib/asset-field-mappings.ts` (expo-sadl field mappings)

**Asset Types (from data/assets-data.json):**
- **Truck**: registration, engineNo, make, model, colour, licenceDiskNo, firstQRCode, secondQRCode, expiryDate
- **Trailer**: registration, make, model, colour, licenceDiskNo, firstQRCode, secondQRCode, expiryDate
- **Driver**: licenceNumber, idNumber, name, surname, initials, gender, birthDate, dateOfExpiry, issueDate, driverRestrictions, ntCode, licenceType, firstQRCode, secondQRCode

**expo-sadl Field Mappings:**
Per South African driver's license standard (see NewtonWeighbridges/src/services/scan.service.ts):
- `VehicleInformation`: registration, make, model, colour, vehicleDiskNo, expiryDate, engineNo
- `PersonInformation`: idNumber, name, surname, initials, gender, birthDate
- `LicenceInformation`: licenceNumber, issueDate, expiryDate, driverRestrictions, licenceType, ntCode (NaTIS transaction code)

**Methods/Functions:**
- `AssetFieldMapper.parseVehicleDisk(barcodeData: string)` - Extract vehicle info
- `AssetFieldMapper.parseDriverLicense(barcodeData: string)` - Extract driver info via expo-sadl
- `AssetFieldMapper.validateExpiry(expiryDate: string)` - Check not expired
- `AssetFieldMapper.getRequiredFields(assetType: 'truck' | 'trailer' | 'driver')` - Return required field list

**Data Model:**
Reference `data/assets-data.json` for real production structure

**Acceptance Criteria:**
- ✅ Barcode data correctly parsed
- ✅ All fields mapped per asset type
- ✅ Expiry validation works
- ✅ Expo-sadl integration functional

---

### 3.2 Asset Induction Wizard
**User Flow**: Flow 2 - Complete Asset Induction Process

**Goal**: Multi-step wizard to induct new assets with QR/barcode scanning and validation.

**Files to Create/Modify:**
- `src/app/(authenticated)/assets/induct/page.tsx`
- `src/components/assets/InductionWizard.tsx`
- `src/components/assets/wizard-steps/Step1CompanySelect.tsx`
- `src/components/assets/wizard-steps/Step2QRScan.tsx`
- `src/components/assets/wizard-steps/Step3LicenseScan.tsx`
- `src/components/assets/wizard-steps/Step4AssetTypeDetection.tsx`
- `src/components/assets/wizard-steps/Step5FieldConfirmation.tsx`
- `src/components/assets/wizard-steps/Step6OptionalFields.tsx`
- `src/components/assets/wizard-steps/Step7Review.tsx`
- `src/components/assets/QRScanner.tsx` (camera integration)
- `src/components/assets/BarcodeScanner.tsx` (camera integration)
- `src/services/asset.service.ts`
- Add to `src/config/search-configs.ts` (assets config)

**Wizard Steps (per Flow 2):**

**Step 1: Company Selection**
- Dropdown: Select company (companyType = transporter OR logistics_coordinator)
- Only companies with transporter flag shown
- Next button

**Step 2: QR Code Scan (First)**
- Camera view or manual input
- Scan QR code (firstQRCode)
- Validation: Check not already in system
- If duplicate: Error + return to start
- Retry button
- Next button

**Step 3: QR Code Verification (Second)**
- Camera view or manual input
- Scan QR code again (secondQRCode)
- Validation: Must match firstQRCode
- If mismatch: Error + return to Step 2
- Next button

**Step 4: License/Disk Scan (First)**
- Camera view or manual input
- Scan license disc barcode (vehicle) OR driver license barcode
- Auto-parse via expo-sadl / vehicle disk parser
- Display extracted fields
- Next button

**Step 5: License/Disk Verification (Second)**
- Camera view or manual input
- Scan same barcode again
- Validation: Must match first scan data
- If mismatch: Error + return to Step 4
- Next button

**Step 6: Asset Type Detection**
- Automatically identify type:
  - If `VehicleInformation` → Truck or Trailer (user selects)
  - If `PersonInformation` → Driver
- Display detected type with icon
- User confirms or overrides
- Next button

**Step 7: Field Confirmation & Validation**
- Display all auto-extracted fields
- Editable fields (pre-filled from barcode data)
- Expiry date validation:
  - If expired: Red banner + error message
  - Block save (per Flow 2: "If Invalid (Expired): Process Blocked")
  - Send notification to users with "security.invalidLicense" enabled
  - Return to start button
- If valid but <30 days: Yellow warning banner
- If valid but <7 days: Red warning banner (still allows save)
- Next button (disabled if expired)

**Step 8: Optional Fields**
- Fleet Number (text input) - only if `systemSettings.fleetNumberEnabled`
- Group (dropdown from `systemSettings.groupOptions`) - only if `systemSettings.transporterGroupEnabled`
- Skip button / Next button

**Step 9: Review & Submit**
- Summary card showing:
  - Company
  - Asset type
  - QR code
  - All extracted fields
  - Expiry status badge
  - Optional fields
- Edit button (returns to relevant step)
- Submit button

**On Successful Submit:**
- Call `AssetService.create(assetData)`
- Send notification to users with "asset.added" enabled
- Show success message
- Option to "Add Another" or "View Asset List"

**Methods/Functions:**
- `AssetService.create(data: AssetInput)` - Create asset
- `AssetService.validateQRCode(qrCode: string)` - Check uniqueness
- `AssetService.checkExpiry(expiryDate: string)` - Validate not expired
- `AssetService.sendExpiryNotifications(asset: Asset, daysUntilExpiry: number)` - Trigger notifications

**Data Model:**
Reference `docs/data-model.md` → `assets` collection

**Acceptance Criteria:**
- ✅ Wizard navigates through all 9 steps
- ✅ QR code scanned twice and verified
- ✅ License/disk scanned twice and verified
- ✅ Asset type auto-detected correctly
- ✅ Expired licenses block save
- ✅ Valid licenses allow save with warnings
- ✅ Fleet number/group fields conditional on settings
- ✅ Notifications sent on success
- ✅ Duplicate QR codes prevented

---

### 3.3 Asset Listing & Search
**User Flow**: Implicit (view existing assets)

**Goal**: Display all assets with search, filter, and expiry warnings.

**Files to Create/Modify:**
- `src/app/(authenticated)/assets/page.tsx`
- `src/components/assets/AssetListTable.tsx`
- `src/components/assets/AssetCard.tsx`
- `src/components/assets/AssetFilters.tsx`
- `src/components/assets/ExpiryBadge.tsx`

**Methods/Functions:**
- `AssetService.getByCompany(companyId: string)` - All assets
- `AssetService.getByType(companyId: string, type: 'truck' | 'trailer' | 'driver')` - Filter by type
- `AssetService.getExpiringAssets(companyId: string, daysThreshold: number)` - Assets expiring soon
- `AssetService.getExpiredAssets(companyId: string)` - Expired assets

**UI Requirements:**
- Search bar (useOptimizedSearch with config for registrationNumber, licenseNumber, qrCode, fleetNumber)
- Filters:
  - Asset type (All, Trucks, Trailers, Drivers)
  - Status (All, Active, Inactive, Expired)
  - Expiry (All, Expiring <7 days, Expiring <30 days, Expired)
- Table/card view toggle
- Columns:
  - Icon (truck/trailer/driver)
  - Registration/License Number
  - QR Code
  - Fleet Number (if enabled)
  - Group (if enabled)
  - Expiry Date
  - Status badge (Active/Inactive/Expired)
  - Actions (View, Edit, Delete)
- Expiry badge colors:
  - Green: >30 days
  - Yellow: 7-30 days
  - Orange: 1-7 days
  - Red: Expired
- Click row to view details
- Bulk actions: Export to Excel

**Acceptance Criteria:**
- ✅ Assets listed with all fields
- ✅ Search by registration/license/QR/fleet works
- ✅ Filters work correctly
- ✅ Expiry badges show correct color
- ✅ Active/inactive toggle works
- ✅ Pagination for large lists

---

### 3.4 Asset Details & Edit
**User Flow**: Implicit (view/edit existing asset)

**Goal**: View full asset details and edit non-barcode fields.

**Files to Create/Modify:**
- `src/app/(authenticated)/assets/[id]/page.tsx`
- `src/components/assets/AssetDetailsCard.tsx`
- `src/components/assets/AssetEditModal.tsx`
- `src/components/assets/AssetHistoryTimeline.tsx` (optional)

**Methods/Functions:**
- `AssetService.getById(id: string)` - Fetch single asset
- `AssetService.update(id: string, data: Partial<Asset>)` - Update asset
- `AssetService.getHistory(id: string)` - Audit log (future)

**UI Requirements:**
- Asset details card:
  - Large icon for type
  - All fields (read-only barcode fields, editable optional fields)
  - Expiry status prominent
  - QR codes displayed
  - Company name
  - Created/updated timestamps
- Edit button (opens modal)
- Edit modal:
  - Fleet Number (editable)
  - Group (editable dropdown)
  - Cannot edit: registration, license, QR, barcode data
  - Note: "Barcode fields cannot be edited. Delete and re-induct to change."
- History timeline (optional):
  - Created date
  - Edited dates
  - Inactivated date (if applicable)

**Acceptance Criteria:**
- ✅ Asset details display correctly
- ✅ Barcode fields are read-only
- ✅ Optional fields are editable
- ✅ Updates trigger "asset.edited" notification
- ✅ Edit modal validates inputs

---

### 3.5 Asset Deletion & Inactivation
**User Flow**: Flow 3 - Asset Deletion (Induction Error Correction)

**Goal**: Delete assets with no transactions, or inactivate if transactions exist.

**Files to Create/Modify:**
- `src/components/assets/DeleteAssetModal.tsx`
- `src/components/assets/InactivateAssetModal.tsx`
- Modify `AssetService` with deletion methods

**Methods/Functions:**
- `AssetService.checkHasTransactions(assetId: string)` - Returns `{ hasTransactions: boolean, count: number }`
- `AssetService.delete(id: string, reason: string)` - Hard delete (only if no transactions)
- `AssetService.inactivate(id: string, reason: string)` - Soft delete (set isActive = false)

**UI Requirements:**

**Delete Flow (per Flow 3):**
- User clicks "Delete" on asset
- Scan QR code to confirm (modal with camera)
- If QR matches:
  - System checks for transactions:
    - Query `weighing_records` where `assetId` = id
    - Query `security_checks` where `assetId`, `driverId`, `trailer1Id`, or `trailer2Id` = id

  **If No Transactions:**
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
  - Show error modal:
    - Title: "Cannot Delete - Asset Has Transactions"
    - Message: "This asset has {count} transaction(s) and cannot be deleted."
    - Option: "Mark as Inactive Instead" button
    - Cancel button
  - If user clicks "Mark as Inactive":
    - Show inactivate modal (see below)

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
- ✅ QR scan required to delete
- ✅ Transaction check prevents deletion
- ✅ Hard delete only if no transactions
- ✅ Inactivation available as alternative
- ✅ Reason required for both actions
- ✅ Notifications sent correctly
- ✅ Audit log created
- ✅ Inactive assets hidden from operational dropdowns

---

## Phase 4: Order Management

### Overview
Implement order creation, allocation, and tracking. Orders depend on products, clients, sites being configured (Phase 2).

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

---

## Phase 6: Operational Flows (Security & Weighbridge)

### Overview
Implement security checkpoint and weighbridge operations that tie together assets, orders, and pre-bookings.

---

### 6.1 Security Checkpoint - Entry
**User Flow**: Flow implied from security flow in user-flow-web.md

**Goal**: Verify trucks, drivers, trailers at entry gate.

**Files to Create/Modify:**
- `src/app/(authenticated)/operations/security-in/page.tsx`
- `src/components/security/SecurityCheckWizard.tsx`
- `src/components/security/wizard-steps/Step1DriverScan.tsx`
- `src/components/security/wizard-steps/Step2TruckScan.tsx`
- `src/components/security/wizard-steps/Step3TrailerScan.tsx`
- `src/components/security/wizard-steps/Step4OrderVerification.tsx`
- `src/components/security/wizard-steps/Step5PreBookingCheck.tsx`
- `src/components/security/wizard-steps/Step6SealVerification.tsx`
- `src/components/security/wizard-steps/Step7ApprovalDenial.tsx`
- `src/services/security-check.service.ts`

**Wizard Steps:**

**Step 1: Driver Scan**
- QR scanner for driver
- On scan:
  - Look up asset by qrCode
  - Validate assetType = 'driver'
  - Check isActive
  - Check license expiry
  - If expired: Error + Send "security.invalidLicense" notification
  - If expiring <7 days: Warning
  - Display driver info:
    - Name, surname
    - License number
    - Expiry date
- Next button

**Step 2: Truck Scan**
- QR scanner for truck
- On scan:
  - Look up asset by qrCode
  - Validate assetType = 'truck'
  - Check isActive
  - Check disk expiry
  - If expired: Error + Send "security.invalidLicense" notification
  - Display truck info:
    - Registration
    - Make, model
    - Fleet number
- Next button

**Step 3: Trailer Scan (Optional)**
- QR scanner for trailer 1
- QR scanner for trailer 2 (optional)
- For each trailer:
  - Look up asset by qrCode
  - Validate assetType = 'trailer'
  - Check isActive
  - Check disk expiry
  - Display trailer info
- Skip button / Next button

**Step 4: Order Verification**
- Search for active orders:
  - Query orders where:
    - companyId matches truck's company
    - status = 'allocated'
    - dispatchStartDate <= today <= dispatchEndDate
- Display list of applicable orders:
  - Order number
  - Product
  - Remaining weight
  - Select radio button
- If no orders found:
  - Show error: "No active orders for this company"
  - Send notification to users with "security.noActiveOrder" enabled
  - Deny entry button
- If orders found: Select order and next

**Step 5: Pre-Booking Check**
- Check if order requires pre-booking (company.orderConfig.preBookingMode = 'compulsory')
- If compulsory:
  - Query pre_bookings where:
    - orderId = selected order
    - assetId = truck
    - scheduledDate = today
    - status = 'pending'
  - If no booking:
    - Show error: "No pre-booking found for this truck on this order today"
    - Send notification to users with "security.unbookedArrival" enabled
    - Option to bypass (if user has "preBooking.bypass" permission)
    - Deny entry button
  - If booking found:
    - Display booking details
    - Update pre-booking status = 'arrived', arrivalTime = now
    - Check if >24h late: Send "preBooking.lateArrival" notification
- If optional:
  - Display "Pre-booking is optional for this order"
- Next button

**Step 6: Seal Verification (if order requires seals)**
- If order.sealRequired = false: Skip this step
- If order.sealRequired = true:
  - Input seal numbers (multiple text inputs based on order.sealQuantity)
  - Validate:
    - Count matches order.sealQuantity
    - No duplicates
  - If incorrect count:
    - Show error: "Expected {quantity} seals, found {count}"
    - Send notification to users with "security.incorrectSealsNo" enabled
    - Deny entry option
  - If correct:
    - Save seal numbers to security check record
- Next button

**Step 7: Approval/Denial**
- Summary of all scans:
  - Driver (name, license, expiry)
  - Truck (registration, expiry)
  - Trailers (if any)
  - Order (number, product)
  - Pre-booking (status)
  - Seals (numbers)
- Verification status:
  - ✅ All checks passed
  - ❌ Issues found: (list issues)
- Buttons:
  - Approve Entry (green) - only if all checks passed
  - Deny Entry (red) - requires reason
- On approve:
  - Create security_check record with checkType = 'entry', verificationStatus = 'passed'
  - Update pre-booking arrivalTime
  - Show success message: "Entry approved. Proceed to weighbridge."
- On deny:
  - Show reason modal (textarea required)
  - Create security_check record with checkType = 'entry', verificationStatus = 'denied', denialReason = reason
  - Send notifications for denial reasons
  - Show message: "Entry denied. Truck must leave premises."

**Methods/Functions:**
- `SecurityCheckService.create(data: SecurityCheckInput)` - Create check record
- `SecurityCheckService.verifyAsset(qrCode: string, expectedType: 'truck' | 'trailer' | 'driver')` - Validate asset
- `SecurityCheckService.findActiveOrders(companyId: string)` - Get applicable orders
- `SecurityCheckService.checkPreBooking(orderId: string, assetId: string, date: string)` - Find booking
- `SecurityCheckService.validateSeals(sealNumbers: string[], requiredQuantity: number)` - Seal validation
- `SecurityCheckService.approve(checkData: SecurityCheck)` - Approve entry
- `SecurityCheckService.deny(checkData: SecurityCheck, reason: string)` - Deny entry

**Data Model:**
Reference `docs/data-model.md` → `security_checks` collection

**Acceptance Criteria:**
- ✅ All assets scanned and validated
- ✅ Expired assets blocked
- ✅ Order verification works
- ✅ Pre-booking requirement enforced
- ✅ Seal count validated
- ✅ Approval creates security check record
- ✅ Denial sends notifications
- ✅ All security alerts trigger correctly

---

### 6.2 Security Checkpoint - Exit
**User Flow**: Implicit (mirror of entry)

**Goal**: Verify truck completed process before exit.

**Files to Create/Modify:**
- `src/app/(authenticated)/operations/security-out/page.tsx`
- `src/components/security/SecurityExitWizard.tsx`
- Reuse/modify entry components

**Wizard Steps:**

**Step 1: Truck QR Scan**
- Scan truck QR code
- Look up most recent entry security check (checkType = 'entry', status = 'passed')
- If no entry record:
  - Error: "No entry record found. Truck should not be on premises."
  - Send alert to security contacts
  - Deny exit
- If entry record exists:
  - Display entry details
  - Next button

**Step 2: Weighing Verification**
- Check for weighing record:
  - Query weighing_records where assetId = truck, status = 'completed'
  - If no record:
    - Warning: "No weighing record found. Has this truck been weighed?"
    - Option to bypass (if user has permission)
    - Send notification to users with "security.incompleteTruck" enabled
  - If record found:
    - Display ticket number, weight, timestamp
    - Next button

**Step 3: Seal Verification (if applicable)**
- If order required seals at entry:
  - Scan/input seal numbers on exit
  - Compare with entry seal numbers
  - If mismatch:
    - Error: "Seal numbers don't match entry seals"
    - Send notification to users with "security.sealMismatch" enabled
    - Deny exit
  - If match:
    - Next button
- If no seals required: Skip

**Step 4: Exit Approval**
- Summary:
  - Entry time
  - Weighing ticket
  - Seals verified (if applicable)
- Buttons:
  - Approve Exit (green)
  - Deny Exit (red, requires reason)
- On approve:
  - Create security_check record with checkType = 'exit', verificationStatus = 'passed'
  - Show success message: "Exit approved. Safe travels."
- On deny:
  - Reason modal
  - Create security_check with checkType = 'exit', verificationStatus = 'denied', denialReason = reason
  - Send alert to security contacts
  - Show message: "Exit denied. Contact supervisor."

**Methods/Functions:**
- `SecurityCheckService.findEntryRecord(assetId: string)` - Find matching entry
- `SecurityCheckService.verifyWeighingCompleted(assetId: string)` - Check weighing record exists
- `SecurityCheckService.compareSeals(entrySeals: string[], exitSeals: string[])` - Validate seals match
- `SecurityCheckService.approveExit(checkData: SecurityCheck)` - Approve exit
- `SecurityCheckService.denyExit(checkData: SecurityCheck, reason: string)` - Deny exit

**Acceptance Criteria:**
- ✅ Entry record verified
- ✅ Weighing record checked
- ✅ Seal verification works
- ✅ Approval creates exit record
- ✅ Denial sends alerts
- ✅ Incomplete process detected and flagged

---

### 6.3 Weighbridge - Tare Weight
**User Flow**: Implied from weighbridge operations

**Goal**: Capture empty truck weight before loading.

**Files to Create/Modify:**
- `src/app/(authenticated)/operations/weighbridge-tare/page.tsx`
- `src/components/weighbridge/TareWeightForm.tsx`
- `src/components/weighbridge/WeighbridgeScaleDisplay.tsx`
- `src/components/weighbridge/SerialPortReader.tsx`
- `src/services/weighbridge.service.ts`
- `src/services/weighing-record.service.ts`

**UI Requirements:**

**Step 1: Security Check Verification**
- Scan truck QR code
- Look up most recent entry security check
- If no entry or entry denied:
  - Error: "Truck has not been cleared by security"
  - Block process
- If entry approved:
  - Display truck details
  - Display order details
  - Next button

**Step 2: Weighbridge Selection**
- Dropdown: Select weighbridge (active weighbridges only)
- Display weighbridge details:
  - Name, location
  - Axle setup
  - Calibration status (warn if due/overdue)
- Next button

**Step 3: Weight Capture**
- Live scale display (if serial port configured):
  - Large numeric display of current weight
  - Unit (tons/kg - configurable)
  - "Reading from {weighbridgeName}"
  - Refresh button (re-read serial port)
- Manual entry option:
  - Text input for weight
  - Validation: > 0, reasonable range (e.g., 1-50 tons for trucks)
- Tare weight field (number input)
- Capture button

**Step 4: Ticket Generation**
- On capture:
  - Generate ticket number: `TKT-YYYY-NNNNNN`
  - Create weighing_record with:
    - orderId, assetId, weighbridgeId
    - status = 'tare_only'
    - tareWeight = captured weight
    - tareTimestamp = now
    - ticketNumber
    - operatorId = current user
  - Display ticket:
    - Ticket number (large, prominent)
    - Truck registration
    - Order number
    - Tare weight
    - Timestamp
    - Operator name
    - Weighbridge name
  - Print button (PDF generation)
  - "Weigh Again" button (clears and restarts)
  - "Finish" button (redirect to list)

**Methods/Functions:**
- `WeighingRecordService.create(data: WeighingRecordInput)` - Create record
- `WeighingRecordService.generateTicketNumber()` - Auto-generate ticket number
- `WeighbridgeService.readWeight(weighbridgeId: string)` - Read from serial port (if configured)
- `WeighbridgeService.validateWeight(weight: number, weighbridgeId: string)` - Check tolerance
- `WeighingRecordService.generateTicketPDF(recordId: string)` - Create PDF ticket

**Serial Port Integration:**
- Use Node.js `serialport` library (server-side API route)
- API endpoint: `POST /api/weighbridge/read-weight`
- Request: `{ weighbridgeId: string }`
- Response: `{ weight: number, unit: string, timestamp: Date }`
- Parse weight from serial string based on weighbridge.serialPortConfig.decodingRules

**Data Model:**
Reference `docs/data-model.md` → `weighing_records` collection

**Acceptance Criteria:**
- ✅ Security check verified before weighing
- ✅ Weight captured from scale or manual entry
- ✅ Ticket number generated
- ✅ Weighing record created with status 'tare_only'
- ✅ PDF ticket printable
- ✅ Serial port reading works (if configured)

---

### 6.4 Weighbridge - Gross Weight
**User Flow**: Implied from weighbridge operations

**Goal**: Capture loaded truck weight after loading, calculate net weight.

**Files to Create/Modify:**
- Modify `src/app/(authenticated)/operations/weighbridge-gross/page.tsx`
- `src/components/weighbridge/GrossWeightForm.tsx`
- Reuse tare components

**UI Requirements:**

**Step 1: Find Tare Record**
- Scan truck QR code
- Look up weighing_record where:
  - assetId = truck
  - status = 'tare_only'
  - tareTimestamp within last 24 hours (configurable)
- If no record:
  - Error: "No tare record found. Truck must weigh empty first."
  - Redirect to tare page
- If record found:
  - Display tare details:
    - Ticket number
    - Tare weight
    - Tare timestamp
  - Next button

**Step 2: Weighbridge Selection**
- Same as tare
- Ideally same weighbridge as tare (but not required)

**Step 3: Gross Weight Capture**
- Same UI as tare weight capture
- Live scale display or manual entry
- Gross weight field (number input)
- Capture button

**Step 4: Net Weight Calculation & Validation**
- Calculate: netWeight = grossWeight - tareWeight
- Display:
  - Tare Weight: {tare} tons
  - Gross Weight: {gross} tons
  - **Net Weight: {net} tons** (large, prominent)
- Validation checks:

  **Overload Check:**
  - Compare net weight to order daily weight limit OR truck capacity
  - If > threshold (e.g., weighbridge.overloadThreshold = 5%):
    - Show red alert: "OVERLOAD DETECTED: {net} tons exceeds limit by {percentage}%"
    - Send notification to users with "weighbridge.overload" enabled
    - Display: "Truck MUST offload excess weight before proceeding"
    - Block ticket completion
    - "Offload & Re-Weigh" button

  **Underweight Check:**
  - If < threshold (e.g., weighbridge.underweightThreshold = 10% of expected):
    - Show yellow warning: "Underweight: {net} tons is {percentage}% below expected"
    - Send notification to users with "weighbridge.underweight" enabled
    - Allow to proceed with confirmation

  **Weight Limit Violation:**
  - Check against order.dailyWeightLimit
  - If today's total weight + net > dailyWeightLimit:
    - Show warning: "Daily weight limit exceeded"
    - Send notification to users with "weighbridge.violations" enabled
    - Option to override (if user has "weighbridge.override" permission)

- If all validations pass or overridden:
  - Next button

**Step 5: Seal Recording (if applicable)**
- If order.sealRequired = true:
  - Display seal numbers from security entry
  - Confirm seals intact (checkbox)
  - If seals broken/missing:
    - Red alert + send notification to users with "security.sealMismatch" enabled
    - Require supervisor override
- If no seals required: Skip

**Step 6: Ticket Completion**
- Update weighing_record:
  - status = 'completed'
  - grossWeight = captured weight
  - netWeight = calculated
  - grossTimestamp = now
  - overloadFlag = true/false
  - underweightFlag = true/false
  - sealNumbers = from entry (if applicable)
- Update order:
  - completedWeight += netWeight
  - completedTrips += 1
  - If completedWeight >= totalWeight: status = 'completed', send "order.completed" notification
- Display final ticket:
  - Ticket number
  - Truck, driver, order
  - Tare, gross, net weights
  - Seal numbers
  - Operator name
  - Timestamp
  - Overload/underweight warnings (if any)
- Print button (PDF)
- "Complete Another" button

**Methods/Functions:**
- `WeighingRecordService.findTareRecord(assetId: string)` - Find incomplete tare
- `WeighingRecordService.complete(id: string, grossData: GrossWeightInput)` - Update to completed
- `WeighingRecordService.calculateNetWeight(gross: number, tare: number)` - Net calculation
- `WeighingRecordService.checkOverload(netWeight: number, limit: number, threshold: number)` - Overload validation
- `WeighingRecordService.checkUnderweight(netWeight: number, expected: number, threshold: number)` - Underweight validation
- `OrderService.updateProgress(orderId: string, netWeight: number)` - Update order stats
- `OrderService.checkCompletion(orderId: string)` - Check if order complete

**Data Model:**
Reference `docs/data-model.md` → `weighing_records` collection

**Acceptance Criteria:**
- ✅ Tare record found and linked
- ✅ Gross weight captured
- ✅ Net weight calculated correctly
- ✅ Overload detection works and blocks ticket
- ✅ Underweight warning shown
- ✅ Daily limit validation works
- ✅ Override permission respected
- ✅ Seals verified if required
- ✅ Order progress updated
- ✅ Order completion detected
- ✅ Notifications sent for violations

---

## Phase 7: Dashboard

### Overview
Implement role-based dashboards with different views for mine companies, transporter companies, and logistics coordinator companies. Each company type sees relevant metrics and data.

---

### 7.1 Dashboard for Mine Companies
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

### 7.3 Dashboard for Logistics Coordinator Companies
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

### 7.4 Global Admin Dashboard (Optional Enhancement)
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

## Phase 8: Notifications

### Overview
Implement automated email notification system triggered by events throughout the application.

---

### 8.1 Notification Sending Service
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

### 8.2 Notification History
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

## Phase 9: Audit Logging

### Overview
Comprehensive audit logging system to track all user actions for compliance, debugging, and security.

---

### 9.1 Audit Logging Implementation
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
  assetType: "truck",
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
