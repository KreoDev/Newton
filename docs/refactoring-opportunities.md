# Newton Codebase Refactoring Opportunities

## Document Purpose

This document identifies duplicate code patterns and reusable components in the Newton weighbridge system codebase. It provides a prioritized list of refactoring opportunities to improve maintainability, reduce code duplication, and create consistent patterns across the application.

**Analysis Date**: January 22, 2025  
**Codebase Version**: Phase 1, 2, and 3 Complete  
**Total Files Analyzed**: 150+ components and services

---

## Executive Summary

The Newton codebase has grown significantly with **Phases 1-3 fully implemented**. While the architecture is solid, there are substantial opportunities for refactoring to reduce the **estimated 40-60% code duplication** across similar components. The highest impact opportunities involve form modals, admin CRUD pages, and permission checking logic.

### Quick Wins (High Impact, Low Risk)

1. **Form Modal Component** - Could reduce ~500 lines of duplicate code
2. **Admin CRUD Page Template** - Could reduce ~800 lines of duplicate code
3. **Permission Logic Consolidation** - Improve security consistency
4. **Table Column Factory** - Reduce column definition duplication

---

## 🔴 High Priority: Form Modal Patterns

### Affected Components

- `ProductFormModal.tsx` (165 lines)
- `ClientFormModal.tsx` (282 lines)
- `SiteFormModal.tsx` (386 lines)
- `RoleFormModal.tsx` (160 lines)
- `CompanyFormModal.tsx` (1307 lines - complex, handle separately)

### Duplicate Patterns Identified

#### 1. **Identical Props Interface**

```typescript
// Repeated in ALL form modals
interface EntityFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  entity?: Entity // For editing existing
  viewOnly?: boolean // For read-only viewing
}
```

#### 2. **Identical Modal Structure**

```typescript
// Repeated Dialog setup in ALL modals
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] w-auto h-auto">
    <DialogHeader>
      <DialogTitle>{viewOnly ? "View" : isEditing ? "Edit" : "Create New"} {EntityName}</DialogTitle>
      <DialogDescription>
        {viewOnly ? "View information" : isEditing ? "Update information" : "Add a new entity"}
      </DialogDescription>
    </DialogHeader>
```

#### 3. **Identical Form Lifecycle**

```typescript
// SAME pattern in ALL modals
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

#### 4. **Identical Error Handling**

```typescript
// SAME pattern in ALL modals
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

### Recommended Solution: Generic FormModal Component

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

## 🔴 High Priority: Admin CRUD Page Patterns

### Affected Pages

- `admin/products/page.tsx` (207 lines)
- `admin/clients/page.tsx` (221 lines)
- `admin/sites/page.tsx` (224 lines)
- `admin/roles/page.tsx` (308 lines)
- `admin/companies/page.tsx` (267 lines)

### Duplicate Patterns Identified

#### 1. **Identical Permission Setup**

```typescript
// Repeated in ALL admin pages
const { canView, canManage, isViewOnly, loading: permissionLoading } = useViewPermission(PERMISSIONS.MODULE_VIEW, PERMISSIONS.MODULE)
const { showSuccess, showError, showConfirm } = useAlert()
```

#### 2. **Identical State Management**

```typescript
// SAME pattern in ALL pages
const [showCreateModal, setShowCreateModal] = useState(false)
const [editingEntity, setEditingEntity] = useState<Entity | undefined>(undefined)
const [filterStatus, setFilterStatus] = useState<string>("all")
```

#### 3. **Identical Data Access**

```typescript
// SAME pattern in ALL pages
useSignals()
const entities = globalData.entities.value
const loading = globalData.loading.value
const { searchTerm, setSearchTerm, filteredItems, isSearching } = useOptimizedSearch(entities, SEARCH_CONFIGS.entities)
```

#### 4. **Identical Toggle Function**

```typescript
// SAME function in ALL pages (just different entity names)
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

#### 5. **Identical Delete Function**

```typescript
// SAME function in ALL pages
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

#### 6. **Identical Render Pattern**

```typescript
// SAME JSX structure in ALL pages
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

### Recommended Solution: Generic AdminCrudPage Component

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

## 🟡 Medium Priority: Permission Checking Logic

### Affected Components

- `AppLayout.tsx` - `hasAnyPermission()` function (27 lines)
- `admin/page.tsx` - `hasAnyPermission()` function (13 lines)
- Multiple components with permission evaluation patterns

### Duplicate Pattern

```typescript
// Repeated permission evaluation logic
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

### Recommended Solution: Enhanced Permission Service

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

## 🟡 Medium Priority: Data Table Column Patterns

### Affected Files

- `assets/column-definitions/truckColumns.tsx` (250 lines)
- `assets/column-definitions/trailerColumns.tsx` (243 lines)
- `assets/column-definitions/driverColumns.tsx` (201 lines)
- `users/UsersTable.tsx` (325 lines)

### Duplicate Patterns

#### 1. **Action Buttons Pattern**

```typescript
// Repeated in ALL column definitions
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
  enableSorting: false,
}
```

#### 2. **Status Badge Pattern**

```typescript
// Repeated status rendering
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

#### 3. **Timestamp Formatting Pattern**

```typescript
// Repeated date formatting
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

### Recommended Solution: Column Factory Functions

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

## 🟡 Medium Priority: Form Validation Patterns

### Affected Components

- All form modals
- `ChangePasswordModal.tsx`
- `AddUserModal.tsx`
- `EditUserModal.tsx`

### Duplicate Validation Logic

#### 1. **Email Validation**

```typescript
// Repeated in multiple components
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email.trim())) {
  showError("Error", "Please enter a valid email address")
  return
}
```

#### 2. **Required Field Validation**

```typescript
// Repeated pattern
if (!name.trim()) {
  showError("Error", "Name is required")
  return
}
if (!address.trim()) {
  showError("Error", "Address is required")
  return
}
```

#### 3. **Phone Number Validation**

```typescript
// Similar phone validation in multiple places
if (!phoneNumber || !phoneNumber.trim()) {
  showError("Error", "Phone number is required")
  return
}
```

### Recommended Solution: Validation Utilities

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

## 🟡 Medium Priority: Scanner Component Patterns

### Affected Components

- `assets/shared/QRCodeScanner.tsx` (251 lines)
- `assets/shared/BarcodeScanner.tsx` (321 lines)

### Duplicate Patterns

#### 1. **Input Handling with Auto-Focus**

```typescript
// Repeated in both scanners
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

#### 2. **Visual State Management**

```typescript
// Repeated visual state logic
const getVisualState = () => {
  if (error) return "error"
  if (isProcessing) return "processing"
  if (parsedData) return "success"
  return "waiting"
}
```

#### 3. **Clear/Reset Functionality**

```typescript
// Repeated clear pattern
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

### Recommended Solution: Base Scanner Component

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

---

## 🟡 Medium Priority: Loading State Patterns

### Affected Components

- All admin pages
- All modals
- All service operations

### Duplicate Pattern

```typescript
// Repeated loading pattern
const [loading, setLoading] = useState(false)

const handleOperation = async () => {
  try {
    setLoading(true)
    // Operation
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false)
  }
}
```

### Recommended Solution: Loading Hook

**Create**: `src/hooks/useAsyncOperation.ts`

```typescript
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async <T>(
    operation: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | null>

  return { loading, error, execute, reset: () => setError(null) }
}
```

---

## 🟢 Low Priority: Service CRUD Operations

### Affected Services

- `AssetService`
- `CompanyService`
- Other entity services

### Duplicate CRUD Methods

```typescript
// Repeated getById pattern
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

### Recommended Solution: Generic Service Base

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

## 🟢 Low Priority: Search Configuration Patterns

### Affected Files

- `config/search-configs.ts` - Similar search field configurations

### Duplicate Pattern

```typescript
// Similar search configurations
export const SEARCH_CONFIGS = {
  products: {
    fields: [
      { path: "name", weight: 3 },
      { path: "code", weight: 2 },
      { path: "specifications", weight: 1 },
    ],
  },
  clients: {
    fields: [
      { path: "name", weight: 3 },
      { path: "contactName", weight: 2 },
      { path: "contactEmail", weight: 1 },
    ],
  },
  // ... similar patterns
}
```

### Recommended Solution: Search Config Factory

**Create**: `src/lib/search/search-config-factory.ts`

```typescript
export class SearchConfigFactory {
  static createBasicConfig(primaryFields: string[], secondaryFields?: string[]): SearchConfig
  static createContactConfig(nameFields: string[], contactFields: string[]): SearchConfig
  static createAssetConfig(identifierFields: string[], infoFields: string[]): SearchConfig
}
```

---

## 🟢 Low Priority: Modal State Management

### Affected Components

- All admin pages with create/edit modals

### Duplicate Pattern

```typescript
// Repeated modal state
const [showCreateModal, setShowCreateModal] = useState(false)
const [editingEntity, setEditingEntity] = useState<Entity | undefined>(undefined)

// Repeated modal handlers
const handleCreate = () => setShowCreateModal(true)
const handleEdit = (entity: Entity) => setEditingEntity(entity)
const handleCloseCreate = () => setShowCreateModal(false)
const handleCloseEdit = () => setEditingEntity(undefined)
```

### Recommended Solution: Modal State Hook

**Create**: `src/hooks/useModalState.ts`

```typescript
export function useModalState<T>() {
  return {
    createModal: { open: boolean, show: () => void, hide: () => void },
    editModal: { open: boolean, entity: T | null, show: (entity: T) => void, hide: () => void },
    viewModal: { open: boolean, entity: T | null, show: (entity: T) => void, hide: () => void }
  }
}
```

---

## Implementation Priority Matrix

| Priority  | Component          | Impact    | Effort | LOC Reduction |
| --------- | ------------------ | --------- | ------ | ------------- |
| 🔴 High   | Generic Form Modal | Very High | Medium | ~500          |
| 🔴 High   | Admin CRUD Pages   | Very High | High   | ~800          |
| 🟡 Medium | Permission Logic   | High      | Low    | ~100          |
| 🟡 Medium | Table Columns      | Medium    | Medium | ~300          |
| 🟡 Medium | Form Validation    | Medium    | Low    | ~200          |
| 🟡 Medium | Scanner Components | Medium    | Medium | ~150          |
| 🟢 Low    | Service CRUD       | Low       | High   | ~100          |
| 🟢 Low    | Search Configs     | Low       | Low    | ~50           |
| 🟢 Low    | Modal State        | Low       | Low    | ~80           |

**Total Estimated Reduction: ~2,280 lines of duplicate code**

---

## Additional Opportunities

### 1. **Company Type Access Control**

```typescript
// Repeated in multiple components
const canAccessAssets = company.companyType === "transporter" || (company.companyType === "logistics_coordinator" && company.isAlsoTransporter === true)

if (!canAccessAssets) {
  router.replace("/")
}
```

**Solution**: Create `useCompanyAccess(feature: string)` hook

### 2. **Alert/Toast Usage Patterns**

- Consistent success/error message formatting
- Standard confirmation dialog patterns
- Uniform alert timing and positioning

**Solution**: Create message template system in `useAlert` hook

### 3. **Status Badge Rendering**

```typescript
// Repeated status badge logic
<Badge variant={entity.isActive ? "success" : "secondary"}>{entity.isActive ? "Active" : "Inactive"}</Badge>
```

**Solution**: Create `<StatusBadge entity={entity} />` component

### 4. **Date Formatting**

```typescript
// Repeated date display
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
