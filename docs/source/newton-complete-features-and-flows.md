# Newton Portal - Complete Features and User Flows

## Overview

Newton Web Portal is a comprehensive weighbridge and logistics management system designed to streamline operations in mining and transportation sectors. The system provides end-to-end management of assets, orders, weighbridge operations, and logistics coordination with real-time notifications and tracking capabilities.

## Complete Feature List

### 1. Authentication & Security
- **Two-Factor Authentication (2FA)** for secure login
- **Facial Recognition** for user verification
- **Role-Based Access Control** with specific permissions per role
- **Credential Management** for portal access

### 2. Company & Organization Management
- **Company Profile Management**
  - Company name and registration number
  - VAT number management
  - Physical address tracking
  - Contact person management with full contact information
- **Branch/Site Management**
  - Multiple branches or sites per company
  - Contact person assignment per branch/site
  - Location tracking
  - Batch number management
- **Special Role Flags**
  - Option to flag Logistics Coordinator as Transporter (dual role functionality)

### 3. User & Role Management
- **User Profile Features**
  - Name and surname management
  - Contact number and email address
  - Profile picture upload
  - Credential management for portal access
- **Available Role Types**
  - Newton Administrator
  - Site Administrator
  - Logistics Coordinator (Company)
  - Allocation Officer
  - Transporter
  - Induction Officer
  - Weighbridge Supervisor
  - Weighbridge Operator
  - Security Personnel
- **Permission Management**
  - Role-based access control
  - View restrictions based on role
  - Feature access control per role

### 4. Asset Management
- **Truck Management**
  - Add new trucks to database
  - QR code scanning for truck identification
  - Registration details capture
  - Active truck tracking
- **Trailer Management**
  - Trailer registration with specifications
  - QR code assignment
  - Linking to trucks
- **Driver Management**
  - Driver registration with license data import
  - License disc scanning and validation
  - Driver verification at checkpoints
  - Perishable data capture (e.g., license disc expiry)
  - Non-perishable data capture (e.g., ID number)
- **Fleet Organization**
  - Fleet number assignment
  - Group creation and management
  - Transporter groups creation
  - Fleet allocation with 24-hour timer

### 5. Induction Process
- **Step-by-Step Asset Induction**
  - User authentication
  - Transporter selection
  - Dual QR code scanning for verification
  - Dual license disc scanning for verification
  - Optional fleet number and group entry
  - Asset saving with automatic notifications
- **Error Handling**
  - Expired license disc notifications
  - Clear error explanations
  - Validation feedback

### 6. Order Management
- **Order Creation Features**
  - Auto-generated order numbers (default)
  - Manual order number entry option (with duplicate checking)
  - Order type selection (Receiving or Dispatching only)
  - Weight allocation
  - Loading date scheduling
  - Dispatch date range selection
  - Collection point selection
  - Destination selection
  - Product selection
  - Seal requirements specification
  - Client selection
- **Order Limits & Controls**
  - Daily truck limits
  - Daily weight limits
  - Monthly limits
  - Weight adjustment within limits
- **Order Allocation**
  - Assignment to Logistics Coordinators or Transporters
  - Order redistribution capabilities
  - Weight adjustment (within order limits)
  - Multiple transporter linking
  - Multiple source linking

### 7. Pre-Booking System
- **Logistics Coordinator Pre-Booking**
  - Pre-book trucks for specific orders
  - Selection of active orders linked to user
  - Truck-to-order linking during pre-booking
  - 24-hour advance booking capability

### 8. Weighbridge Operations
- **Weight Management**
  - Integration with weighbridge hardware
  - Axle weight measurement
  - Main weight measurement
  - Weight data capture and validation
  - Overload detection and alerts
  - Underload detection and alerts
- **Calibration Features**
  - Weighbridge calibration tools
  - Load cell configuration
  - Calibration data input
  - Ongoing weight verification
  - Calibration reports generation
- **Configuration Options**
  - Single axle weighbridge setup
  - Multiple axle weighbridge setup
  - Serial port access for system configuration
  - Input string decoding from weighbridge data

### 9. Scanning & Verification
- **Multi-Point Scanning**
  - Security in checkpoint scanning
  - Weighbridge scanning
  - Security out checkpoint scanning
- **Verification Types**
  - Driver verification
  - Truck verification
  - Trailer verification
  - Seal verification and matching
  - Order verification

### 10. Notification System
- **Email Notifications**
  - Automatic notifications on asset addition
  - Customizable email recipients per transporter/client
  - Issue alerts (invalid drivers, missing orders, incorrect seals)
  - Overload/underload notifications
- **Real-Time Alerts**
  - Logistics coordinator alerts for unbooked trucks
  - Security checkpoint alerts
  - Weight limit violations
  - Expired document warnings

### 11. Location & Product Management
- **Location Management**
  - Collection points/loading places
  - Destinations with contact information
  - Route linking capabilities
- **Product Catalog**
  - Product management
  - Product selection for orders
  - Product specifications

### 12. Reporting & Analytics
- **Performance Tracking**
  - Turnaround time tracking
  - Delay identification and analysis
  - Workflow efficiency reports
- **Data Reports**
  - Weight tickets generation
  - Transaction history
  - Calibration reports
  - Asset utilization reports

### 13. Asset Deletion & Management
- **Deletion Controls**
  - Direct deletion for assets without transactions
  - Reason documentation requirement
  - Automatic blocking if transactions exist
  - Primarily for correcting induction errors
- **Audit Trail**
  - No editing of existing assets (delete and re-add policy)
  - Full deletion history with reasons logged

### 14. Configuration & Settings
- **Administrator Configuration**
  - Additional field configuration (fleet number, group)
  - Feature enable/disable options
  - Company-specific requirements
  - System-wide settings
- **User Interface Customization**
  - Predictive text for fleet numbers
  - Dropdown customization for groups
  - Interface simplification options

### 15. Integration Capabilities
- **External System Integration**
  - Weighbridge hardware integration
  - License verification system connection
  - Client management system integration
  - Facial recognition system compatibility
  - MOX system integration potential
- **Data Exchange**
  - Serial port communication
  - API endpoints for third-party systems

### 16. Multi-Client Support
- **Client Management**
  - Multiple client support
  - Client-specific order management
  - Cross-client linking capabilities
  - Client-specific rules and limits

### 17. Sales & Marketing Tools
- **Demonstration Features**
  - Comprehensive data presentation capabilities
  - System versatility showcase
  - Client presentation tools
  - Feature demonstration mode

## Complete User Flows

### Authentication Flows

#### Flow 1: User Login with 2FA
```
Start → Enter Username/Email → Enter Password → 
Receive 2FA Code → Enter 2FA Code → 
Dashboard Access → Role-Based View
```

#### Flow 2: User Login with Facial Recognition
```
Start → Enter Username/Email → 
Initiate Facial Scan → Face Verification → 
Dashboard Access → Role-Based View
```

### Asset Management Flows

#### Flow 3: Complete Asset Induction Process
```
Induction Officer Login → Select "Add New Asset" → 
Select Transporter from Dropdown → 
Scan QR Code (First Time) → Scan QR Code (Second Time for Verification) → 
Scan License Disc Barcode (First Time) → Scan License Disc Barcode (Second Time for Verification) → 
System Automatically:
  - Identifies Asset Type (Truck/Trailer/Driver)
  - Extracts All Information from License Disc
  - Validates Expiry Dates
→ If Valid:
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

#### Flow 4: Asset Deletion (Induction Error Correction)
```
Operator Login → Navigate to Asset Management → 
Search/Select Asset → Click Delete → 
Enter Deletion Reason → Submit → 
System Checks for Linked Transactions → 
  If No Transactions (Typically During Induction):
    → Asset Deleted Immediately
    → Deletion Logged with Reason
    → Confirmation Message
  If Transactions Exist (99% of Cases):
    → Deletion Blocked
    → Show Transaction Count
    → Display "Cannot Delete - Asset Has Transactions"
    → Return to Asset List
```

### Order Management Flows

#### Flow 5: Complete Order Creation
```
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
  - Set Monthly Limits
→ Choose Allocation Method:
  Option 1: Assign to Logistics Coordinator
    → Select Logistics Coordinator
    → LC Will Handle Weight Distribution Later
  Option 2: Assign to Transporter(s)
    → Select Multiple Transporters
    → Allocate Weight to Each Transporter
    → System Validates Total Weight = Sum of Allocations
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

#### Flow 6: Order Allocation Process (Post-Creation)
```
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

#### Flow 7: Pre-Booking Process
```
Logistics Coordinator Login → View Active Orders → 
Select Order for Pre-Booking → 
View Available Dates/Slots → Select Date → 
Search Available Trucks → 
  Filter by:
    - Transporter
    - Truck Type
    - Availability
→ Select Trucks → Link to Order → 
Set Collection Time → Add Special Instructions → 
Submit Pre-Booking → 
Send Notifications and Emails to:
  - Selected Transporters
  - Other Relevant Parties
→ Booking Confirmation
```

### Weighbridge Operation Flows

#### Flow 8: Complete Weighbridge Process (Inbound)
```
Truck Arrives at Security In → 
Security Personnel:
  - Scan Truck QR Code
  - Scan Driver ID
  - Verify Against Pre-Booking
  - Check Order Details
  If Valid → Allow Entry
  If Invalid → Send Alert to Logistics Coordinator
→ Truck Proceeds to Weighbridge → 
Weighbridge Operator:
  - Scan Truck QR Code
  - System Auto-Retrieves Order
  - Capture Tare Weight
  - Check for Weight Limits
  - Print Tare Weight Ticket
→ Truck Proceeds to Loading Point
```

#### Flow 9: Complete Weighbridge Process (Outbound)
```
Loaded Truck Returns to Weighbridge → 
Weighbridge Operator:
  - Scan Truck QR Code
  - Capture Gross Weight
  - Calculate Net Weight (Gross - Tare)
  - Check for Overload
    If Overloaded:
      → Alert Generated
      → Notify Logistics Coordinator
      → Document Overload
      → Decide Action (Offload/Proceed with Penalty)
    If Within Limits:
      → Proceed
  - Scan Seal Numbers
  - Verify Seals Match Order
  - Generate Final Weight Ticket
  - Print Documents with Seal Numbers
→ Truck Proceeds to Security Out → 
Security Personnel:
  - Verify Documents
  - Check Seal Integrity
  - Scan Seals for Final Verification
  - Record Exit Time
→ Truck Exits Facility
```

#### Flow 10: Weighbridge Calibration
```
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

### Multi-Point Process Flows

#### Flow 11: Complete Transportation Cycle
```
Day Before:
  Logistics Coordinator → Pre-Books Trucks → Notifications Sent

Day Of Operation:
  Driver Arrives → Security In Process → 
  First Weighbridge (Tare) → Loading → 
  Second Weighbridge (Gross) → Seal Application → 
  Documentation → Security Out → 
  
  Transport to Destination → 
  
  At Destination:
    → Arrival Scan
    → Weight Verification (if applicable)
    → Seal Verification
    → Unloading
    → Confirmation of Delivery
    → Update System Status
```

### Administrative Flows

#### Flow 12: System Configuration (Newton Administrator)
```
Newton Admin Login → System Settings → 
Select Configuration Area:
  Company Settings:
    → Add/Edit Companies
    → Configure Branches
    → Set Company Limits
  User Management:
    → Create Users
    → Assign Roles
    → Set Permissions
  Product Management:
    → Add Products
    → Set Specifications
    → Configure Categories
  Order Types:
    → Configure Receiving Orders
    → Configure Dispatching Orders
  Location Management:
    → Add Collection Points
    → Add Destinations
    → Set Route Rules
  Weighbridge Settings:
    → Configure Bridges
    → Set Tolerance Levels
    → Configure Alerts
→ Apply Changes → Test Configuration → 
Deploy to Production → Notify Affected Users
```

#### Flow 13: Report Generation
```
User Login → Navigate to Reports → 
Select Report Type:
  - Turnaround Time Report
  - Weight Summary Report
  - Transaction History
  - Asset Utilization
  - Calibration History
→ Set Parameters:
  - Date Range
  - Specific Assets/Orders
  - Grouping Options
→ Generate Report → 
View/Export Options:
  - View Online
  - Export PDF
  - Export Excel
  - Email Report
→ Save Report Settings (Optional)
```

### Error Handling Flows

#### Flow 14: Invalid Driver at Checkpoint
```
Driver Scanned at Security → 
System Detects Invalid/Expired License → 
Alert Generated → 
  Notifications Sent to:
    - Security Supervisor
    - Logistics Coordinator
    - Transporter
→ Driver Detained → 
Options:
  - Replace Driver
  - Update License Information
  - Cancel Trip
→ Resolution Logged → 
Process Continues or Terminated
```

## Business Rules Summary

### Critical Business Rules

1. **Order Types**
   - Orders can only be of two types: Receiving or Dispatching
   - No other order types are permitted in the system

2. **Weight Management**
   - Orders cannot exceed original weight allocation when redistributed
   - Weight adjustments permitted but cannot exceed order total
   - Overload detection triggers mandatory alerts
   - Daily and monthly limits must be enforced

3. **Time Constraints**
   - 24-hour timer starts upon order acceptance by transporter
   - Fleet allocation must be completed within timer period
   - Pre-booking must be done at least 24 hours in advance

4. **Access Control**
   - Role-based visibility strictly enforced
   - Transporters can only see their assigned orders
   - Asset deletion allowed only when no transactions exist
   - Dual role (Logistics Coordinator as Transporter) requires special flag

5. **Data Integrity**
   - No editing of existing assets (delete and re-add only)
   - All deletions require reason documentation
   - QR codes are permanently linked to assets

6. **Verification Requirements**
   - Dual scanning required for critical operations
   - License expiry validation mandatory
   - Seal numbers must match order specifications
   - Driver verification required at all checkpoints

## Integration Requirements

### Required Integrations
- Weighbridge hardware systems
- License verification systems
- Email notification service
- QR code generation and scanning systems

### Optional Integrations
- Facial recognition systems
- MOX systems
- Client management systems
- ERP systems
- GPS tracking systems

## Security & Compliance

### Security Features
- Two-factor authentication
- Role-based access control
- Audit trail for all transactions
- Encrypted data transmission
- Session management

### Compliance Requirements
- Data retention policies
- Privacy protection for driver information
- Weight certification standards
- Calibration compliance tracking
- Regulatory reporting capabilities

## User Interface Requirements

### Design Principles
- Simple and intuitive interface
- Mobile-responsive design
- Predictive text and smart dropdowns
- Clear error messages
- Visual status indicators

### Accessibility Features
- Screen reader compatibility
- Keyboard navigation
- High contrast mode options
- Multi-language support

## Performance Requirements

### System Performance
- Real-time weight capture
- Instant notification delivery
- Sub-second response times for queries
- Support for concurrent users
- Offline capability for critical operations

### Scalability
- Multi-company support
- Unlimited users per company
- High transaction volume handling
- Distributed weighbridge support

## Conclusion

The Newton Portal provides a comprehensive solution for weighbridge and logistics management with robust features for asset management, order processing, real-time tracking, and compliance management. The system's modular design allows for flexible deployment and customization based on specific client requirements while maintaining core functionality across all implementations.