# Phase 2 Testing Guide

## Overview

This guide provides step-by-step instructions to test all Phase 2 Administrative Configuration features. Phase 2 includes master data management required before orders can be created.

**Testing Account:**
- Email: `dev@newton.co.za`
- Password: `NewtonDev123!`
- Role: Global Administrator (full access)

---

## Prerequisites

1. ✅ Seed script has been run successfully
2. ✅ Dev server is running on `http://localhost:3000`
3. ✅ You are logged in as `dev@newton.co.za`

---

## Test Suite

### 1. Product Management (2.1)

**Location:** `/admin/products`

#### Test 1.1: View Products List
**Steps:**
1. Navigate to Products page via sidebar/top navigation
2. Verify you see 6 products seeded:
   - Gold Ore (AU-001)
   - Platinum Ore (PT-001)
   - Diamond Ore (DI-001)
   - Iron Ore (FE-001)
   - Chrome Ore (CR-001)
   - Coal (CO-001)

**Expected Results:**
- ✅ All products display with name, code, and specifications
- ✅ Each product shows "Active" badge
- ✅ Search bar is present
- ✅ "Add Product" button visible

#### Test 1.2: Search Products
**Steps:**
1. Type "Gold" in search bar
2. Type "AU-001" in search bar
3. Clear search

**Expected Results:**
- ✅ Search filters products by name
- ✅ Search filters products by code
- ✅ Search is case-insensitive
- ✅ Results update in real-time (debounced)

#### Test 1.3: Create New Product
**Steps:**
1. Click "Add Product" button
2. Fill in:
   - Product Name: "Test Mineral"
   - Product Code: "TEST-001"
   - Specifications: "Test specifications"
   - Active: Checked
3. Click "Create Product"

**Expected Results:**
- ✅ Modal opens with form
- ✅ Required fields are validated
- ✅ Success toast appears: "Product created successfully"
- ✅ Modal closes
- ✅ New product appears in list
- ✅ Product is active

#### Test 1.4: Edit Product
**Steps:**
1. Click "Edit" button on any product
2. Change Product Name to "Updated Name"
3. Click "Update Product"

**Expected Results:**
- ✅ Modal opens with pre-filled data
- ✅ Success toast appears: "Product updated successfully"
- ✅ Product name updates in list

#### Test 1.5: Toggle Product Status
**Steps:**
1. Click toggle button (green switch icon) on any product
2. Observe status change
3. Toggle again to reactivate

**Expected Results:**
- ✅ Status badge changes from "Active" to "Inactive"
- ✅ Toggle icon changes color (green → gray)
- ✅ Success toast appears

#### Test 1.6: Delete Product (Unused)
**Steps:**
1. Click "Delete" button on "Test Mineral" product
2. Confirm deletion in dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Success toast appears: "Product deleted successfully"
- ✅ Product removed from list

#### Test 1.7: Delete Product (In Use) - Future Test
**Note:** This test can only be performed after Phase 3 when orders exist.

**Steps:**
1. Create an order using a product
2. Try to delete that product
3. Observe prevention message

**Expected Results:**
- ✅ Warning dialog appears
- ✅ Message: "Cannot delete - product is in use"
- ✅ Delete button disabled

---

### 2. Client Management (2.2)

**Location:** `/admin/clients`

#### Test 2.1: View Clients List
**Steps:**
1. Navigate to Clients page
2. Verify you see 2 clients seeded:
   - ABC Mining Solutions
   - XYZ Minerals Corp

**Expected Results:**
- ✅ Both clients display with full details
- ✅ Contact information visible (name, email, phone)
- ✅ Registration and VAT numbers shown
- ✅ Physical addresses displayed
- ✅ All clients show "Active" badge

#### Test 2.2: Search Clients
**Steps:**
1. Type "ABC" in search bar
2. Type registration number "2020/123456/07"
3. Type VAT number "4123456789"
4. Clear search

**Expected Results:**
- ✅ Search by name works
- ✅ Search by registration number works
- ✅ Search by VAT number works
- ✅ Real-time filtering (debounced)

#### Test 2.3: Create New Client
**Steps:**
1. Click "Add Client" button
2. Fill in ALL required fields:
   - Client Name: "Test Mining Co"
   - Registration Number: "2025/999999/07"
   - VAT Number: "4999999999"
   - Physical Address: "123 Test St, Test City"
   - Contact Person Name: "Test Person"
   - Contact Email: "test@testmining.co.za"
   - Contact Phone: "+27821234567"
   - Allowed Sites: Select at least one site
   - Active: Checked
3. Click "Create Client"

**Expected Results:**
- ✅ Modal opens with form
- ✅ Email validation works (try invalid email)
- ✅ Phone validation works (try invalid phone)
- ✅ Sites dropdown shows all active sites
- ✅ Multi-select works for allowed sites
- ✅ Success toast appears
- ✅ New client appears in list

#### Test 2.4: Edit Client
**Steps:**
1. Click "Edit" button on any client
2. Change contact email
3. Add/remove allowed sites
4. Click "Update Client"

**Expected Results:**
- ✅ Modal opens with pre-filled data
- ✅ All fields editable
- ✅ Site selection updates
- ✅ Success toast appears

#### Test 2.5: Toggle Client Status
**Steps:**
1. Toggle any client to inactive
2. Verify status badge changes

**Expected Results:**
- ✅ Status changes to "Inactive"
- ✅ Success toast appears

#### Test 2.6: Delete Client
**Steps:**
1. Click "Delete" on "Test Mining Co"
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Client deleted successfully
- ✅ Client removed from list

---

### 3. Site Management (2.3)

**Location:** `/admin/sites`

#### Test 3.1: View Sites List
**Steps:**
1. Navigate to Sites page
2. Verify you see 4 sites seeded:
   - North Collection Point (collection)
   - South Collection Point (collection)
   - Main Processing Plant (destination)
   - Secondary Processing Facility (destination)

**Expected Results:**
- ✅ All sites display with name, type, and address
- ✅ Site type badges shown (Collection/Destination)
- ✅ "Contact assigned" indicator visible
- ✅ All sites show "Active" badge

#### Test 3.2: Filter by Site Type
**Steps:**
1. Select "Collection" from type filter dropdown
2. Select "Destination" from type filter dropdown
3. Select "All Types"

**Expected Results:**
- ✅ Only collection sites shown
- ✅ Only destination sites shown
- ✅ All sites shown

#### Test 3.3: Search Sites
**Steps:**
1. Type "North" in search bar
2. Type address fragment "Processing"
3. Clear search

**Expected Results:**
- ✅ Search by name works
- ✅ Search by address works
- ✅ Real-time filtering

#### Test 3.4: Create New Site
**Steps:**
1. Click "Add Site" button
2. Fill in:
   - Site Name: "Test Site"
   - Site Type: Collection (radio button)
   - Physical Address: "999 Test Rd, Test City"
   - Contact Person: Select a user from dropdown (only shows users with phone numbers)
   - Operating Hours: Set custom hours for each day
     - Use "Closed" checkbox for Sunday
     - Set different hours for different days
   - Active: Checked
3. Click "Create Site"

**Expected Results:**
- ✅ Modal opens with form
- ✅ Contact Person dropdown only shows users with phone numbers
- ✅ Operating hours editor displays for all 7 days
- ✅ "Closed" checkbox disables time inputs
- ✅ Time validation works (open < close)
- ✅ Success toast appears
- ✅ New site appears in list

#### Test 3.5: Edit Site Operating Hours
**Steps:**
1. Click "Edit" on any site
2. Scroll to operating hours section
3. Change Monday hours from 06:00-18:00 to 07:00-17:00
4. Mark Saturday as "Closed"
5. Click "Update Site"

**Expected Results:**
- ✅ Modal opens with pre-filled operating hours
- ✅ Time inputs are editable
- ✅ "Closed" checkbox works correctly
- ✅ Success toast appears

#### Test 3.6: Validate Contact Person Phone Number
**Steps:**
1. Create a new user WITHOUT a phone number
2. Try to create a site with that user as contact
3. Observe validation

**Expected Results:**
- ✅ User without phone doesn't appear in contact dropdown
- ✅ Helper text: "Only users with phone numbers are shown"

#### Test 3.7: Toggle Site Status
**Steps:**
1. Toggle any site to inactive

**Expected Results:**
- ✅ Status changes to "Inactive"
- ✅ Success toast appears

#### Test 3.8: Delete Site
**Steps:**
1. Click "Delete" on "Test Site"
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Site deleted successfully

---

### 4. Enhanced User Management (2.4)

**Location:** `/admin/users`

#### Test 4.1: View Users List with Login Indicators
**Steps:**
1. Navigate to Users page
2. Observe user avatars
3. Look for login capability indicators

**Expected Results:**
- ✅ Admin user shows:
  - 🔑 Green KeyRound icon (small badge on avatar)
  - "Login User" badge
- ✅ Contact users show:
  - 👤 Blue UserCircle2 icon (small badge on avatar)
  - "Contact Only" badge
- ✅ Hover over badge shows tooltip ("Can log in" or "Contact only")

#### Test 4.2: Company Filter (Global Admin Only)
**Steps:**
1. Observe company filter dropdown at top
2. Select "All Companies"
3. Select specific company

**Expected Results:**
- ✅ Dropdown shows all companies
- ✅ "All Companies" option available
- ✅ User list filters by selected company
- ✅ Company name displayed under each user

#### Test 4.3: Search Users
**Steps:**
1. Type user's first name
2. Type user's email
3. Type phone number
4. Clear search

**Expected Results:**
- ✅ Search by name works
- ✅ Search by email works
- ✅ Search by phone works
- ✅ Real-time filtering

#### Test 4.4: Filter by Status
**Steps:**
1. Select "Active" from status filter
2. Select "Inactive" from status filter
3. Select "All Status"

**Expected Results:**
- ✅ Only active users shown
- ✅ Only inactive users shown
- ✅ All users shown

#### Test 4.5: Manage User Roles
**Steps:**
1. Click "More Actions" (three dots) on a user
2. Select "Manage Roles"
3. In the modal:
   - View current role (if any)
   - Click "Add" on a different role
   - Remove the old role if needed
4. Click "Save Roles"

**Expected Results:**
- ✅ Modal opens showing current role
- ✅ Available roles section shows all company roles
- ✅ Add/Remove buttons work
- ✅ Only ONE role can be assigned (single role model)
- ✅ Success toast appears
- ✅ Role updates for user

#### Test 4.6: Edit Permission Overrides
**Steps:**
1. Click "More Actions" on a user
2. Select "Edit Permissions"
3. In the modal:
   - View permission categories (7 categories)
   - Change a permission from "Use Role Default" to "Full Access"
   - Change another to "No Access"
   - View the "Overridden" badge appear
4. Click "Save Permissions"

**Expected Results:**
- ✅ Modal opens with permission tree
- ✅ 7 categories shown:
  - Asset Management
  - Order Management
  - Pre-Booking Management
  - Operational Flow Permissions
  - Administrative Permissions
  - Reporting
  - Transporter-Specific
- ✅ Each permission has dropdown: Use Role Default / No Access / View Only / Full Access
- ✅ "Overridden" badge shows when not using default
- ✅ Success toast appears

#### Test 4.7: Reset Permission Overrides
**Steps:**
1. Open "Edit Permissions" for user with overrides
2. Click "Reset to Defaults" button
3. Confirm action

**Expected Results:**
- ✅ All overrides cleared
- ✅ All dropdowns return to "Use Role Default"
- ✅ Success toast appears

#### Test 4.8: Move User to Another Company (Global Admin Only)
**Steps:**
1. Click "More Actions" on a non-admin user
2. Select "Move to Another Company"
3. In the modal:
   - View current company (read-only)
   - Select new company from dropdown
   - Read warning message
   - Check confirmation checkbox
4. Click "Move" button

**Expected Results:**
- ✅ Modal opens with warning message
- ✅ Warning explains data will be cleared:
  - Roles removed
  - Permission overrides reset
  - Notification preferences cleared
- ✅ Confirmation checkbox required
- ✅ Move button disabled until confirmed
- ✅ Success toast appears
- ✅ User moves to new company

#### Test 4.9: Toggle User Status
**Steps:**
1. Click toggle button on any user
2. Observe status change

**Expected Results:**
- ✅ Status changes between Active/Inactive
- ✅ Success toast appears

---

### 5. Role Management (2.5)

**Location:** `/admin/roles`

#### Test 5.1: View Roles List
**Steps:**
1. Navigate to Roles page
2. Verify you see 10 default roles:
   - Newton Administrator
   - Site Administrator
   - Logistics Coordinator
   - Allocation Officer
   - Transporter
   - Induction Officer
   - Weighbridge Supervisor
   - Weighbridge Operator
   - Security Personnel
   - Contact (for contact-only users)

**Expected Results:**
- ✅ All 10 roles displayed
- ✅ Each shows description
- ✅ "Number of users assigned" column visible
- ✅ All roles show "Active" badge

#### Test 5.2: Search Roles
**Steps:**
1. Type "Admin" in search bar
2. Type "Weighbridge" in search bar
3. Clear search

**Expected Results:**
- ✅ Search filters by role name
- ✅ Real-time filtering

#### Test 5.3: Create New Role
**Steps:**
1. Click "Add Role" button
2. Fill in:
   - Role Name: "Test Manager"
   - Description: "Test role for managers"
   - Permissions: Check multiple permissions across categories:
     - Asset Management: "View Assets", "Add Assets"
     - Order Management: "View Orders", "Create Orders"
     - Administrative: "User Management"
   - Active: Checked
3. Click "Create Role"

**Expected Results:**
- ✅ Modal opens with form
- ✅ Permission selector shows 7 categories with grouped permissions
- ✅ Checkboxes for each permission
- ✅ "Select All" / "Deselect All" per category works
- ✅ Success toast appears
- ✅ New role appears in list

#### Test 5.4: Edit Role Permissions
**Steps:**
1. Click "Edit" on "Test Manager" role
2. Add more permissions
3. Remove some permissions
4. Click "Update Role"

**Expected Results:**
- ✅ Modal opens with current permissions checked
- ✅ Permission changes save correctly
- ✅ Success toast appears

#### Test 5.5: Delete Role (Not Assigned)
**Steps:**
1. Click "Delete" on "Test Manager" role (not assigned to users)
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog: "Are you sure you want to delete this role?"
- ✅ Success toast appears
- ✅ Role removed from list

#### Test 5.6: Attempt to Delete Role (Assigned to Users)
**Steps:**
1. Create a new role
2. Assign it to a user via Users page → Manage Roles
3. Try to delete that role
4. Observe prevention

**Expected Results:**
- ✅ Warning dialog appears
- ✅ Message: "Cannot delete role - {count} user(s) are assigned to this role"
- ✅ Delete action blocked
- ✅ Dialog only has "Cancel" button (no Delete button)

#### Test 5.7: Toggle Role Status
**Steps:**
1. Toggle any role to inactive

**Expected Results:**
- ✅ Status changes to "Inactive"
- ✅ Success toast appears
- ✅ Role no longer appears in user assignment dropdowns

---

### 6. Notification Templates (2.6)

**Location:** `/admin/notifications`

#### Test 6.1: View Templates List
**Steps:**
1. Navigate to Notifications page
2. Verify you see category tabs:
   - All
   - Asset
   - Order
   - Weighbridge
   - Security
   - PreBooking
   - Driver
3. Count templates in each category

**Expected Results:**
- ✅ 26 total templates visible in "All" tab
- ✅ Asset: 4 templates
- ✅ Order: 5 templates
- ✅ Weighbridge: 4 templates
- ✅ Security: 9 templates (largest category)
- ✅ PreBooking: 2 templates
- ✅ Driver: 2 templates

#### Test 6.2: Filter by Category
**Steps:**
1. Click each category tab
2. Observe filtered results

**Expected Results:**
- ✅ Only templates from selected category shown
- ✅ Tab highlighting works
- ✅ Counts match expectations

#### Test 6.3: Edit Template
**Steps:**
1. Click "Edit" on "Asset Added" template
2. In the modal:
   - View current subject and body
   - Modify subject: "New Asset Added - {{assetType}} {{registrationNumber}}"
   - Modify body: Add custom text
   - View available placeholders sidebar
3. Click "Preview" tab
4. View rendered preview with sample data
5. Click "Editor" tab to return
6. Click "Save Template"

**Expected Results:**
- ✅ Modal opens with tabs: Editor | Preview
- ✅ Subject and body fields editable
- ✅ Placeholders sidebar shows grouped placeholders:
  - General (userName, companyName, date, time)
  - Asset (assetType, registrationNumber, fleetNumber)
  - Order (orderNumber, productName, weight)
  - Weighbridge (weighbridgeName)
  - Other (reason, expiryDate, etc.)
- ✅ Each placeholder has description
- ✅ Click to copy placeholder
- ✅ Preview tab shows rendered HTML with sample data
- ✅ Placeholders replaced with sample values
- ✅ Success toast appears

#### Test 6.4: Send Test Email
**Steps:**
1. Edit any template
2. Click "Send Test Email" button
3. Observe confirmation

**Expected Results:**
- ✅ Button is enabled
- ✅ Confirmation toast appears
- ✅ Email sent to your user email (check inbox)
- ✅ Email contains rendered template with sample data

#### Test 6.5: Reset Template to Default
**Steps:**
1. Edit a template and make significant changes
2. Save the changes
3. Re-open the template
4. Click "Reset to Default" button
5. Confirm reset

**Expected Results:**
- ✅ Button is visible
- ✅ Confirmation dialog appears
- ✅ Template reverts to original default
- ✅ Success toast appears

#### Test 6.6: Verify All Notification Types
**Steps:**
1. Go through each category
2. Verify all expected templates exist:

**Asset (4):**
- Asset Added
- Asset Made Inactive
- Asset Edited
- Asset Deleted

**Order (5):**
- Order Created
- Order Allocated
- Order Cancelled
- Order Completed
- Order Expiring Soon

**Weighbridge (4):**
- Overload Detected
- Underweight Detected
- Weight Limit Violations
- Manual Weight Override Used

**Security (9):**
- Invalid/Expired License
- Unbooked Truck Arrival
- Truck Arrival No Active Order
- Incorrect Seals
- Seal Number Mismatch
- Unregistered Asset Attempting Entry
- Inactive Entity Attempted Entry
- Truck Left Without Completing Process

**PreBooking (2):**
- Pre-Booking Created
- Pre-Booking Late Arrival

**Driver (2):**
- Driver License Expiring (7 days)
- Driver License Expiring (30 days)

**Expected Results:**
- ✅ All 26 templates exist
- ✅ Each has appropriate placeholders
- ✅ Professional formatting
- ✅ All are company-scoped

---

### 7. User Notification Preferences (2.7)

**Location:** `/admin/users` → User Actions → "Edit Notifications" (if implemented) OR `/settings` → Notifications tab

**Note:** Based on the implementation, this might be in the user's own settings page rather than the admin users page.

#### Test 7.1: View Notification Preferences
**Steps:**
1. Navigate to your user settings
2. Find Notification Preferences section
3. View all notification categories

**Expected Results:**
- ✅ 6 categories of notifications:
  - Asset Notifications (4)
  - Order Notifications (5)
  - Weighbridge Notifications (4)
  - Pre-Booking & Scheduling (2)
  - Security & Compliance (9)
  - Asset & Driver Alerts (2)
- ✅ Each notification has checkbox
- ✅ Current preferences loaded from user document

#### Test 7.2: Toggle Notification Preferences
**Steps:**
1. Uncheck "Asset Added"
2. Check "Asset Made Inactive" (if unchecked)
3. Change several other preferences
4. Click "Save Preferences"

**Expected Results:**
- ✅ Checkboxes toggle correctly
- ✅ Success toast appears
- ✅ Preferences persist in user document
- ✅ Reload page - preferences maintained

#### Test 7.3: Select/Deselect All per Category
**Steps:**
1. Click "Select All" for Asset Notifications
2. Click "Deselect All" for Order Notifications

**Expected Results:**
- ✅ All checkboxes in category toggle
- ✅ Changes are immediate

#### Test 7.4: Set Preferred Email
**Steps:**
1. Find "Preferred Email" field
2. Enter different email: `alternative@example.com`
3. Save preferences

**Expected Results:**
- ✅ Field accepts valid email
- ✅ Email validation works
- ✅ Preferred email saved to user document
- ✅ System will send notifications to this email

#### Test 7.5: Verify Default Preferences for New Users
**Steps:**
1. Create a new user via Users page
2. Check that user's notification preferences

**Expected Results:**
- ✅ All notification preferences set to default values
- ✅ Important notifications enabled by default
- ✅ Less critical notifications can be disabled

---

### 8. System-Wide Settings (2.8)

**Location:** `/admin/companies` → Edit Company → "Fleet" tab

**Note:** This was implemented in Phase 1 as part of Company Management.

#### Test 8.1: View Fleet Settings
**Steps:**
1. Navigate to Companies page
2. Edit "Dev Company"
3. Click "Fleet" tab

**Expected Results:**
- ✅ "Enable Fleet Number" checkbox visible
- ✅ "Fleet Number Label" input field
- ✅ "Enable Transporter Groups" checkbox visible
- ✅ "Transporter Group Label" input field
- ✅ "Group Options" tag input (comma-separated)

#### Test 8.2: Configure Fleet Number Setting
**Steps:**
1. Check "Enable Fleet Number"
2. Set label to "Vehicle Number"
3. Save company

**Expected Results:**
- ✅ Setting saves successfully
- ✅ Fleet number field will appear in asset forms (Phase 3)

#### Test 8.3: Configure Transporter Groups
**Steps:**
1. Check "Enable Transporter Groups"
2. Set label to "Region"
3. Add group options: "North, South, East, West"
4. Save company

**Expected Results:**
- ✅ Setting saves successfully
- ✅ Tag input accepts comma-separated values
- ✅ Tags display correctly
- ✅ Group dropdown will appear in forms with these options

---

## Integration Tests

### Integration Test 1: Complete Workflow
**Scenario:** Set up all master data for a new mining operation

**Steps:**
1. Create a new product: "Iron Ore Grade A"
2. Create a new client: "Mining Corp Ltd"
3. Create a new collection site: "North Mine Entrance"
4. Create a new destination site: "Processing Plant 3"
5. Link client to both sites (edit client, add allowed sites)
6. Create a new role: "Site Supervisor"
7. Create a new user with "Site Supervisor" role
8. Customize notification template for "Order Created"

**Expected Results:**
- ✅ All entities created successfully
- ✅ Relationships work (client → sites)
- ✅ User can be assigned custom role
- ✅ System ready for order creation (Phase 3)

### Integration Test 2: Permission Cascade
**Scenario:** Test permission inheritance and overrides

**Steps:**
1. Create role "Limited Manager" with only view permissions
2. Assign role to a test user
3. Add permission override: "orders.create" = Full Access
4. Verify effective permissions

**Expected Results:**
- ✅ User inherits view permissions from role
- ✅ Override adds create permission
- ✅ User can create orders but cannot delete assets
- ✅ Permission system respects hierarchy

### Integration Test 3: Data Validation
**Scenario:** Test all validation rules

**Steps:**
1. Try to create product with empty name → Blocked
2. Try to create client with invalid email → Blocked
3. Try to create site with invalid operating hours → Blocked
4. Try to delete role assigned to users → Blocked
5. Try to delete product used in orders → Blocked (Phase 3)

**Expected Results:**
- ✅ All validations work correctly
- ✅ User-friendly error messages
- ✅ No data corruption possible

---

## Performance Tests

### Performance Test 1: Search Performance
**Steps:**
1. Test search on products list (small dataset)
2. Test search on users list (11 users)
3. Verify debouncing (300ms delay)

**Expected Results:**
- ✅ Search results return < 100ms
- ✅ Debouncing prevents excessive queries
- ✅ No lag when typing

### Performance Test 2: Real-time Updates
**Steps:**
1. Open Products page in two browser windows
2. Create product in window 1
3. Observe window 2

**Expected Results:**
- ✅ New product appears in window 2 automatically
- ✅ Firebase onSnapshot listener working
- ✅ No manual refresh needed

---

## Accessibility Tests

### Accessibility Test 1: Keyboard Navigation
**Steps:**
1. Navigate entire UI using only keyboard (Tab, Enter, Escape)
2. Test all modals (open, close, save)
3. Test all forms (input, select, checkbox)

**Expected Results:**
- ✅ All interactive elements reachable via Tab
- ✅ Escape closes modals
- ✅ Enter submits forms
- ✅ Focus indicators visible

### Accessibility Test 2: Screen Reader Support
**Steps:**
1. Enable screen reader (VoiceOver on Mac)
2. Navigate through products list
3. Listen to form labels and buttons

**Expected Results:**
- ✅ All labels properly associated with inputs
- ✅ Buttons have descriptive text
- ✅ Status messages announced (toasts)

---

## Edge Cases

### Edge Case 1: Empty States
**Steps:**
1. Delete all products
2. Observe empty state message
3. Repeat for clients, sites

**Expected Results:**
- ✅ User-friendly message: "No [items] found"
- ✅ "Add [Item]" button still accessible
- ✅ No errors in console

### Edge Case 2: Long Names
**Steps:**
1. Create product with very long name (100+ characters)
2. Create client with long company name
3. Verify display truncation

**Expected Results:**
- ✅ Text truncates gracefully (ellipsis)
- ✅ Hover shows full text (title attribute)
- ✅ No layout breaking

### Edge Case 3: Special Characters
**Steps:**
1. Create product with name: "Gold & Silver Ore (Premium)"
2. Create client with special characters in address
3. Test search with special characters

**Expected Results:**
- ✅ Special characters saved correctly
- ✅ Search finds items with special characters
- ✅ Display is correct

### Edge Case 4: Concurrent Edits
**Steps:**
1. Open same product in two windows
2. Edit in window 1, save
3. Edit in window 2, try to save

**Expected Results:**
- ✅ Window 2 updates with changes from window 1 (real-time)
- ✅ No data corruption
- ✅ Last write wins (Firestore behavior)

---

## Regression Tests

### Regression Test 1: Phase 1 Still Works
**Steps:**
1. Test company management (from Phase 1)
2. Test user creation (from Phase 1)
3. Test authentication

**Expected Results:**
- ✅ All Phase 1 features still functional
- ✅ No breaking changes
- ✅ New Phase 2 features integrate smoothly

### Regression Test 2: Build Verification
**Steps:**
1. Run: `bun run build`
2. Check for TypeScript errors
3. Check for warnings

**Expected Results:**
- ✅ Build succeeds
- ✅ No TypeScript errors
- ✅ Only acceptable warnings (unused variables)

---

## Bug Reporting Template

If you find any issues during testing, report them with:

```markdown
**Bug Title:** [Short description]

**Location:** [Page/Component]

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[If applicable]

**Browser:** [Chrome/Safari/Firefox]

**Console Errors:**
[Any errors in browser console]
```

---

## Summary Checklist

After completing all tests, verify:

- ✅ All 8 Phase 2 features working
- ✅ CRUD operations functional for all entities
- ✅ Search and filtering work correctly
- ✅ Validation rules enforced
- ✅ Real-time updates working
- ✅ Toast notifications appearing
- ✅ Permission system functioning
- ✅ No console errors
- ✅ Mobile responsive design
- ✅ Keyboard navigation works
- ✅ Phase 1 features still functional

---

## Test Completion Sign-off

**Tester Name:** _________________

**Date:** _________________

**Phase 2 Status:** ⬜ Pass | ⬜ Fail

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Next Steps:** Proceed to Phase 3 - Asset Management
