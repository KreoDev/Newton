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
Operator Login → Navigate to Asset Management →
Search/Select Asset → Click Delete →
Enter Deletion Reason → Submit →
System Checks for Linked Transactions:
  If No Transactions (Typically During Induction):
    → Asset Deleted Immediately
    → Deletion Logged with Reason
    → Send Notification to Users with "Asset Deleted" Enabled
    → Confirmation Message
  If Transactions Exist (99% of Cases):
    → Deletion Blocked
    → Show Transaction Count
    → Display "Cannot Delete - Asset Has Transactions"
    → Offer "Mark as Inactive" Option:
      If Selected:
        → Enter Reason for Inactivation
        → Confirm Inactivation
        → Flag Asset as Inactive with Reason
        → Send Notification to Users with "Asset Made Inactive" Enabled
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
  - Select Client from List
  - Set Dispatch Date Range (Start & End)
  - Allocate Total Weight
  - Select Collection Point from List
  - Select Destination from List
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
        - Collection Point operating hours
        - Order date range (single or multi-day)
        - Shows trips per day and total trips
      → System validates against Collection Point hours:
        - If trip duration exceeds daily operating window
        - Automatically spans to next operating day
  - Adjust Monthly Limits (Pre-filled with Default)
→ Choose Allocation Method:
  Option 1: Assign to Logistics Coordinator Company:
    → Select Logistics Company from List
    → Notifications sent to configured contacts
    → LC Will Handle Weight Distribution Later
  Option 2: Assign to Transporter(s):
    → Select Transporter Companies from List
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
  → Select Multiple Transporters
  → Allocate Weight to Each Transporter
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
Send Notification to Users with "Pre-Booking Created" Enabled →
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
        → Send Notification to Users with "Unbooked Truck Arrival" Enabled
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
  - Check for Weight Violations:
    If Overloaded:
      → Alert Generated
      → Send Notification to Users with "Overload Detected" Enabled
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
    If Underloaded:
      → Alert Generated
      → Send Notification to Users with "Underload Detected" Enabled
      → Document Underload
      → Proceed with Warning Flag
    If Within Limits:
      → Proceed
  - Scan Seal Numbers
  - Verify Seals Match Order:
    If Seals Don't Match:
      → Send Notification to Users with "Incorrect Seals" Enabled
      → Document Seal Mismatch
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
Set Next Calibration Date →
System Will Send Notification to Users with "Calibration Due" Enabled When Date Approaches →
Complete
```

### Administrative Flows

#### Flow 12: Company (Mine) Configuration

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
  - Configure Mine Sites/Branches:
    → Add Multiple Sites per Company
    → Enter Site Location
    → Set Site-Specific Requirements
    → Add Site Manager Contact
→ Save Company Configuration →
Update Company Database → Confirmation
```

#### Flow 13: Transporter Configuration

```text
Newton Admin Login → System Settings →
Select Transporter Management →
Configure Transporter Details:
  - Add New Transporter:
    → Enter Transporter Company Name
    → Enter Registration Number
    → Enter VAT Number
    → Enter Physical Address
    → Enter Fleet Size Information
  - Link Contact People for Transporter:
    → Select Primary Contact from Existing Users
    → Select Secondary Contacts from Existing Users
    → System Validates Contact Information:
      If Contact Missing Phone Number:
        → Prompt: "Contact requires phone number for notifications"
        → Enter Phone Number for Contact
        → Update User Profile with Phone Number
      If Contact Has Complete Information:
        → Link Contact to Transporter
→ Save Transporter Configuration →
Update Transporter Database → Send Welcome Email to Contacts
```

#### Flow 14: Logistics Coordinator Company Configuration

```text
Newton Admin Login → System Settings →
Select Logistics Coordinator Management →
Configure Logistics Company Details:
  - Add New Logistics Company:
    → Enter Company Name
    → Enter Registration Number
    → Enter VAT Number
    → Enter Physical Address
    → Set as Dual-Role Logistics Coordinator (if applicable)
  - Link Contact People for Logistics Company:
    → Select Primary Coordinator from Existing Users
    → Select Additional Coordinators from Existing Users
    → System Validates Contact Information:
      If Contact Missing Phone Number:
        → Prompt: "Contact requires phone number for notifications"
        → Enter Phone Number for Contact
        → Update User Profile with Phone Number
      If Contact Has Complete Information:
        → Link Contact to Logistics Company
  - Logistics Company Settings:
    → Link Associated Transporters if selected as a Dual-Role Logistics Coordinator (Optional)
→ Save Logistics Company Configuration →
Update Database → Send Welcome Email to Contacts
```

#### Flow 15: User Management Configuration

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
      - Underload Detected - Enable/Disable
      - Weight Limit Violations - Enable/Disable
      - Manual Weight Override Used - Enable/Disable
    → Pre-Booking & Scheduling Notifications:
      - Pre-Booking Created - Enable/Disable
      - Pre-Booking Late Arrival (24+ hours) - Enable/Disable
    → Security & Compliance Notifications:
      - Invalid/Expired License - Enable/Disable
      - Unbooked Truck Arrival - Enable/Disable
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

#### Flow 16: Product Management Configuration

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

#### Flow 17: Order Settings Configuration

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
  - Order Types:
    → Configure Receiving Orders
    → Configure Dispatching Orders
  - Order Limits:
    → Set Default Daily Truck Limit
    → Set Default Daily Weight Limit
    → Set Default Monthly Limits
    → Set Default Trip Limit (Default: 1 trip per operating day)
    Note: Trip calculations will consider Collection Point operating hours
    → Enforce Weight Redistribution Rules (Cannot Exceed Original Allocation)
    → Set Weight Adjustment Rules (Cannot Exceed Order Total)
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

#### Flow 18: Client Management Configuration

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
    → Link Allowed Collection Points
    → Link Allowed Destinations
    → Set Client-Specific Requirements
    → Configure Notification Recipients
→ Save Client Configuration →
Update Client Database → Confirmation
```

#### Flow 19: Location Management Configuration

```text
Newton Admin Login → System Settings →
Select Location Management →
Configure Location Settings:
  - Collection Points/Loading Places:
    → Add Collection Point Name
    → Enter Physical Address
    → Add Contact Information
    → Set Operating Hours (Default: 06:00-18:00)
  - Destinations:
    → Add Destination Name
    → Enter Physical Address
    → Add Contact Person Details
    → Set Delivery Requirements
→ Save Location Settings →
Update Route Database → Notify Transportation Teams
```

#### Flow 20: Weighbridge Settings Configuration

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
    → Set Default Tolerance Levels (e.g., ±0.5%)
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

#### Flow 21: Notification System Infrastructure

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
    → Overload Alert Template
    → Underload Alert Template
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
    → Set Default Overload/Underload Thresholds (e.g., >5% / <10%)
→ Test Email Templates:
  - Send Test Email for Each Template
  - Preview with Sample Data
→ Save Infrastructure Settings →
Apply System-Wide → Restart Notification Service
```

#### Flow 22: System-Wide Settings Configuration

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
