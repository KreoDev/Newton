# Newton Web Application - Testing Checklist

## Phase 1 & Phase 2 User Acceptance Testing

**Purpose**: This checklist covers all functionality implemented in Phase 1 (Core Infrastructure) and Phase 2 (Administrative Configuration). Test items are organized in the order they appear in the application's side menu.

**Test Environment**: Web Application (Desktop & Mobile browsers)

**Testing Approach**: For each section, verify CRUD operations (Create, Read, Update, Delete) and business rule validations.

---

## 1. Companies Management

**Location**: Admin → Companies

### 1.1 View Companies List

- [ ] Companies page loads without errors
- [ ] Can see list of existing companies
- [ ] Company cards display: name, type, registration number, status
- [ ] Can see company type badge (Mine/Transporter/Logistics Coordinator)
- [ ] Active/Inactive status is clearly visible
- [ ] Search bar is visible at top of page

### 1.2 Create Company - Mine Type

- [ ] Can click "Add Company" button
- [ ] Modal opens with "Add Company" title
- [ ] Can select "Mine" as company type
- [ ] **Basic Information Tab**:
  - [ ] Can enter company name (required field validation works)
  - [ ] Can enter registration number (optional)
  - [ ] Can enter VAT number (required field validation works)
  - [ ] Can enter physical address (required field validation works)
  - [ ] Can select main contact from dropdown (shows users from current company)
  - [ ] Can select multiple secondary contacts
  - [ ] Can toggle "Active" status
- [ ] **Mine Configuration Tab** (visible for Mine type):
  - [ ] Can see default operating hours for each day of week
  - [ ] Can set custom hours (open/close times)
  - [ ] Can mark days as "Closed"
  - [ ] Operating hours validate correctly (open time before close time)
- [ ] **Order Configuration Tab** (visible for Mine type):
  - [ ] Can set order number mode (Auto Only/Manual Entry)
  - [ ] Can set order number prefix
  - [ ] Can set daily truck limit
  - [ ] Can set daily weight limit
  - [ ] Can set monthly limit
  - [ ] Can set trip limit per truck
  - [ ] Can set default weight per truck
  - [ ] Can set pre-booking mode (Compulsory/Optional/Disabled)
  - [ ] Can set advance booking hours
  - [ ] Can toggle seal requirements
  - [ ] Can set default seal quantity
- [ ] **System Settings Tab** (visible for Mine type):
  - [ ] Can toggle fleet number enabled/disabled
  - [ ] Can customize fleet number label
  - [ ] Can toggle transporter group enabled/disabled
  - [ ] Can customize transporter group label
  - [ ] Can add/remove group options (e.g., North, South, East, West)
- [ ] **Security Alerts Tab** (visible for Mine type):
  - [ ] Can select primary contact for alerts
  - [ ] Can select secondary alert contacts
  - [ ] Can set escalation minutes
  - [ ] Can set QR mismatch contacts
  - [ ] Can set document failure contacts
  - [ ] Can set seal discrepancy contacts
  - [ ] Can set required response minutes
- [ ] **Groups Tab** (visible for Mine type):
  - [ ] Groups tree interface is visible
  - [ ] Can see "No groups yet" message if no groups exist
  - [ ] (Groups functionality tested in dedicated Groups section below)
- [ ] Can save company successfully
- [ ] Success toast notification appears
- [ ] New company appears in companies list
- [ ] Modal closes after successful save

### 1.3 Create Company - Transporter Type

- [ ] Can click "Add Company" button
- [ ] Can select "Transporter" as company type
- [ ] **Basic Information Tab** is visible
- [ ] **Transporter Configuration Tab** is visible (empty for now)
- [ ] **Order Configuration Tab** is NOT visible (mine-specific)
- [ ] **System Settings Tab** is NOT visible (mine-specific)
- [ ] **Security Alerts Tab** is NOT visible (mine-specific)
- [ ] **Groups Tab** is NOT visible (mine-specific)
- [ ] Can save transporter company successfully

### 1.4 Create Company - Logistics Coordinator Type

- [ ] Can click "Add Company" button
- [ ] Can select "Logistics Coordinator" as company type
- [ ] **Basic Information Tab** is visible
- [ ] **Logistics Coordinator Configuration Tab** is visible (empty for now)
- [ ] **Order Configuration Tab** is NOT visible (mine-specific)
- [ ] **System Settings Tab** is NOT visible (mine-specific)
- [ ] **Security Alerts Tab** is NOT visible (mine-specific)
- [ ] **Groups Tab** is NOT visible (mine-specific)
- [ ] Can save logistics coordinator company successfully

### 1.5 Edit Company

- [ ] Can click "Edit" button on company card
- [ ] Modal opens with "Edit Company" title
- [ ] All fields are pre-populated with existing data
- [ ] Company type is displayed but NOT editable (read-only)
- [ ] Can modify company name
- [ ] Can modify registration number
- [ ] Can modify VAT number
- [ ] Can modify physical address
- [ ] Can change main contact
- [ ] Can add/remove secondary contacts
- [ ] Can toggle active status
- [ ] For Mine companies: Can modify mine configuration
- [ ] For Mine companies: Can modify order configuration
- [ ] For Mine companies: Can modify system settings
- [ ] For Mine companies: Can modify security alerts
- [ ] For Mine companies: Can access Groups tab
- [ ] Can save changes successfully
- [ ] Success toast notification appears
- [ ] Changes reflect in companies list
- [ ] Modal closes after successful save

### 1.6 View Company (Read-Only)

- [ ] Can click "View" button on company card (FileText icon)
- [ ] Modal opens with "View Company" title
- [ ] All form fields are disabled (read-only)
- [ ] Can navigate between tabs
- [ ] Tab navigation remains functional
- [ ] Can see all company data but cannot edit
- [ ] Only "Close" button is visible (no Save button)
- [ ] Modal closes when clicking Close

### 1.7 Delete Company

- [ ] Can click "Delete" button on company card
- [ ] Confirmation dialog appears with warning message
- [ ] Can cancel deletion (company remains)
- [ ] Can confirm deletion
- [ ] **If company is in use** (has users, products, sites, etc.):
  - [ ] Error message appears preventing deletion
  - [ ] Toast notification explains why deletion failed
  - [ ] Company remains in the list
- [ ] **If company is not in use**:
  - [ ] Company is deleted successfully
  - [ ] Success toast notification appears
  - [ ] Company is removed from list

### 1.8 Search & Filter Companies

- [ ] Can type in search bar
- [ ] Companies filter as you type (by name)
- [ ] Search is case-insensitive
- [ ] Can clear search to see all companies
- [ ] No results message appears when no matches found

### 1.9 Company Switching (Global Admin)

- [ ] Top navigation shows current company name
- [ ] Can click company name to open company switcher
- [ ] Dropdown shows all active companies
- [ ] Can select different company from dropdown
- [ ] Page refreshes/updates with new company context
- [ ] Success toast shows company switch
- [ ] Data on all pages now reflects new company

---

## 2. Organizational Groups (Mine Companies Only)

**Location**: Admin → Companies → Edit Company → Groups Tab (Mine companies only)

**Note**: This feature is only available for companies with `companyType: "mine"`. Transporter and Logistics Coordinator companies do not see this tab.

### 2.1 View Groups Tree

- [ ] Open a Mine company in edit mode
- [ ] Navigate to "Groups" tab
- [ ] Can see groups tree interface
- [ ] If no groups exist: "No groups yet" message displays
- [ ] If groups exist: Tree displays with proper hierarchy
- [ ] Parent groups show expand/collapse icons
- [ ] Expanded groups show child groups indented
- [ ] Collapsed groups hide child groups

### 2.2 Create Root Group

- [ ] Can see "Add Root Group" button at top
- [ ] Click "Add Root Group" button
- [ ] Inline form appears for new group
- [ ] Can enter group name (required)
- [ ] Can enter group description (optional)
- [ ] Can save new root group
- [ ] Success toast appears
- [ ] New root group appears in tree at level 0
- [ ] Can cancel adding root group (form disappears)

### 2.3 Create Child Group (Subgroup)

- [ ] Hover over existing group
- [ ] "Add Child" button appears
- [ ] Click "Add Child" button
- [ ] Inline form appears indented under parent
- [ ] Can enter child group name (required)
- [ ] Can enter child group description (optional)
- [ ] Can save new child group
- [ ] Success toast appears
- [ ] New child group appears indented under parent
- [ ] Parent shows expand/collapse icon if it didn't before
- [ ] Child group displays correct level indicator

### 2.4 Create Nested Subgroups (Unlimited Depth)

- [ ] Can add child to existing child group (level 2)
- [ ] Can add child to level 2 group (level 3)
- [ ] Can continue nesting groups (no depth limit)
- [ ] Each level displays with correct indentation
- [ ] Path indicators (breadcrumbs) show correct ancestry

### 2.5 Edit Group

- [ ] Hover over existing group
- [ ] "Edit" button appears
- [ ] Click "Edit" button
- [ ] Inline edit form appears with pre-populated data
- [ ] Can modify group name
- [ ] Can modify group description
- [ ] Can save changes
- [ ] Success toast appears
- [ ] Updated group name/description displays
- [ ] Can cancel editing (changes discarded)

### 2.6 Delete Group

- [ ] Hover over existing group
- [ ] "Delete" button appears
- [ ] Click "Delete" button
- [ ] Confirmation dialog appears
- [ ] **If group has child groups**:
  - [ ] Error message appears preventing deletion
  - [ ] Toast explains group has children
  - [ ] Group remains in tree
- [ ] **If group is assigned to sites**:
  - [ ] Error message appears preventing deletion
  - [ ] Toast explains group is in use by sites
  - [ ] Group remains in tree
- [ ] **If group has no children and no site assignments**:
  - [ ] Confirmation dialog shows "Are you sure?"
  - [ ] Can cancel deletion
  - [ ] Can confirm deletion
  - [ ] Group is removed from tree
  - [ ] Success toast appears
  - [ ] Parent group updates if it no longer has children

### 2.7 Toggle Active/Inactive Status

- [ ] Can see toggle switch for each group
- [ ] Can toggle group status on/off
- [ ] Inactive groups display with visual indicator (grayed out)
- [ ] Status change saves immediately
- [ ] Toast notification confirms status change
- [ ] Child groups remain visible when parent is inactive (structure preserved)

### 2.8 Expand/Collapse Groups

- [ ] Parent groups show arrow/chevron icon
- [ ] Click arrow to expand group (show children)
- [ ] Click arrow again to collapse group (hide children)
- [ ] Expand/collapse state persists during session
- [ ] Can expand/collapse multiple branches independently

### 2.9 Groups Tree Navigation

- [ ] Tree structure is visually clear with indentation
- [ ] Level indicators (lines/connectors) show hierarchy
- [ ] Can scroll tree if it exceeds viewport height
- [ ] All group management buttons are accessible
- [ ] Tree updates in real-time when groups are added/edited/deleted

### 2.10 Groups Not Visible for Non-Mine Companies

- [ ] Open Transporter company in edit mode
- [ ] Verify "Groups" tab is NOT present
- [ ] Open Logistics Coordinator company in edit mode
- [ ] Verify "Groups" tab is NOT present
- [ ] Verify only Mine companies have Groups tab

---

## 3. Products Management (Mine Companies Only)

**Location**: Admin → Products

**Note**: This menu item is only visible for users in Mine companies. Transporter and Logistics Coordinator company users do not see this menu item.

### 3.1 Access Control by Company Type

- [ ] **As Mine company user**: Products menu item is visible in sidebar
- [ ] **As Transporter company user**: Products menu item is NOT visible in sidebar
- [ ] **As Logistics Coordinator company user**: Products menu item is NOT visible in sidebar
- [ ] **As Global Admin in Mine company context**: Products menu item is visible

### 3.2 View Products List

- [ ] Products page loads without errors
- [ ] Can see list of products scoped to current company
- [ ] Product cards display: name, code, unit of measure, status
- [ ] Active/Inactive status is clearly visible
- [ ] Search bar is visible at top

### 3.3 Create Product

- [ ] Can click "Add Product" button
- [ ] Modal opens with "Add Product" title
- [ ] Can enter product name (required field validation works)
- [ ] Can enter product code (required field validation works)
- [ ] Can select unit of measure from dropdown (tons, kilograms, litres, cubic meters, units)
- [ ] Can enter description (optional)
- [ ] Can toggle "Active" status (default is active)
- [ ] Can save product successfully
- [ ] Success toast notification appears
- [ ] New product appears in products list
- [ ] Modal closes after successful save
- [ ] Product is scoped to current company (companyId)

### 3.4 Edit Product

- [ ] Can click "Edit" button on product card
- [ ] Modal opens with "Edit Product" title
- [ ] All fields are pre-populated with existing data
- [ ] Can modify product name
- [ ] Can modify product code
- [ ] Can change unit of measure
- [ ] Can modify description
- [ ] Can toggle active status
- [ ] Can save changes successfully
- [ ] Success toast notification appears
- [ ] Changes reflect in products list
- [ ] Modal closes after successful save

### 3.5 View Product (Read-Only)

- [ ] Can click "View" button on product card (FileText icon)
- [ ] Modal opens with "View Product" title
- [ ] All form fields are disabled (read-only)
- [ ] Can see all product data but cannot edit
- [ ] Only "Close" button is visible (no Save button)
- [ ] Modal closes when clicking Close

### 3.6 Delete Product

- [ ] Can click "Delete" button on product card
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] **If product is in use** (referenced in orders):
  - [ ] Error message appears preventing deletion
  - [ ] Toast notification explains why deletion failed
  - [ ] Product remains in the list
- [ ] **If product is not in use**:
  - [ ] Product is deleted successfully
  - [ ] Success toast notification appears
  - [ ] Product is removed from list

### 3.7 Search Products

- [ ] Can type in search bar
- [ ] Products filter as you type (by name or code)
- [ ] Search is case-insensitive
- [ ] Can clear search to see all products

### 3.8 Product Code Uniqueness

- [ ] Cannot create two products with same code in same company
- [ ] Error message appears if duplicate code is entered
- [ ] Can have same product code across different companies

---

## 4. Clients Management (Mine Companies Only)

**Location**: Admin → Clients

**Note**: This menu item is only visible for users in Mine companies.

### 4.1 Access Control by Company Type

- [ ] **As Mine company user**: Clients menu item is visible in sidebar
- [ ] **As Transporter company user**: Clients menu item is NOT visible in sidebar
- [ ] **As Logistics Coordinator company user**: Clients menu item is NOT visible in sidebar

### 4.2 View Clients List

- [ ] Clients page loads without errors
- [ ] Can see list of clients scoped to current company
- [ ] Client cards display: name, contact person, email, phone, status
- [ ] Active/Inactive status is clearly visible
- [ ] Search bar is visible at top

### 4.3 Create Client

- [ ] Can click "Add Client" button
- [ ] Modal opens with "Add Client" title
- [ ] Can enter client name (required field validation works)
- [ ] Can enter contact person name (required)
- [ ] Can enter email address (required, email format validation)
- [ ] Can enter phone number (required)
- [ ] Can enter physical address (optional)
- [ ] Can enter billing address (optional)
- [ ] Can enter VAT number (optional)
- [ ] Can enter registration number (optional)
- [ ] Can toggle "Active" status (default is active)
- [ ] Can save client successfully
- [ ] Success toast notification appears
- [ ] New client appears in clients list
- [ ] Modal closes after successful save

### 4.4 Edit Client

- [ ] Can click "Edit" button on client card
- [ ] Modal opens with "Edit Client" title
- [ ] All fields are pre-populated with existing data
- [ ] Can modify all client fields
- [ ] Can toggle active status
- [ ] Can save changes successfully
- [ ] Success toast notification appears
- [ ] Changes reflect in clients list

### 4.5 View Client (Read-Only)

- [ ] Can click "View" button on client card (FileText icon)
- [ ] Modal opens with "View Client" title
- [ ] All form fields are disabled (read-only)
- [ ] Only "Close" button is visible
- [ ] Modal closes when clicking Close

### 4.6 Delete Client

- [ ] Can click "Delete" button on client card
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] **If client is in use** (referenced in orders):
  - [ ] Error message appears preventing deletion
  - [ ] Toast notification explains why deletion failed
- [ ] **If client is not in use**:
  - [ ] Client is deleted successfully
  - [ ] Success toast notification appears
  - [ ] Client is removed from list

### 4.7 Search Clients

- [ ] Can type in search bar
- [ ] Clients filter as you type (by name or contact person)
- [ ] Search is case-insensitive

---

## 5. Sites Management (Mine Companies Only)

**Location**: Admin → Sites

**Note**: This menu item is only visible for users in Mine companies.

### 5.1 Access Control by Company Type

- [ ] **As Mine company user**: Sites menu item is visible in sidebar
- [ ] **As Transporter company user**: Sites menu item is NOT visible in sidebar
- [ ] **As Logistics Coordinator company user**: Sites menu item is NOT visible in sidebar

### 5.2 View Sites List

- [ ] Sites page loads without errors
- [ ] Can see list of sites scoped to current company
- [ ] Site cards display: name, location, group assignment, contacts, status
- [ ] Active/Inactive status is clearly visible
- [ ] Search bar is visible at top

### 5.3 Create Site

- [ ] Can click "Add Site" button
- [ ] Modal opens with "Add Site" title
- [ ] **Basic Information**:
  - [ ] Can enter site name (required)
  - [ ] Can enter site code (required, unique within company)
  - [ ] Can enter location/address (required)
  - [ ] Can enter GPS coordinates (optional)
  - [ ] Can toggle "Active" status (default is active)
- [ ] **Group Assignment** (if groups exist):
  - [ ] Can see group dropdown showing organizational groups
  - [ ] Can select a group to assign site to (optional)
  - [ ] Dropdown shows hierarchical group structure
  - [ ] If no groups exist: Dropdown is empty or shows "No groups available"
- [ ] **Contacts**:
  - [ ] Can select main contact from user dropdown
  - [ ] Main contact dropdown shows users from current company
  - [ ] Can select secondary contacts (multiple selection)
  - [ ] Secondary contacts dropdown shows users from current company
- [ ] Can save site successfully
- [ ] Success toast notification appears
- [ ] New site appears in sites list
- [ ] Site displays assigned group if selected

### 5.4 Edit Site

- [ ] Can click "Edit" button on site card
- [ ] Modal opens with "Edit Site" title
- [ ] All fields are pre-populated
- [ ] Can modify site name
- [ ] Can modify site code
- [ ] Can modify location
- [ ] Can modify GPS coordinates
- [ ] Can change group assignment
- [ ] Can change main contact
- [ ] Can change secondary contacts
- [ ] Can toggle active status
- [ ] Can save changes successfully

### 5.5 View Site (Read-Only)

- [ ] Can click "View" button on site card (FileText icon)
- [ ] Modal opens with "View Site" title
- [ ] All form fields are disabled (read-only)
- [ ] Can see group assignment (if any)
- [ ] Only "Close" button is visible

### 5.6 Delete Site

- [ ] Can click "Delete" button on site card
- [ ] Confirmation dialog appears
- [ ] **If site is in use** (referenced in orders, weighbridge records):
  - [ ] Error message appears preventing deletion
  - [ ] Toast notification explains why deletion failed
- [ ] **If site is not in use**:
  - [ ] Site is deleted successfully
  - [ ] Success toast notification appears

### 5.7 Site-Group Relationship

- [ ] Sites assigned to a group display the group name
- [ ] Can filter/view sites by group (if implemented)
- [ ] Cannot delete a group that has sites assigned to it (tested in Groups section)
- [ ] Can change a site's group assignment
- [ ] Can remove group assignment from a site (set to none)

### 5.8 Search Sites

- [ ] Can type in search bar
- [ ] Sites filter as you type (by name or code)

---

## 6. Users Management

**Location**: Admin → Users

### 6.1 View Users List

- [ ] Users page loads without errors
- [ ] Can see list of users scoped to current company
- [ ] User table displays: name, email, role, status, global admin badge
- [ ] Active/Inactive status is clearly visible
- [ ] Global admin users show special badge/indicator
- [ ] Search bar is visible at top
- [ ] Can see user count

### 6.2 Create User (Regular Login User)

- [ ] Can click "Add User" button
- [ ] Modal opens with "Add User" title
- [ ] **Basic Information**:
  - [ ] Can enter first name (required)
  - [ ] Can enter last name (required)
  - [ ] Display name auto-generates from first + last name
  - [ ] Can enter email address (required, format validation)
  - [ ] Can enter phone number (required)
  - [ ] Can upload profile picture (optional)
  - [ ] Profile picture preview displays if uploaded
- [ ] **Role & Permissions**:
  - [ ] Can select role from dropdown (shows roles from system)
  - [ ] Role dropdown shows role name and description
  - [ ] Can toggle "Can Login" checkbox (default is ON)
  - [ ] Can toggle "Active" status (default is active)
  - [ ] Can toggle "Global Administrator" checkbox (default is OFF)
- [ ] **Global Administrator Elevation Security**:
  - [ ] When checking "Global Administrator" checkbox:
    - [ ] Warning message displays about global admin implications
    - [ ] Re-authentication modal appears
    - [ ] Must enter current user's password to proceed
    - [ ] If password is incorrect: Error message, checkbox reverts to OFF
    - [ ] If password is correct: User becomes global admin
    - [ ] If re-auth is cancelled: Checkbox reverts to OFF
- [ ] Can save user successfully
- [ ] Firebase Authentication account is created
- [ ] Success toast notification appears
- [ ] New user appears in users list
- [ ] User receives email (if Firebase email configured)

### 6.3 Create Contact-Only User (No Login)

- [ ] Can click "Add User" button
- [ ] Modal opens
- [ ] Enter all basic information
- [ ] **Uncheck "Can Login" checkbox**
- [ ] When "Can Login" is OFF:
  - [ ] Email field becomes optional (can be left empty)
  - [ ] No Firebase Auth account will be created
  - [ ] User is marked as contact-only
- [ ] Can save contact-only user
- [ ] Success toast notification appears
- [ ] User appears in list with "Contact Only" indicator
- [ ] No Firebase Auth account exists for this user

### 6.4 Edit User - Basic Information

- [ ] Can click "Edit" button on user row (or select "Edit User" from dropdown)
- [ ] Modal opens with "Edit User" title
- [ ] All fields are pre-populated
- [ ] Can modify first name
- [ ] Can modify last name
- [ ] Display name updates automatically
- [ ] Can modify phone number
- [ ] Can change profile picture
- [ ] Can remove profile picture
- [ ] **Cannot modify email directly** (email is read-only)
- [ ] To change email: Must use separate "Change Email" option
- [ ] Can save changes successfully

### 6.5 Edit User - Change Email

- [ ] Click dropdown menu on user row
- [ ] Select "Change Email" option
- [ ] Email change modal appears
- [ ] Can enter new email address
- [ ] Email format validation works
- [ ] Can submit new email
- [ ] Firebase Authentication email is updated
- [ ] Success toast notification appears
- [ ] User's email updates in list

### 6.6 Edit User - Change Role

- [ ] Open user in edit mode
- [ ] Can select different role from dropdown
- [ ] Role change saves successfully
- [ ] User's permissions update based on new role

### 6.7 Edit User - Toggle Global Administrator

- [ ] Open user in edit mode
- [ ] Can see "Global Administrator" checkbox
- [ ] **If user is NOT currently global admin**:
  - [ ] Checking the checkbox triggers re-authentication modal
  - [ ] Must enter current user's password
  - [ ] If password correct: User becomes global admin
  - [ ] If password incorrect: Checkbox reverts, error message displays
- [ ] **If user is ALREADY global admin**:
  - [ ] Unchecking the checkbox removes global admin status (no re-auth needed)
- [ ] Changes save successfully

### 6.8 Edit User - Toggle Active Status

- [ ] Open user in edit mode
- [ ] Can toggle "Active" status on/off
- [ ] Inactive users cannot log in
- [ ] Changes save successfully

### 6.9 Edit User - Permission Overrides

- [ ] Click dropdown menu on user row
- [ ] Select "View/Edit Permissions" option (or Shield icon option)
- [ ] Permission Override Editor modal opens
- [ ] Can see all permission categories filtered by company type:
  - [ ] Mine company: Shows all permissions including Products, Clients, Sites
  - [ ] Transporter company: NO Products, Clients, Sites permissions visible
  - [ ] Logistics Coordinator company: Minimal permission set visible
- [ ] For each permission, can set override:
  - [ ] "Use Role" (inherit from role - default)
  - [ ] "Grant" (force allow)
  - [ ] "Deny" (force deny)
- [ ] Can see current effective permission (role + override)
- [ ] Can expand/collapse permission categories
- [ ] Can save permission overrides
- [ ] Success toast notification appears
- [ ] Permission overrides apply immediately

### 6.10 View User Details (Read-Only)

- [ ] Click dropdown menu on user row
- [ ] Select "View Details" option (or FileText icon)
- [ ] View User modal opens
- [ ] All fields are read-only (disabled)
- [ ] Can see user's basic info, role, status
- [ ] Only "Close" button is visible

### 6.11 View User Roles (Read-Only)

- [ ] Click dropdown menu on user row
- [ ] Select "View Roles" option
- [ ] Modal shows user's assigned role
- [ ] Shows all permissions granted by the role
- [ ] Read-only view (cannot edit)
- [ ] Only "Close" button is visible

### 6.12 View User Permissions (Read-Only)

- [ ] Click dropdown menu on user row
- [ ] Select "View Permissions" option (or Lock icon)
- [ ] Modal shows effective permissions (role + overrides)
- [ ] Shows which permissions are from role vs overrides
- [ ] Read-only view (cannot edit)
- [ ] Only "Close" button is visible

### 6.13 Convert Login User to Contact-Only

- [ ] Select a user who has "Can Login" enabled
- [ ] Click dropdown menu on user row
- [ ] Select "Convert to Contact" option
- [ ] Confirmation dialog appears with warning
- [ ] Warning explains user will lose login access
- [ ] Can cancel conversion
- [ ] Can confirm conversion
- [ ] Firebase Auth account is deleted
- [ ] User's "Can Login" flag set to false
- [ ] Success toast notification appears
- [ ] User now shows as "Contact Only" in list

### 6.14 Convert Contact-Only to Login User

- [ ] Select a user who is contact-only (canLogin: false)
- [ ] Click dropdown menu on user row
- [ ] Select "Convert to Login User" option
- [ ] Modal appears requesting password for new account
- [ ] Can enter password (validation: min 8 characters)
- [ ] Can confirm password (must match)
- [ ] Can submit
- [ ] Firebase Auth account is created
- [ ] User's "Can Login" flag set to true
- [ ] Success toast notification appears
- [ ] User can now log in with email and password

### 6.15 Delete User

- [ ] Click dropdown menu on user row
- [ ] Select "Delete" option
- [ ] Confirmation dialog appears
- [ ] Warning explains user will be permanently deleted
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] **If user is in use** (assigned as main contact, has audit logs, etc.):
  - [ ] Error message appears preventing deletion
  - [ ] Toast explains why deletion failed
- [ ] **If user is not in use**:
  - [ ] User is deleted from Firestore
  - [ ] Firebase Auth account is deleted (if exists)
  - [ ] Success toast notification appears
  - [ ] User removed from list

### 6.16 Search Users

- [ ] Can type in search bar
- [ ] Users filter as you type (by name or email)
- [ ] Search is case-insensitive

### 6.17 User Dropdown Menu (All Actions)

- [ ] Dropdown menu appears on user row
- [ ] Shows 3 view options:
  - [ ] View Details (FileText icon)
  - [ ] View Roles (Shield icon)
  - [ ] View Permissions (Lock icon)
- [ ] Shows edit options:
  - [ ] Edit User
  - [ ] Change Email
  - [ ] View/Edit Permissions
- [ ] Shows conversion options (conditional):
  - [ ] "Convert to Contact" (if canLogin is true)
  - [ ] "Convert to Login User" (if canLogin is false)
- [ ] Shows delete option:
  - [ ] Delete User (destructive action)

### 6.18 Global Admin Restrictions

- [ ] Regular users cannot see "Manage Global Admins" permission
- [ ] Only global admins with "admin.users.manageGlobalAdmins" permission can:
  - [ ] See "Manage Global Admins" permission in role editor
  - [ ] Grant global admin status to other users
  - [ ] Edit other global admins

---

## 7. Roles Management

**Location**: Admin → Roles

### 7.1 View Roles List

- [ ] Roles page loads without errors
- [ ] Can see list of all roles (roles are global, shared across companies)
- [ ] Role cards display: name, description, permission count
- [ ] Default system roles are visible (Newton Admin, Allocation Officer, Security Guard, etc.)
- [ ] Search bar is visible at top

### 7.2 View Role Permissions

- [ ] Can click on role card to view details
- [ ] Modal shows role name and description
- [ ] Lists all permissions granted by this role
- [ ] Permissions are organized by category
- [ ] Can see which users have this role (user count)

### 7.3 Create Role

- [ ] Can click "Add Role" button
- [ ] Modal opens with "Add Role" title in full-screen mode
- [ ] Can enter role name (required)
- [ ] Can enter role description (optional)
- [ ] **Permission Selection** (filtered by company type):
  - [ ] **Mine company user**: Can see ALL permission categories:
    - [ ] Asset Management
    - [ ] Order Management
    - [ ] Pre-Booking Management
    - [ ] Operational Flow (Security, Weighbridge)
    - [ ] Administrative (including Products, Clients, Sites, Weighbridge Management)
    - [ ] Special Permissions
  - [ ] **Transporter company user**: Can see LIMITED permissions:
    - [ ] Asset Management (own assets)
    - [ ] Order Management (allocated orders only)
    - [ ] Pre-Booking Management
    - [ ] Operational Flow (Security only, NO Weighbridge)
    - [ ] Administrative (NO Products, Clients, Sites, Weighbridge Management)
    - [ ] Special Permissions
  - [ ] **Logistics Coordinator user**: Can see MINIMAL permissions:
    - [ ] Order Management (coordination only)
    - [ ] Pre-Booking Management
    - [ ] Administrative (minimal set)
- [ ] Can select/deselect individual permissions
- [ ] Can use "Select All" / "Deselect All" per category
- [ ] Permission count updates as permissions are selected
- [ ] Can save role successfully
- [ ] Success toast notification appears
- [ ] New role appears in roles list

### 7.4 Edit Role

- [ ] Can click "Edit" button on role card
- [ ] Modal opens with "Edit Role" title in full-screen mode
- [ ] Role name and description are pre-populated
- [ ] All selected permissions are pre-checked
- [ ] Can modify role name
- [ ] Can modify role description
- [ ] Can add/remove permissions (filtered by company type)
- [ ] Permission categories are filtered by current company type
- [ ] Can save changes successfully
- [ ] Success toast notification appears

### 7.5 View Role (Read-Only)

- [ ] Can click "View" button on role card (FileText icon)
- [ ] Modal opens with "View Role" title
- [ ] All form fields are disabled (read-only)
- [ ] Permission checkboxes are disabled
- [ ] Can see all role data but cannot edit
- [ ] Only "Close" button is visible

### 7.6 Delete Role

- [ ] Can click "Delete" button on role card
- [ ] Confirmation dialog appears
- [ ] **If role is in use** (assigned to users):
  - [ ] Error message appears preventing deletion
  - [ ] Toast shows how many users have this role
  - [ ] Role remains in list
- [ ] **If role is not in use**:
  - [ ] Role is deleted successfully
  - [ ] Success toast notification appears
  - [ ] Role removed from list

### 7.7 Permission Filtering by Company Type

- [ ] **As Mine company user creating/editing role**:
  - [ ] Can see "Products Management" permission
  - [ ] Can see "Clients Management" permission
  - [ ] Can see "Sites Management" permission
  - [ ] Can see "Weighbridge Management" permissions
- [ ] **As Transporter company user creating/editing role**:
  - [ ] CANNOT see "Products Management" permission
  - [ ] CANNOT see "Clients Management" permission
  - [ ] CANNOT see "Sites Management" permission
  - [ ] CANNOT see "Weighbridge Management" permissions
  - [ ] CAN see "Asset Management" (own assets)
  - [ ] CAN see "Security Checkpoint" permissions
- [ ] **As Logistics Coordinator company user creating/editing role**:
  - [ ] CANNOT see "Products Management" permission
  - [ ] CANNOT see "Clients Management" permission
  - [ ] CANNOT see "Sites Management" permission
  - [ ] CANNOT see "Weighbridge Management" permissions
  - [ ] CAN see "Order Management" (coordination)
  - [ ] CAN see "Pre-Booking Management"

### 7.8 "Manage Global Admins" Permission

- [ ] Regular users do NOT see "Manage Global Admins" permission
- [ ] Only global admins with "admin.users.manageGlobalAdmins" permission can:
  - [ ] See this permission in role editor
  - [ ] Assign this permission to roles
- [ ] This permission is in "Administrative" category

### 7.9 Search Roles

- [ ] Can type in search bar
- [ ] Roles filter as you type (by name or description)
- [ ] Search is case-insensitive

### 7.10 Default System Roles

- [ ] "Newton Admin" role exists with full permissions
- [ ] "Allocation Officer" role exists
- [ ] "Security Guard" role exists
- [ ] "Weighbridge Operator" role exists
- [ ] "Driver" role exists
- [ ] "Contact" role exists (minimal/no permissions)
- [ ] Can view permissions for each default role
- [ ] Can edit default roles (if needed)

---

## 8. Notification Templates Management

**Location**: Admin → Notifications

### 8.1 View Notification Templates List

- [ ] Notification templates page loads without errors
- [ ] Can see list of notification templates
- [ ] Template cards display: name, notification type, enabled status
- [ ] Enabled/Disabled status is clearly visible
- [ ] Search bar is visible

### 8.2 View Notification Template

- [ ] Can click on template card to view
- [ ] Modal shows template details
- [ ] Can see notification type (e.g., "asset.added", "order.completed")
- [ ] Can see template name
- [ ] Can see subject line
- [ ] Can see message body
- [ ] Can see enabled/disabled status

### 8.3 Edit Notification Template

- [ ] Can click "Edit" button on template
- [ ] Modal opens with template editor
- [ ] Can modify subject line
- [ ] Can modify message body
- [ ] Message body supports template variables (e.g., {{assetName}}, {{orderNumber}})
- [ ] Can toggle enabled/disabled status
- [ ] Can save changes
- [ ] Success toast notification appears

### 8.4 Test Notification Template (if implemented)

- [ ] Can see "Test" button on template
- [ ] Click test button
- [ ] Can enter recipient email
- [ ] Test notification is sent
- [ ] Success message confirms test sent

### 8.5 Search Notification Templates

- [ ] Can type in search bar
- [ ] Templates filter as you type (by name or type)

### 8.6 Template Variables Documentation

- [ ] Documentation or tooltip shows available template variables
- [ ] Variables are clearly explained (what each one represents)
- [ ] Examples of template usage are provided

---

## 9. Settings

**Location**: Top Navigation → Settings Icon → Settings

### 9.1 Profile Tab

- [ ] Settings page loads with Profile tab active
- [ ] **View Profile**:
  - [ ] Can see current user's first name (read-only)
  - [ ] Can see current user's last name (read-only)
  - [ ] Can see display name (auto-generated from first + last)
  - [ ] Can see email (read-only)
  - [ ] Can see phone number
  - [ ] Can see profile picture preview
- [ ] **Edit Profile**:
  - [ ] Can modify first name
  - [ ] Can modify last name
  - [ ] Display name updates automatically
  - [ ] Can modify phone number
  - [ ] Can upload new profile picture
  - [ ] Profile picture preview updates
  - [ ] Can remove profile picture
  - [ ] Can save changes
  - [ ] Success toast notification appears
  - [ ] Changes reflect immediately in top navigation bar

### 9.2 Appearance Tab

- [ ] Can navigate to Appearance tab
- [ ] **Theme Selection**:
  - [ ] Can see theme options: Light, Dark, System
  - [ ] Can select "Light" theme
  - [ ] Page immediately switches to light theme
  - [ ] Can select "Dark" theme
  - [ ] Page immediately switches to dark theme
  - [ ] Can select "System" theme
  - [ ] Theme follows system preference (OS theme)
- [ ] **Theme Persistence**:
  - [ ] Selected theme persists after page refresh
  - [ ] Theme applies across all pages in application
- [ ] **Visual Confirmation**:
  - [ ] Current theme is visually indicated (checkmark or highlight)
  - [ ] Theme changes are smooth (no flash of unstyled content)

### 9.3 Notifications Tab

- [ ] Can navigate to Notifications tab
- [ ] **Notification Preferences** (filtered by company type):
  - [ ] Can see notification categories relevant to company type
  - [ ] **Mine company users see ALL categories**:
    - [ ] Asset Management (4 notifications)
    - [ ] Order Management (5 notifications)
    - [ ] Weighbridge Operations (4 notifications)
    - [ ] Pre-Booking (2 notifications)
    - [ ] Security & Compliance (8 notifications)
    - [ ] Driver Alerts (2 notifications)
    - [ ] System & Maintenance (1 notification)
  - [ ] **Transporter company users see FILTERED categories** (NO weighbridge, mine-specific):
    - [ ] Asset Management (own assets)
    - [ ] Order Management (allocated orders)
    - [ ] Pre-Booking
    - [ ] Security & Compliance (own assets only)
    - [ ] Driver Alerts
  - [ ] **Logistics Coordinator users see MINIMAL categories**:
    - [ ] Order Management (coordination)
    - [ ] Pre-Booking
    - [ ] Security & Compliance (limited)
- [ ] **Enable/Disable Notifications**:
  - [ ] Can toggle individual notification on/off
  - [ ] Can use "Enable All" button per category
  - [ ] Can use "Disable All" button per category
  - [ ] Changes are tracked (Save button appears)
- [ ] **Save Notification Preferences**:
  - [ ] Save button only appears when changes are made
  - [ ] Can click "Save Preferences" button
  - [ ] Success toast notification appears
  - [ ] Preferences are saved to user document in Firestore
  - [ ] Save button disappears after successful save
- [ ] **Company Type Display**:
  - [ ] Page description shows current company type
  - [ ] Example: "Notifications are filtered based on your company type (mine)"

### 9.4 Security Tab

- [ ] Can navigate to Security tab
- [ ] **Change Password**:
  - [ ] Can see "Change Password" section
  - [ ] Can enter current password (required)
  - [ ] Can enter new password (required, min 8 characters)
  - [ ] Can confirm new password (must match)
  - [ ] Password strength indicator displays
  - [ ] Can click "Change Password" button
  - [ ] If current password is incorrect: Error message displays
  - [ ] If new password is too weak: Error message displays
  - [ ] If passwords don't match: Error message displays
  - [ ] If successful: Success toast appears, password updated
- [ ] **Two-Factor Authentication** (if implemented):
  - [ ] Can see 2FA status (enabled/disabled)
  - [ ] Can enable 2FA
  - [ ] Can disable 2FA
- [ ] **Active Sessions** (if implemented):
  - [ ] Can see list of active sessions
  - [ ] Can revoke sessions

### 9.5 Settings Navigation & UI

- [ ] Tab navigation is clear and intuitive
- [ ] Active tab is visually highlighted
- [ ] Can navigate between tabs without losing unsaved changes warning (if implemented)
- [ ] Settings modal/page is responsive on mobile
- [ ] Can close settings and return to previous page

---

## 10. Authentication & Session Management

### 10.1 Login Process

- [ ] Can access login page at /login
- [ ] Login page displays company branding/logo
- [ ] Can enter email address
- [ ] Can enter password
- [ ] Password field has show/hide toggle
- [ ] Can submit login form
- [ ] **Valid credentials**: Redirects to dashboard, user logged in
- [ ] **Invalid credentials**: Error message displays, remains on login page
- [ ] **Inactive user**: Error message displays, login denied
- [ ] **Contact-only user (canLogin: false)**: Error message displays, login denied

### 10.2 Logout Process

- [ ] Can click user profile menu in top navigation
- [ ] Can select "Log Out" option
- [ ] User is logged out successfully
- [ ] Redirected to login page
- [ ] Session is cleared
- [ ] Cannot access protected pages without logging in again

---

## 11. Security & Permissions

### 11.1 Permission Enforcement

- [ ] Users without "admin.companies" permission cannot access Companies page
- [ ] Users without "admin.users" permission cannot access Users page
- [ ] Users without "admin.products" permission cannot access Products page (mine companies)

### 11.2 Company Type Access Control

- [ ] Transporter users do NOT see Products menu item
- [ ] Transporter users do NOT see Clients menu item
- [ ] Transporter users do NOT see Sites menu item
- [ ] Transporter users do NOT see Groups functionality
- [ ] Logistics Coordinator users do NOT see Products menu item
- [ ] Logistics Coordinator users do NOT see Clients menu item
- [ ] Logistics Coordinator users do NOT see Sites menu item
- [ ] Mine users see ALL menu items and features

### 11.3 Global Admin Restrictions

- [ ] Regular users cannot elevate themselves to global admin
- [ ] Elevating another user to global admin requires re-authentication
- [ ] Re-authentication modal validates current user's password
- [ ] Only global admins with "admin.users.manageGlobalAdmins" can:
  - [ ] See/assign "Manage Global Admins" permission
  - [ ] Grant global admin status to other users

### 11.4 Data Scoping

- [ ] Users see only data from their own company (unless global admin)
- [ ] Global admins can switch companies and see all data

---

## 12. Data Export (if implemented)

### 12.1 Export to Excel

- [ ] Can export companies list to Excel
- [ ] Can export users list to Excel
- [ ] Can export products list to Excel
- [ ] Excel file downloads correctly
- [ ] Excel file contains all expected columns
- [ ] Excel file contains correct data

### 12.2 Export to PDF

- [ ] Can export reports to PDF
- [ ] PDF downloads correctly
- [ ] PDF formatting is correct

---

## 13. Final Smoke Test

### 13.1 Complete User Journey - Mine Company

- [ ] Log in as global admin (mine company)
- [ ] Create a new mine company
- [ ] Add organizational groups to the company
- [ ] Create a product
- [ ] Create a client
- [ ] Create a site and assign it to a group
- [ ] Create a new role with specific permissions
- [ ] Create a new user with the new role
- [ ] Log out
- [ ] Log in as the new user
- [ ] Verify user sees appropriate UI based on permissions
- [ ] Log out

### 13.2 Complete User Journey - Transporter Company

- [ ] Log in as global admin
- [ ] Switch to or create a transporter company
- [ ] Verify Products menu is NOT visible
- [ ] Verify Clients menu is NOT visible
- [ ] Verify Sites menu is NOT visible
- [ ] Create a user for transporter company
- [ ] Log out
- [ ] Log in as transporter user
- [ ] Verify limited menu and features
- [ ] Log out

### 13.3 Complete User Journey - Contact-Only User

- [ ] Create a contact-only user (canLogin: false)
- [ ] Verify user appears in list with "Contact Only" indicator
- [ ] Verify user can be selected as contact for companies, sites, etc.
- [ ] Convert contact-only user to login user
- [ ] Set password for converted user
- [ ] Log out
- [ ] Log in as converted user
- [ ] Verify login works
- [ ] Log out

---
