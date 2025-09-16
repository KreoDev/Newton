<!-- cSpell:words Underload underload -->

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
Select Transporter from Dropdown →
Scan QR Code (First Time) → Scan QR Code (Second Time for Verification) →
Scan License Disc Barcode (First Time) → Scan License Disc Barcode (Second Time for Verification) →
System Automatically:
  - Identifies Asset Type (Truck/Trailer/Driver)
  - Extracts All Information from License Disc
  - Validates Expiry Dates
→ Check Validation Results:
  If Valid:
    → Enter Fleet Number (Optional - Manual Entry)
    → Select/Enter Group (Optional - Manual Entry)
    → Save Asset
    → Email Notifications Sent to Transporter & Client
    → Confirmation Message
  If Invalid (Expired):
    → Error Notification with Reason
    → Process Blocked
    → Return to Start
```

#### Flow 3: Asset Deletion (Induction Error Correction)

```text
Operator Login → Navigate to Asset Management →
Search/Select Asset → Click Delete →
Enter Deletion Reason → Submit →
System Checks for Linked Transactions:
  If No Transactions (Typically During Induction):
    → Asset Deleted Immediately
    → Deletion Logged with Reason
    → Confirmation Message
  If Transactions Exist (99% of Cases):
    → Deletion Blocked
    → Show Transaction Count
    → Display "Cannot Delete - Asset Has Transactions"
    → Offer "Mark as Inactive" Option:
      If Selected:
        → Confirm Inactivation
        → Flag Asset as Inactive
    → Return to Asset List
```

### Order Management Flows

#### Flow 4: Order Creation

```text
Logistics Coordinator/Allocation Officer Login →
Navigate to Orders → Click "Create New Order" →
Choose Order Number Method:
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
  - Set Dispatch Date Range (Start & End)
  - Allocate Total Weight
  - Select Loading Dates
  - Choose Collection Point from List
  - Select Destination
  - Choose Product from Catalog
  - Specify Seal Requirements (Yes/No, Quantity)
  - Select Client
  - Set Daily Truck Limit
  - Set Daily Weight Limit
  - Set Trip Limits:
    Option 1: Set Maximum Trips Per Day:
      → Enter number of trips allowed per day
      → System applies limit across all order days
    Option 2: Set Trip Duration:
      → Enter trip duration in hours
      → System calculates possible trips based on:
        - 24-hour day availability
        - Order date range (single or multi-day)
        - Shows trips per day and total trips
      → For multi-day trips (>24 hours):
        - System adjusts daily capacity accordingly
        - Shows trips spanning multiple days
  - Set Monthly Limits
→ Choose Allocation Method:
  Option 1: Assign to Logistics Coordinator:
    → Select Logistics Coordinator
    → LC Will Handle Weight Distribution Later
  Option 2: Assign to Transporter(s):
    → Select Multiple Transporters
    → Allocate Weight to Each Transporter
    → System Validates Total Weight = Sum of Allocations:
      If Mismatch:
        → Error: "Weight allocation doesn't match total"
        → Adjust Allocations
      If Match:
        → Proceed
→ Review Order Summary → Submit Order →
Order Saved to Database →
Send Notifications and Emails:
  - If Assigned to LC: Notify Logistics Coordinator
  - If Assigned to Transporters: Notify All Selected Transporters
  - Notify Other Relevant Parties
→ Confirmation Screen
```

#### Flow 5: Order Allocation Process (Post-Creation)

```text
Logistics Coordinator Login → View Orders Assigned to Me →
Select Order for Distribution →
Review Total Weight Available →
Redistribute Weight:
  → Select Multiple Transporters
  → Allocate Weight to Each Transporter
  → Ensure Total = Original Allocation
  → Set Transporter-Specific Requirements
→ Submit Distribution →
Send Notifications and Emails:
  - Notify All Selected Transporters
  - Notify Other Relevant Parties
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
    - Transporter
    - Truck Type
    - Availability
→ Select Trucks → Link to Order →
Set Trip Configuration for Each Truck:
  - Specify number of trips per day
  - System validates against order's trip limits
  - Shows total capacity based on trips
→ Add Special Instructions →
Submit Pre-Booking →
Send Notifications and Emails to:
  - Selected Transporters
  - Other Relevant Parties
→ Booking Confirmation
```

### Weighbridge Operation Flows

#### Flow 7: Security In Process

```text
Truck Arrives at Security In →
Security Personnel:
  - Scan Truck QR Code
  - Scan Driver ID
  - System Checks Pre-Booking Configuration:
    If Pre-Booking is Compulsory:
      → Verify truck has orders for today
      → Check order details match
      If No Valid Orders for Today:
        → Deny Entry
        → Send Alert to Logistics Coordinator
        → Log Rejection Reason
      If Valid Orders Exist:
        → Allow Entry
    If Pre-Booking is Optional:
      → Verify truck/driver exists in system
      If Registered in System:
        → Allow Entry (even without pre-booking)
      If Not Registered:
        → Deny Entry
        → Alert Security Supervisor
→ Truck Proceeds to Weighbridge
```

#### Flow 8: Weighbridge Tare Weight (Inbound)

```text
Truck Arrives at Weighbridge (Empty) →
Weighbridge Operator:
  - Scan Truck QR Code
  - Order Retrieval Process:
    If Pre-Booking is Compulsory:
      → System Auto-Retrieves Order
    If Pre-Booking is Optional:
      If Truck Has Pre-Booking:
        → System Auto-Retrieves Order
      If No Pre-Booking:
        → Manual Order Selection Required
        → Operator Links Truck to Available Order
  - Capture Tare Weight
  - Check for Weight Limits
  - Print Tare Weight Ticket
→ Truck Proceeds to Loading Point
```

#### Flow 9: Weighbridge Gross Weight (Outbound)

```text
Loaded Truck Returns to Weighbridge →
Weighbridge Operator:
  - Scan Truck QR Code
  - Capture Gross Weight
  - Calculate Net Weight (Gross - Tare)
  - Check for Overload:
    If Overloaded:
      → Alert Generated
      → Notify Logistics Coordinator
      → Document Overload
      → System Checks Overload Policy Setting:
        If "Allow Overload with Penalty" is Enabled:
          → Apply Penalty Fee
          → Document Penalty
          → Generate Weight Ticket with Overload Flag
          → Allow Proceed to Security Out
        If "Deny Overload Exit" is Enabled:
          → Block Exit Permission
          → Force Return for Offload
          → Truck Must Return to Loading Point
          → Adjust Load Weight
          → Return to Weighbridge for Re-weighing
    If Within Limits:
      → Proceed
  - Scan Seal Numbers
  - Verify Seals Match Order
  - Generate Final Weight Ticket
  - Print Documents with Seal Numbers
→ Truck Proceeds to Security Out
```

#### Flow 10: Security Out Process

```text
Truck Arrives at Security Out →
Security Personnel:
  - Verify Documents
  - Check for Overload Permission Flag:
    If Overload Denied Flag Present:
      → Deny Exit
      → Direct Back to Loading Area
  - Check Seal Integrity
  - Scan Seals for Final Verification
  - Record Exit Time
→ Truck Exits Facility
```

#### Flow 11: Weighbridge Calibration

```text
Weighbridge Supervisor Login →
Navigate to Calibration Tools →
Select Weighbridge →
Access Serial Port Configuration →
  For Initial Calibration:
    → Place Known Weight on Bridge
    → Input Known Weight Value
    → System Calculates Variance
    → Adjust Calibration Factor
    → Test with Multiple Weights
    → Save Calibration Settings
  For Verification:
    → Run Verification Test
    → Compare Against Standards
    → Generate Calibration Certificate
→ Log Calibration Activity →
Set Next Calibration Date → Complete
```

### Administrative Flows

#### Flow 12: Company Settings Configuration

```text
Newton Admin Login → System Settings →
Select Company Settings →
Configure Company Details:
  - Add/Edit Companies:
    → Enter Company Name
    → Enter Registration Number
    → Enter VAT Number
    → Enter Physical Address
    → Add Contact Person with Full Details
  - Configure Branches/Sites:
    → Add Multiple Branches per Company
    → Assign Contact Person per Branch
    → Set Batch Number Management Rules
  - Set Company Limits:
    → Daily Truck Limits
    → Daily Weight Limits
    → Monthly Limits
  - Special Role Configuration:
    → Flag Logistics Coordinator as Transporter (if needed)
→ Save Company Settings →
Confirm Changes → Notify Affected Users
```

#### Flow 13: User Management Configuration

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
  - Set Permissions:
    → Role-Based Access Control
    → View Restrictions per Role
    → Feature Access Control
    → Configure Transporter View (Only See Assigned Orders)
    → Set Role-Based Visibility Rules
→ Save User Configuration →
Send Welcome Emails → Activate User Accounts
```

#### Flow 14: Product Management Configuration

```text
Newton Admin Login → System Settings →
Select Product Management →
Configure Product Settings:
  - Add New Products:
    → Enter Product Name
    → Enter Product Code
    → Set Product Specifications
    → Define Product Categories
  - Configure Categories:
    → Create Product Categories
    → Set Category Rules
    → Define Category Hierarchies
  - Product Linking:
    → Link Products to Order Types
    → Set Product Availability per Site
→ Save Product Configuration →
Update Product Catalog → Notify Relevant Users
```

#### Flow 15: Order Settings Configuration

```text
Newton Admin Login → System Settings →
Select Order Configuration →
Configure Order Settings:
  - Order Types:
    → Configure Receiving Orders
    → Configure Dispatching Orders
  - Order Limits:
    → Set Daily Truck Limits
    → Set Daily Weight Limits
    → Set Monthly Limits
    → Enforce Weight Redistribution Rules (Cannot Exceed Original Allocation)
    → Set Weight Adjustment Rules (Cannot Exceed Order Total)
  - Trip Configuration:
    → Enable Manual Trip Count Setting
    → Enable Automatic Trip Calculation
    → Set Multi-Day Trip Rules
    → Configure Trip Duration Parameters
  - Pre-Booking Settings:
    → Set Pre-Booking as Compulsory or Optional
    → Configure 24-Hour Advance Booking Rule
  - Seal Requirements:
    → Configure Seal Verification Rules
    → Set Seal Number Requirements
→ Save Order Settings →
Apply to All Active Orders → Notify Logistics Coordinators
```

#### Flow 16: Location Management Configuration

```text
Newton Admin Login → System Settings →
Select Location Management →
Configure Location Settings:
  - Collection Points/Loading Places:
    → Add Collection Point Name
    → Enter Physical Address
    → Add Contact Information
    → Set Operating Hours
  - Destinations:
    → Add Destination Name
    → Enter Physical Address
    → Add Contact Person Details
    → Set Delivery Requirements
  - Route Configuration:
    → Link Collection Points to Destinations
    → Set Route Rules
    → Define Distance/Duration
    → Configure Route Restrictions
→ Save Location Settings →
Update Route Database → Notify Transportation Teams
```

#### Flow 17: Weighbridge Settings Configuration

```text
Newton Admin Login → System Settings →
Select Weighbridge Configuration →
Configure Weighbridge Settings:
  - Bridge Configuration:
    → Add/Configure Weighbridge Stations
    → Set Single or Multiple Axle Setup
    → Configure Serial Port Access
    → Set Input String Decoding Rules
  - Weight Settings:
    → Set Tolerance Levels
    → Configure Weight Limits
    → Set Tare Weight Rules
  - Overload Policy:
    → Set as "Allow with Penalty" or "Deny Exit"
    → Configure Penalty Fees (if applicable)
    → Set Overload Alert Recipients
  - Calibration Settings:
    → Set Calibration Schedule
    → Configure Load Cell Parameters
    → Set Verification Standards
  - Alert Configuration:
    → Configure Overload/Underload Alerts
    → Set Weight Violation Notifications
    → Define Alert Recipients
→ Save Weighbridge Settings →
Test Configuration → Deploy to All Weighbridges
```

#### Flow 18: Notification System Configuration

```text
Newton Admin Login → System Settings →
Select Notification Configuration →
Configure Notification Triggers and Recipients:
  - Asset Management Notifications:
    → Asset Added:
      • Enable/Disable Notification
      • Select Recipients: Transporter, Client, Site Admin, Custom List
      • Set Email Template
    → Asset Made Inactive:
      • Enable/Disable Notification
      • Select Recipients: Transporter, Asset Owner, Site Admin
      • Set Email Template
    → Asset Edited/Modified:
      • Enable/Disable Notification
      • Select Recipients: Transporter, Previous Owner, New Owner
      • Set Email Template
    → Asset Deleted:
      • Enable/Disable Notification
      • Select Recipients: Transporter, Site Admin, Audit Team
      • Include Deletion Reason in Email
  - Order Management Notifications:
    → Order Created:
      • Select Recipients: Logistics Coordinator, Transporters, Client
    → Order Allocated/Redistributed:
      • Select Recipients: Affected Transporters, Logistics Coordinator
    → Order Cancelled:
      • Select Recipients: All Assigned Parties
  - Weighbridge Notifications:
    → Overload Detected:
      • Select Recipients: Logistics Coordinator, Site Supervisor, Driver
      • Set Severity Levels and Escalation
    → Underload Detected:
      • Select Recipients: Logistics Coordinator, Quality Control
    → Weight Limit Violations:
      • Select Recipients: Site Admin, Security, Transporter
  - Security & Compliance Notifications:
    → Invalid/Expired License:
      • Select Recipients: Security Supervisor, Transporter, Driver
    → Unbooked Truck Arrival:
      • Select Recipients: Logistics Coordinator, Security
    → Missing Orders:
      • Select Recipients: Logistics Coordinator, Allocation Officer
    → Incorrect Seals:
      • Select Recipients: Security, Quality Control, Client
  - Pre-Booking Notifications:
    → Pre-Booking Created:
      • Select Recipients: Transporter, Driver, Loading Team
    → Pre-Booking Modified:
      • Select Recipients: All Affected Parties
    → 24-Hour Advance Reminder:
      • Select Recipients: Transporter, Driver
  - System Alerts:
    → Calibration Due:
      • Select Recipients: Weighbridge Supervisor, Maintenance Team
    → Document Expiry Warning:
      • Select Recipients: Asset Owner, Compliance Officer
      • Set Warning Period (Days Before Expiry)
  - Email Configuration:
    → Email Templates:
      • Create/Edit Templates per Notification Type
      • Set Subject Lines
      • Include Dynamic Fields (Names, Dates, Numbers)
    → Recipient Lists:
      • Create Custom Recipient Groups
      • Set Primary and CC Recipients
      • Configure Escalation Chains
    → Delivery Settings:
      • Immediate vs. Batched Notifications
      • Set Quiet Hours (No Notifications)
      • Configure Retry on Failure
→ Test Notification Configuration:
  - Send Test Email for Each Type
  - Verify Recipient Delivery
→ Save Notification Settings →
Apply to All Active Processes → Confirmation
```

#### Flow 19: System-Wide Settings Configuration

```text
Newton Admin Login → System Settings →
Select System Configuration →
Configure Global Settings:
  - Fleet Management:
    → Enable/Disable Fleet Number Requirements
    → Configure Fleet Number Format
    → Enable Predictive Text for Fleet Numbers
    → Set 24-Hour Timer for Fleet Allocation
  - Group Management:
    → Enable/Disable Group Requirements
    → Create Transporter Groups
    → Configure Group Dropdown Options
  - Asset Management:
    → Set Asset Deletion Rules (No Deletion if Transactions Exist)
    → Configure Induction Requirements
    → Set QR Code Configuration (Permanent Linking to Assets)
    → Enable/Disable Dual Scanning
    → Enforce No-Edit Policy (Delete and Re-add Only)
  - Interface Settings:
    → Enable/Disable Features
    → Set UI Simplification Options
    → Configure Dashboard Views per Role
→ Save System Settings →
Apply System-Wide → Restart Services if Required
```
