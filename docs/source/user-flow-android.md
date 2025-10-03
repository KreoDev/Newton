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

### Weighbridge Operation Flows

#### Flow 4: Security In Process

```text
Truck Arrives at Security In →
Security Personnel:
  - Scan Driver QR Code →If other Country is Identified skip Driver license scan?
  - Scan Truck QR Code
  - Scan Trailer 1 QR Code
  - Scan Trailer 2 QR Code
  - System Validates All Scanned Documents
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
        → Check for Active Orders for the Company (Transporter / Logistics Coordinator)
        If Active Orders Exist:
          → Allow Entry
        If No Active Orders:
          → Deny Entry
          → Send Notification to Users with "Truck Arrival No Active Order" Enabled
          → Log Rejection Reason
      If Not Registered:
        → Deny Entry
        → Alert Security Supervisor
→ Truck Proceeds to Weighbridge
```

#### Flow 5: Weighbridge (First Weight) Depending on type of order Tare / Gross Weight

```text
Truck Arrives at Weighbridge →
Weighbridge Operator:
  -Scan Any QR Code
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
  - Capture ALPR Image and start verifying Transaction
  - Submit = When all of above is in Order Boom gates open to proceed
  - Show a pop up of a PDF
→ Truck Proceeds to Loading Point
```

#### Flow 6: Weighbridge (Last Weight) Depending on type of order Tare / Gross Weight

```text
Loaded Truck Returns to Weighbridge →
Weighbridge Operator:
  - Scan Any QR Code
  - Capture Gross Weight
  - Calculate Net Weight (Gross - Tare)
  - Check for Weight Violations:
    If Overloaded:
      → Alert Generated
      → Send Notification to Users with "Overload Detected" Enabled
      → Document Overload
      → Block Exit Permission
      → Force Return for Offload
      → Truck Must Return to Loading Point
      → Adjust Load Weight
      → Return to Weighbridge for Re-weighing
    If Underweight:
      → Alert Generated
      → Send Notification to Users with "Underweight Detected" Enabled
      → Document Underweight
      → Proceed with Warning Flag
    If Within Limits:
      → Proceed
  - Scan Seal Numbers
  - Capture ALPR Image and start verifying Transaction
  - Generate Final Weight Ticket
  - Print Documents with Seal Numbers
→ Truck Proceeds to Security Out
```

#### Flow 7: Security Out Process

```text
Truck Arrives at Security Out →
Security Personnel:
  - Scan Driver QR Code
  - Scan Truck QR Code
  - Scan Trailer 1 QR Code
  - Scan Trailer 2 QR Code
  - System Verifies All Scanned Items:
    If Any Verification Fails:
      → Deny Exit
      → Display "Exit Denied" (No Reason Given)
      → Send Silent Notification to Configured Security Alert Contacts
      → Wait for Inspection Resolution
    If All Verifications Pass:
      → Continue Process
  - Check Seal Integrity
  - Scan Seals for Final Verification:
    If Seal Verification Fails:
      → Deny Exit
      → Display "Exit Denied" (No Reason Given)
      → Send Silent Notification to Configured Security Alert Contacts
      → Document Seal Issue Internally
      → Wait for Inspection Resolution
    If Seal Verification Passes:
      → Continue Process
  - Record Exit Time
→ Truck Exits Facility
```
