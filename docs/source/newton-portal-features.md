# Newton Web Portal - Features and User Flows

## Overview
The Newton Web Portal is a logistics management system designed to handle order creation, allocation, and fleet management for transportation operations. The system supports multiple companies, transporters, and includes weighbridge integration.

## Core Features

### 1. Company Management
- **Company Profile**
  - Company name
  - Registration number
  - VAT number
  - Physical address
  - Contact persons with relevant contact information
- **Branch/Site Management**
  - Multiple branches or sites per company
  - Contact person assignment per branch/site
  - Location tracking
  - Batch number management
- **Special Flags**
  - Option to flag Logistics Coordinator as Transporter (dual role)

### 2. User & Role Management
- **User Profiles**
  - Name and surname
  - Contact number
  - Email address
  - Profile picture
  - Credential management for portal access
- **Role Types**
  - Logistics Coordinator (Company)
  - Allocation Officer
  - Transporter
  - Site Administrator
  - Induction Officer
  - Weighbridge Supervisor
  - Weighbridge Operator
  - Newton Administrator
- **Permissions**
  - Role-based access control
  - View restrictions based on role

### 3. Transporter Management
- **Transporter Registration**
  - Company information (reg number, VAT, address)
  - Contact persons and information
- **Asset Management**
  - Trucks registration
  - Trailers registration
  - Drivers registration (data collected from licenses)
  - Dispatch/Receiving tracking
- **Fleet Management**
  - Transporter groups creation
  - Active truck tracking
  - Fleet allocation with 24-hour timer

### 4. Order Management
- **Order Creation**
  - Auto-generated order numbers
  - Order type selection
  - Weight allocation
  - Loading date scheduling
  - Dispatch date range selection
  - Collection point selection
  - Destination selection
  - Product selection
  - Seal requirements
  - Client selection
- **Order Limits**
  - Daily truck limits
  - Daily weight limits
  - Monthly limits
- **Order Allocation**
  - Assignment to Logistics Coordinators or Transporters
  - Order redistribution capabilities
  - Weight adjustment (within order limits)
- **Pre-Booking System**

### 5. Location & Product Management
- **Locations**
  - Collection points/loading places
  - Destinations with contact numbers
- **Products**
  - Product catalog management
  - Product selection for orders

### 6. Weighbridge Integration
- Weighbridge system connection
- Weight recording and validation
- Dispatch and receiving weight tracking

### 7. Multi-Client Support
- System supports multiple clients
- Client-specific order management
- Cross-client linking capabilities

## User Flows

### Flow 1: Company Onboarding
```
Start → Register Company → Enter Company Info → Create Branches/Sites → 
Assign Contact Persons → Setup Logistics Coordinator → 
Optional: Flag as Transporter → Complete
```

### Flow 2: Order Creation (Logistics Coordinator/Allocation Officer)
```
Login → Navigate to Orders → Create New Order → 
Enter Order Details:
  - Select order type
  - Set dispatch date range
  - Allocate weight
  - Select loading dates
  - Choose collection point
  - Select destination
  - Select product
  - Specify seal requirements
  - Select client
  - Set daily/monthly limits
→ Submit Order → Order Number Generated
```

### Flow 3: Order Allocation
```
Allocation Officer Login → View Orders → Select Order(s) → 
Check Assignment Flags → 
  If Logistics Coordinator Flag:
    → Assign to Logistics Coordinator
    → LC can redistribute to multiple transporters
    → Adjust weights (within limits)
  If Transporter Flag:
    → Assign directly to Transporter
→ Confirmation
```

### Flow 4: Transporter Fleet Assignment
```
Transporter Login → View Active Orders → Accept Order → 
24-Hour Timer Starts → View Active Trucks → 
Allocate Fleet:
  - Select trucks
  - Assign trailers
  - Assign drivers
→ Confirm Allocation
```

### Flow 5: Asset Registration (Transporter)
```
Transporter Login → Navigate to Assets → 
Register Assets:
  - Add Trucks (registration details)
  - Add Trailers (specifications)
  - Add Drivers (license data import)
→ Create Asset Groups → Save
```

### Flow 6: Destination Management
```
Login → Navigate to Destinations → Create New Destination → 
Enter Details:
  - Location name
  - Address
  - Contact numbers
  - Contact persons
→ Link to Available Routes → Save
```

### Flow 7: Weighbridge Operations
```
Weighbridge Operator Login → Select Incoming Vehicle → 
Verify Order Details → Record Weight → 
Validate Against Order Specs → 
  If Dispatch: Record dispatch weight
  If Receiving: Record receiving weight
→ Generate Weight Receipt → Update System
```

### Flow 8: Multi-Client Order Management
```
Check Multi-Client Flag → Select Client → 
Create/View Client-Specific Orders → 
Apply Client-Specific Rules/Limits → 
Link Related Orders Across Clients (if applicable)
```

### Flow 9: Newton Administrator Management
```
Newton Admin Login → System Configuration →
  - Manage Collection Points
  - Manage Product Catalog
  - Configure System Settings
  - User Management
  - Permission Settings
→ Apply Changes
```

## Business Rules

### Order Management Rules
- Orders cannot exceed original weight allocation when redistributed
- Order redistribution allowed only to assigned Logistics Coordinator
- Weight adjustments permitted but cannot exceed order total
- Daily and monthly limits must be enforced

### Fleet Allocation Rules
- 24-hour timer starts upon order acceptance
- Only active orders visible to transporters
- Only active trucks can be allocated to orders
- Fleet allocation must be completed within timer period

### Access Control Rules
- Role-based visibility restrictions
- Users can only access features permitted by their role
- Logistics Coordinator can have dual role as Transporter (when flagged)
- Transporters can only see their assigned orders

### Data Validation Rules
- Driver data must be validated against license information
- Weight recordings must be validated against order specifications
- Company registration and VAT numbers required for profile creation

## Integration Points
- Weighbridge systems for weight capture
- License verification system for driver data
- Client management systems (when multi-client flag is active)

## Notes
- This is a preliminary feature and flow extraction based on available documentation
- Flows are intentionally high-level to allow for iteration
- Additional details needed for:
  - Specific permission mappings per role
  - Detailed validation rules
  - Error handling procedures
  - Reporting requirements
  - Notification system
  - Audit trail requirements