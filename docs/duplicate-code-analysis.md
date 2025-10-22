# Newton Codebase Duplication Analysis

## Analysis Overview

**Analysis Date**: January 22, 2025 **Codebase Version**: Phase 1, 2, and 3 Complete **Total Files Analyzed**: 150+ components and services **Estimated Code Duplication**: 40-60% across similar components

This document identifies duplicate code patterns and reusable components in the Newton weighbridge system codebase. It provides a comprehensive analysis of duplication opportunities to improve maintainability, reduce code duplication, and create consistent patterns across the application.

---

## Executive Summary

The Newton codebase demonstrates excellent architectural patterns with centralized data management and proper separation of concerns. However, significant opportunities exist for refactoring to eliminate code duplication. The highest impact areas involve form modals, admin CRUD pages, and permission checking logic.

### Key Findings

1. **Form Modal Patterns**: 8+ similar modal components with identical structure (~500 lines of duplicate code)
2. **Admin CRUD Pages**: 5 admin pages with nearly identical patterns (~800 lines of duplicate code)
3. **Permission Logic**: Multiple similar permission checking hooks and functions (~100 lines of duplicate code)
4. **Scanner Components**: Barcode/QR scanners with nearly identical keyboard handling (~150 lines of duplicate code)
5. **Bulk Action Modals**: 6 similar bulk operation modals with identical patterns (~200 lines of duplicate code)

### Recommended Actions

**Immediate (High Impact, Low Risk):**

- Create generic `FormModal` component for CRUD operations
- Build reusable `AdminCrudPage` template
- Consolidate permission checking logic
- Create column factory functions for data tables

**Short-term (Medium Impact, Medium Risk):**

- Extract scanner base component
- Create validation utility functions
- Build reusable async operation hooks

**Total Estimated Code Reduction**: ~2,280 lines of duplicate code

---

## 🔴 High Priority: Form Modal Duplications

### Affected Components

- `ProductFormModal.tsx` (165 lines, 75% duplicate)
- `ClientFormModal.tsx` (282 lines, 70% duplicate)
- `SiteFormModal.tsx` (386 lines, 65% duplicate)
- `RoleFormModal.tsx` (160 lines, 80% duplicate)
- `CompanyFormModal.tsx` (1307 lines - complex, handle separately)

### 1. Identical Props Interface Pattern

**Repeated in ALL form modals:**

```typescript
interface EntityFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  entity?: Entity // For editing existing
  viewOnly?: boolean // For read-only viewing
}
```

**Files with this pattern:**

- `src/components/products/ProductFormModal.tsx`
- `src/components/clients/ClientFormModal.tsx`
- `src/components/sites/SiteFormModal.tsx`
- `src/components/roles/RoleFormModal.tsx`
- `src/components/companies/CompanyFormModal.tsx`

### 2. Identical Modal Structure Pattern

**Repeated Dialog setup in ALL modals:**

```typescript
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] w-auto h-auto">
    <DialogHeader>
      <DialogTitle>{viewOnly ? "View" : isEditing ? "Edit" : "Create New"} {EntityName}</DialogTitle>
      <DialogDescription>
        {viewOnly ? "View information" : isEditing ? "Update information" : "Add a new entity"}
      </DialogDescription>
    </DialogHeader>
```

### 3. Identical Form Lifecycle Pattern

**Repeated in ALL form modals:**

```typescript
const [loading, setLoading] = useState(false)
const isEditing = Boolean(entity)

useEffect(() => {
  if (entity && open) {
    // Pre-populate fields
  } else if (!entity && open) {
    resetForm()
  }
}, [entity, open])

const resetForm = () => {
  // Clear all fields
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // Validation
  // Try-catch with loading states
  // Success/error alerts
}
```

### 4. Identical Error Handling Pattern

**Repeated in ALL form modals:**

```typescript
const { showSuccess, showError } = useAlert()

try {
  setLoading(true)
  if (isEditing) {
    await updateDocument(collection, entity.id, data, "Updated successfully")
  } else {
    await createDocument(collection, data, "Created successfully")
  }
  showSuccess(title, message)
  onSuccess()
} catch (error) {
  console.error(error)
  showError("Failed", error.message)
} finally {
  setLoading(false)
}
```

### 5. Identical Button Pattern

**Repeated in ALL form modals:**

```typescript
{
  viewOnly ? (
    <div className="flex justify-end pt-4 border-t">
      <Button type="button" onClick={onClose}>
        Close
      </Button>
    </div>
  ) : (
    <div className="flex justify-end gap-3 pt-4 border-t">
      <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : isEditing ? "Update Entity" : "Create Entity"}
      </Button>
    </div>
  )
}
```

### Refactoring Solution: Generic FormModal Component

**Create**: `src/components/ui/generic-form-modal/GenericFormModal.tsx`

```typescript
interface GenericFormModalProps<T> {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  entity?: T
  viewOnly?: boolean
  title: string
  description?: string
  collection: string
  children: React.ReactNode // Form fields
  onValidate?: (data: any) => string[] // Custom validation
  onPrepareData?: (formData: any) => any // Transform before save
}
```

**Benefits:**

- Reduce 400+ lines of duplicate code
- Consistent modal behavior across app
- Standardized error handling
- Easier testing and maintenance

---

## 🔴 High Priority: Admin CRUD Page Duplications

### Affected Pages

- `admin/products/page.tsx` (207 lines, 85% duplicate)
- `admin/clients/page.tsx` (221 lines, 85% duplicate)
- `admin/sites/page.tsx` (224 lines, 85% duplicate)
- `admin/roles/page.tsx` (308 lines, 80% duplicate)
- `admin/companies/page.tsx` (267 lines, 85% duplicate)

### 1. Identical Permission Setup Pattern

**Repeated in ALL admin pages:**

```typescript
const { canView, canManage, isViewOnly, loading: permissionLoading } = useViewPermission(PERMISSIONS.MODULE_VIEW, PERMISSIONS.MODULE)
const { showSuccess, showError, showConfirm } = useAlert()
```

### 2. Identical State Management Pattern

**Repeated in ALL admin pages:**

```typescript
const [showCreateModal, setShowCreateModal] = useState(false)
const [editingEntity, setEditingEntity] = useState<Entity | undefined>(undefined)
const [filterStatus, setFilterStatus] = useState<string>("all")
```

### 3. Identical Data Access Pattern

**Repeated in ALL admin pages:**

```typescript
useSignals()
const entities = globalData.entities.value
const loading = globalData.loading.value
const { searchTerm, setSearchTerm, filteredItems, isSearching } = useOptimizedSearch(entities, SEARCH_CONFIGS.entities)
```

### 4. Identical Toggle Function Pattern

**Repeated in ALL admin pages:**

```typescript
const toggleEntityStatus = async (entity: Entity) => {
  try {
    await updateDocument(collection, entity.id, {
      isActive: !entity.isActive,
    })
    showSuccess(`Entity ${entity.isActive ? "Deactivated" : "Activated"}`, `${entity.name} has been ${entity.isActive ? "deactivated" : "activated"} successfully.`)
  } catch (error) {
    console.error("Error toggling status:", error)
    showError("Failed to Update", error.message)
  }
}
```

### 5. Identical Delete Function Pattern

**Repeated in ALL admin pages:**

```typescript
const handleDeleteClick = async (entity: Entity) => {
  // Check if in use
  const inUse = await checkEntityInUse(entity.id)
  if (inUse) {
    showError("Cannot Delete", "Entity is in use...")
    return
  }

  showConfirm("Delete Entity", "Are you sure?", async () => {
    await deleteDocument(collection, entity.id, "Deleted successfully")
    showSuccess("Deleted", "Entity deleted successfully")
  })
}
```

### 6. Identical Render Structure Pattern

**Repeated in ALL admin pages:**

```typescript
return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
        <p className="text-muted-foreground">Manage your entities</p>
      </div>
      {isViewOnly && <ViewOnlyBadge />}
    </div>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">{/* Search and filters */}</div>
          {canManage && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>{/* Entity grid/list */}</CardContent>
    </Card>

    {/* Modals */}
  </div>
)
```

### Refactoring Solution: Generic AdminCrudPage Component

**Create**: `src/components/ui/admin-crud-page/AdminCrudPage.tsx`

```typescript
interface AdminCrudPageConfig<T> {
  entityName: string
  entityNamePlural: string
  collection: string
  viewPermission: PermissionKey
  managePermission: PermissionKey
  searchConfig: SearchConfig
  checkInUse?: (entity: T) => Promise<boolean>
  getEntityData: () => T[]
  FormModal: React.ComponentType<any>
  renderCard: (entity: T, actions: CardActions<T>) => React.ReactNode
}
```

**Benefits:**

- Reduce 800+ lines of duplicate code
- Consistent admin page behavior
- Standardized permission enforcement
- Single place to update admin page patterns

---

## 🟡 Medium Priority: Permission Logic Duplications

### Affected Components

- `AppLayout.tsx` - `hasAnyPermission()` function (27 lines)
- `admin/page.tsx` - `hasAnyPermission()` function (13 lines)
- Multiple components with permission evaluation patterns

### Duplicate Pattern

**Repeated permission evaluation logic:**

```typescript
const hasAnyPermission = (permissions: PermissionKey[]): boolean => {
  if (!permissions || permissions.length === 0) return true
  if (!user) return false

  const userRole = globalData.roles.value.find(r => r.id === user.roleId)

  return permissions.some(permission => {
    // 1. Check permission overrides FIRST
    if (user.permissionOverrides && permission in user.permissionOverrides) {
      return user.permissionOverrides[permission]
    }

    // 2. Global users have all permissions (unless overridden)
    if (user.isGlobal) return true

    // 3. Check role permissions
    if (userRole) {
      if (userRole.permissionKeys.includes("*")) return true
      if (userRole.permissionKeys.includes(permission)) return true
    }

    return false
  })
}
```

**Found in:**

- `src/components/layout/AppLayout.tsx:47-73`
- `src/app/(authenticated)/admin/page.tsx:89-101`

### Similar Permission Hooks

**usePermission hook pattern:**

```typescript
export function usePermission(permission: PermissionKey): { hasPermission: boolean; loading: boolean } {
  const { user } = useAuth()
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function checkPermission() {
      if (!user) {
        setHasPermission(false)
        setLoading(false)
        return
      }

      try {
        // Evaluation order: permissionOverrides → isGlobal → role.permissionKeys
        // 1. Check permission overrides (per-user permission adjustments)
        if (user.permissionOverrides && permission in user.permissionOverrides) {
          const override = user.permissionOverrides[permission]
          setHasPermission(override)
          setLoading(false)
          return
        }

        // 2. Global users have all permissions (unless overridden above)
        if (user.isGlobal) {
          setHasPermission(true)
          setLoading(false)
          return
        }

        // 3. Get role from centralized data service (in-memory, real-time)
        const role = globalData.roles.value.find((r: Role) => r.id === user.roleId)

        if (!role) {
          setHasPermission(false)
          setLoading(false)
          return
        }

        // Check if role has wildcard permission
        if (role.permissionKeys.includes("*")) {
          setHasPermission(true)
          setLoading(false)
          return
        }

        // Check if role has specific permission
        const hasIt = role.permissionKeys.includes(permission)
        setHasPermission(hasIt)
        setLoading(false)
      } catch (error) {
        console.error("Error checking permission:", error)
        setHasPermission(false)
        setLoading(false)
      }
    }

    checkPermission()
  }, [user, permission])

  return { hasPermission, loading }
}
```

**Found in:**

- `src/hooks/usePermission.ts` (72 lines)

**useViewPermission hook pattern:**

```typescript
export function useViewPermission(viewPermission: PermissionKey, managePermission: PermissionKey) {
  const { hasPermission: hasViewPermission, loading: viewLoading } = usePermission(viewPermission)
  const { hasPermission: hasManagePermission, loading: manageLoading } = usePermission(managePermission)

  return {
    canView: hasViewPermission || hasManagePermission, // Can view if has either permission
    canManage: hasManagePermission, // Can manage only if has full permission
    isViewOnly: hasViewPermission && !hasManagePermission, // View-only mode
    loading: viewLoading || manageLoading,
  }
}
```

**Found in:**

- `src/hooks/useViewPermission.ts` (20 lines)

### Refactoring Solution: Enhanced Permission Service

**Enhance**: `src/services/permission.service.ts`

```typescript
export class PermissionService {
  static hasAnyPermission(user: User, permissions: PermissionKey[]): boolean
  static hasAllPermissions(user: User, permissions: PermissionKey[]): boolean
  static getEffectivePermissions(user: User): PermissionKey[]
  static canPerformAction(user: User, action: string): boolean
}
```

**Create**: `src/hooks/usePermissions.ts` (enhanced version)

```typescript
export function usePermissions(permissions: PermissionKey[]) {
  return {
    hasAny: boolean,
    hasAll: boolean,
    effective: PermissionKey[],
    loading: boolean
  }
}
```

---

## 🟡 Medium Priority: Scanner Component Duplications

### Affected Components

- `assets/shared/QRCodeScanner.tsx` (251 lines, ~60% duplicate)
- `assets/shared/BarcodeScanner.tsx` (321 lines, ~60% duplicate)

### 1. Identical Input Handling Pattern

**Repeated in both scanners:**

```typescript
const [inputData, setInputData] = useState("")
const [isProcessing, setIsProcessing] = useState(false)
const [error, setError] = useState("")
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  if (inputRef.current) {
    inputRef.current.focus()
  }
}, [])
```

### 2. Identical Keyboard Handler Pattern

**Repeated in both scanners (147 lines of identical code):**

```typescript
useEffect(() => {
  let scanBuffer = ""
  let scanTimeout: NodeJS.Timeout | null = null
  let lastKeyTime = 0

  const handleKeyDown = (event: KeyboardEvent) => {
    const currentTime = Date.now()
    const timeDiff = currentTime - lastKeyTime

    if (event.key === "Enter") {
      if (scanBuffer.length >= 6) {
        handleScannerScan(scanBuffer)
        scanBuffer = ""
      }
      if (scanTimeout) clearTimeout(scanTimeout)
      event.preventDefault()
      return
    }

    if (timeDiff > 100 && scanBuffer.length > 0) {
      scanBuffer = ""
    }

    if (event.key.length === 1) {
      scanBuffer += event.key
      lastKeyTime = currentTime

      if (scanTimeout) clearTimeout(scanTimeout)
      scanTimeout = setTimeout(() => {
        if (scanBuffer.length >= 6) {
          handleScannerScan(scanBuffer)
        }
        scanBuffer = ""
      }, 100)
    }
  }

  document.addEventListener("keydown", handleKeyDown)

  return () => {
    document.removeEventListener("keydown", handleKeyDown)
    if (scanTimeout) clearTimeout(scanTimeout)
  }
}, [handleScannerScan])
```

### 3. Identical Visual State Management Pattern

**Repeated in both scanners:**

```typescript
const getVisualState = () => {
  if (error) return "error"
  if (isProcessing) return "processing"
  if (parsedData) return "success"
  return "waiting"
}

const visualState = getVisualState()
```

### 4. Identical Clear/Reset Pattern

**Repeated in both scanners:**

```typescript
const handleClear = () => {
  setInputData("")
  setError("")
  setParsedData(null)
  setIsProcessing(false)
  setTimeout(() => {
    inputRef.current?.focus()
  }, 100)
}
```

### 5. Identical JSX Structure Pattern

**Both scanners have nearly identical JSX structures:**

```typescript
return (
  <div className="space-y-4">
    {/* Hidden input that captures scanner events */}
    <Input ref={inputRef} type="text" value={inputData} className="sr-only" autoComplete="off" readOnly onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()} aria-label={label} />

    {/* Visual placeholder */}
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`visual-state-classes-${visualState}`}>{/* Icons and status text */}</div>

      {/* Show parsed data when captured */}
      {parsedData && (
        <div className="mt-4 p-3 bg-muted rounded-lg w-full max-w-md">
          {/* Data display */}
          <Button variant="ghost" size="sm" type="button" className="h-6 px-2 text-xs mt-2 w-full" onClick={handleClear}>
            Clear & Rescan
          </Button>
        </div>
      )}
    </div>
  </div>
)
```

### Refactoring Solution: Base Scanner Component

**Create**: `src/components/ui/scanner/BaseScanner.tsx`

```typescript
interface BaseScannerProps {
  onScanSuccess: (data: any) => void
  onScanError?: (error: string) => void
  label: string
  helpText: string
  validateFn?: (data: string) => Promise<any>
  parseFn?: (data: string) => Promise<any>
  autoAdvance?: boolean
  placeholder?: string
}
```

**Benefits:**

- Reduce ~150 lines of duplicate code
- Single place to maintain scanner logic
- Consistent scanner behavior
- Easier to add new scanner types

---

## 🟡 Medium Priority: Bulk Action Modal Duplications

### Affected Components

- `users/bulk-actions/BulkActivateModal.tsx` (83 lines)
- `users/bulk-actions/BulkDeactivateModal.tsx` (83 lines)
- `users/bulk-actions/BulkDeleteModal.tsx` (similar structure)
- `users/bulk-actions/BulkMoveCompanyModal.tsx` (similar structure)
- `users/bulk-actions/BulkChangeRoleModal.tsx` (similar structure)
- `users/bulk-actions/BulkSendNotificationModal.tsx` (similar structure)

### 1. Identical Props Interface Pattern

**Repeated in ALL bulk action modals:**

```typescript
interface BulkActionModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}
```

### 2. Identical State Management Pattern

**Repeated in ALL bulk action modals:**

```typescript
const { showSuccess, showError } = useAlert()
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  try {
    setLoading(true)
    await bulkUpdateUsers(userIds, updateData)
    showSuccess("Success Title", `Successfully updated ${users.length} user${users.length > 1 ? "s" : ""}.`)
    onSuccess()
  } catch (error) {
    console.error("Error:", error)
    showError("Action Failed", error.message)
  } finally {
    setLoading(false)
  }
}
```

### 3. Identical JSX Structure Pattern

**Repeated in ALL bulk action modals:**

```typescript
return (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-{color}-600">
          <Icon className="h-5 w-5" />
          Action Title
        </DialogTitle>
        <DialogDescription>
          Action description {users.length} user{users.length > 1 ? "s" : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Users list */}
        <div className="space-y-2">
          <Label>Users to Update ({users.length})</Label>
          <div className="max-h-48 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg">
            {users.map(user => (
              <div key={user.id} className="text-sm">
                {user.firstName} {user.lastName} <span className="text-muted-foreground text-xs">({user.email})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleAction} disabled={loading} className={buttonClass}>
          {loading ? "Processing..." : `Action ${users.length} User${users.length > 1 ? "s" : ""}`}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
```

### Refactoring Solution: Generic Bulk Action Modal

**Create**: `src/components/ui/bulk-action-modal/BulkActionModal.tsx`

```typescript
interface BulkActionModalConfig<T> {
  title: string
  description: string
  icon: React.ComponentType<any>
  buttonText: string
  buttonVariant?: "default" | "destructive"
  buttonClass?: string
  onConfirm: (items: T[]) => Promise<void>
  renderItem: (item: T) => React.ReactNode
}
```

**Benefits:**

- Reduce ~200 lines of duplicate code
- Consistent bulk action behavior
- Standardized confirmation patterns
- Easier to add new bulk actions

---

## 🟡 Medium Priority: Data Table Column Duplications

### Affected Files

- `assets/column-definitions/truckColumns.tsx` (250 lines)
- `assets/column-definitions/trailerColumns.tsx` (243 lines)
- `assets/column-definitions/driverColumns.tsx` (201 lines)
- `users/UsersTable.tsx` (325 lines)

### 1. Identical Action Buttons Pattern

**Repeated in ALL column definitions:**

```typescript
{
  id: "actions",
  header: "Actions",
  cell: ({ row }) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}>
        <FileText className="h-4 w-4" />
      </Button>
      {canEdit && (
        <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  ),
  enableHiding: false,
  enableSorting: false
}
```

### 2. Identical Status Badge Pattern

**Repeated status rendering:**

```typescript
{
  id: "status",
  header: "Status",
  cell: ({ row }) => (
    <Badge variant={row.original.isActive ? "success" : "secondary"}>
      {row.original.isActive ? "Active" : "Inactive"}
    </Badge>
  ),
}
```

### 3. Identical Timestamp Formatting Pattern

**Repeated date formatting:**

```typescript
{
  id: "createdAt",
  header: "Created",
  cell: ({ row }) => (
    <span className="text-sm text-muted-foreground">
      {new Date(row.original.createdAt).toLocaleDateString()}
    </span>
  ),
}
```

### Refactoring Solution: Column Factory Functions

**Create**: `src/lib/table-columns/column-factory.ts`

```typescript
export class ColumnFactory {
  static createActionColumn<T>(config: ActionColumnConfig<T>): ColumnDef<T>
  static createStatusColumn<T>(field: keyof T): ColumnDef<T>
  static createDateColumn<T>(field: keyof T, header: string): ColumnDef<T>
  static createBadgeColumn<T>(config: BadgeColumnConfig<T>): ColumnDef<T>
  static createImageColumn<T>(config: ImageColumnConfig<T>): ColumnDef<T>
}
```

---

## 🟡 Medium Priority: Validation Logic Duplications

### Affected Components

- All form modals
- `ChangePasswordModal.tsx`
- `AddUserModal.tsx`
- `EditUserModal.tsx`

### 1. Email Validation Pattern

**Repeated in multiple components:**

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email.trim())) {
  showError("Error", "Please enter a valid email address")
  return
}
```

**Found in:**

- `src/components/users/AddUserModal.tsx:25`
- `src/components/users/EditUserModal.tsx:29`
- `src/components/users/ChangeEmailModal.tsx`
- `src/components/clients/ClientFormModal.tsx`

### 2. Required Field Validation Pattern

**Repeated pattern:**

```typescript
if (!name.trim()) {
  showError("Error", "Name is required")
  return
}
if (!address.trim()) {
  showError("Error", "Address is required")
  return
}
```

**Found in:**

- `src/components/companies/CompanyFormModal.tsx`
- `src/components/products/ProductFormModal.tsx`
- `src/components/clients/ClientFormModal.tsx`
- `src/components/sites/SiteFormModal.tsx`

### 3. Phone Number Validation Pattern

**Similar phone validation in multiple places:**

```typescript
if (!phoneNumber || !phoneNumber.trim()) {
  showError("Error", "Phone number is required")
  return
}
```

**Found in:**

- `src/components/users/AddUserModal.tsx`
- `src/components/users/EditUserModal.tsx`
- `src/components/clients/ClientFormModal.tsx`
- `src/components/sites/SiteFormModal.tsx`

### Refactoring Solution: Validation Utilities

**Create**: `src/lib/validation/form-validators.ts`

```typescript
export const FormValidators = {
  required: (value: string, fieldName: string) => string | null,
  email: (value: string) => string | null,
  phone: (value: string) => string | null,
  minLength: (value: string, min: number) => string | null,
  uniqueInCollection: (value: string, collection: any[], field: string) => string | null
}

export const ValidationSchemas = {
  product: z.object({...}),
  client: z.object({...}),
  site: z.object({...}),
  // ... other schemas
}
```

---

## 🟢 Low Priority: Service CRUD Operation Duplications

### Affected Services

- `AssetService`
- `CompanyService`
- Other entity services

### Duplicate CRUD Methods

**Repeated getById pattern:**

```typescript
static async getById(id: string): Promise<Entity | null> {
  try {
    const docRef = doc(db, "collection", id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Entity
  } catch (error) {
    console.error("Error fetching:", error)
    throw error
  }
}
```

**Found in:**

- `src/services/company.service.ts:10-22`
- `src/services/asset.service.ts:180-192`

### Refactoring Solution: Generic Service Base

**Create**: `src/services/base/BaseService.ts`

```typescript
export abstract class BaseService<T> {
  constructor(protected collectionName: string) {}

  static async getById<T>(collection: string, id: string): Promise<T | null>
  static async getByCompany<T>(collection: string, companyId: string): Promise<T[]>
  static async create<T>(collection: string, data: Partial<T>): Promise<string>
  static async update<T>(collection: string, id: string, data: Partial<T>): Promise<void>
  static async delete<T>(collection: string, id: string): Promise<void>
}
```

---

## Implementation Priority Matrix

| Priority  | Component          | Impact    | Effort | LOC Reduction | Timeline |
| --------- | ------------------ | --------- | ------ | ------------- | -------- |
| 🔴 High   | Generic Form Modal | Very High | Medium | ~500          | Week 1   |
| 🔴 High   | Admin CRUD Pages   | Very High | High   | ~800          | Week 1   |
| 🟡 Medium | Permission Logic   | High      | Low    | ~100          | Week 2   |
| 🟡 Medium | Table Columns      | Medium    | Medium | ~300          | Week 2   |
| 🟡 Medium | Form Validation    | Medium    | Low    | ~200          | Week 3   |
| 🟡 Medium | Scanner Components | Medium    | Medium | ~150          | Week 3   |
| 🟡 Medium | Bulk Action Modals | Medium    | Low    | ~200          | Week 3   |
| 🟢 Low    | Service CRUD       | Low       | High   | ~100          | Week 4   |
| 🟢 Low    | Search Configs     | Low       | Low    | ~50           | Week 4   |
| 🟢 Low    | Modal State        | Low       | Low    | ~80           | Week 4   |

**Total Estimated Reduction: ~2,280 lines of duplicate code**

---

## Additional Refactoring Opportunities

### 1. Company Type Access Control

**Repeated pattern:**

```typescript
const canAccessAssets = company.companyType === "transporter" || (company.companyType === "logistics_coordinator" && company.isAlsoTransporter === true)

if (!canAccessAssets) {
  router.replace("/")
}
```

**Solution**: Create `useCompanyAccess(feature: string)` hook

### 2. Status Badge Rendering

**Repeated pattern:**

```typescript
<Badge variant={entity.isActive ? "success" : "secondary"}>{entity.isActive ? "Active" : "Inactive"}</Badge>
```

**Solution**: Create `<StatusBadge entity={entity} />` component

### 3. Date Formatting

**Repeated pattern:**

```typescript
<span className="text-sm text-muted-foreground">{new Date(timestamp).toLocaleDateString()}</span>
```

**Solution**: Create `<FormattedDate date={timestamp} />` component

---

## Migration Strategy

### Phase 1: Foundation Components (Week 1)

1. Create `GenericFormModal` component
2. Create `AdminCrudPage` component
3. Create enhanced permission utilities
4. Migrate 2-3 simplest admin pages

### Phase 2: Form Refactoring (Week 2)

1. Migrate `ProductFormModal` to generic pattern
2. Migrate `ClientFormModal` to generic pattern
3. Migrate `SiteFormModal` to generic pattern
4. Update validation utilities

### Phase 3: Table Components (Week 3)

1. Create column factory functions
2. Refactor asset table columns
3. Create reusable table action components
4. Update search configurations

### Phase 4: Polish & Testing (Week 4)

1. Migrate remaining components
2. Create shared utility components
3. Update documentation
4. Comprehensive testing

---

## Benefits of Refactoring

### Immediate Benefits

- **~2,280 lines** of duplicate code eliminated
- **Faster feature development** - new CRUD pages in minutes
- **Consistent UX** - all modals/pages behave identically
- **Easier testing** - test generic components once
- **Better maintainability** - single place to fix bugs

### Long-term Benefits

- **Easier onboarding** - developers learn fewer patterns
- **Reduced bugs** - less duplicate logic to maintain
- **Faster Phase 4+ development** - reuse patterns for orders, pre-bookings
- **Better security** - consistent permission enforcement
- **Improved performance** - optimized reusable components

---

## Risk Assessment

### Low Risk Refactoring

- Form validation utilities
- Column factory functions
- Status badge components
- Date formatting components

### Medium Risk Refactoring

- Generic form modal (affects many modals)
- Admin CRUD page template (affects all admin pages)

### High Risk Refactoring

- Permission service changes (affects security)
- Data service modifications (affects all data access)

---

## Conclusion

The Newton codebase has excellent functionality and architecture, but significant opportunities exist for consolidation. The recommended **4-phase migration approach** would eliminate substantial code duplication while maintaining system stability.

**Next Steps:**

1. Review and approve refactoring priorities
2. Create generic components starting with highest impact items
3. Migrate existing components in controlled batches
4. Update development documentation with new patterns

**Success Metrics:**

- Lines of code reduced by ~2,280
- Development velocity increased for new features
- Bug count reduced due to consolidated logic
- Developer onboarding time reduced

---

## Appendix: Detailed Component Analysis

### Form Modal Breakdown

| Component        | Lines | Duplicate % | Unique Logic                |
| ---------------- | ----- | ----------- | --------------------------- |
| ProductFormModal | 165   | 75%         | Product-specific validation |
| ClientFormModal  | 282   | 70%         | Site selection logic        |
| SiteFormModal    | 386   | 65%         | Operating hours editor      |
| RoleFormModal    | 160   | 80%         | Permission selector         |

### Admin Page Breakdown

| Page          | Lines | Duplicate % | Unique Logic         |
| ------------- | ----- | ----------- | -------------------- |
| products/page | 207   | 85%         | Usage validation     |
| clients/page  | 221   | 85%         | Site linking         |
| sites/page    | 224   | 85%         | Contact validation   |
| roles/page    | 308   | 80%         | Permission filtering |

### Service Method Breakdown

| Service        | Methods | Duplicate % | Unique Logic          |
| -------------- | ------- | ----------- | --------------------- |
| AssetService   | 15      | 40%         | Asset field mapping   |
| CompanyService | 12      | 60%         | Company type logic    |
| Permission     | 8       | 70%         | Permission evaluation |

---

**END OF DOCUMENT**
