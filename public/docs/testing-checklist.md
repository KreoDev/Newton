# Newton Web Application - Testing Checklist

## Phase 1, 2, 3 & 4 User Acceptance Testing

**Purpose**: This checklist covers all functionality implemented in Phase 1 (Core Infrastructure), Phase 2 (Administrative Configuration), Phase 3 (Asset Management), and Phase 4 (Order Management). Test items are organized in the order they appear in the application's side menu.

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
- [ ] **If company is in use** (has users, sites, orders, or assets):
  - [ ] Cannot Delete dialog appears with detailed usage information
  - [ ] Dialog lists what company has (e.g., "5 users, 3 sites, 12 assets")
  - [ ] Dialog explains deactivation as alternative
  - [ ] "Deactivate Instead" button is shown
  - [ ] Can cancel (company remains active)
  - [ ] Can click "Deactivate Instead"
  - [ ] Company is deactivated successfully
  - [ ] Company remains in list but shows as "Inactive"
  - [ ] Success toast: "Company Deactivated"
- [ ] **If company is not in use**:
  - [ ] Standard deletion confirmation appears
  - [ ] Can cancel deletion
  - [ ] Can confirm deletion
  - [ ] Company is deleted successfully
  - [ ] Success toast notification appears
  - [ ] Company is removed from list
- [ ] **Cannot delete currently active company**:
  - [ ] If trying to delete own company: Error message appears
  - [ ] Message explains must switch to different company first

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

### 1.10 Company Deactivation Monitoring

- [ ] **When company is deactivated (Standard User)**:
  - [ ] Real-time monitoring detects deactivation
  - [ ] Inactive Company modal appears automatically
  - [ ] Modal explains company has been deactivated
  - [ ] Modal shows "Contact Administrator" message
  - [ ] Only "Log Out" button is available
  - [ ] Click "Log Out" logs user out
  - [ ] User redirected to login page
  - [ ] Cannot log back in to deactivated company
- [ ] **When company is deactivated (Global Admin)**:
  - [ ] Real-time monitoring detects deactivation
  - [ ] Company Switcher modal appears automatically
  - [ ] Modal explains current company is now inactive
  - [ ] Modal shows list of other active companies
  - [ ] Can select different active company
  - [ ] Switching to new company reloads page with new context
  - [ ] Data now shows selected company's information
  - [ ] Can also choose to log out instead
- [ ] **Login Prevention for Inactive Company**:
  - [ ] Try to login with user from inactive company
  - [ ] Login fails with error message
  - [ ] Error explains company is inactive
  - [ ] User remains on login page
- [ ] **Company Reactivation**:
  - [ ] Admin reactivates company (toggle status to active)
  - [ ] Users can now log in again
  - [ ] Logged-out users can log back in successfully

### 1.11 Fleet Number Feature (Transporter & Dual-Role Companies)

**Location**: Company Edit Modal → Fleet Tab

#### 1.11.1 Enable Fleet Number (No Assets)

- [ ] Open transporter company in edit mode
- [ ] Navigate to Fleet tab
- [ ] Enable "Fleet Number" checkbox
- [ ] Verify "Fleet Number Label" field appears
- [ ] Change label to custom value (e.g., "Truck ID")
- [ ] Save company
- [ ] Verify feature is enabled in company settings
- [ ] Verify custom label is saved

#### 1.11.2 Enable Fleet Number (With Default Label)

- [ ] Enable "Fleet Number" checkbox
- [ ] Leave label as default "Fleet No."
- [ ] Save company
- [ ] Verify feature is enabled with default label

#### 1.11.3 Disable Fleet Number (No Assets Using It)

- [ ] Company has fleet number enabled
- [ ] No assets have fleet numbers assigned
- [ ] Disable "Fleet Number" checkbox
- [ ] Click "Update Company"
- [ ] Verify NO dialog appears (no cleanup needed)
- [ ] Verify feature is disabled in company settings

#### 1.11.4 Disable Fleet Number (Assets Using It) - Remove All

- [ ] Company has fleet number enabled
- [ ] Multiple assets have fleet numbers assigned
- [ ] Disable "Fleet Number" checkbox
- [ ] Click "Update Company"
- [ ] Verify dialog appears showing affected assets
- [ ] Dialog shows correct count of assets
- [ ] Dialog lists all assets with fleet numbers
- [ ] Click "Remove Fleet Number from all X assets and disable feature"
- [ ] Verify toast notification shows successful removal
- [ ] Verify all assets no longer have fleet numbers
- [ ] Verify fleet number feature is disabled in company settings
- [ ] Verify all other company changes were saved

#### 1.11.5 Disable Fleet Number (Assets Using It) - Cancel

- [ ] Company has fleet number enabled
- [ ] Multiple assets have fleet numbers assigned
- [ ] Disable "Fleet Number" checkbox
- [ ] Click "Update Company"
- [ ] Dialog appears
- [ ] Click "Cancel" button
- [ ] Verify dialog closes
- [ ] Verify fleet number feature remains ENABLED
- [ ] Verify checkbox reverts to enabled state
- [ ] Verify all other company changes were saved (except fleet number)

#### 1.11.6 Change Fleet Number Label Only

- [ ] Fleet number is enabled
- [ ] Change fleet number label from "Fleet No." to "Truck ID"
- [ ] Do NOT disable the checkbox
- [ ] Save company
- [ ] Verify label updates successfully
- [ ] Verify feature remains enabled
- [ ] Verify no dialog appears

### 1.12 Transporter Group Feature (Transporter & Dual-Role Companies)

**Location**: Company Edit Modal → Fleet Tab

#### 1.12.1 Enable Transporter Group (No Assets)

- [ ] Open transporter company in edit mode
- [ ] Navigate to Fleet tab
- [ ] Enable "Transporter Group" checkbox
- [ ] Verify "Transporter Group Label" field appears
- [ ] Change label to custom value (e.g., "Division")
- [ ] Verify "Group Options" section appears
- [ ] Add group option "North"
- [ ] Add group option "South"
- [ ] Add group option "East"
- [ ] Add group option "West"
- [ ] Save company
- [ ] Verify feature is enabled with custom label
- [ ] Verify all group options are saved

#### 1.12.2 Enable Transporter Group - Validation

- [ ] Enable "Transporter Group" checkbox
- [ ] Do NOT add any group options
- [ ] Try to save company
- [ ] Verify error message: "At least one group option is required when transporter group is enabled"
- [ ] Add at least one group option
- [ ] Verify save succeeds

#### 1.12.3 Add Group Option

- [ ] Group feature is enabled
- [ ] Enter new group name in input field
- [ ] Click "Add" button
- [ ] Verify group appears in list
- [ ] Verify group is marked as active
- [ ] Save company
- [ ] Verify group option persists

#### 1.12.4 Delete Group Option (Not In Use)

- [ ] Group feature is enabled
- [ ] Have a group option that NO assets are using
- [ ] Click delete (X) button on group option
- [ ] Verify group is removed from list
- [ ] Save company
- [ ] Verify group option is deleted

#### 1.12.5 Try to Delete Group Option (In Use by Assets)

- [ ] Group feature is enabled
- [ ] Have a group option that assets ARE using
- [ ] Click delete (X) button on group option
- [ ] Verify error dialog appears
- [ ] Error message explains group is in use by assets
- [ ] Verify group remains in list
- [ ] Verify "Deactivate" button is shown instead of delete

#### 1.12.6 Mark Group Option as Inactive (In Use)

- [ ] Group feature is enabled
- [ ] Have a group option in use by assets
- [ ] Click "Deactivate" button
- [ ] Verify group is marked as inactive (grayed out, "Inactive" badge)
- [ ] Verify group remains in list
- [ ] Verify assets still have this group assigned
- [ ] Save company
- [ ] Verify inactive status persists

#### 1.12.7 Mark Inactive Group as Active

- [ ] Have an inactive group option
- [ ] Click "Activate" button
- [ ] Verify group is marked as active (normal appearance)
- [ ] Save company
- [ ] Verify active status persists

#### 1.12.8 Disable Transporter Group (No Assets Using It)

- [ ] Company has transporter group enabled
- [ ] No assets have groups assigned
- [ ] Disable "Transporter Group" checkbox
- [ ] Click "Update Company"
- [ ] Verify NO dialog appears
- [ ] Verify feature is disabled

#### 1.12.9 Disable Transporter Group (Assets Using It) - Remove All

- [ ] Company has transporter group enabled
- [ ] Multiple assets have groups assigned
- [ ] Disable "Transporter Group" checkbox
- [ ] Click "Update Company"
- [ ] Verify dialog appears showing affected assets
- [ ] Dialog shows correct count of assets
- [ ] Dialog lists all assets with groups
- [ ] Click "Remove Group from all X assets and disable feature"
- [ ] Verify toast notification shows successful removal
- [ ] Verify all assets no longer have groups
- [ ] Verify group feature is disabled in company settings
- [ ] Verify all other company changes were saved

#### 1.12.10 Disable Transporter Group (Assets Using It) - Cancel

- [ ] Company has transporter group enabled
- [ ] Multiple assets have groups assigned
- [ ] Disable "Transporter Group" checkbox
- [ ] Click "Update Company"
- [ ] Dialog appears
- [ ] Click "Cancel" button
- [ ] Verify dialog closes
- [ ] Verify group feature remains ENABLED
- [ ] Verify checkbox reverts to enabled state
- [ ] Verify all other company changes were saved (except group)

#### 1.12.11 Change Group Label Only

- [ ] Group feature is enabled
- [ ] Change group label from "Group" to "Division"
- [ ] Do NOT disable the checkbox
- [ ] Save company
- [ ] Verify label updates successfully
- [ ] Verify feature remains enabled
- [ ] Verify no dialog appears

### 1.13 Sequential Dialog System (Both Features)

**Note**: When both fleet number AND transporter group are disabled while assets are using them, dialogs appear SEQUENTIALLY (fleet first, then group).

#### 1.13.1 Scenario: Cancel Fleet → Remove Group

- [ ] Both features enabled with assets using both
- [ ] Disable both "Fleet Number" and "Transporter Group" checkboxes
- [ ] Click "Update Company"
- [ ] **First Dialog - Fleet Number**:
  - [ ] Verify fleet number dialog appears first
  - [ ] Shows assets with fleet numbers
  - [ ] Click "Cancel"
- [ ] **Second Dialog - Group**:
  - [ ] Verify group dialog appears next (automatically)
  - [ ] Shows assets with groups
  - [ ] Click "Remove Group from all X assets and disable feature"
- [ ] **Verify Final State**:
  - [ ] Fleet number feature ENABLED (canceled)
  - [ ] Group feature DISABLED (removed)
  - [ ] Assets keep their fleet numbers
  - [ ] Assets no longer have groups
  - [ ] All other company changes saved

#### 1.13.2 Scenario: Remove Fleet → Remove Group

- [ ] Both features enabled with assets using both
- [ ] Disable both checkboxes
- [ ] Click "Update Company"
- [ ] **First Dialog - Fleet Number**:
  - [ ] Fleet number dialog appears
  - [ ] Click "Remove Fleet Number from all X assets and disable feature"
  - [ ] Verify toast shows successful removal
- [ ] **Second Dialog - Group**:
  - [ ] Group dialog appears automatically after first completes
  - [ ] Click "Remove Group from all X assets and disable feature"
  - [ ] Verify toast shows successful removal
- [ ] **Verify Final State**:
  - [ ] Fleet number feature DISABLED
  - [ ] Group feature DISABLED
  - [ ] No assets have fleet numbers
  - [ ] No assets have groups
  - [ ] All other company changes saved

#### 1.13.3 Scenario: Cancel Fleet → Cancel Group

- [ ] Both features enabled with assets using both
- [ ] Disable both checkboxes
- [ ] Click "Update Company"
- [ ] **First Dialog - Fleet Number**:
  - [ ] Fleet number dialog appears
  - [ ] Click "Cancel"
- [ ] **Second Dialog - Group**:
  - [ ] Group dialog appears automatically
  - [ ] Click "Cancel"
- [ ] **Verify Final State**:
  - [ ] Fleet number feature ENABLED (canceled)
  - [ ] Group feature ENABLED (canceled)
  - [ ] Assets keep their fleet numbers
  - [ ] Assets keep their groups
  - [ ] All other company changes saved

#### 1.13.4 Scenario: Remove Fleet → Cancel Group

- [ ] Both features enabled with assets using both
- [ ] Disable both checkboxes
- [ ] Click "Update Company"
- [ ] **First Dialog - Fleet Number**:
  - [ ] Fleet number dialog appears
  - [ ] Click "Remove Fleet Number from all X assets and disable feature"
  - [ ] Verify toast shows successful removal
- [ ] **Second Dialog - Group**:
  - [ ] Group dialog appears automatically
  - [ ] Click "Cancel"
- [ ] **Verify Final State**:
  - [ ] Fleet number feature DISABLED (removed)
  - [ ] Group feature ENABLED (canceled)
  - [ ] No assets have fleet numbers
  - [ ] Assets keep their groups
  - [ ] All other company changes saved

### 1.14 Single Feature Enabled

#### 1.14.1 Only Fleet Enabled - Disable with Assets

- [ ] Fleet number enabled, group disabled
- [ ] Assets using fleet numbers
- [ ] Disable fleet number
- [ ] Click "Update Company"
- [ ] Verify fleet number dialog appears
- [ ] NO group dialog should appear
- [ ] Test both "Remove" and "Cancel" options
- [ ] Verify single dialog works correctly

#### 1.14.2 Only Group Enabled - Disable with Assets

- [ ] Group enabled, fleet number disabled
- [ ] Assets using groups
- [ ] Disable group
- [ ] Click "Update Company"
- [ ] Verify group dialog appears
- [ ] NO fleet number dialog should appear
- [ ] Test both "Remove" and "Cancel" options
- [ ] Verify single dialog works correctly

#### 1.14.3 Enable Fleet When Group Already Enabled

- [ ] Group is enabled
- [ ] Fleet number is disabled
- [ ] Enable fleet number
- [ ] Add fleet number label
- [ ] Save company
- [ ] Verify fleet number enabled successfully
- [ ] Verify group remains enabled

#### 1.14.4 Enable Group When Fleet Already Enabled

- [ ] Fleet number is enabled
- [ ] Group is disabled
- [ ] Enable group
- [ ] Add group options
- [ ] Add group label
- [ ] Save company
- [ ] Verify group enabled successfully
- [ ] Verify fleet number remains enabled

### 1.15 Asset List Modal

#### 1.15.1 Asset List Modal - UI Elements

- [ ] Trigger dialog by disabling feature with assets
- [ ] Verify modal title: "Assets Using Fleet No." or "Assets Using Group"
- [ ] Verify description explains what needs to be done
- [ ] Verify asset count is correct in description
- [ ] Verify scrollable list shows all affected assets
- [ ] Verify each asset shows:
  - [ ] Asset type icon (Truck/Trailer/Driver)
  - [ ] Asset identifier (registration or name)
  - [ ] Current field value (fleet number or group name)
  - [ ] Active/Inactive badge
- [ ] Verify "Remove from all X assets and disable feature" button
- [ ] Verify "Cancel" button

#### 1.15.2 Asset List Modal - Navigation

- [ ] Click on an asset in the list
- [ ] Verify navigates to asset details page
- [ ] Verify modal closes
- [ ] Navigate back to companies page
- [ ] Open company edit modal again
- [ ] Verify state is preserved

#### 1.15.3 Asset List Modal - Button Behavior

- [ ] Test "Remove" button:
  - [ ] Click button
  - [ ] Verify loading state shows
  - [ ] Verify toast notification appears
  - [ ] Verify modal closes after success
  - [ ] Verify next dialog opens (if applicable)
- [ ] Test "Cancel" button:
  - [ ] Click button
  - [ ] Verify modal closes immediately
  - [ ] Verify next dialog opens (if applicable)
  - [ ] Verify feature remains enabled

### 1.16 Data Persistence

#### 1.16.1 Fleet/Group Settings Persist After Save

- [ ] Enable fleet number with custom label
- [ ] Enable group with custom options
- [ ] Save company
- [ ] Close modal
- [ ] Reopen company in edit mode
- [ ] Verify fleet number checkbox is checked
- [ ] Verify custom fleet label is preserved
- [ ] Verify group checkbox is checked
- [ ] Verify all group options are preserved
- [ ] Verify inactive groups show inactive status

#### 1.16.2 Canceled Fields Revert to Original

- [ ] Fleet enabled, group enabled
- [ ] Disable fleet (trigger dialog)
- [ ] Cancel fleet dialog
- [ ] Cancel group dialog (if triggered)
- [ ] Close company modal
- [ ] Reopen company
- [ ] Verify fleet number is still enabled (original state)
- [ ] Verify group is still enabled (original state)

#### 1.16.3 Other Changes Save Even When Fleet/Group Canceled

- [ ] Open company edit
- [ ] Change company name to "Test Company Updated"
- [ ] Change registration number
- [ ] Disable fleet number (with assets)
- [ ] Cancel fleet dialog
- [ ] Verify company modal closes after save
- [ ] Reopen company
- [ ] Verify company name changed to "Test Company Updated"
- [ ] Verify registration number changed
- [ ] Verify fleet number still enabled (canceled change)

### 1.17 Company Settings Edge Cases

#### 1.17.1 Enable and Disable Immediately (No Assets)

- [ ] Enable fleet number
- [ ] Immediately disable fleet number (same session)
- [ ] Save company
- [ ] Verify no dialog appears
- [ ] Verify feature is disabled

#### 1.17.2 Enable, Add Assets, Then Disable

- [ ] Enable fleet number
- [ ] Save company
- [ ] Create assets and assign fleet numbers
- [ ] Edit company again
- [ ] Disable fleet number
- [ ] Save
- [ ] Verify dialog appears
- [ ] Test remove/cancel behavior

#### 1.17.3 Change Label While Feature Is In Use

- [ ] Fleet number enabled with assets using it
- [ ] Change fleet label from "Fleet No." to "Vehicle ID"
- [ ] Keep feature enabled
- [ ] Save company
- [ ] Verify no dialog appears
- [ ] Verify label changes
- [ ] Verify assets still have fleet numbers

#### 1.17.4 Add Group Options While Feature In Use

- [ ] Group enabled with existing options
- [ ] Assets using existing groups
- [ ] Add new group option "Central"
- [ ] Save company
- [ ] Verify new option is added
- [ ] Verify existing assets maintain their groups

#### 1.17.5 Empty/Whitespace Validation

- [ ] Try to add group option with only spaces
- [ ] Verify error or trimming behavior
- [ ] Try to add duplicate group option
- [ ] Verify error message

#### 1.17.6 Company Type Change (Should Not Happen in Production)

- [ ] Note: Company type is read-only after creation
- [ ] Fleet tab only visible for transporters and dual-role LCs
- [ ] If company type changes, fleet settings should be preserved but not accessible

### 1.18 Multiple Companies

#### 1.18.1 Different Settings Per Company

- [ ] Create Company A (transporter)
- [ ] Enable fleet with label "Truck ID"
- [ ] Create Company B (transporter)
- [ ] Enable fleet with label "Fleet No."
- [ ] Enable group with options "North", "South"
- [ ] Switch between companies
- [ ] Verify each company has independent fleet/group settings

#### 1.18.2 Global Admin Editing Different Company

- [ ] Log in as global admin
- [ ] Switch to Company A context
- [ ] Edit Company B (different company)
- [ ] Change fleet/group settings
- [ ] Verify changes save correctly
- [ ] Verify local users/assets data loads correctly for Company B

### 1.19 Company Validation & Error Handling

#### 1.19.1 Group Options Required When Enabled

- [ ] Enable "Transporter Group"
- [ ] Delete all group options
- [ ] Try to save company
- [ ] Verify error: "At least one group option is required when transporter group is enabled"
- [ ] Add a group option
- [ ] Verify save succeeds

#### 1.19.2 Cannot Delete Group In Use

- [ ] Have assets using group "North"
- [ ] Try to delete "North" from group options
- [ ] Verify error dialog
- [ ] Verify suggestion to mark as inactive instead
- [ ] Verify delete button is replaced with deactivate button

#### 1.19.3 Dialog Appears Only When Needed

- [ ] Disable feature with NO assets using it
- [ ] Verify NO dialog appears
- [ ] Disable feature WITH assets using it
- [ ] Verify dialog DOES appear

### 1.20 Company UI/UX

#### 1.20.1 Fleet Tab Visibility

- [ ] **Mine company**: Fleet tab NOT visible
- [ ] **Transporter company**: Fleet tab visible
- [ ] **Logistics Coordinator (not also transporter)**: Fleet tab NOT visible
- [ ] **Logistics Coordinator (also transporter)**: Fleet tab visible

#### 1.20.2 Loading States

- [ ] Verify loading spinner when removing fleet numbers from assets
- [ ] Verify loading spinner when removing groups from assets
- [ ] Verify buttons disabled during loading
- [ ] Verify toast notifications appear after completion

#### 1.20.3 Modal Behavior

- [ ] Verify modal closes on successful save
- [ ] Verify modal stays open on validation error
- [ ] Verify clicking outside modal does NOT close it (by design)
- [ ] Verify ESC key does NOT close modal (by design)
- [ ] Must use Cancel or Save buttons explicitly

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

## 3. Asset Management

**Location**: Assets Menu

**Note**: Asset Management is available for all company types (Mine, Transporter, Logistics Coordinator). Access is controlled by permissions.

### 3.1 Access Control

- [ ] **As user with assets.view permission**: Assets menu item is visible in sidebar
- [ ] **As user without assets.view permission**: Assets menu item is NOT visible
- [ ] Assets page enforces permission checks (view, add, edit, delete)
- [ ] Action buttons only visible if user has corresponding permission

### 3.2 Asset Induction Wizard

**Location**: Assets → Induct Asset button

#### 3.2.1 Step 1: QR Code Scan

- [ ] Can click "Induct Asset" button (only visible with assets.add permission)
- [ ] Wizard modal opens with Step 1: QR Code Scan
- [ ] Text input field is visible for desktop scanner
- [ ] Can scan/enter QR code
- [ ] **QR Code Validation**:
  - [ ] Must start with "NT" prefix (South African NaTIS standard)
  - [ ] Error alert appears if missing NT prefix
  - [ ] Real-time uniqueness check against existing assets
  - [ ] Error alert if duplicate QR code found
  - [ ] Can retry with different QR code
- [ ] Valid QR code auto-advances to Step 2
- [ ] Can go back to cancel induction

#### 3.2.2 Step 2: Barcode Scan

- [ ] Step 2: Barcode Scan screen displays
- [ ] Text input field visible for desktop scanner
- [ ] **First Scan**:
  - [ ] Can scan driver's license barcode
  - [ ] expo-sadl automatically parses driver license data
  - [ ] Can scan vehicle license disk barcode
  - [ ] scan.service parses vehicle disk data
  - [ ] Barcode data displays for review
- [ ] **Verification Scan**:
  - [ ] Second scan required for verification
  - [ ] Must match first scan exactly
  - [ ] Error alert if scans don't match
  - [ ] Can retry if mismatch
- [ ] **Asset Type Detection**:
  - [ ] Driver's license → Automatically selects "Driver" type
  - [ ] Vehicle license disk → Shows truck/trailer selection
  - [ ] Can select "Truck" or "Trailer" for vehicle
- [ ] **Expiry Date Validation**:
  - [ ] Expired documents: Red banner, Next button disabled, error alert
  - [ ] <7 days to expiry: Orange warning, can proceed
  - [ ] 7-30 days to expiry: Yellow warning, can proceed
  - [ ] >30 days to expiry: Green valid, can proceed
  - [ ] Cannot proceed with expired document
- [ ] **Field Confirmation**:
  - [ ] All extracted barcode fields display
  - [ ] For vehicles: registration, make, model, colour, VIN, engine number, etc.
  - [ ] For drivers: name, surname, ID number, license number, birth date, etc.
  - [ ] Can review all fields before proceeding
- [ ] Valid barcode advances to Step 3 (or Step 4 if no optional fields)

#### 3.2.3 Step 3: Optional Fields (Conditional)

- [ ] **Step 3 only shows for trucks with enabled settings**
- [ ] Step 3 auto-skips for trailers and drivers
- [ ] Step 3 auto-skips if both fleet/group settings disabled
- [ ] **Fleet Number** (if systemSettings.fleetNumberEnabled):
  - [ ] Fleet number text input visible
  - [ ] Uses custom label from systemSettings.fleetNumberLabel
  - [ ] Optional field (can leave blank)
- [ ] **Transporter Group** (if systemSettings.transporterGroupEnabled):
  - [ ] Group dropdown visible
  - [ ] Shows active groups from company.systemSettings.groupOptions
  - [ ] Uses custom label from systemSettings.transporterGroupLabel
  - [ ] Optional field (can leave blank)
- [ ] Can proceed to Step 4 (Review)

#### 3.2.4 Step 4: Review & Submit

- [ ] **Review screen displays all asset information**:
  - [ ] Asset type with icon (🚚 truck, 🚛 trailer, driver photo/icon)
  - [ ] Newton QR code (ntCode)
  - [ ] All barcode-extracted fields
  - [ ] Expiry date with color-coded badge
  - [ ] Fleet number (if applicable)
  - [ ] Transporter group (if applicable)
- [ ] **Edit Capability**:
  - [ ] Each section has "Edit" button
  - [ ] Click Edit returns to relevant step
  - [ ] Changes reflect in review screen
- [ ] **Submit Button**:
  - [ ] Can click "Submit" to create asset
  - [ ] Success alert dialog appears
  - [ ] Alert shows: "{AssetType} ({Identifier}) has been successfully inducted"
  - [ ] Must click "OK" to close alert
  - [ ] After OK, wizard closes
  - [ ] Returns to assets list page
  - [ ] New asset appears in list

#### 3.2.5 Wizard Error Handling

- [ ] **Validation errors use alert dialogs** (full-screen, impossible to miss)
- [ ] **Duplicate QR code**: Alert dialog with retry option
- [ ] **Expired document**: Alert dialog, cannot proceed
- [ ] **Barcode mismatch**: Alert dialog with retry option
- [ ] **Backend errors**: Toast notification (less intrusive)
- [ ] Can cancel wizard at any step
- [ ] Cancel confirmation if data already entered

### 3.3 Asset List View

**Location**: Assets page

#### 3.3.1 View Toggle

- [ ] View toggle button visible (Card/Table icons)
- [ ] Can click to switch between Card and Table views
- [ ] Selection persists (remembered for next visit)
- [ ] Page updates immediately when toggling

#### 3.3.2 Card View

- [ ] Assets display in card layout
- [ ] Each card shows:
  - [ ] Asset icon: Driver photo (if available) or 🚚/🚛 emoji
  - [ ] Registration number (vehicles) or Name (drivers)
  - [ ] License number (drivers)
  - [ ] Fleet number badge (if assigned)
  - [ ] Active/Inactive status badge
  - [ ] Asset type label (Truck/Trailer/Driver)
  - [ ] Newton QR code (ntCode)
  - [ ] Expiry date with color-coded badge
- [ ] **Action buttons on card** (permission-based):
  - [ ] View button (always visible)
  - [ ] Toggle Active/Inactive button (visible with assets.edit)
  - [ ] Edit dropdown menu (visible with assets.edit or assets.delete)
- [ ] **Toggle Active/Inactive from card**:
  - [ ] Click toggle button (ToggleRight/ToggleLeft icon)
  - [ ] If deactivating: Reason modal appears
  - [ ] Must enter deactivation reason
  - [ ] Asset marked inactive, reason saved
  - [ ] Card updates to show "Inactive" badge
  - [ ] Toggle icon changes to ToggleLeft (gray)
  - [ ] If reactivating: Confirm reactivation
  - [ ] Asset marked active
  - [ ] Card updates to show "Active" badge
  - [ ] Toggle icon changes to ToggleRight (green)

#### 3.3.3 Table View

- [ ] Assets display in table with columns
- [ ] **Columns shown** (vary by asset type):
  - [ ] For vehicles: Registration, Make & Model, Type, Fleet Number, Expiry Date, Status
  - [ ] For drivers: Name, License Number, ID Number, Expiry Date, Status
- [ ] **Column Features**:
  - [ ] Can sort by clicking column headers
  - [ ] Can toggle column visibility
  - [ ] Can reorder columns via drag-and-drop
  - [ ] Column order persists (remembered)
  - [ ] Column visibility persists
- [ ] **Row Actions**:
  - [ ] Dropdown menu button on each row
  - [ ] View option (always visible)
  - [ ] Edit option (visible with assets.edit)
  - [ ] Mark Inactive/Reactivate (visible with assets.edit)
  - [ ] Delete option (visible with assets.delete)
- [ ] **Pagination**:
  - [ ] Page size selector (10, 20, 50, 100)
  - [ ] Previous/Next buttons
  - [ ] Page number indicator

#### 3.3.4 Search & Filters

- [ ] **Search bar**:
  - [ ] Can type to search
  - [ ] Searches: registration, license number, ntCode, fleet number, name, surname
  - [ ] Search is case-insensitive
  - [ ] Real-time filtering as you type
- [ ] **Asset Type Filter**:
  - [ ] Dropdown shows: All, Truck, Trailer, Driver
  - [ ] Filter applies immediately
  - [ ] Can combine with other filters
- [ ] **Status Filter**:
  - [ ] Dropdown shows: All, Active, Inactive, Expired
  - [ ] Filter applies immediately
  - [ ] Can combine with search and type filter
- [ ] **Combined Filtering**:
  - [ ] All filters work together (search + type + status)
  - [ ] Clear filters button resets all
  - [ ] No results message if no matches

#### 3.3.5 Expiry Status Indicators

- [ ] **Color-coded expiry badges**:
  - [ ] Green: >30 days until expiry
  - [ ] Yellow: 7-30 days until expiry
  - [ ] Orange: <7 days until expiry
  - [ ] Red: Expired
- [ ] Expiry date format: DD/MM/YYYY
- [ ] Badge shows on both card and table views

### 3.4 Asset Details Page

**Location**: Assets → View Asset

- [ ] Can click "View" button on asset card/row
- [ ] Details page loads with asset ID in URL (/assets/[id])
- [ ] **Page Header**:
  - [ ] Asset type with large icon/emoji
  - [ ] Status badges (Active/Inactive/Expired)
  - [ ] Action buttons (permission-based):
    - [ ] Edit (assets.edit permission)
    - [ ] Edit Fleet/Group (assets.edit permission)
    - [ ] Mark Inactive (assets.edit permission, if active)
    - [ ] Reactivate (assets.edit permission, if inactive)
    - [ ] Delete (assets.delete permission)
- [ ] **Basic Information Card**:
  - [ ] Newton QR Code (ntCode)
  - [ ] Company name
  - [ ] Fleet number (if assigned)
  - [ ] Transporter group (if assigned)
  - [ ] Created date and time
  - [ ] Last updated date and time
- [ ] **Vehicle Details Card** (for trucks/trailers):
  - [ ] Registration number
  - [ ] Make & Model
  - [ ] Vehicle type (vehicleDescription)
  - [ ] Description
  - [ ] Colour
  - [ ] License disk number
  - [ ] Expiry date with color-coded badge
  - [ ] Engine number
  - [ ] VIN (Vehicle Identification Number)
- [ ] **Driver Personal Information Card** (for drivers):
  - [ ] Driver photo (if available)
  - [ ] ID Number
  - [ ] Full name (initials, name, surname)
  - [ ] Gender
  - [ ] Date of birth
  - [ ] Age (calculated)
  - [ ] Country
  - [ ] Place issued
  - [ ] ID type
- [ ] **Driver License Information Card** (for drivers):
  - [ ] License number
  - [ ] License type
  - [ ] Expiry date with color-coded badge
  - [ ] Issue date
  - [ ] License issue number
  - [ ] Vehicle codes
  - [ ] Vehicle class codes
  - [ ] PrDP code, category, valid until
  - [ ] Endorsement
  - [ ] Driver restrictions
  - [ ] Vehicle restrictions
  - [ ] General restrictions
  - [ ] Status badge (Valid/Expired)
- [ ] All information displays correctly based on asset type

### 3.5 Asset Editing

#### 3.5.1 Edit QR Code or Barcode

- [ ] Can click "Edit" button on asset details page
- [ ] Edit modal opens with two options
- [ ] **Option 1: Update QR Code** (for damaged/replaced QR codes):
  - [ ] Select "Update QR Code" option
  - [ ] Step 1: Verify existing barcode
  - [ ] Must scan current barcode to verify correct asset
  - [ ] Error if wrong asset scanned
  - [ ] Step 2: Scan new QR code
  - [ ] New QR code validated (NT prefix, uniqueness)
  - [ ] Error if same as current QR code
  - [ ] Success alert: "QR code for {identifier} has been successfully updated"
  - [ ] Must click OK to close modal
- [ ] **Option 2: Update Barcode** (for renewed license/disk):
  - [ ] Select "Update Barcode" option
  - [ ] Step 1: Verify existing QR code
  - [ ] Must scan current QR code to verify correct asset
  - [ ] Error if wrong QR code scanned
  - [ ] Step 2: Scan new barcode (license/disk)
  - [ ] **Validation Rules**:
    - [ ] For vehicles: Registration must match existing asset
    - [ ] For drivers: ID number must match existing asset
    - [ ] Error if registration/ID mismatch
    - [ ] Cannot update to expired document (error alert)
    - [ ] Warning if new expiry is older than current (can override with confirmation)
  - [ ] All barcode fields extracted and saved
  - [ ] Success alert: "Asset updated successfully with new barcode data"
  - [ ] Must click OK to close modal
- [ ] Can cancel update at any step
- [ ] Can go back to previous step

#### 3.5.2 Edit Fleet Number & Group

- [ ] Can click "Edit Fleet/Group" button
- [ ] Modal opens with current values pre-filled
- [ ] Can edit fleet number (if enabled)
- [ ] Can change transporter group (if enabled)
- [ ] Can save changes
- [ ] Success toast notification
- [ ] Changes reflect on details page

### 3.6 Asset Deletion & Inactivation

#### 3.6.1 Delete Asset

- [ ] Can click "Delete" button (only with assets.delete permission)
- [ ] Delete modal opens
- [ ] **If asset has NO transactions** (not used in orders, weighing, security checks):
  - [ ] Reason input field displays
  - [ ] Must enter deletion reason
  - [ ] Can cancel deletion
  - [ ] Can confirm deletion with reason
  - [ ] Asset is permanently deleted
  - [ ] Success toast: "Asset deleted successfully"
  - [ ] Redirected to assets list
  - [ ] Asset removed from list
- [ ] **If asset HAS transactions**:
  - [ ] Cannot delete message appears
  - [ ] Lists where asset is used (orders, weighing records, security checks)
  - [ ] Suggests inactivation as alternative
  - [ ] Can close modal (asset remains)
  - [ ] Delete button disabled or not shown

#### 3.6.2 Inactivate Asset

- [ ] Can click "Mark Inactive" button (only with assets.edit permission)
- [ ] Inactivate modal opens
- [ ] **Reason input field** (required):
  - [ ] Must enter inactivation reason
  - [ ] Examples: "License expired", "Vehicle sold", "Driver resigned"
  - [ ] Cannot proceed without reason
- [ ] Can cancel inactivation
- [ ] Can confirm inactivation with reason
- [ ] Asset marked as inactive (isActive: false)
- [ ] Reason and date saved to asset document
- [ ] Success toast: "Asset inactivated successfully"
- [ ] Details page updates to show "Inactive" badge
- [ ] "Mark Inactive" button changes to "Reactivate"

#### 3.6.3 Reactivate Asset

- [ ] Can click "Reactivate" button (only with assets.edit permission)
- [ ] Confirmation dialog appears
- [ ] Can cancel reactivation
- [ ] Can confirm reactivation
- [ ] Asset marked as active (isActive: true)
- [ ] Success toast: "Asset reactivated successfully"
- [ ] Details page updates to show "Active" badge
- [ ] "Reactivate" button changes to "Mark Inactive"

### 3.7 Fleet Number & Transporter Groups

#### 3.7.1 Company Settings

- [ ] Open mine company in edit mode
- [ ] Navigate to System Settings tab
- [ ] **Fleet Number Settings**:
  - [ ] Can toggle "Fleet Number Enabled" on/off
  - [ ] Can customize fleet number label (default: "Fleet No.")
  - [ ] If enabled: Fleet number field appears in induction wizard (Step 3)
  - [ ] If disabled: Fleet number field hidden in wizard
- [ ] **Transporter Group Settings**:
  - [ ] Can toggle "Transporter Group Enabled" on/off
  - [ ] Can customize group label (default: "Group")
  - [ ] Can add group options (e.g., "North", "South", "East", "West")
  - [ ] Can remove group options
  - [ ] If enabled: Group dropdown appears in induction wizard (Step 3)
  - [ ] If disabled: Group dropdown hidden in wizard

#### 3.7.2 Wizard Conditional Display

- [ ] **If both settings disabled**:
  - [ ] Step 3 (Optional Fields) auto-skipped
  - [ ] Wizard goes directly from Step 2 to Step 4
- [ ] **If fleet enabled only**:
  - [ ] Step 3 shows fleet number field
  - [ ] Group dropdown not shown
- [ ] **If group enabled only**:
  - [ ] Step 3 shows group dropdown
  - [ ] Fleet number field not shown
- [ ] **If both enabled**:
  - [ ] Step 3 shows both fleet number and group
- [ ] **For trailers and drivers**:
  - [ ] Step 3 always skipped (even if settings enabled)
  - [ ] Fleet/group only applicable to trucks

#### 3.7.3 Asset Integration

- [ ] **Asset Creation with Fleet Number**:
  - [ ] Company has fleet number enabled
  - [ ] Create new asset (truck)
  - [ ] Verify fleet number field appears in asset form
  - [ ] Verify field label matches company's custom label
  - [ ] Assign fleet number to asset
  - [ ] Save asset
  - [ ] Verify fleet number is saved
- [ ] **Asset Creation with Group**:
  - [ ] Company has group enabled
  - [ ] Create new asset (truck)
  - [ ] Verify group dropdown appears in asset form
  - [ ] Verify dropdown shows all active group options
  - [ ] Verify inactive groups are NOT shown (or shown as disabled)
  - [ ] Assign group to asset
  - [ ] Save asset
  - [ ] Verify group is saved
- [ ] **Asset Displays Fleet Number in Lists**:
  - [ ] Assets list page shows fleet number badge
  - [ ] Badge displays correct fleet number value
  - [ ] Badge uses secondary variant styling
- [ ] **Asset Displays Group in Lists**:
  - [ ] Assets list page shows group badge
  - [ ] Badge displays correct group name
  - [ ] Badge uses purple variant styling

### 3.8 Asset Permission Enforcement

- [ ] **View Assets** (assets.view permission):
  - [ ] Can access assets page
  - [ ] Can see asset list
  - [ ] Can click view button
  - [ ] Can view asset details
  - [ ] Without permission: Assets menu not visible
- [ ] **Add Assets** (assets.add permission):
  - [ ] "Induct Asset" button visible
  - [ ] Can access induction wizard
  - [ ] Can complete induction
  - [ ] Without permission: Button hidden
- [ ] **Edit Assets** (assets.edit permission):
  - [ ] "Edit" button visible on details page
  - [ ] "Edit Fleet/Group" button visible
  - [ ] "Mark Inactive" button visible (if active)
  - [ ] "Reactivate" button visible (if inactive)
  - [ ] Toggle active/inactive button visible on cards
  - [ ] Can modify asset data
  - [ ] Without permission: Buttons hidden
- [ ] **Delete Assets** (assets.delete permission):
  - [ ] "Delete" button visible on details page
  - [ ] Can delete assets (if no transactions)
  - [ ] Without permission: Button hidden
- [ ] **View-Only Users**:
  - [ ] Can see assets list
  - [ ] Can view details
  - [ ] Cannot see edit/delete buttons
  - [ ] Cannot induct new assets

### 3.9 Assets Restricted to Transporters

#### 3.9.1 Mine Company - Assets Hidden

- [ ] Log in as a mine company user
- [ ] Verify Assets menu item is NOT visible in navigation
- [ ] Attempt to navigate directly to `/assets`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/induct`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/[id]` with valid asset ID
- [ ] Verify redirect to home page `/`

#### 3.9.2 Transporter Company - Assets Visible

- [ ] Log in as a transporter company user
- [ ] Verify Assets menu item IS visible in navigation
- [ ] Navigate to `/assets` page
- [ ] Verify page loads successfully with asset list
- [ ] Navigate to `/assets/induct` page
- [ ] Verify induction wizard loads successfully
- [ ] Navigate to `/assets/[id]` with valid asset ID
- [ ] Verify asset detail page loads successfully

#### 3.9.3 Logistics Coordinator (Not Transporter) - Assets Hidden

- [ ] Log in as a logistics coordinator company with `isAlsoTransporter = false`
- [ ] Verify Assets menu item is NOT visible in navigation
- [ ] Attempt to navigate directly to `/assets`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/induct`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/[id]` with valid asset ID
- [ ] Verify redirect to home page `/`

#### 3.9.4 Logistics Coordinator (Is Transporter) - Assets Visible

- [ ] Log in as a logistics coordinator company with `isAlsoTransporter = true`
- [ ] Verify Assets menu item IS visible in navigation
- [ ] Navigate to `/assets` page
- [ ] Verify page loads successfully with asset list
- [ ] Navigate to `/assets/induct` page
- [ ] Verify induction wizard loads successfully
- [ ] Navigate to `/assets/[id]` with valid asset ID
- [ ] Verify asset detail page loads successfully

#### 3.9.5 Logistics Coordinator Cannot Disable Transporter Role (Has Assets)

- [ ] Create logistics coordinator company with `isAlsoTransporter = true`
- [ ] Induct at least one asset (truck, trailer, or driver)
- [ ] Open Company Form Modal to edit company
- [ ] Verify "Is also a Transporter" checkbox is DISABLED
- [ ] Verify checkbox is visually styled as disabled (opacity reduced, cursor not-allowed)
- [ ] Verify helper text displays: "Cannot be disabled because this company has assets. Assets can only belong to transporters."
- [ ] Verify cannot toggle checkbox
- [ ] Attempt to save company (should work but checkbox remains checked)

#### 3.9.6 Logistics Coordinator Can Disable Transporter Role (No Assets)

- [ ] Create logistics coordinator company with `isAlsoTransporter = true`
- [ ] Do NOT add any assets
- [ ] Open Company Form Modal to edit company
- [ ] Verify "Is also a Transporter" checkbox is ENABLED
- [ ] Verify no helper text shown
- [ ] Toggle checkbox to unchecked
- [ ] Save company
- [ ] Verify `isAlsoTransporter` is now `false`
- [ ] Verify Assets menu disappears from navigation

#### 3.9.7 Company Switch Clears Asset Data

- [ ] Log in as user with access to multiple companies
- [ ] Switch to a transporter company (Company A)
- [ ] Navigate to Assets page
- [ ] Note the assets displayed for Company A
- [ ] Switch to different transporter company (Company B)
- [ ] Verify assets from Company A are no longer visible
- [ ] Verify assets from Company B load correctly
- [ ] Verify no stale data from Company A appears
- [ ] Verify other company-scoped data (users, products, groups, sites, clients) also clears correctly

#### 3.9.8 Company Switch - Assets Menu Visibility Changes

- [ ] Log in as user with access to multiple companies of different types
- [ ] Switch from transporter to mine company
- [ ] Verify Assets menu disappears immediately
- [ ] Switch from mine to transporter company
- [ ] Verify Assets menu appears immediately
- [ ] Switch from LC (not transporter) to LC (is transporter)
- [ ] Verify Assets menu appears immediately
- [ ] Switch from LC (is transporter) to LC (not transporter)
- [ ] Verify Assets menu disappears immediately
- [ ] Verify navigation updates without requiring page refresh

### 3.10 Bulk Fleet Number Update

**Location**: Assets Page → Trucks Tab → Select Multiple Assets → Bulk Actions Toolbar

#### 3.10.1 Bulk Update Fleet Number - Visibility

- [ ] Company has fleet number feature **enabled**
- [ ] Navigate to Assets page → Trucks tab
- [ ] Select multiple truck assets (2 or more)
- [ ] Verify bulk actions toolbar appears
- [ ] Verify "Update Fleet #" button is visible
- [ ] Switch to Trailers tab
- [ ] Select multiple trailers
- [ ] Verify "Update Fleet #" button is **NOT** visible
- [ ] Switch to Drivers tab
- [ ] Select multiple drivers
- [ ] Verify "Update Fleet #" button is **NOT** visible

#### 3.10.2 Bulk Update Fleet Number - Feature Disabled

- [ ] Company has fleet number feature **disabled**
- [ ] Navigate to Assets page → Trucks tab
- [ ] Select multiple trucks
- [ ] Verify bulk actions toolbar appears
- [ ] Verify "Update Fleet #" button is **NOT** visible

#### 3.10.3 Bulk Update Fleet Number - Assign New Value

- [ ] Select 3+ trucks without fleet numbers
- [ ] Click "Update Fleet #" button
- [ ] Verify modal opens with title "Update Fleet Numbers"
- [ ] Verify modal shows count of selected assets
- [ ] Enter fleet number "FL-2024-001"
- [ ] Click "Update" button
- [ ] Verify confirmation dialog appears
- [ ] Confirm action
- [ ] Verify success toast shows count of updated assets
- [ ] Verify all selected trucks now have fleet number "FL-2024-001"
- [ ] Verify selection is cleared automatically

#### 3.10.4 Bulk Update Fleet Number - Duplicate Validation

- [ ] Have an existing truck with fleet number "FL-2024-001"
- [ ] Select different trucks
- [ ] Click "Update Fleet #" button
- [ ] Enter "FL-2024-001" (duplicate)
- [ ] Click "Update"
- [ ] Verify error alert appears
- [ ] Error shows: "Fleet number 'FL-2024-001' is already assigned to [registration]"
- [ ] Verify no changes are made
- [ ] Change to unique fleet number "FL-2024-002"
- [ ] Verify update succeeds

#### 3.10.5 Bulk Update Fleet Number - Clear Values

- [ ] Select multiple trucks that have fleet numbers
- [ ] Click "Update Fleet #" button
- [ ] Check "Clear fleet number" checkbox
- [ ] Verify input field is disabled
- [ ] Verify button text changes to "Clear"
- [ ] Click "Clear" button
- [ ] Verify confirmation dialog asks about clearing
- [ ] Confirm action
- [ ] Verify success toast appears
- [ ] Verify all selected trucks no longer have fleet numbers (null)

#### 3.10.6 Bulk Update Fleet Number - Mixed Selection (Some with, Some without)

- [ ] Select 5 trucks: 3 with fleet numbers, 2 without
- [ ] Click "Update Fleet #" button
- [ ] Enter new fleet number "FL-2024-NEW"
- [ ] Update all assets
- [ ] Verify all 5 trucks now have "FL-2024-NEW"
- [ ] Verify previous fleet numbers are replaced

#### 3.10.7 Bulk Update Fleet Number - Validation Errors

- [ ] Select multiple trucks
- [ ] Click "Update Fleet #" button
- [ ] Leave fleet number input empty
- [ ] Do NOT check "Clear fleet number"
- [ ] Click "Update"
- [ ] Verify error: "Please enter a fleet number or check 'Clear fleet number'"
- [ ] Enter a fleet number
- [ ] Verify update succeeds

#### 3.10.8 Bulk Update Fleet Number - Cancel Action

- [ ] Select multiple trucks
- [ ] Click "Update Fleet #" button
- [ ] Enter fleet number
- [ ] Click "Cancel" button
- [ ] Verify modal closes
- [ ] Verify no changes are made to assets
- [ ] Verify selection remains active (not cleared)

### 3.11 Bulk Group Update

**Location**: Assets Page → Trucks Tab → Select Multiple Assets → Bulk Actions Toolbar

#### 3.11.1 Bulk Update Group - Visibility

- [ ] Company has group feature **enabled**
- [ ] Navigate to Assets page → Trucks tab
- [ ] Select multiple truck assets (2 or more)
- [ ] Verify bulk actions toolbar appears
- [ ] Verify "Update [GroupLabel]" button is visible (uses custom label)
- [ ] Switch to Trailers tab
- [ ] Select multiple trailers
- [ ] Verify "Update [GroupLabel]" button is **NOT** visible
- [ ] Switch to Drivers tab
- [ ] Select multiple drivers
- [ ] Verify "Update [GroupLabel]" button is **NOT** visible

#### 3.11.2 Bulk Update Group - Feature Disabled

- [ ] Company has group feature **disabled**
- [ ] Navigate to Assets page → Trucks tab
- [ ] Select multiple trucks
- [ ] Verify bulk actions toolbar appears
- [ ] Verify "Update [GroupLabel]" button is **NOT** visible

#### 3.11.3 Bulk Update Group - Assign Group

- [ ] Company has groups: "North", "South", "East", "West"
- [ ] Select 3+ trucks without groups
- [ ] Click "Update [GroupLabel]" button
- [ ] Verify modal opens with custom group label in title
- [ ] Verify modal shows count of selected assets
- [ ] Verify dropdown shows all active group options
- [ ] Select "North" from dropdown
- [ ] Click "Update" button
- [ ] Verify confirmation dialog appears
- [ ] Confirm action
- [ ] Verify success toast shows count of updated assets
- [ ] Verify all selected trucks now have group "North"
- [ ] Verify selection is cleared automatically

#### 3.11.4 Bulk Update Group - Inactive Groups Not Shown

- [ ] Company has groups: "North" (active), "South" (active), "Legacy" (inactive)
- [ ] Select multiple trucks
- [ ] Click "Update [GroupLabel]" button
- [ ] Verify dropdown shows "North" and "South"
- [ ] Verify dropdown does NOT show "Legacy"

#### 3.11.5 Bulk Update Group - Clear Groups

- [ ] Select multiple trucks that have groups assigned
- [ ] Click "Update [GroupLabel]" button
- [ ] Check "Clear [group label]" checkbox
- [ ] Verify dropdown is disabled
- [ ] Verify button text changes to "Clear"
- [ ] Click "Clear" button
- [ ] Verify confirmation dialog asks about clearing
- [ ] Confirm action
- [ ] Verify success toast appears
- [ ] Verify all selected trucks no longer have groups (null)

#### 3.11.6 Bulk Update Group - Validation Errors

- [ ] Select multiple trucks
- [ ] Click "Update [GroupLabel]" button
- [ ] Leave dropdown at "Select group..." (no selection)
- [ ] Do NOT check "Clear group"
- [ ] Click "Update"
- [ ] Verify error: "Please select a group or check 'Clear group'"
- [ ] Select a group
- [ ] Verify update succeeds

#### 3.11.7 Bulk Update Group - Cancel Action

- [ ] Select multiple trucks
- [ ] Click "Update [GroupLabel]" button
- [ ] Select a group from dropdown
- [ ] Click "Cancel" button
- [ ] Verify modal closes
- [ ] Verify no changes are made to assets
- [ ] Verify selection remains active (not cleared)

### 3.12 Bulk Actions Integration

#### 3.12.1 Both Features Enabled - Both Buttons Visible

- [ ] Company has both fleet number AND group enabled
- [ ] Select multiple trucks
- [ ] Verify bulk actions toolbar shows:
  - [ ] "Update Fleet #" button
  - [ ] "Update [GroupLabel]" button
  - [ ] "Activate" button (if any inactive selected)
  - [ ] "Deactivate" button (if any active selected)

#### 3.12.2 Update Both Fleet and Group Sequentially

- [ ] Select multiple trucks
- [ ] Click "Update Fleet #"
- [ ] Assign fleet number "FL-001"
- [ ] Verify selection is cleared after success
- [ ] Select same trucks again
- [ ] Click "Update [GroupLabel]"
- [ ] Assign group "North"
- [ ] Verify both fleet number and group are now assigned

#### 3.12.3 Bulk Actions with Single Asset

- [ ] Select only 1 truck
- [ ] Verify bulk actions toolbar appears
- [ ] Verify buttons show "1 asset selected"
- [ ] Click "Update Fleet #"
- [ ] Verify modal shows "1 selected asset"
- [ ] Update fleet number
- [ ] Verify update works for single asset

#### 3.12.4 Bulk Actions - Tab Switching Clears Selection

- [ ] On Trucks tab, select 3 trucks
- [ ] Verify bulk actions toolbar appears
- [ ] Switch to Trailers tab
- [ ] Verify selection is cleared
- [ ] Verify bulk actions toolbar disappears
- [ ] Switch back to Trucks tab
- [ ] Verify selection remains cleared

#### 3.12.5 Bulk Actions - Modal Close Behavior

- [ ] Select multiple trucks
- [ ] Click "Update Fleet #"
- [ ] Try to click outside modal
- [ ] Verify modal does NOT close (by design)
- [ ] Try pressing ESC key
- [ ] Verify modal does NOT close (by design)
- [ ] Must use "Cancel" or "Update" button to close

#### 3.12.6 Real-Time Data Updates

- [ ] User A: Select trucks and update fleet number
- [ ] User B: Open Assets page (same company)
- [ ] Verify User B sees updated fleet numbers immediately (via real-time listeners)
- [ ] Verify no page refresh required

### 3.13 Bulk Actions UI/UX

#### 3.13.1 Loading States

- [ ] Select multiple trucks
- [ ] Click "Update Fleet #"
- [ ] Fill in fleet number
- [ ] Click "Update"
- [ ] Confirm action
- [ ] Verify button shows "Updating..." during operation
- [ ] Verify button is disabled during operation
- [ ] Verify input fields are disabled during operation
- [ ] Verify success state after completion

#### 3.13.2 Error Handling

- [ ] Simulate network failure
- [ ] Attempt bulk fleet number update
- [ ] Verify error alert displays with error message
- [ ] Verify modal remains open
- [ ] Verify user can retry operation
- [ ] Fix network issue and retry
- [ ] Verify update succeeds

#### 3.13.3 Toolbar Styling

- [ ] Select trucks
- [ ] Verify bulk actions toolbar has:
  - [ ] Glass morphism styling
  - [ ] Proper z-index (stays on top when scrolling)
  - [ ] Slide-in animation when appearing
  - [ ] Count badge showing number of selected assets
  - [ ] Clear button to deselect all
  - [ ] Proper spacing between action buttons

#### 3.13.4 Button Icons

- [ ] Verify "Update Fleet #" button has Hash icon (# symbol)
- [ ] Verify "Update [GroupLabel]" button has FolderTree icon
- [ ] Verify "Activate" button has CheckCircle icon
- [ ] Verify "Deactivate" button has XCircle icon
- [ ] Verify "Clear" button has X icon

### 3.14 Bulk Actions Edge Cases

#### 3.14.1 Update Fleet Number to Existing Value (Same Asset)

- [ ] Select trucks that already have fleet number "FL-001"
- [ ] Update fleet number to "FL-001" again (same value)
- [ ] Verify duplicate validation does NOT trigger (same assets)
- [ ] Verify update succeeds (idempotent)

#### 3.14.2 Large Selection (100+ Assets)

- [ ] Select 100+ trucks (if available)
- [ ] Update fleet number
- [ ] Verify operation completes successfully
- [ ] Verify performance is acceptable (< 5 seconds)
- [ ] Verify all assets updated correctly

#### 3.14.3 Company Settings Change While Modal Open

- [ ] Select trucks and open "Update Fleet #" modal
- [ ] In another tab, disable fleet number feature
- [ ] Return to modal and try to update
- [ ] Verify appropriate error handling
- [ ] Verify modal closes gracefully

#### 3.14.4 Whitespace in Fleet Number

- [ ] Select trucks
- [ ] Update fleet number to "  FL-001  " (leading/trailing spaces)
- [ ] Verify spaces are trimmed
- [ ] Verify saved as "FL-001"

#### 3.14.5 Mixed Active/Inactive Assets

- [ ] Select 5 trucks: 3 active, 2 inactive
- [ ] Update fleet number
- [ ] Verify all 5 trucks get updated regardless of active status
- [ ] Verify inactive status is preserved

### 3.15 Bulk Actions Permissions

#### 3.15.1 Bulk Actions Require Edit Permission

- [ ] Log in as user without ASSETS_EDIT permission
- [ ] Navigate to Assets page
- [ ] Select multiple trucks
- [ ] Verify bulk actions toolbar does NOT appear
- [ ] Verify cannot bulk update fleet numbers or groups

#### 3.15.2 Read-Only User

- [ ] Log in as user with ASSETS_VIEW only (no edit)
- [ ] Navigate to Assets page
- [ ] Verify can view assets
- [ ] Verify row selection is disabled
- [ ] Verify bulk actions are not accessible

---

## 4. Products Management (Mine Companies Only)

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

## 5. Clients Management (Mine Companies Only)

**Location**: Admin → Clients

**Note**: This menu item is only visible for users in Mine companies.

### 5.1 Access Control by Company Type

- [ ] **As Mine company user**: Clients menu item is visible in sidebar
- [ ] **As Transporter company user**: Clients menu item is NOT visible in sidebar
- [ ] **As Logistics Coordinator company user**: Clients menu item is NOT visible in sidebar

### 5.2 View Clients List

- [ ] Clients page loads without errors
- [ ] Can see list of clients scoped to current company
- [ ] Client cards display: name, contact person, email, phone, status
- [ ] Active/Inactive status is clearly visible
- [ ] Search bar is visible at top

### 5.3 Create Client

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

### 5.4 Edit Client

- [ ] Can click "Edit" button on client card
- [ ] Modal opens with "Edit Client" title
- [ ] All fields are pre-populated with existing data
- [ ] Can modify all client fields
- [ ] Can toggle active status
- [ ] Can save changes successfully
- [ ] Success toast notification appears
- [ ] Changes reflect in clients list

### 5.5 View Client (Read-Only)

- [ ] Can click "View" button on client card (FileText icon)
- [ ] Modal opens with "View Client" title
- [ ] All form fields are disabled (read-only)
- [ ] Only "Close" button is visible
- [ ] Modal closes when clicking Close

### 5.6 Delete Client

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

### 5.7 Search Clients

- [ ] Can type in search bar
- [ ] Clients filter as you type (by name or contact person)
- [ ] Search is case-insensitive

---

## 6. Sites Management (Mine Companies Only)

**Location**: Admin → Sites

**Note**: This menu item is only visible for users in Mine companies.

### 6.1 Access Control by Company Type

- [ ] **As Mine company user**: Sites menu item is visible in sidebar
- [ ] **As Transporter company user**: Sites menu item is NOT visible in sidebar
- [ ] **As Logistics Coordinator company user**: Sites menu item is NOT visible in sidebar

### 6.2 View Sites List

- [ ] Sites page loads without errors
- [ ] Can see list of sites scoped to current company
- [ ] Site cards display: name, location, group assignment, contacts, status
- [ ] Active/Inactive status is clearly visible
- [ ] Search bar is visible at top

### 6.3 Create Site

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

### 6.4 Edit Site

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

### 6.5 View Site (Read-Only)

- [ ] Can click "View" button on site card (FileText icon)
- [ ] Modal opens with "View Site" title
- [ ] All form fields are disabled (read-only)
- [ ] Can see group assignment (if any)
- [ ] Only "Close" button is visible

### 6.6 Delete Site

- [ ] Can click "Delete" button on site card
- [ ] Confirmation dialog appears
- [ ] **If site is in use** (referenced in orders, weighbridge records):
  - [ ] Error message appears preventing deletion
  - [ ] Toast notification explains why deletion failed
- [ ] **If site is not in use**:
  - [ ] Site is deleted successfully
  - [ ] Success toast notification appears

### 6.7 Site-Group Relationship

- [ ] Sites assigned to a group display the group name
- [ ] Can filter/view sites by group (if implemented)
- [ ] Cannot delete a group that has sites assigned to it (tested in Groups section)
- [ ] Can change a site's group assignment
- [ ] Can remove group assignment from a site (set to none)

### 6.8 Search Sites

- [ ] Can type in search bar
- [ ] Sites filter as you type (by name or code)

---

## 7. Users Management

**Location**: Admin → Users

### 7.1 View Users List

- [ ] Users page loads without errors
- [ ] Can see list of users scoped to current company
- [ ] User table displays: name, email, role, status, global admin badge
- [ ] Active/Inactive status is clearly visible
- [ ] Global admin users show special badge/indicator
- [ ] Search bar is visible at top
- [ ] Can see user count

### 7.2 Create User (Regular Login User)

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

### 7.3 Create Contact-Only User (No Login)

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

### 7.4 Edit User - Basic Information

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

### 7.5 Edit User - Change Email

- [ ] Click dropdown menu on user row
- [ ] Select "Change Email" option
- [ ] Email change modal appears
- [ ] Can enter new email address
- [ ] Email format validation works
- [ ] Can submit new email
- [ ] Firebase Authentication email is updated
- [ ] Success toast notification appears
- [ ] User's email updates in list

### 7.6 Edit User - Change Role

- [ ] Open user in edit mode
- [ ] Can select different role from dropdown
- [ ] Role change saves successfully
- [ ] User's permissions update based on new role

### 7.7 Edit User - Toggle Global Administrator

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

### 7.8 Edit User - Toggle Active Status

- [ ] Open user in edit mode
- [ ] Can toggle "Active" status on/off
- [ ] Inactive users cannot log in
- [ ] Changes save successfully

### 7.9 Edit User - Permission Overrides

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

### 7.10 View User Details (Read-Only)

- [ ] Click dropdown menu on user row
- [ ] Select "View Details" option (or FileText icon)
- [ ] View User modal opens
- [ ] All fields are read-only (disabled)
- [ ] Can see user's basic info, role, status
- [ ] Only "Close" button is visible

### 7.11 View User Roles (Read-Only)

- [ ] Click dropdown menu on user row
- [ ] Select "View Roles" option
- [ ] Modal shows user's assigned role
- [ ] Shows all permissions granted by the role
- [ ] Read-only view (cannot edit)
- [ ] Only "Close" button is visible

### 7.12 View User Permissions (Read-Only)

- [ ] Click dropdown menu on user row
- [ ] Select "View Permissions" option (or Lock icon)
- [ ] Modal shows effective permissions (role + overrides)
- [ ] Shows which permissions are from role vs overrides
- [ ] Read-only view (cannot edit)
- [ ] Only "Close" button is visible

### 7.13 Convert Login User to Contact-Only

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

### 7.14 Convert Contact-Only to Login User

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

### 7.15 Delete User

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

### 7.16 Search Users

- [ ] Can type in search bar
- [ ] Users filter as you type (by name or email)
- [ ] Search is case-insensitive

### 7.17 User Dropdown Menu (All Actions)

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

### 7.18 Global Admin Restrictions

- [ ] Regular users cannot see "Manage Global Admins" permission
- [ ] Only global admins with "admin.users.manageGlobalAdmins" permission can:
  - [ ] See "Manage Global Admins" permission in role editor
  - [ ] Grant global admin status to other users
  - [ ] Edit other global admins

---

## 8. Roles Management

**Location**: Admin → Roles

### 8.1 View Roles List

- [ ] Roles page loads without errors
- [ ] Can see list of all roles (roles are global, shared across companies)
- [ ] Role cards display: name, description, permission count
- [ ] Default system roles are visible (Newton Admin, Allocation Officer, Security Guard, etc.)
- [ ] Search bar is visible at top

### 8.2 View Role Permissions

- [ ] Can click on role card to view details
- [ ] Modal shows role name and description
- [ ] Lists all permissions granted by this role
- [ ] Permissions are organized by category
- [ ] Can see which users have this role (user count)

### 8.3 Create Role

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

### 8.4 Edit Role

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

### 8.5 View Role (Read-Only)

- [ ] Can click "View" button on role card (FileText icon)
- [ ] Modal opens with "View Role" title
- [ ] All form fields are disabled (read-only)
- [ ] Permission checkboxes are disabled
- [ ] Can see all role data but cannot edit
- [ ] Only "Close" button is visible

### 8.6 Delete Role

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

### 8.7 Permission Filtering by Company Type

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

### 8.8 "Manage Global Admins" Permission

- [ ] Regular users do NOT see "Manage Global Admins" permission
- [ ] Only global admins with "admin.users.manageGlobalAdmins" permission can:
  - [ ] See this permission in role editor
  - [ ] Assign this permission to roles
- [ ] This permission is in "Administrative" category

### 8.9 Search Roles

- [ ] Can type in search bar
- [ ] Roles filter as you type (by name or description)
- [ ] Search is case-insensitive

### 8.10 Default System Roles

- [ ] "Newton Admin" role exists with full permissions
- [ ] "Allocation Officer" role exists
- [ ] "Security Guard" role exists
- [ ] "Weighbridge Operator" role exists
- [ ] "Driver" role exists
- [ ] "Contact" role exists (minimal/no permissions)
- [ ] Can view permissions for each default role
- [ ] Can edit default roles (if needed)

---

## 9. Notification Templates Management

**Location**: Admin → Notifications

### 9.1 View Notification Templates List

- [ ] Notification templates page loads without errors
- [ ] Can see list of notification templates
- [ ] Template cards display: name, notification type, enabled status
- [ ] Enabled/Disabled status is clearly visible
- [ ] Search bar is visible

### 9.2 View Notification Template

- [ ] Can click on template card to view
- [ ] Modal shows template details
- [ ] Can see notification type (e.g., "asset.added", "order.completed")
- [ ] Can see template name
- [ ] Can see subject line
- [ ] Can see message body
- [ ] Can see enabled/disabled status

### 9.3 Edit Notification Template

- [ ] Can click "Edit" button on template
- [ ] Modal opens with template editor
- [ ] Can modify subject line
- [ ] Can modify message body
- [ ] Message body supports template variables (e.g., {{assetName}}, {{orderNumber}})
- [ ] Can toggle enabled/disabled status
- [ ] Can save changes
- [ ] Success toast notification appears

### 9.4 Test Notification Template (if implemented)

- [ ] Can see "Test" button on template
- [ ] Click test button
- [ ] Can enter recipient email
- [ ] Test notification is sent
- [ ] Success message confirms test sent

### 9.5 Search Notification Templates

- [ ] Can type in search bar
- [ ] Templates filter as you type (by name or type)

### 9.6 Template Variables Documentation

- [ ] Documentation or tooltip shows available template variables
- [ ] Variables are clearly explained (what each one represents)
- [ ] Examples of template usage are provided

---

## 10. Settings

**Location**: Top Navigation → Settings Icon → Settings

### 10.1 Profile Tab

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

### 10.2 Appearance Tab

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

### 10.3 Notifications Tab

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

### 10.4 Security Tab

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

### 10.5 Settings Navigation & UI

- [ ] Tab navigation is clear and intuitive
- [ ] Active tab is visually highlighted
- [ ] Can navigate between tabs without losing unsaved changes warning (if implemented)
- [ ] Settings modal/page is responsive on mobile
- [ ] Can close settings and return to previous page

---

## 11. Authentication & Session Management

### 11.1 Login Process

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

### 11.2 Logout Process

- [ ] Can click user profile menu in top navigation
- [ ] Can select "Log Out" option
- [ ] User is logged out successfully
- [ ] Redirected to login page
- [ ] Session is cleared
- [ ] Cannot access protected pages without logging in again

---

## 12. Security & Permissions

### 12.1 Permission Enforcement

- [ ] Users without "admin.companies" permission cannot access Companies page
- [ ] Users without "admin.users" permission cannot access Users page
- [ ] Users without "admin.products" permission cannot access Products page (mine companies)

### 12.2 Company Type Access Control

- [ ] Transporter users do NOT see Products menu item
- [ ] Transporter users do NOT see Clients menu item
- [ ] Transporter users do NOT see Sites menu item
- [ ] Transporter users do NOT see Groups functionality
- [ ] Logistics Coordinator users do NOT see Products menu item
- [ ] Logistics Coordinator users do NOT see Clients menu item
- [ ] Logistics Coordinator users do NOT see Sites menu item
- [ ] Mine users see ALL menu items and features

### 12.3 Global Admin Restrictions

- [ ] Regular users cannot elevate themselves to global admin
- [ ] Elevating another user to global admin requires re-authentication
- [ ] Re-authentication modal validates current user's password
- [ ] Only global admins with "admin.users.manageGlobalAdmins" can:
  - [ ] See/assign "Manage Global Admins" permission
  - [ ] Grant global admin status to other users

### 12.4 Data Scoping

- [ ] Users see only data from their own company (unless global admin)
- [ ] Global admins can switch companies and see all data

---

## 13. Data Export (if implemented)

### 13.1 Export to Excel

- [ ] Can export companies list to Excel
- [ ] Can export users list to Excel
- [ ] Can export products list to Excel
- [ ] Excel file downloads correctly
- [ ] Excel file contains all expected columns
- [ ] Excel file contains correct data

### 13.2 Export to PDF

- [ ] Can export reports to PDF
- [ ] PDF downloads correctly
- [ ] PDF formatting is correct

---

## 14. Order Management (Mine Companies Only)

**Location**: Orders Menu

**Note**: This menu item is only visible for users in Mine companies. Order management involves creating orders, allocating to logistics coordinators or transporters, and tracking order fulfillment.

### 14.1 Access Control by Company Type

- [ ] **As Mine company user**: Orders menu item is visible in sidebar
- [ ] **As Transporter company user**: Orders menu item is visible (can view allocated orders only)
- [ ] **As Logistics Coordinator company user**: Orders menu item is visible (can view and allocate orders)
- [ ] **As Mine company user with ORDERS_VIEW permission**: Can access orders page
- [ ] **Without ORDERS_VIEW permission**: Orders menu item is NOT visible

### 14.2 Order Creation Wizard - Step 1: Order Number

**Location**: Orders → Create Order button

#### 14.2.1 Auto-Generated Order Number (orderNumberMode: "autoOnly")

- [ ] Can click "Create Order" button
- [ ] Wizard modal opens with Step 1: Order Number
- [ ] Display shows auto-generated order number (read-only)
- [ ] Format: `{orderConfig.orderNumberPrefix}YYYY-NNNN` (e.g., ORD-2025-0001)
- [ ] Can proceed to Step 2

#### 14.2.2 Manual Order Number Entry (orderNumberMode: "manualAllowed")

- [ ] Wizard shows radio buttons for order number selection
- [ ] **Option 1: Use Auto-Generated**:
  - [ ] Radio button selected by default
  - [ ] Displays auto-generated format
  - [ ] Can proceed to Step 2
- [ ] **Option 2: Enter Manual Order Number**:
  - [ ] Can select manual entry radio button
  - [ ] Text input field appears
  - [ ] Can enter custom order number
  - [ ] **Duplicate Validation**:
    - [ ] On blur, system checks for duplicate order numbers
    - [ ] If duplicate exists: Error message appears
    - [ ] Error shows: "Order Number Already Exists"
    - [ ] Next button is disabled until unique number entered
  - [ ] With unique number: Can proceed to Step 2

### 14.3 Order Creation Wizard - Step 2: Basic Information

#### 14.3.1 Order Type Selection

- [ ] **Order Type radio buttons**:
  - [ ] "Receiving" option available
  - [ ] "Dispatching" option available (default selected)
  - [ ] Can select either option
  - [ ] Selection affects later steps (sites, trip calculations)

#### 14.3.2 Client Selection

- [ ] Client dropdown displays active clients
- [ ] Can search/filter clients
- [ ] Required field validation works
- [ ] Can select client from dropdown

#### 14.3.3 Dispatch Date Range

- [ ] Start date picker visible
- [ ] End date picker visible
- [ ] Both fields required
- [ ] **Date Validation**:
  - [ ] End date must be >= Start date
  - [ ] Error message if end before start
  - [ ] Cannot proceed with invalid date range

#### 14.3.4 Total Weight

- [ ] Number input for total weight (kg)
- [ ] Required field validation
- [ ] Must be > 0
- [ ] Error message if zero or negative
- [ ] Can enter weight value
- [ ] Can proceed to Step 3

### 14.4 Order Creation Wizard - Step 3: Sites

#### 14.4.1 Collection Site Selection

- [ ] Dropdown shows active sites where siteType = 'collection'
- [ ] Can search/filter sites
- [ ] Required field
- [ ] **Site Display Info**:
  - [ ] Shows site name
  - [ ] Shows site address
  - [ ] Shows operating hours (collapsed/expandable)
- [ ] Can select collection site

#### 14.4.2 Destination Site Selection

- [ ] Dropdown shows active sites where siteType = 'destination'
- [ ] Can search/filter sites
- [ ] Required field
- [ ] Shows site name and address
- [ ] Can select destination site

#### 14.4.3 Site Validation

- [ ] **Cannot select same site for both**:
  - [ ] If collection = destination: Error message appears
  - [ ] Error: "Collection and Destination sites must be different"
  - [ ] Next button disabled until valid
- [ ] With different sites: Can proceed to Step 4

### 14.5 Order Creation Wizard - Step 4: Product

- [ ] Product dropdown shows active products
- [ ] Can search/filter products
- [ ] Required field
- [ ] **Product Display Info**:
  - [ ] Shows product name
  - [ ] Shows product code
  - [ ] Shows category
- [ ] Can select product
- [ ] Can proceed to Step 5

### 14.6 Order Creation Wizard - Step 5: Seal Requirements

#### 14.6.1 Seal Configuration

- [ ] "Seal Required" checkbox visible
- [ ] Pre-filled from `company.orderConfig.defaultSealRequired`
- [ ] Can toggle seal requirement on/off
- [ ] **Seal Quantity Field**:
  - [ ] Number input visible
  - [ ] Pre-filled from `company.orderConfig.defaultSealQuantity`
  - [ ] Disabled when "Seal Required" unchecked
  - [ ] Enabled when "Seal Required" checked
  - [ ] **Validation**:
    - [ ] If seal required: Quantity must be > 0
    - [ ] Error message if required but quantity = 0
    - [ ] Cannot proceed with invalid seal configuration
- [ ] Can proceed to Step 6

### 14.7 Order Creation Wizard - Step 6: Limits

#### 14.7.1 Daily Truck Limit

- [ ] Number input visible
- [ ] Pre-filled from `company.orderConfig.defaultDailyTruckLimit`
- [ ] Required field
- [ ] Must be > 0
- [ ] Can modify value

#### 14.7.2 Daily Weight Limit

- [ ] Number input visible (kg)
- [ ] Pre-filled from `company.orderConfig.defaultDailyWeightLimit`
- [ ] Required field
- [ ] Must be > 0
- [ ] Can modify value

#### 14.7.3 Monthly Limit (Optional)

- [ ] Number input visible (kg)
- [ ] Pre-filled from `company.orderConfig.defaultMonthlyLimit`
- [ ] Optional field (can leave blank)
- [ ] If entered, must be > 0
- [ ] Can proceed to Step 7

### 14.8 Order Creation Wizard - Step 7: Trip Configuration

**Note**: This step determines how many trips per day each truck can make, which affects truck capacity calculations in Step 8.

#### 14.8.1 Trip Configuration Mode Selection

- [ ] Radio buttons for trip configuration mode visible
- [ ] **Option 1: Maximum Trips Per Day**
- [ ] **Option 2: Trip Duration (hours)**
- [ ] Can select either option

#### 14.8.2 Option 1: Maximum Trips Per Day

- [ ] Number input for trips per day
- [ ] Pre-filled from `company.orderConfig.defaultTripLimit` (default 1)
- [ ] Validation: >= 1
- [ ] Applied uniformly across all order days
- [ ] **Display Summary**:
  - [ ] Shows "This order allows {tripsPerDay} trips per day"
  - [ ] Shows per-truck capacity breakdown
  - [ ] "{tripsPerDay} trips/day × {weightPerTrip} kg/trip = {weightPerDay} kg/day"
  - [ ] "Over {orderDurationDays} days: {weightPerTruckOverDuration} kg per truck"
- [ ] Can proceed to Step 8

#### 14.8.3 Option 2: Trip Duration - Multiple Trips Per Day

**Scenario**: Trip duration ≤ operating hours (e.g., 4 hours with 10h operating hours)

- [ ] Number input for trip duration (hours)
- [ ] Enter trip duration (e.g., 4 hours)
- [ ] **System Calculation**:
  - [ ] Uses relevant site operating hours:
    - [ ] **Dispatching orders**: Collection site operating hours
    - [ ] **Receiving orders**: Destination site operating hours
  - [ ] Formula: `tripsPerDay = Math.floor(operatingHours / tripDuration)`
  - [ ] Example: 10h ÷ 4h = 2.5 → 2 trips/day
- [ ] **Display shows**:
  - [ ] "This order allows 2 trips per day"
  - [ ] Per-truck capacity breakdown
  - [ ] "2 trips/day × {weightPerTrip} kg/trip = {weightPerDay} kg/day"
  - [ ] "Over {orderDurationDays} days: {weightPerTruckOverDuration} kg per truck"
- [ ] Can proceed to Step 8

#### 14.8.4 Option 2: Trip Duration - Single Trip Per Day

**Scenario**: Trip duration > operating hours but ≤ 24h (e.g., 15 hours with 10h operating hours)

- [ ] Enter trip duration (e.g., 15 hours)
- [ ] **System Calculation**:
  - [ ] `tripsPerDay = 1`
  - [ ] Note: "Trip duration exceeds operating hours but ≤24h - 1 trip per day possible"
- [ ] **Display shows**:
  - [ ] "This order allows 1 trip per day"
  - [ ] Warning message explaining trip exceeds operating hours
  - [ ] Per-truck capacity breakdown
  - [ ] "1 trip/day × {weightPerTrip} kg/trip = {weightPerDay} kg/day"
- [ ] Can proceed to Step 8

#### 14.8.5 Option 2: Trip Duration - Multi-Day Trips

**Scenario**: Trip duration > 24h (e.g., 30 hours)

- [ ] Enter trip duration (e.g., 30 hours)
- [ ] **System Calculation**:
  - [ ] `tripsPerDay = 1 / Math.ceil(tripDuration / 24)`
  - [ ] Example: 30h = 2 days per trip → 0.5 trips/day
  - [ ] Note: "Multi-day trip - 2 days per trip"
- [ ] **Display shows**:
  - [ ] "This order allows 0.5 trips per day"
  - [ ] Multi-day trip warning/info box
  - [ ] "2 days required per trip"
  - [ ] Per-truck capacity breakdown
  - [ ] "0.5 trips/day × {weightPerTrip} kg/trip = {weightPerDay} kg/day"
  - [ ] "Over {orderDurationDays} days: {weightPerTruckOverDuration} kg per truck"
- [ ] Calculation notes displayed
- [ ] Can proceed to Step 8

#### 14.8.6 Trip Duration Validation

- [ ] Trip duration must be > 0
- [ ] Error message if zero or negative
- [ ] Cannot proceed with invalid duration

### 14.9 Order Creation Wizard - Step 8: Allocation Method

**Note**: This step shows truck capacity calculations from Step 7 and allows allocation to LC or direct to transporters.

#### 14.9.1 Truck Capacity Display

- [ ] Blue info box visible at top of step
- [ ] **Displays complete calculation from Step 7**:
  - [ ] "{tripsPerDay} trips per day × {weightPerTrip} kg per trip = {weightPerDay} kg/day"
  - [ ] "Over {orderDurationDays} days: **{weightPerTruckOverDuration} kg per truck**"
  - [ ] Calculation notes (e.g., "Multi-day trip - 2 days per trip")
- [ ] Calculation uses real-time data from `calculateTruckCapacityOverDuration()` function
- [ ] **Respects conditional site selection**:
  - [ ] Dispatching orders: Uses collection site operating hours
  - [ ] Receiving orders: Uses destination site operating hours

#### 14.9.2 Allocation Mode Selection

- [ ] Radio buttons for allocation method visible
- [ ] **Option 1: Assign to Logistics Coordinator**
- [ ] **Option 2: Assign to Transporter Companies**
- [ ] Can select either option

#### 14.9.3 Option 1: Assign to Logistics Coordinator

- [ ] Can select "Assign to Logistics Coordinator" radio button
- [ ] Dropdown shows companies where companyType = 'logistics_coordinator'
- [ ] Can search/filter LCs
- [ ] Required to select LC
- [ ] **Display Note**: "LC will distribute weight to transporters later"
- [ ] Can proceed to Step 9 (Review)
- [ ] **On Submit** (Step 9):
  - [ ] Order created with `allocations = []` (empty)
  - [ ] LC company ID added to `allocatedCompanyIds` array
  - [ ] Notification sent to LC contacts (always sent)
  - [ ] Notification sent to users with "order.allocated" enabled

#### 14.9.4 Option 2: Assign to Transporter Companies - Add Transporter

- [ ] Can select "Assign to Transporter Companies" radio button
- [ ] "Add Transporter" button visible
- [ ] Can click "Add Transporter" button
- [ ] **Mini-modal opens** with transporter allocation form:
  - [ ] Company dropdown (companyType = 'transporter')
  - [ ] Can search/filter transporters
  - [ ] **Truck Limit Field**:
    - [ ] Number input for trucks to allocate
    - [ ] Fetches transporter's active trucks from Firestore (lazy-loaded)
    - [ ] Displays "{count} active trucks available"
    - [ ] Can enter number of trucks
  - [ ] **Allocated Weight Field**:
    - [ ] Number input (kg)
    - [ ] Required field
    - [ ] Must be > 0
  - [ ] **Loading Dates**:
    - [ ] Multi-date picker visible
    - [ ] Shows dates from order date range
    - [ ] Can select multiple dates
    - [ ] Required field
  - [ ] "Add" button to confirm transporter
  - [ ] "Cancel" button to close modal

#### 14.9.5 Option 2: Transporter List Display

- [ ] Added transporters appear in list
- [ ] **Each transporter shows**:
  - [ ] Company name
  - [ ] Number of trucks allocated
  - [ ] Allocated weight
  - [ ] Loading dates (comma-separated)
  - [ ] "Remove" button (X icon)
- [ ] Can add multiple transporters
- [ ] Can remove transporter from list
- [ ] List updates in real-time

#### 14.9.6 Option 2: Weight Allocation Validation

- [ ] **Total allocated weight display** shows running total
- [ ] System validates: Sum(allocatedWeights) = totalWeight
- [ ] **If mismatch**:
  - [ ] Error message appears
  - [ ] Shows: "Weight allocation doesn't match total ({sum}/{total})"
  - [ ] Next button disabled
  - [ ] Cannot proceed to Step 9
- [ ] **When sum matches total**:
  - [ ] Success indicator (green checkmark/message)
  - [ ] Next button enabled
  - [ ] Can proceed to Step 9
- [ ] **On Submit** (Step 9):
  - [ ] Order created with `allocations` array
  - [ ] Each allocation includes `trucks` count
  - [ ] All transporter company IDs added to `allocatedCompanyIds` array
  - [ ] Notification sent to each transporter (always sent)
  - [ ] Notification sent to users with "order.allocated" enabled

### 14.10 Order Creation Wizard - Step 9: Review & Submit

#### 14.10.1 Review Screen Display

- [ ] **Summary sections visible**:
  - [ ] Order Number section
  - [ ] Order Type, Client section
  - [ ] Date Range section
  - [ ] Total Weight section
  - [ ] Collection Site, Destination Site section
  - [ ] Product section
  - [ ] Seal Requirements section
  - [ ] Limits (daily truck, daily weight, monthly) section
  - [ ] Trip Configuration section
  - [ ] Allocations section (if any)
- [ ] All entered data displays correctly
- [ ] **Edit Capability**:
  - [ ] Each section has "Edit" button
  - [ ] Click Edit returns to relevant step
  - [ ] Changes reflect in review screen

#### 14.10.2 Submit Order

- [ ] "Submit" button visible
- [ ] Can click Submit
- [ ] **Processing**:
  - [ ] Loading state shows
  - [ ] `OrderService.create(orderData)` called
  - [ ] Trip capacity calculation saved with order (`tripCapacityCalculation` field)
  - [ ] Order status set:
    - [ ] If allocated to LC or transporters: `status = 'allocated'`
    - [ ] Otherwise: `status = 'pending'`
- [ ] **Success**:
  - [ ] Success toast notification appears
  - [ ] Wizard modal closes
  - [ ] Redirects to order details page
  - [ ] New order appears in orders list

#### 14.10.3 Order Creation - Error Handling

- [ ] **If validation errors**:
  - [ ] Cannot submit
  - [ ] Error messages display
  - [ ] Can go back to fix errors
- [ ] **If backend errors**:
  - [ ] Error toast notification
  - [ ] Wizard remains open
  - [ ] Can retry submission

### 14.11 Order Allocation (Post-Creation by LC)

**Location**: Orders → Allocate button (LC companies only)

**Scenario**: Order was created with allocation to LC (Step 8, Option 1), now LC needs to distribute weight to transporters.

#### 14.11.1 Access LC Allocate Page

- [ ] **As LC company user**:
  - [ ] Can see orders allocated to LC company
  - [ ] "Allocate" button visible on order card/row
  - [ ] Can click "Allocate" button
  - [ ] Navigates to `/orders/allocate/[id]` page
- [ ] **As Mine company user**:
  - [ ] Cannot see "Allocate" button (not LC)
- [ ] **As Transporter user**:
  - [ ] Cannot see "Allocate" button (not LC)

#### 14.11.2 Allocate Page Display

- [ ] Page loads with order details
- [ ] **Order Summary Section** (read-only):
  - [ ] Order number
  - [ ] Total weight
  - [ ] Date range
  - [ ] Product
  - [ ] Client
- [ ] **Per Truck Capacity Info** (blue info box, MATCHES CREATE ORDER DISPLAY):
  - [ ] **Preferentially uses saved** `order.tripCapacityCalculation` (if available):
    - [ ] "{tripsPerDay} trips per day × {weightPerTrip} kg per trip = {weightPerDay} kg/day"
    - [ ] "Over {orderDurationDays} days: **{weightPerTruckOverDuration} kg per truck**"
    - [ ] Calculation notes (if applicable)
  - [ ] **Fallback**: Calculates from order data for existing orders without saved calculation:
    - [ ] Shows orange warning: "⚠️ Calculated from order data (order created before capacity calculations were saved)"
    - [ ] Uses order.tripLimit or order.tripDuration
    - [ ] Calculates based on saved order config

#### 14.11.3 Add Transporter to Allocation

- [ ] "Add Transporter" button visible
- [ ] Can click "Add Transporter"
- [ ] **Transporter selection form**:
  - [ ] Company dropdown (companyType = 'transporter')
  - [ ] Can search/filter transporters
  - [ ] **Truck Limit Field**:
    - [ ] Number input for trucks to allocate
    - [ ] When company selected: Fetches active trucks from Firestore (lazy-loaded)
    - [ ] Displays "{count} active trucks available"
    - [ ] Can enter number of trucks
  - [ ] **Allocated Weight**:
    - [ ] Number input (kg)
    - [ ] Required field
  - [ ] **Loading Dates**:
    - [ ] Multi-date picker
    - [ ] Shows dates from order date range
    - [ ] Can select multiple dates
  - [ ] "Add" button
  - [ ] "Cancel" button

#### 14.11.4 Allocation List Display

- [ ] Added transporters appear in list
- [ ] **Each allocation shows**:
  - [ ] Company name
  - [ ] Number of trucks allocated
  - [ ] Weight allocated
  - [ ] Loading dates (comma-separated)
  - [ ] "Edit" button
  - [ ] "Remove" button
- [ ] Can edit existing allocation
- [ ] Can remove allocation from list

#### 14.11.5 Allocation Validation

- [ ] **Total allocated weight display** visible
- [ ] **Progress bar**: {allocated}/{total} kg
- [ ] Visual indicator shows progress
- [ ] **Validation**: Sum = total weight
- [ ] **If sum < total**:
  - [ ] Error: "Weight allocation incomplete ({sum}/{total})"
  - [ ] Submit button disabled
- [ ] **If sum > total**:
  - [ ] Error: "Weight allocation exceeds total ({sum}/{total})"
  - [ ] Submit button disabled
- [ ] **If sum = total**:
  - [ ] Success indicator (green)
  - [ ] Submit button enabled

#### 14.11.6 Submit Allocation

- [ ] "Submit" button enabled when valid
- [ ] Can click Submit
- [ ] **Processing**:
  - [ ] Loading state shows
  - [ ] `order.allocations` array updated (includes `trucks` count for each)
  - [ ] `order.status` updated to 'allocated'
  - [ ] All transporter company IDs added to `allocatedCompanyIds` array
- [ ] **Success**:
  - [ ] Success toast notification
  - [ ] Redirects to order details or orders list
  - [ ] Notifications sent:
    - [ ] To each transporter (always sent)
    - [ ] To users with "order.allocated" notification enabled

#### 14.11.7 Allocation - Loading Dates Validation

- [ ] **Loading dates must be within order date range**:
  - [ ] System validates dates are between dispatchStartDate and dispatchEndDate
  - [ ] Error if date outside range
  - [ ] Cannot add transporter with invalid dates

### 14.12 Order Listing & Search

**Location**: Orders page

#### 14.12.1 View Orders List

- [ ] Orders page loads without errors
- [ ] **Company-specific order visibility**:
  - [ ] **Mine company**: Sees orders created by mine
  - [ ] **Transporter company**: Sees orders where transporter is in `allocatedCompanyIds`
  - [ ] **LC company**: Sees orders where LC is in `allocatedCompanyIds`
  - [ ] **Global Admin**: Can see all orders for current company context
- [ ] Orders display in table or card view
- [ ] **Each order shows**:
  - [ ] Order number
  - [ ] Order type (Receiving/Dispatching)
  - [ ] Client name
  - [ ] Product name
  - [ ] Total weight
  - [ ] Allocated weight / Completed weight
  - [ ] Progress bar
  - [ ] Dispatch date range
  - [ ] Status badge
  - [ ] Actions (View, Allocate if LC, Cancel)

#### 14.12.2 Order Status Badges

- [ ] **Status badge colors correct**:
  - [ ] Gray: Pending
  - [ ] Blue: Allocated
  - [ ] Green: Completed
  - [ ] Red: Cancelled
- [ ] Status badge displays current status
- [ ] Badge styling is consistent

#### 14.12.3 Search Orders

- [ ] Search bar visible at top
- [ ] Can type in search bar
- [ ] **Search filters by**:
  - [ ] Order number
  - [ ] Product name
  - [ ] Client name
- [ ] Search is case-insensitive
- [ ] Real-time filtering as you type
- [ ] Can clear search to see all orders
- [ ] "No results" message if no matches

#### 14.12.4 Filter Orders

- [ ] **Status Filter**:
  - [ ] Dropdown shows: All, Pending, Allocated, Completed, Cancelled
  - [ ] Can select status
  - [ ] Orders filter immediately
  - [ ] Filter persists during session
- [ ] **Order Type Filter**:
  - [ ] Dropdown shows: All, Receiving, Dispatching
  - [ ] Can select type
  - [ ] Orders filter immediately
- [ ] **Date Range Filter** (if implemented):
  - [ ] Can select custom date range
  - [ ] Orders filter to date range
- [ ] **Allocated to Me Filter** (for transporters):
  - [ ] Checkbox shows "Show only orders allocated to me"
  - [ ] When checked: Filters to orders with company in allocatedCompanyIds
- [ ] **Combined Filtering**:
  - [ ] All filters work together
  - [ ] Search + status + type + date range combine correctly
  - [ ] Clear filters button resets all

#### 14.12.5 Order Actions from List

- [ ] **View button** (always visible):
  - [ ] Click View navigates to order details page
- [ ] **Allocate button** (LC companies only):
  - [ ] Only visible for LC companies
  - [ ] Only visible for orders where `allocations = []` OR order assigned to LC
  - [ ] Click Allocate navigates to allocation page
- [ ] **Cancel button** (mine companies only):
  - [ ] Only visible for mine companies
  - [ ] Hidden from LCs and transporters
  - [ ] Only visible if order status ≠ 'cancelled' AND ≠ 'completed'
  - [ ] Click Cancel opens cancellation modal

### 14.13 Order Details Page

**Location**: Orders → View Order

#### 14.13.1 View Order Details

- [ ] Can click "View" button on order card/row
- [ ] Details page loads with order ID in URL
- [ ] **Page Header**:
  - [ ] Order number (large, prominent)
  - [ ] Order type badge (Receiving/Dispatching)
  - [ ] Status badge (Pending/Allocated/Completed/Cancelled)
  - [ ] Action buttons (permission-based)
- [ ] **Order Details Card**:
  - [ ] Order number
  - [ ] Type (Receiving/Dispatching)
  - [ ] Client name
  - [ ] Product name
  - [ ] Total weight
  - [ ] Dispatch date range (start - end)
  - [ ] Collection site (name, address)
  - [ ] Destination site (name, address)
  - [ ] Seal requirements (required/not required, quantity)
  - [ ] Limits (daily truck limit, daily weight limit, monthly limit)
  - [ ] Trip configuration (trip limit or trip duration)
  - [ ] Created by (user name)
  - [ ] Created date

#### 14.13.2 Trip Capacity Breakdown Display

- [ ] **If `tripCapacityCalculation` field exists** (orders created after feature):
  - [ ] Blue info box displays saved calculation
  - [ ] Shows: "{tripsPerDay} trips per day × {weightPerTrip} kg per trip = {weightPerDay} kg/day"
  - [ ] Shows: "Over {orderDurationDays} days: {weightPerTruckOverDuration} kg per truck"
  - [ ] Shows calculation notes (if applicable)
  - [ ] Shows operating hours used
  - [ ] Shows calculation mode (trips or duration)

#### 14.13.3 Progress Section

- [ ] **Total weight progress**:
  - [ ] Shows: {completed}/{total} kg
  - [ ] Progress bar displays completion percentage
  - [ ] Visual indicator accurate
- [ ] **Completed trips** (if tracked):
  - [ ] Shows number of completed trips
- [ ] **Daily usage chart** (if implemented):
  - [ ] Bar chart showing trucks/weight per day
  - [ ] Chart displays data correctly

#### 14.13.4 Allocations Section

- [ ] **If order has allocations**:
  - [ ] List of transporters displays
  - [ ] **Each allocation shows**:
    - [ ] Transporter company name
    - [ ] Number of trucks allocated
    - [ ] Weight allocated
    - [ ] Weight completed (if tracking implemented)
    - [ ] Progress per transporter
    - [ ] Loading dates
- [ ] **If no allocations**:
  - [ ] Shows "Not yet allocated" or similar message
  - [ ] If LC: "Allocate" button visible

#### 14.13.5 Order Actions from Details Page

- [ ] **Allocate button** (LC companies only):
  - [ ] Only visible for LC companies
  - [ ] Only visible if order not yet allocated
  - [ ] Click navigates to allocation page
- [ ] **Create Pre-Booking button** (transporter companies, if Phase 5 implemented):
  - [ ] Only visible for transporters
  - [ ] Only visible if order allocated to transporter
  - [ ] Click navigates to pre-booking creation
- [ ] **Cancel Order button** (RESTRICTED: mine companies only):
  - [ ] Only visible for mine companies
  - [ ] Hidden from LCs and transporters (even if they have ORDERS_CANCEL permission)
  - [ ] Company type check: `company?.companyType === "mine"`
  - [ ] Only visible if status ≠ 'cancelled' AND ≠ 'completed'
  - [ ] Click opens cancellation modal
- [ ] **Export to PDF button** (if implemented):
  - [ ] Click generates PDF
  - [ ] PDF downloads correctly

### 14.14 Order Cancellation

**Location**: Order details page or orders list → Cancel button (mine companies only)

#### 14.14.1 Cancel Order - Mine Company

- [ ] **As mine company user**:
  - [ ] "Cancel Order" button visible on order details page
  - [ ] "Cancel" button visible in orders table
  - [ ] Can click Cancel button
  - [ ] **Cancellation modal opens**:
    - [ ] Title: "Cancel Order"
    - [ ] Warning message
    - [ ] Reason input field (required)
    - [ ] Must enter cancellation reason
    - [ ] "Cancel Order" button (confirm)
    - [ ] "Close" button (abort)
  - [ ] Can enter reason
  - [ ] Can click "Cancel Order" to confirm
  - [ ] **Processing**:
    - [ ] `OrderService.cancel(id, reason)` called
    - [ ] Order status updated to 'cancelled'
    - [ ] Cancellation reason and timestamp saved
  - [ ] **Success**:
    - [ ] Success toast notification
    - [ ] Modal closes
    - [ ] Page updates to show cancelled status
    - [ ] Notifications sent (if configured)

#### 14.14.2 Cancel Order - Restricted for Non-Mine Companies

- [ ] **As LC company user**:
  - [ ] "Cancel Order" button is NOT visible on order details page
  - [ ] "Cancel" button is NOT visible in orders table
  - [ ] Even if user has ORDERS_CANCEL permission, button remains hidden
  - [ ] Cannot cancel orders
- [ ] **As Transporter company user**:
  - [ ] "Cancel Order" button is NOT visible on order details page
  - [ ] "Cancel" button is NOT visible in orders table
  - [ ] Even if user has ORDERS_CANCEL permission, button remains hidden
  - [ ] Cannot cancel orders

#### 14.14.3 Cancel Button Visibility Logic

- [ ] **Visibility conditions** (all must be true):
  - [ ] User has ORDERS_CANCEL permission
  - [ ] Company type is "mine"
  - [ ] Order status ≠ 'cancelled'
  - [ ] Order status ≠ 'completed'
- [ ] **Hidden when**:
  - [ ] User lacks permission
  - [ ] Company is not mine type
  - [ ] Order already cancelled
  - [ ] Order already completed

### 14.15 Order Permissions & Access Control

#### 14.15.1 View Orders (ORDERS_VIEW permission)

- [ ] **With ORDERS_VIEW permission**:
  - [ ] Orders menu item visible in sidebar
  - [ ] Can access orders page
  - [ ] Can see orders list (scoped appropriately)
  - [ ] Can click view button
  - [ ] Can view order details
- [ ] **Without ORDERS_VIEW permission**:
  - [ ] Orders menu item NOT visible in sidebar
  - [ ] Cannot access `/orders` (redirect)
  - [ ] Cannot access `/orders/[id]` (redirect)

#### 14.15.2 Create Orders (ORDERS_CREATE permission)

- [ ] **With ORDERS_CREATE permission**:
  - [ ] "Create Order" button visible on orders page
  - [ ] Can access order creation wizard
  - [ ] Can complete wizard and submit order
- [ ] **Without ORDERS_CREATE permission**:
  - [ ] "Create Order" button hidden
  - [ ] Cannot access `/orders/new` (redirect or 403)

#### 14.15.3 Cancel Orders (ORDERS_CANCEL permission + Mine Company)

- [ ] **With ORDERS_CANCEL permission AND mine company**:
  - [ ] "Cancel" button visible on orders
  - [ ] Can cancel orders with reason
- [ ] **With ORDERS_CANCEL permission BUT NOT mine company**:
  - [ ] "Cancel" button remains hidden (company type restriction)
  - [ ] Cannot cancel orders
- [ ] **Without ORDERS_CANCEL permission**:
  - [ ] "Cancel" button hidden regardless of company type

#### 14.15.4 Allocate Orders (LC Company Access)

- [ ] **As LC company user**:
  - [ ] Can see orders allocated to LC
  - [ ] "Allocate" button visible on unallocated orders
  - [ ] Can access allocation page
  - [ ] Can distribute weight to transporters
- [ ] **As Non-LC company user**:
  - [ ] Cannot see "Allocate" button
  - [ ] Cannot access allocation page directly

### 14.16 Multi-Company Order Visibility

#### 14.16.1 Orders Created by Mine Company

- [ ] **Mine company creates order**:
  - [ ] Order saved with `companyId` = mine company ID
  - [ ] If allocated to LC: `allocatedCompanyIds` includes LC company ID
  - [ ] If allocated to transporters: `allocatedCompanyIds` includes all transporter company IDs

#### 14.16.2 LC Company Views Allocated Orders

- [ ] **LC user logs in**:
  - [ ] Can see orders where LC company ID is in `allocatedCompanyIds`
  - [ ] Can view order details
  - [ ] Can see orders created by other mine companies (if allocated to this LC)
  - [ ] Cannot see unrelated mine company orders

#### 14.16.3 Transporter Company Views Allocated Orders

- [ ] **Transporter user logs in**:
  - [ ] Can see orders where transporter company ID is in `allocatedCompanyIds`
  - [ ] Can view order details
  - [ ] Can see orders created by other companies (if allocated to this transporter)
  - [ ] Cannot see unrelated orders

#### 14.16.4 Company Switch Affects Order Visibility

- [ ] **Global Admin switches companies**:
  - [ ] Switch from Mine Company A to Mine Company B
  - [ ] Orders list updates to show Mine Company B's orders
  - [ ] Cannot see Mine Company A's orders anymore (unless allocated to B)
  - [ ] Switch to LC company
  - [ ] Can see orders allocated to this LC
  - [ ] Switch to Transporter company
  - [ ] Can see orders allocated to this transporter

### 14.17 Edge Cases & Validations

#### 14.17.1 Trip Duration Calculation - Receiving vs Dispatching

- [ ] **Dispatching Order**:
  - [ ] Create dispatching order
  - [ ] Select collection site with 10h operating hours
  - [ ] Select trip duration: 4 hours
  - [ ] System uses collection site operating hours
  - [ ] Calculates: Math.floor(10 / 4) = 2 trips/day
  - [ ] Displays correct calculation
- [ ] **Receiving Order**:
  - [ ] Create receiving order
  - [ ] Select destination site with 8h operating hours
  - [ ] Select trip duration: 3 hours
  - [ ] System uses destination site operating hours
  - [ ] Calculates: Math.floor(8 / 3) = 2 trips/day
  - [ ] Displays correct calculation

#### 14.17.2 Trip Duration Calculation - Operating Hours Changes

- [ ] **Scenario**: Order created with site operating hours = 10h
- [ ] Trip duration = 5h → 2 trips/day calculated and saved
- [ ] **Later**: Site operating hours changed to 8h
- [ ] **Existing order**:
  - [ ] Still shows 2 trips/day (from saved `tripCapacityCalculation`)
  - [ ] Consistent with calculation at creation time
- [ ] **New order**:
  - [ ] Uses updated 8h operating hours
  - [ ] Calculates: Math.floor(8 / 5) = 1 trip/day
  - [ ] Saves new calculation

#### 14.17.3 Duplicate Order Number Validation

- [ ] **Scenario**: Manual order number entry enabled
- [ ] Enter order number "ORD-2025-001"
- [ ] Submit wizard, order created
- [ ] **Create second order**:
  - [ ] Enter same order number "ORD-2025-001"
  - [ ] System checks for duplicate on blur
  - [ ] Error message appears
  - [ ] Cannot proceed with duplicate
  - [ ] Change to "ORD-2025-002"
  - [ ] Duplicate check passes
  - [ ] Can proceed

#### 14.17.4 Weight Allocation - Exact Match Required

- [ ] **Scenario**: Order total weight = 1000 kg
- [ ] Allocate to Transporter A: 600 kg
- [ ] Allocate to Transporter B: 300 kg
- [ ] **Total allocated**: 900 kg
- [ ] **Validation**:
  - [ ] Error: "Weight allocation doesn't match total (900/1000)"
  - [ ] Submit button disabled
- [ ] Change Transporter B to 400 kg
- [ ] **Total allocated**: 1000 kg
- [ ] **Validation**:
  - [ ] Success indicator
  - [ ] Submit button enabled
  - [ ] Can submit allocation

#### 14.17.5 Date Range Validation

- [ ] **Scenario**: Order creation Step 2
- [ ] Set start date: 2025-10-01
- [ ] Set end date: 2025-09-30 (before start)
- [ ] **Validation**:
  - [ ] Error: "End date must be after start date"
  - [ ] Cannot proceed
- [ ] Change end date to 2025-10-05
- [ ] **Validation**:
  - [ ] Validation passes
  - [ ] Can proceed

#### 14.17.6 Site Selection - Same Site Validation

- [ ] **Scenario**: Order creation Step 3
- [ ] Select collection site: "Mine Site A"
- [ ] Select destination site: "Mine Site A" (same)
- [ ] **Validation**:
  - [ ] Error: "Collection and Destination sites must be different"
  - [ ] Cannot proceed
- [ ] Change destination site to "Port Site B"
- [ ] **Validation**:
  - [ ] Validation passes
  - [ ] Can proceed

### 14.18 Order Data Persistence

#### 14.18.1 Trip Capacity Calculation Saved

- [ ] Create order with trip duration = 30h
- [ ] System calculates: 0.5 trips/day
- [ ] Order submitted
- [ ] **Check order document in Firestore**:
  - [ ] `tripCapacityCalculation` field exists
  - [ ] `tripsPerDay: 0.5`
  - [ ] `weightPerTrip: {value}` (from orderConfigSnapshot)
  - [ ] `weightPerDayPerTruck: {calculated}`
  - [ ] `orderDurationDays: {calculated}`
  - [ ] `weightPerTruckOverDuration: {calculated}`
  - [ ] `operatingHoursUsed: {value}`
  - [ ] `calculationMode: "duration"`
  - [ ] `calculationNotes: "Multi-day trip - 2 days per trip"`

#### 14.18.2 Order Config Snapshot Saved

- [ ] Create order
- [ ] **Check order document**:
  - [ ] `orderConfigSnapshot` field exists
  - [ ] Contains snapshot of company.orderConfig at creation time
  - [ ] Includes: defaultWeightPerTruck, defaultDailyTruckLimit, etc.
  - [ ] Ensures consistency if company settings change later

#### 14.18.3 Allocated Company IDs Saved

- [ ] **Scenario 1**: Order allocated to LC
- [ ] **Check order document**:
  - [ ] `allocatedCompanyIds: [lcCompanyId]`
- [ ] **Scenario 2**: Order allocated to 2 transporters
- [ ] **Check order document**:
  - [ ] `allocatedCompanyIds: [transporter1Id, transporter2Id]`
- [ ] **Scenario 3**: LC later allocates to transporters
- [ ] **Check order document after LC allocation**:
  - [ ] `allocatedCompanyIds: [lcCompanyId, transporter1Id, transporter2Id]`

### 14.19 Order UI/UX

#### 14.19.1 Wizard Navigation

- [ ] Can navigate between wizard steps using Next/Back buttons
- [ ] Step indicator shows current step
- [ ] Can click step indicator to jump to previous steps
- [ ] Cannot skip ahead to future steps
- [ ] Wizard preserves data when navigating back
- [ ] Can cancel wizard at any step

#### 14.19.2 Loading States

- [ ] **Fetching data**:
  - [ ] Loading spinner shows when fetching products/clients/sites
  - [ ] Skeleton loaders for dropdowns
- [ ] **Submitting order**:
  - [ ] Submit button shows "Creating..." text
  - [ ] Submit button disabled during submission
  - [ ] Loading spinner visible
- [ ] **Allocating order**:
  - [ ] Submit button shows "Allocating..." text
  - [ ] Form fields disabled during submission

#### 14.19.3 Error Handling

- [ ] **Validation errors**:
  - [ ] Clear error messages displayed
  - [ ] Error styling (red border, red text)
  - [ ] Field focuses on error
- [ ] **Backend errors**:
  - [ ] Toast notification shows error message
  - [ ] Wizard/form remains open
  - [ ] Can retry operation
- [ ] **Network errors**:
  - [ ] Error message explains network issue
  - [ ] Can retry when connection restored

#### 14.19.4 Responsive Design

- [ ] **Desktop view**:
  - [ ] Wizard displays in centered modal
  - [ ] All steps display correctly
  - [ ] Action buttons properly positioned
- [ ] **Mobile view**:
  - [ ] Wizard adapts to mobile screen
  - [ ] Steps stack vertically
  - [ ] Touch-friendly buttons
  - [ ] Dropdowns work on mobile
  - [ ] Date pickers mobile-optimized

---

## 15. Final Smoke Test

### 15.1 Complete User Journey - Mine Company

- [ ] Log in as global admin (mine company)
- [ ] Create a new mine company
- [ ] Add organizational groups to the company
- [ ] Create a product
- [ ] Create a client
- [ ] Create a site and assign it to a group
- [ ] **Asset Management Journey**:
  - [ ] Navigate to Assets page
  - [ ] Induct a truck asset using the wizard:
    - [ ] Scan/enter QR code (NT prefix)
    - [ ] Scan/enter barcode (parse vehicle details)
    - [ ] Add optional fields (fleet number, group)
    - [ ] Review and submit
  - [ ] Induct a driver asset using the wizard:
    - [ ] Scan/enter QR code (NT prefix)
    - [ ] Scan/enter driver's license barcode (expo-sadl parsing)
    - [ ] Skip optional fields (driver has no fleet/group)
    - [ ] Review and submit with photo
  - [ ] View assets in both Card and Table views
  - [ ] Edit an asset (change fleet number)
  - [ ] Toggle view between active and inactive assets
  - [ ] Inactivate an asset with reason
  - [ ] Reactivate the asset
- [ ] Create a new role with specific permissions
- [ ] Create a new user with the new role
- [ ] Log out
- [ ] Log in as the new user
- [ ] Verify user sees appropriate UI based on permissions
- [ ] Log out

### 15.2 Complete User Journey - Transporter Company

- [ ] Log in as global admin
- [ ] Switch to or create a transporter company
- [ ] Verify Products menu is NOT visible
- [ ] Verify Clients menu is NOT visible
- [ ] Verify Sites menu is NOT visible
- [ ] **Asset Management Journey** (Transporter owns their fleet):
  - [ ] Navigate to Assets page (menu item IS visible)
  - [ ] Induct a truck asset for transporter fleet
  - [ ] Induct a driver asset
  - [ ] Verify assets are scoped to transporter company only
- [ ] Create a user for transporter company
- [ ] Log out
- [ ] Log in as transporter user
- [ ] Verify limited menu and features
- [ ] Verify Assets menu IS visible (own fleet management)
- [ ] Log out

### 15.3 Complete User Journey - Contact-Only User

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
