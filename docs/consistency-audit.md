# Consistency Audit Findings

## Blocking

- **Role management UI contradicts single-role model.** `RoleManager` still treats roles as a multi-select list (add/remove buttons, array state) even though `docs/data-model.md` specifies a single `roleId`. This also bypasses `hiddenForCompanies` filtering when the user has multiple roles toggled.

```24:108:src/components/users/RoleManager.tsx
export function RoleManager({ open, onClose, onSuccess, user, viewOnly = false }: RoleManagerProps) {
  useSignals()
  const { showSuccess, showError } = useAlert()
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const availableRoles = filterVisibleRoles(globalData.roles.value, user.companyId)
  // ... existing code ...
  const toggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId))
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId])
    }
  }
```

## High

- **Notification defaults omit `system.calibrationDue`.** The preferences editor’s defaults skip this mandatory key from `docs/data-model.md`, so users never see or persist that preference.

```19:56:src/components/users/NotificationPreferencesEditor.tsx
const DEFAULT_PREFERENCES = {
  "asset.added": true,
  // ... existing code ...
  "driver.licenseExpiring30": true,
}
```

- **`outline` button variant violates design guidance.** Design requires outline buttons to stay minimal without border glow; current implementation adds `hover:border-[var(--glass-border-floating)]`.

```1:18:src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 ...",
  {
    variants: {
      variant: {
        // ... existing code ...
        outline: "border border-[var(--glass-border-soft)] text-foreground hover:bg-[oklch(1_0_0_/_0.2)] hover:border-[var(--glass-border-floating)]",
```

## Medium

- **Asset edit flow uses toasts for blocking errors.** Spec mandates alert dialogs for validation failures, yet `AssetEditModal` falls back to `toast.error` on save failures.

```361:407:src/components/assets/AssetEditModal.tsx
  const handleSaveQRUpdate = async (qrCode: string) => {
    setIsSaving(true)
    try {
      await AssetService.update(asset.id, {
        ntCode: qrCode,
      })
      // ... existing code ...
    } catch (error) {
      console.error("Error updating QR code:", error)
      toast.error("Failed to update QR code")
```

- **Permission hook bypasses centralized data service.** `usePermission` fetches roles directly from Firestore instead of relying on the shared `data.service` signals, contradicting the “NO duplicate queries” directive.

```53:69:src/hooks/usePermission.ts
        if (roleCache.has(user.roleId)) {
          role = roleCache.get(user.roleId)!
        } else {
          const roleDoc = await getDoc(doc(db, "roles", user.roleId))
          if (roleDoc.exists()) {
            role = { id: roleDoc.id, ...roleDoc.data() } as Role
            roleCache.set(user.roleId, role)
          }
        }
```

## Low

- **User creation API enables every notification flag.** Defaults in `route.ts` set all notification preferences to `true`, conflicting with documented defaults (e.g., `asset.inactive`, `order.cancelled` should start disabled).

```53:80:src/app/api/users/create/route.ts
    await adminDb
      .collection("users")
      .doc(userId)
      .set({
        // ... existing code ...
        notificationPreferences: {
          "asset.added": true,
          "asset.inactive": true,
          "asset.edited": true,
          "asset.deleted": true,
          // ... existing code ...
          "system.calibrationDue": true,
        },
```
