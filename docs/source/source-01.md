### Features and User Flows for the Weighbridge System Application

#### Features:

1. **User Roles and Permissions:**

   - Different roles such as Administrator, Induction Officer, and Operator with specific permissions.
   - Ability to manage user access and roles.

2. **Asset Management:**

   - Add new assets (trucks and trailers) to the database.
   - Unique ID generation for each asset that cannot be changed.
   - Scanning of QR codes for asset identification.
   - Capture of perishable data (e.g., licence disc expiry) and non-perishable data (e.g., VIN number).

3. **Induction Process:**

   - Step-by-step induction process for assets:
     1. User logs in.
     2. Selects transporter.
     3. Scans QR code (twice for verification).
     4. Scans licence disc (twice for verification).
     5. Optionally enters fleet number and group.
     6. Saves the asset, triggering an email notification to relevant parties.

4. **Error Handling:**

   - Notifications for errors (e.g., expired licence disc) during the induction process.
   - Clear explanations for why an asset cannot be added.

5. **Email Notifications:**

   - Automatic email notifications sent to the transporter and client upon asset addition.
   - Customisable email recipients based on the transporter and client configurations.

6. **Asset Deletion:**

   - Operators can request deletion of an asset if a mistake is made.
   - No editing of existing assets; deletion and re-adding is required.
   - Restrictions on deletion if there are transactions associated with the asset.

7. **Alerts:**

   - Alerts for specific events (e.g., overloads, underloads) based on asset data.

8. **Configuration Settings:**

   - Administrators can configure additional fields for asset entry (e.g., fleet number, group).
   - Options to enable or disable certain features based on company requirements.

9. **User-Friendly Interface:**
   - Simple and intuitive interface for operators and induction officers.
   - Predictive text and dropdowns for fleet numbers and groups to minimize errors.

#### Basic User Flows:

> **Flow Entry Point:** After a successful login, users land on the **Dashboard**. Each flow below begins from the Dashboard.

1. **Adding a New Asset:**

   - **Login:** User logs into the system.
   - **Dashboard:** User lands on the Dashboard.
   - **Start Add:** User clicks **Add New Asset** on the Dashboard.
   - **Select Transporter:** User selects the transporter from a dropdown list.
   - **Scan QR Code:** User scans the asset's QR code twice for verification.
   - **Scan Licence Disc:** User scans the licence disc twice for verification.
   - **Enter Additional Information:** User can optionally enter fleet number and group.
   - **Save:** User saves the asset, triggering an email notification to the transporter and client.
   - **Confirmation:** User receives confirmation of successful asset addition or an error notification.

2. **Requesting Asset Deletion:**

   - **Login:** User logs into the system.
   - **Dashboard:** User lands on the Dashboard.
   - **Go to Assets:** From the Dashboard, the user navigates to **Assets**.
   - **Locate Asset:** User searches for or selects the asset to delete.
   - **Check Asset Usage:** The system verifies if the asset is currently in use or has any associated transactions. If it is, deletion is blocked and a clear notification is displayed.
   - **Request Deletion:** If the asset is not in use, the user clicks on the delete option and provides a reason for deletion.
   - **Confirmation:** The system confirms the deletion request (if permitted) and notifies the administrator.
