<!-- cSpell:words Underweight underweight ALPR -->

# Newton Weighbridge System

## User Flows

### Authentication Flows

#### Flow 1: User Login

```text
Start → Enter Email → Enter Password →
System Validates Credentials →
Dashboard Access → Role-Based View
```

### Asset Management Flows

#### Flow 2: Complete Asset Induction Process

```text
Induction Officer Login → Select "Add New Asset" →
Select Company (companyType = transporter or logistics_coordinator) from Dropdown →
Scan QR Code (First Time) → Scan QR Code (Second Time for Verification) →
Scan License Disc Barcode (First Time) → Scan License Disc Barcode (Second Time for Verification) →
System Automatically:
  - Identifies Asset Type (Truck/Trailer/Driver)
  - Extracts All Information from License Disc
  - Validates Expiry Dates
→ Check Validation Results:
  If Valid:
    → Select Fleet Number (Optional)
    → Select Group (Optional)
    → Save Asset
    → Send Notification to Users with "Asset Added" Enabled
    → Confirmation Message
  If Invalid (Expired):
    → Error Notification with Reason
    → Send Notification to Users with "Invalid/Expired License" Enabled
    → Process Blocked
    → Return to Start
```

#### Flow 3: Asset Deletion (Induction Error Correction)

```text
Operator Login → Remove or Delete Assets/Drivers → Scan the QR code → Click Delete →
Enter Deletion Reason → Submit →
System Checks for Linked Transactions:
  If No Transactions (Typically During Induction):
    → Asset/Driver Deleted Immediately
    → Deletion Logged with Reason
    → Send Notification to Users with "Asset/Driver Deleted" Enabled
    → Confirmation Message
  If Transactions Exist (99% of Cases):
    → Deletion Blocked
    → Show Transaction Count
    → Display "Cannot Delete - Asset/Driver Has Transactions"
    → Offer "Mark as Inactive" Option:
      If Selected:
        → Enter Reason for Inactivation
        → Confirm Inactivation
        → Flag Asset/Drivers as Inactive with Reason
        → Send Notification to Users with "Asset/Drivers Made Inactive" Enabled
    → Return to Asset List
```

### Order Management Flows

#### Flow 4: Order Creation

```text
Logistics Coordinator/Allocation Officer Login →
Navigate to Orders → Click "Create New Order" →
System Checks Order Number Configuration:
  If "Auto-Generated Only" is Configured:
    → System Automatically Generates Unique Order Number
    → No Manual Entry Option Shown
  If "Manual Entry Allowed" is Configured:
    → Choose Order Number Method:
      Option 1: Use Auto-Generated Order Number
        → System Generates Unique Order Number
      Option 2: Enter Manual Order Number
        → Enter Custom Order Number
        → System Checks for Duplicates
          If Duplicate Exists:
            → Error: "Order Number Already Exists"
            → Prompt to Enter Different Number
          If Unique:
            → Proceed
→ Fill Order Details:
  - Select Order Type (Receiving or Dispatching)
  - Select Client from Client List
  - Set Dispatch Date Range (Start & End)
  - Allocate Total Weight
  - Select Collection Site (siteType = collection) from List
  - Select Destination Site (siteType = destination) from List
  - Select Product from Catalog
  - Adjust Seal Requirements (Pre-filled with Defaults)
  - Adjust Daily Truck Limit (Pre-filled with Default)
  - Adjust Daily Weight Limit (Pre-filled with Default)
  - Adjust Trip Limits (Pre-filled with Default: 1 trip per 24 hours):
    Option 1: Keep or Adjust Maximum Trips Per Day:
      → Modify trips allowed per day if needed
      → System applies limit across all order days
    Option 2: Set Trip Duration:
      → Enter trip duration in hours
      → System calculates possible trips based on:
        - Collection Site operating hours
        - Order date range (single or multi-day)
        - Shows trips per day and total trips
      → System validates against Collection Site hours:
        - If trip duration exceeds daily operating window
        - Automatically spans to next operating day
  - Adjust Monthly Limits (Pre-filled with Default)
→ Choose Allocation Method:
  Option 1: Assign to Logistics Coordinator:
    → Select from Companies (companyType = logistics_coordinator)
    → Notifications sent to configured contacts
    → LC Will Handle Weight Distribution Later
  Option 2: Assign to Transporter Companies:
    → Select from Companies (companyType = transporter)
    → Notifications sent to configured contacts
    → Allocate Weight to Each Transporter
    → Select Loading Dates
    → System Validates Total Weight = Sum of Allocations:
      If Mismatch:
        → Error: "Weight allocation doesn't match total"
        → Adjust Allocations
      If Match:
        → Proceed
→ Review Order Summary → Submit Order →
Order Saved to Database →
Send Notification to Users with "Order Created" Enabled →
If Order Allocated to Specific Users:
  → Send Notification to Those Users (Always Sent)
  → Send Notification to Users with "Order Allocated" Enabled
→ Confirmation Screen
```

#### Flow 5: Order Allocation Process (Post-Creation)

```text
Logistics Coordinator Login → View Orders Assigned to Me →
Select Order for Distribution →
Review Total Weight Available →
Redistribute Weight:
  → Select Multiple Transporter Companies (companyType = transporter)
  → Allocate Weight to Each Transporter Company
  → Select Loading Dates
  → Ensure Total = Original Allocation
  → Set Transporter-Specific Requirements
→ Submit Distribution →
Send Notification to Allocated Transporters (Always Sent) →
Send Notification to Users with "Order Allocated" Enabled →
→ Update Order Status → Confirmation

Note: This flow only applies when orders were assigned to
Logistics Coordinator during creation. Orders directly
assigned to transporters skip this step.
```

#### Flow 6: Pre-Booking Process

```text
Logistics Coordinator Login → View Active Orders →
Select Order for Pre-Booking →
View Available Dates/Slots → Select Date →
Search Available Trucks:
  Filter by:
    - Transporter Company
    - Truck Type
    - Availability
→ Select Trucks → Link to Order →
Set Trip Configuration for Each Truck:
  - Specify number of trips per day
  - System validates against order's trip limits
  - Shows total capacity based on trips
→ Add Special Instructions →
Submit Pre-Booking →
Send Notification to Users with "Pre-Booking Created" Enabled →
→ Booking Confirmation
```

### Administrative Flows

#### Flow 7: Company (Mine) Configuration

```text
Newton Admin Login → System Settings →
Select Company Management →
Configure Mining Company Details:
  - Add New Mining Company:
    → Enter Company Name (Mine Name)
    → Enter Registration Number
    → Enter VAT Number
    → Enter Physical Address
    → Enter Main Contact Details
  - Configure Mine Groups and Sites:
    → Add Group
    → Add site, mark as receiving or dispatching
    → Enter Site Location
    → Set Site-Specific Requirements
    → Add Site Manager Contact
→ Save Company Configuration →
Update Company Database → Confirmation
```

#### Flow 8: Company Configuration (Transporter Type)

```text
Site Newton Admin Login → System Settings →
Select Company Management →
Choose "Add Company" with `companyType = transporter` →
Configure Company Details:
  - Add New Company:
    → Enter Company Name
    → Enter Registration Number
    → Enter VAT Number
    → Enter Physical Address
    → Enter Fleet Size Information
    → Set Flags:
      - Is Transporter: Yes
      - Is Logistics Coordinator: No (or Yes for Dual-Role)
  - Link Contact People:
    → Select Primary Contact from Existing Users
    → Select Secondary Contacts from Existing Users
    → System Validates Contact Information:
      If Contact Missing Phone Number:
        → Prompt: "Contact requires phone number for notifications"
        → Enter Phone Number for Contact
        → Update User Profile with Phone Number
      If Contact Has Complete Information:
        → Link Contact to Company
→ Save Company Configuration →
Update companies Collection → Send Welcome Email to Contacts
```

#### Flow 9: Company Configuration (Logistics Coordinator Type)

```text
Site Newton Admin Login → System Settings →
Select Company Management →
Choose "Add Company" with `companyType = logistics_coordinator` →
Configure Company Details:
  - Add New Company:
    → Enter Company Name
    → Enter Registration Number
    → Enter VAT Number
    → Enter Physical Address
    → Set Flags:
      - Is Transporter: No (or Yes for Dual-Role)
      - Is Logistics Coordinator: Yes
  - Link Contact People:
    → Select Primary Coordinator from Existing Users
    → Select Additional Coordinators from Existing Users
    → System Validates Contact Information:
      If Contact Missing Phone Number:
        → Prompt: "Contact requires phone number for notifications"
        → Enter Phone Number for Contact
        → Update User Profile with Phone Number
      If Contact Has Complete Information:
        → Link Contact to Company
  - Additional Settings for Dual-Role:
    If dual-role (includes transporter):
      → Enter Fleet Size Information
      → Configure Transport Capabilities
→ Save Company Configuration →
Update companies Collection → Send Welcome Email to Contacts
```

#### Flow 10: User Management Configuration

```text
Newton Admin Login → System Settings →
Select User Management →
Configure User Settings:
  - Create New Users:
    → Enter Name and Surname
    → Enter Contact Number
    → Enter Email Address
    → Upload Profile Picture
    → Set Login Credentials
  - Assign Roles:
    → Newton Administrator
    → Site Administrator
    → Logistics Coordinator (Company)
    → Allocation Officer
    → Transporter
    → Induction Officer
    → Weighbridge Supervisor
    → Weighbridge Operator
    → Security Personnel
  - Set Granular Permissions (Per User):
    → Asset Management:
      - No Access / View Only / Add & Edit / Full Access (Add, Edit, Delete)
    → Order Management:
      - No Access / View Only / Create Orders / Allocate Orders / Full Access
    → Pre-Booking Management:
      - No Access / View Only / Create & Edit / Full Access
    → Operational Flow Permissions:
      - Security In - Enable/Disable
      - Security Out - Enable/Disable
      - Weighbridge Tare Weight - Enable/Disable
      - Weighbridge Gross Weight - Enable/Disable
      - Weighbridge Calibration - Enable/Disable
    → Administrative Permissions:
      - User Management - No Access / View Only / Full Access
      - Product Management - No Access / View Only / Full Access
      - Order Settings - No Access / View Only / Full Access
      - Client Management - No Access / View Only / Full Access
      - Collection Site/Destination Management - No Access / View Only / Full Access
      - Weighbridge Configuration - No Access / View Only / Full Access
      - Notification Infrastructure - No Access / View Only / Full Access
      - System-Wide Settings - No Access / View Only / Full Access
      - Security Alert Configuration - No Access / View Only / Full Access
    → Transporter-Specific Settings:
      - View Only Assigned Orders - Enable/Disable
      - View Other Transporters' Data - Enable/Disable
  - Notification Settings (Per User):
    → Asset Notifications:
      - Asset Added - Enable/Disable
      - Asset Made Inactive - Enable/Disable
      - Asset Edited - Enable/Disable
      - Asset Deleted - Enable/Disable
    → Order Notifications:
      - Order Created - Enable/Disable
      - Order Allocated - Enable/Disable
      - Order Cancelled - Enable/Disable
      - Order Completed - Enable/Disable
      - Order Expiring Soon - Enable/Disable
      Note: Users always receive notifications when orders are allocated directly to them
    → Weighbridge Notifications:
      - Overload Detected - Enable/Disable
      - Underweight Detected - Enable/Disable
      - Weight Limit Violations - Enable/Disable
      - Manual Weight Override Used - Enable/Disable
    → Pre-Booking & Scheduling Notifications:
      - Pre-Booking Created - Enable/Disable
      - Pre-Booking Late Arrival (24+ hours) - Enable/Disable
    → Security & Compliance Notifications:
      - Invalid/Expired License - Enable/Disable
      - Unbooked Truck Arrival - Enable/Disable
      - Truck Arrival No Active Order - Enable/Disable
      - Incorrect Seals - Enable/Disable
      - Seal Number Mismatch - Enable/Disable
      - Unregistered Asset Attempting Entry - Enable/Disable
      - Inactive Entity Attempted Entry - Enable/Disable
      - Truck Left Without Completing Process - Enable/Disable
    → Asset & Driver Alerts:
      - Driver License Expiring (7 days) - Enable/Disable
      - Driver License Expiring (30 days) - Enable/Disable
    → System Notifications:
      - Calibration Due - Enable/Disable
    → Notification Delivery Preferences:
      - Preferred Email Address
→ Save User Configuration →
Send Welcome Emails → Activate User Accounts
```

#### Flow 11: Product Management Configuration

```text
Newton Admin Login → System Settings →
Select Product Management →
View Product List (e.g., Gold, Platinum, Diamond, Iron Ore, Chrome) →
Add/Edit Products:
  - Product Name* (e.g., "Gold Ore")
  - Product Code* (e.g., "AU-001")
  - Specifications (optional - e.g., "Grade A")
  - Active/Inactive Status
→ Save Product →
Product Available for Order Creation
```

#### Flow 12: Order Settings Configuration (We need to define daily allowed trucks, weight per Transporter)

```text
Newton Admin Login → System Settings →
Select Order Configuration →
Configure Order Settings:
  - Order Number Configuration:
    → Set Order Number Mode:
      - Auto-Generated Only (Force Auto-Generated)
      - Manual Entry Allowed (User Can Choose)
    → If Auto-Generated: Configure Number Format/Prefix
    → If Manual Allowed: Set Validation Rules
  - Order Limits:
    → Set Default Daily Truck Limit
    → Set Default Daily Weight Limit
    → Set Default Monthly Limits
    → Set Default Trip Limit (Default: 1 trip per operating day)
    Note: Trip calculations will consider Collection Site operating hours
    → Set Default Weight per Truck
    Note: These defaults will pre-populate in order creation but can be overridden per order
  - Pre-Booking Settings:
    → Set Pre-Booking as Compulsory or Optional
    → Set Default Advance Booking Time (Default: 24 hours)
  - Seal Requirements:
    → Set Default Seal Requirement (Yes/No)
    → Set Default Seal Quantity
    → Configure Seal Verification Rules
    Note: Default seal settings will pre-populate in order creation
→ Save Order Settings →
Apply to All Active Orders → Notify Logistics Coordinators
```

#### Flow 13: Client Management Configuration

```text
Newton Admin Login → System Settings →
Select Client Management →
Configure Client Settings:
  - Add New Client:
    → Enter Client Name
    → Enter Company Registration Number
    → Enter VAT Number
    → Enter Physical Address
    → Add Contact Person Details
    → Set Email for Notifications
  - Client-Specific Settings:
    → Link Allowed Collection Sites
    → Link Allowed Destinations
    → Set Client-Specific Requirements
    → Configure Notification Recipients
→ Save Client Configuration →
Update Client Database → Confirmation
```

#### Flow 14: Site Management Configuration

```text
Newton Admin Login → System Settings →
Select Site Management →
Configure Site Settings:
  - Collection Sites/Loading Places:
    → Add Collection Site Name
    → Enter Physical Address
    → Select Contact Person from Existing Users
    → System Validates Contact Information:
      If Contact Missing Phone Number:
        → Prompt: "Contact requires phone number for notifications"
        → Enter Phone Number for Contact
        → Update User Profile with Phone Number
    → Set Operating Hours (Default: 06:00-18:00)
  - Destinations:
    → Add Destination Name
    → Enter Physical Address
    → Select Contact Person from Existing Users
    → System Validates Contact Information:
      If Contact Missing Phone Number:
        → Prompt: "Contact requires phone number for notifications"
        → Enter Phone Number for Contact
        → Update User Profile with Phone Number
    → Set Delivery Requirements
→ Save Site Settings →
Update Route Database → Notify Transportation Teams
```

#### Flow 15: Notification System Infrastructure

```text
Newton Admin Login → System Settings →
Select Notification Infrastructure →
Configure System-Wide Notification Settings:
  - Email Templates:
    → Asset Added Template
    → Asset Inactive Template
    → Asset Edited Template
    → Asset Deleted Template (Include Reason Field)
    → Order Created Template
    → Order Allocated Template
    → Order Cancelled Template
    → Overload Alert Template (Mandatory Offload Required)
    → Underweight Alert Template
    → License Expiry Warning Template
    → Pre-Booking Confirmation Template
    → 24-Hour Reminder Template
    → System Alert Templates
  - Template Configuration:
    → Edit Subject Lines
    → Customize Email Body
    → Add Company Logo
    → Include Dynamic Fields:
      - User Name
      - Asset Details
      - Order Numbers
      - Weights
      - Dates and Times
      - Reason Fields
  - Notification Triggers:
    → Define When Each Notification Type is Sent
    → Set Escalation Rules for Critical Alerts
    → Configure Warning Periods (Days Before Expiry)
    → Set Default Overload Threshold (e.g., >5% requires mandatory offload)
    → Set Default Underweight Threshold (e.g., <10% triggers warning)
→ Test Email Templates:
  - Send Test Email for Each Template
  - Preview with Sample Data
→ Save Infrastructure Settings →
Apply System-Wide → Restart Notification Service
```

#### Flow 16: System-Wide Settings Configuration

```text
Newton Admin Login → System Settings →
Select System Configuration →
Configure Global Settings:
  - Fleet Management:
    → Enable/Disable Fleet Number
    → Customize Fleet Number label
  - Group Management:
    → Enable/Disable Transporter Group
    → Customize Transporter Group label
    → Configure Group Dropdown Options
  - Interface Settings:
    → Enable/Disable Features
    → Set UI Simplification Options
    → Configure Dashboard Views per Role
→ Save System Settings →
Apply System-Wide → Restart Services if Required
```

#### Flow 17: Security Alert Configuration

```text
Newton Admin Login → System Settings →
Select Security Alert Configuration →
Configure Security Exit Verification Alerts:
  - Exit Verification Failure Contacts:
    → Add Primary Contact from Existing Users
    → Add Secondary Contacts from Existing Users
    → Set Contact Priority Order
    → System Validates Contact Information:
      If Contact Missing Phone Number:
        → Prompt: "Contact requires phone number for security alerts"
        → Enter Phone Number for Contact
        → Update User Profile with Phone Number
  - Alert Settings:
    → Configure Escalation Time (minutes before alerting next contact)
    → Set Alert Severity Levels
  - Verification Failure Types:
    → QR Code Mismatch Alert Recipients
    → Document Verification Failure Alert Recipients
    → Seal Discrepancy Alert Recipients
    → General Security Breach Alert Recipients
  - Response Requirements:
    → Set Required Response Time
    → Configure Auto-Escalation Rules
    → Define Emergency Override Procedures
→ Save Security Alert Configuration →
Apply to All Security Checkpoints → Test Alert System
```
