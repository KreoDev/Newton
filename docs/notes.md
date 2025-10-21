# Newton - Phase 3 Testing Notes

**Purpose**: This file captures test scenarios and notes for Phase 3 features that need to be included in the comprehensive testing checklist.

---

## Fleet Number & Transporter Group Management

**Feature Location**: Company Edit Modal → Fleet Tab (Transporter & Dual-Role Logistics Coordinator companies only)

### Overview
Transporter companies and Logistics Coordinators who are also Transporters can enable/disable two optional features:
1. **Fleet Number** - Custom label for fleet identification (e.g., "Fleet No.", "Truck ID")
2. **Transporter Group** - Predefined group options with custom label (e.g., "North", "South", "East", "West")

Both features can be toggled on/off. When disabling a feature that's in use by active assets, a sequential dialog system manages the cleanup process.

---

### Test Scenarios - Fleet Number Feature

#### 1.1 Enable Fleet Number (No Assets)
- [ ] Open transporter company in edit mode
- [ ] Navigate to Fleet tab
- [ ] Enable "Fleet Number" checkbox
- [ ] Verify "Fleet Number Label" field appears
- [ ] Change label to custom value (e.g., "Truck ID")
- [ ] Save company
- [ ] Verify feature is enabled in company settings
- [ ] Verify custom label is saved

#### 1.2 Enable Fleet Number (With Default Label)
- [ ] Enable "Fleet Number" checkbox
- [ ] Leave label as default "Fleet No."
- [ ] Save company
- [ ] Verify feature is enabled with default label

#### 1.3 Disable Fleet Number (No Assets Using It)
- [ ] Company has fleet number enabled
- [ ] No assets have fleet numbers assigned
- [ ] Disable "Fleet Number" checkbox
- [ ] Click "Update Company"
- [ ] Verify NO dialog appears (no cleanup needed)
- [ ] Verify feature is disabled in company settings

#### 1.4 Disable Fleet Number (Assets Using It) - Remove All
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

#### 1.5 Disable Fleet Number (Assets Using It) - Cancel
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

#### 1.6 Change Fleet Number Label Only
- [ ] Fleet number is enabled
- [ ] Change fleet number label from "Fleet No." to "Truck ID"
- [ ] Do NOT disable the checkbox
- [ ] Save company
- [ ] Verify label updates successfully
- [ ] Verify feature remains enabled
- [ ] Verify no dialog appears

---

### Test Scenarios - Transporter Group Feature

#### 2.1 Enable Transporter Group (No Assets)
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

#### 2.2 Enable Transporter Group - Validation
- [ ] Enable "Transporter Group" checkbox
- [ ] Do NOT add any group options
- [ ] Try to save company
- [ ] Verify error message: "At least one group option is required when transporter group is enabled"
- [ ] Add at least one group option
- [ ] Verify save succeeds

#### 2.3 Add Group Option
- [ ] Group feature is enabled
- [ ] Enter new group name in input field
- [ ] Click "Add" button
- [ ] Verify group appears in list
- [ ] Verify group is marked as active
- [ ] Save company
- [ ] Verify group option persists

#### 2.4 Delete Group Option (Not In Use)
- [ ] Group feature is enabled
- [ ] Have a group option that NO assets are using
- [ ] Click delete (X) button on group option
- [ ] Verify group is removed from list
- [ ] Save company
- [ ] Verify group option is deleted

#### 2.5 Try to Delete Group Option (In Use by Assets)
- [ ] Group feature is enabled
- [ ] Have a group option that assets ARE using
- [ ] Click delete (X) button on group option
- [ ] Verify error dialog appears
- [ ] Error message explains group is in use by assets
- [ ] Verify group remains in list
- [ ] Verify "Deactivate" button is shown instead of delete

#### 2.6 Mark Group Option as Inactive (In Use)
- [ ] Group feature is enabled
- [ ] Have a group option in use by assets
- [ ] Click "Deactivate" button
- [ ] Verify group is marked as inactive (grayed out, "Inactive" badge)
- [ ] Verify group remains in list
- [ ] Verify assets still have this group assigned
- [ ] Save company
- [ ] Verify inactive status persists

#### 2.7 Mark Inactive Group as Active
- [ ] Have an inactive group option
- [ ] Click "Activate" button
- [ ] Verify group is marked as active (normal appearance)
- [ ] Save company
- [ ] Verify active status persists

#### 2.8 Disable Transporter Group (No Assets Using It)
- [ ] Company has transporter group enabled
- [ ] No assets have groups assigned
- [ ] Disable "Transporter Group" checkbox
- [ ] Click "Update Company"
- [ ] Verify NO dialog appears
- [ ] Verify feature is disabled

#### 2.9 Disable Transporter Group (Assets Using It) - Remove All
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

#### 2.10 Disable Transporter Group (Assets Using It) - Cancel
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

#### 2.11 Change Group Label Only
- [ ] Group feature is enabled
- [ ] Change group label from "Group" to "Division"
- [ ] Do NOT disable the checkbox
- [ ] Save company
- [ ] Verify label updates successfully
- [ ] Verify feature remains enabled
- [ ] Verify no dialog appears

---

### Test Scenarios - Sequential Dialog System (Both Features)

**Note**: When both fleet number AND transporter group are disabled while assets are using them, dialogs appear SEQUENTIALLY (fleet first, then group).

#### 3.1 Scenario: Cancel Fleet → Remove Group
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

#### 3.2 Scenario: Remove Fleet → Remove Group
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

#### 3.3 Scenario: Cancel Fleet → Cancel Group
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

#### 3.4 Scenario: Remove Fleet → Cancel Group
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

---

### Test Scenarios - Single Feature Enabled

#### 4.1 Only Fleet Enabled - Disable with Assets
- [ ] Fleet number enabled, group disabled
- [ ] Assets using fleet numbers
- [ ] Disable fleet number
- [ ] Click "Update Company"
- [ ] Verify fleet number dialog appears
- [ ] NO group dialog should appear
- [ ] Test both "Remove" and "Cancel" options
- [ ] Verify single dialog works correctly

#### 4.2 Only Group Enabled - Disable with Assets
- [ ] Group enabled, fleet number disabled
- [ ] Assets using groups
- [ ] Disable group
- [ ] Click "Update Company"
- [ ] Verify group dialog appears
- [ ] NO fleet number dialog should appear
- [ ] Test both "Remove" and "Cancel" options
- [ ] Verify single dialog works correctly

#### 4.3 Enable Fleet When Group Already Enabled
- [ ] Group is enabled
- [ ] Fleet number is disabled
- [ ] Enable fleet number
- [ ] Add fleet number label
- [ ] Save company
- [ ] Verify fleet number enabled successfully
- [ ] Verify group remains enabled

#### 4.4 Enable Group When Fleet Already Enabled
- [ ] Fleet number is enabled
- [ ] Group is disabled
- [ ] Enable group
- [ ] Add group options
- [ ] Add group label
- [ ] Save company
- [ ] Verify group enabled successfully
- [ ] Verify fleet number remains enabled

---

### Test Scenarios - Asset List Modal

#### 5.1 Asset List Modal - UI Elements
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

#### 5.2 Asset List Modal - Navigation
- [ ] Click on an asset in the list
- [ ] Verify navigates to asset details page
- [ ] Verify modal closes
- [ ] Navigate back to companies page
- [ ] Open company edit modal again
- [ ] Verify state is preserved

#### 5.3 Asset List Modal - Button Behavior
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

---

### Test Scenarios - Data Persistence

#### 6.1 Fleet/Group Settings Persist After Save
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

#### 6.2 Canceled Fields Revert to Original
- [ ] Fleet enabled, group enabled
- [ ] Disable fleet (trigger dialog)
- [ ] Cancel fleet dialog
- [ ] Cancel group dialog (if triggered)
- [ ] Close company modal
- [ ] Reopen company
- [ ] Verify fleet number is still enabled (original state)
- [ ] Verify group is still enabled (original state)

#### 6.3 Other Changes Save Even When Fleet/Group Canceled
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

---

### Test Scenarios - Edge Cases

#### 7.1 Enable and Disable Immediately (No Assets)
- [ ] Enable fleet number
- [ ] Immediately disable fleet number (same session)
- [ ] Save company
- [ ] Verify no dialog appears
- [ ] Verify feature is disabled

#### 7.2 Enable, Add Assets, Then Disable
- [ ] Enable fleet number
- [ ] Save company
- [ ] Create assets and assign fleet numbers
- [ ] Edit company again
- [ ] Disable fleet number
- [ ] Save
- [ ] Verify dialog appears
- [ ] Test remove/cancel behavior

#### 7.3 Change Label While Feature Is In Use
- [ ] Fleet number enabled with assets using it
- [ ] Change fleet label from "Fleet No." to "Vehicle ID"
- [ ] Keep feature enabled
- [ ] Save company
- [ ] Verify no dialog appears
- [ ] Verify label changes
- [ ] Verify assets still have fleet numbers

#### 7.4 Add Group Options While Feature In Use
- [ ] Group enabled with existing options
- [ ] Assets using existing groups
- [ ] Add new group option "Central"
- [ ] Save company
- [ ] Verify new option is added
- [ ] Verify existing assets maintain their groups

#### 7.5 Empty/Whitespace Validation
- [ ] Try to add group option with only spaces
- [ ] Verify error or trimming behavior
- [ ] Try to add duplicate group option
- [ ] Verify error message

#### 7.6 Company Type Change (Should Not Happen in Production)
- [ ] Note: Company type is read-only after creation
- [ ] Fleet tab only visible for transporters and dual-role LCs
- [ ] If company type changes, fleet settings should be preserved but not accessible

---

### Test Scenarios - Multiple Companies

#### 8.1 Different Settings Per Company
- [ ] Create Company A (transporter)
- [ ] Enable fleet with label "Truck ID"
- [ ] Create Company B (transporter)
- [ ] Enable fleet with label "Fleet No."
- [ ] Enable group with options "North", "South"
- [ ] Switch between companies
- [ ] Verify each company has independent fleet/group settings

#### 8.2 Global Admin Editing Different Company
- [ ] Log in as global admin
- [ ] Switch to Company A context
- [ ] Edit Company B (different company)
- [ ] Change fleet/group settings
- [ ] Verify changes save correctly
- [ ] Verify local users/assets data loads correctly for Company B

---

### Test Scenarios - Validation & Error Handling

#### 9.1 Group Options Required When Enabled
- [ ] Enable "Transporter Group"
- [ ] Delete all group options
- [ ] Try to save company
- [ ] Verify error: "At least one group option is required when transporter group is enabled"
- [ ] Add a group option
- [ ] Verify save succeeds

#### 9.2 Cannot Delete Group In Use
- [ ] Have assets using group "North"
- [ ] Try to delete "North" from group options
- [ ] Verify error dialog
- [ ] Verify suggestion to mark as inactive instead
- [ ] Verify delete button is replaced with deactivate button

#### 9.3 Dialog Appears Only When Needed
- [ ] Disable feature with NO assets using it
- [ ] Verify NO dialog appears
- [ ] Disable feature WITH assets using it
- [ ] Verify dialog DOES appear

---

### Test Scenarios - UI/UX

#### 10.1 Fleet Tab Visibility
- [ ] **Mine company**: Fleet tab NOT visible
- [ ] **Transporter company**: Fleet tab visible
- [ ] **Logistics Coordinator (not also transporter)**: Fleet tab NOT visible
- [ ] **Logistics Coordinator (also transporter)**: Fleet tab visible

#### 10.2 Loading States
- [ ] Verify loading spinner when removing fleet numbers from assets
- [ ] Verify loading spinner when removing groups from assets
- [ ] Verify buttons disabled during loading
- [ ] Verify toast notifications appear after completion

#### 10.3 Modal Behavior
- [ ] Verify modal closes on successful save
- [ ] Verify modal stays open on validation error
- [ ] Verify clicking outside modal does NOT close it (by design)
- [ ] Verify ESC key does NOT close modal (by design)
- [ ] Must use Cancel or Save buttons explicitly

---

### Test Scenarios - Asset Integration

#### 11.1 Asset Creation with Fleet Number
- [ ] Company has fleet number enabled
- [ ] Create new asset (truck)
- [ ] Verify fleet number field appears in asset form
- [ ] Verify field label matches company's custom label
- [ ] Assign fleet number to asset
- [ ] Save asset
- [ ] Verify fleet number is saved

#### 11.2 Asset Creation with Group
- [ ] Company has group enabled
- [ ] Create new asset (truck)
- [ ] Verify group dropdown appears in asset form
- [ ] Verify dropdown shows all active group options
- [ ] Verify inactive groups are NOT shown (or shown as disabled)
- [ ] Assign group to asset
- [ ] Save asset
- [ ] Verify group is saved

#### 11.3 Asset Displays Fleet Number in Lists
- [ ] Assets list page shows fleet number badge
- [ ] Badge displays correct fleet number value
- [ ] Badge uses secondary variant styling

#### 11.4 Asset Displays Group in Lists
- [ ] Assets list page shows group badge
- [ ] Badge displays correct group name
- [ ] Badge uses purple variant styling

---

### Test Scenarios - Assets Restricted to Transporters

#### 12.1 Mine Company - Assets Hidden
- [ ] Log in as a mine company user
- [ ] Verify Assets menu item is NOT visible in navigation
- [ ] Attempt to navigate directly to `/assets`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/induct`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/[id]` with valid asset ID
- [ ] Verify redirect to home page `/`

#### 12.2 Transporter Company - Assets Visible
- [ ] Log in as a transporter company user
- [ ] Verify Assets menu item IS visible in navigation
- [ ] Navigate to `/assets` page
- [ ] Verify page loads successfully with asset list
- [ ] Navigate to `/assets/induct` page
- [ ] Verify induction wizard loads successfully
- [ ] Navigate to `/assets/[id]` with valid asset ID
- [ ] Verify asset detail page loads successfully

#### 12.3 Logistics Coordinator (Not Transporter) - Assets Hidden
- [ ] Log in as a logistics coordinator company with `isAlsoTransporter = false`
- [ ] Verify Assets menu item is NOT visible in navigation
- [ ] Attempt to navigate directly to `/assets`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/induct`
- [ ] Verify redirect to home page `/`
- [ ] Attempt to navigate directly to `/assets/[id]` with valid asset ID
- [ ] Verify redirect to home page `/`

#### 12.4 Logistics Coordinator (Is Transporter) - Assets Visible
- [ ] Log in as a logistics coordinator company with `isAlsoTransporter = true`
- [ ] Verify Assets menu item IS visible in navigation
- [ ] Navigate to `/assets` page
- [ ] Verify page loads successfully with asset list
- [ ] Navigate to `/assets/induct` page
- [ ] Verify induction wizard loads successfully
- [ ] Navigate to `/assets/[id]` with valid asset ID
- [ ] Verify asset detail page loads successfully

#### 12.5 Logistics Coordinator Cannot Disable Transporter Role (Has Assets)
- [ ] Create logistics coordinator company with `isAlsoTransporter = true`
- [ ] Induct at least one asset (truck, trailer, or driver)
- [ ] Open Company Form Modal to edit company
- [ ] Verify "Is also a Transporter" checkbox is DISABLED
- [ ] Verify checkbox is visually styled as disabled (opacity reduced, cursor not-allowed)
- [ ] Verify helper text displays: "Cannot be disabled because this company has assets. Assets can only belong to transporters."
- [ ] Verify cannot toggle checkbox
- [ ] Attempt to save company (should work but checkbox remains checked)

#### 12.6 Logistics Coordinator Can Disable Transporter Role (No Assets)
- [ ] Create logistics coordinator company with `isAlsoTransporter = true`
- [ ] Do NOT add any assets
- [ ] Open Company Form Modal to edit company
- [ ] Verify "Is also a Transporter" checkbox is ENABLED
- [ ] Verify no helper text shown
- [ ] Toggle checkbox to unchecked
- [ ] Save company
- [ ] Verify `isAlsoTransporter` is now `false`
- [ ] Verify Assets menu disappears from navigation

#### 12.7 Company Switch Clears Asset Data
- [ ] Log in as user with access to multiple companies
- [ ] Switch to a transporter company (Company A)
- [ ] Navigate to Assets page
- [ ] Note the assets displayed for Company A
- [ ] Switch to different transporter company (Company B)
- [ ] Verify assets from Company A are no longer visible
- [ ] Verify assets from Company B load correctly
- [ ] Verify no stale data from Company A appears
- [ ] Verify other company-scoped data (users, products, groups, sites, clients) also clears correctly

#### 12.8 Company Switch - Assets Menu Visibility Changes
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

---

## Additional Notes

### Dialog Timing
- 50ms delay between modal close and next modal open ensures React properly processes state changes
- `useEffect` monitors `isProcessingQueue`, `assetListModalOpen`, and `pendingRemovals` to control flow

### State Management
- `pendingRemovals`: Queue of fields that need removal dialogs
- `canceledFields`: Set of fields user canceled (revert to original values)
- `isProcessingQueue`: Flag indicating active queue processing

### Key Files
- `/src/components/companies/CompanyFormModal.tsx` - Main company edit modal with fleet tab
- `/src/components/assets/AssetListModal.tsx` - Dialog showing affected assets
- `/src/types/index.ts` - Company interface with systemSettings

### Future Enhancements to Consider
- Bulk update fleet numbers across multiple assets
- Import/export fleet numbers from CSV
- Analytics on fleet number usage
- History/audit log for fleet/group changes

---

**Last Updated**: 2025-10-21
**Feature Status**: ✅ Implemented and tested
**Related Phase**: Phase 3 - Asset Management & Fleet Configuration
