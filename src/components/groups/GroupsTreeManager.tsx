"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ChevronRight, ChevronDown, Edit, Trash2, Save, X, Network } from "lucide-react"
import type { Group } from "@/types"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createDocument } from "@/lib/firebase-utils"
import { useAlert } from "@/hooks/useAlert"
import { cn } from "@/lib/utils"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

interface GroupsTreeManagerProps {
  companyId: string
}

interface TreeNode extends Group {
  children: TreeNode[]
  expanded?: boolean
}

export function GroupsTreeManager({ companyId }: GroupsTreeManagerProps) {
  useSignals() // Required for reactivity
  const { showSuccess, showError, showConfirm } = useAlert()
  const [treeData, setTreeData] = useState<TreeNode[]>([])

  // Form state for adding/editing
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [addingParentId, setAddingParentId] = useState<string | null | undefined>(undefined) // undefined = not adding, null = adding root
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")

  // Get groups from centralized data service
  const groups = globalData.groups.value
  const loading = globalData.loading.value

  // Build tree structure from flat groups array
  useEffect(() => {
    const buildTree = (parentId: string | null | undefined): TreeNode[] => {
      return groups
        .filter(g => (parentId ? g.parentGroupId === parentId : !g.parentGroupId))
        .map(group => ({
          ...group,
          children: buildTree(group.id),
          expanded: false,
        }))
    }

    setTreeData(buildTree(null))
  }, [groups])

  const toggleExpand = (groupId: string) => {
    const updateExpanded = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === groupId) {
          return { ...node, expanded: !node.expanded }
        }
        return { ...node, children: updateExpanded(node.children) }
      })
    }
    setTreeData(updateExpanded(treeData))
  }

  const startAddSubgroup = (parentId: string | null) => {
    setAddingParentId(parentId)
    setEditingGroupId(null)
    setFormName("")
    setFormDescription("")
  }

  const startEdit = (group: Group) => {
    setEditingGroupId(group.id)
    setAddingParentId(null)
    setFormName(group.name)
    setFormDescription(group.description || "")
  }

  const cancelForm = () => {
    setEditingGroupId(null)
    setAddingParentId(undefined) // Reset to not adding anything
    setFormName("")
    setFormDescription("")
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      showError("Error", "Please enter a group name")
      return
    }

    try {
      if (editingGroupId) {
        // Update existing group
        await updateDoc(doc(db, "groups", editingGroupId), {
          name: formName.trim(),
          description: formDescription.trim() || null,
          updatedAt: Date.now(),
        })
        showSuccess("Group Updated", `Group "${formName.trim()}" has been updated successfully.`)
      } else {
        // Create new group
        const parentGroup = addingParentId ? groups.find(g => g.id === addingParentId) : null
        const level = parentGroup ? parentGroup.level + 1 : 0
        const path = parentGroup ? [...parentGroup.path, parentGroup.id] : []

        const groupData: any = {
          name: formName.trim(),
          level,
          path,
          isActive: true,
          companyId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          dbCreatedAt: null as any, // Will be set by createDocument
          dbUpdatedAt: null as any,
        }

        // Only add optional fields if they have values
        if (formDescription.trim()) {
          groupData.description = formDescription.trim()
        }
        if (addingParentId) {
          groupData.parentGroupId = addingParentId
        }

        await createDocument("groups", groupData, `Group "${formName.trim()}" has been created successfully.`)
      }

      cancelForm()
    } catch (error) {
      console.error("Error saving group:", error)
      showError("Failed to Save Group", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const handleDelete = async (group: Group) => {
    // Check if group has subgroups
    const hasChildren = groups.some(g => g.parentGroupId === group.id)

    if (hasChildren) {
      const childCount = groups.filter(g => g.parentGroupId === group.id).length
      showError("Cannot Delete Group", `This group has ${childCount} subgroup(s). Please delete or reassign the subgroups first.`)
      return
    }

    // Check if group is assigned to any sites - MUST filter by the company being edited
    const allSites = globalData.sites.value
    const companySites = allSites.filter(s => s.companyId === companyId)
    const sitesUsingGroup = companySites.filter(s => s.groupId === group.id)

    if (sitesUsingGroup.length > 0) {
      const siteNames = sitesUsingGroup.map(s => s.name).join(", ")
      showError("Cannot Delete Group", `This group is assigned to ${sitesUsingGroup.length} site(s): ${siteNames}. Please reassign or remove these sites first.`)
      return
    }

    showConfirm(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteDoc(doc(db, "groups", group.id))
          showSuccess("Group Deleted", `Group "${group.name}" has been permanently removed.`)
        } catch (error) {
          console.error("Error deleting group:", error)
          showError("Failed to Delete Group", error instanceof Error ? error.message : "An unexpected error occurred.")
        }
      },
      undefined,
      "Delete",
      "Cancel"
    )
  }

  const renderTree = (nodes: TreeNode[], level: number = 0): React.ReactNode => {
    return nodes.map(node => {
      const hasChildren = node.children.length > 0
      const isExpanded = node.expanded
      const isEditing = editingGroupId === node.id

      return (
        <div key={node.id} style={{ marginLeft: `${level * 24}px` }}>
          <div className={cn("flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 group", isEditing && "bg-accent")}>
            {/* Expand/Collapse button */}
            {hasChildren ? (
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleExpand(node.id)}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="h-6 w-6" />
            )}

            {/* Group name and description */}
            <div className="flex-1">
              <div className="font-medium">{node.name}</div>
              {node.description && <div className="text-sm text-muted-foreground">{node.description}</div>}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button type="button" variant="ghost" size="sm" onClick={() => startAddSubgroup(node.id)} title="Add subgroup">
                <Plus className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(node)} title="Edit group">
                <Edit className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(node)} title="Delete group">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {/* Inline edit form */}
          {isEditing && (
            <div className="ml-6 my-2 p-3 border rounded-md bg-card space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name</Label>
                <Input id="edit-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Enter group name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea id="edit-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Enter description" rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={cancelForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Add subgroup form */}
          {addingParentId === node.id && (
            <div className="ml-6 my-2 p-3 border rounded-md bg-card space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-name">Subgroup Name</Label>
                <Input id="new-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Enter subgroup name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-description">Description (Optional)</Label>
                <Textarea id="new-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Enter description" rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSave}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subgroup
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={cancelForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Render children if expanded */}
          {isExpanded && hasChildren && renderTree(node.children, level + 1)}
        </div>
      )
    })
  }

  const renderHierarchyDiagram = (nodes: TreeNode[], ancestorIsLast: boolean[] = []): React.ReactNode => {
    if (nodes.length === 0) return null

    return nodes.map((node, index) => {
      const isLast = index === nodes.length - 1
      const hasChildren = node.children && node.children.length > 0

      let prefix = ""
      ancestorIsLast.forEach(isAncestorLast => {
        prefix += isAncestorLast ? "   " : "│  "
      })

      const connector = ancestorIsLast.length === 0 ? "" : isLast ? "└─ " : "├─ "

      return (
        <div key={node.id}>
          <div className="font-mono text-sm">
            <span className="text-muted-foreground whitespace-pre">
              {prefix}
              {connector}
            </span>
            <span className="text-foreground font-medium">{node.name}</span>
            {node.description && <span className="text-muted-foreground/70 text-xs ml-2">({node.description})</span>}
          </div>
          {hasChildren && renderHierarchyDiagram(node.children, [...ancestorIsLast, isLast])}
        </div>
      )
    })
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading groups...</div>
  }

  return (
    <div className="space-y-4">
      {/* Add root group button */}
      {addingParentId === undefined && !editingGroupId && (
        <Button type="button" onClick={() => startAddSubgroup(null)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Main Group
        </Button>
      )}

      {/* Add root group form */}
      {addingParentId === null && !editingGroupId && (
        <div className="p-3 border rounded-md bg-card space-y-3">
          <div className="space-y-2">
            <Label htmlFor="root-name">Group Name</Label>
            <Input id="root-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Enter group name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="root-description">Description (Optional)</Label>
            <Textarea id="root-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Enter description" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={cancelForm}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Hierarchy Diagram */}
      {treeData.length > 0 && (
        <div className="border rounded-md p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Network className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Group Hierarchy</h4>
          </div>
          <div className="bg-background rounded-md p-3 space-y-1">{renderHierarchyDiagram(treeData)}</div>
        </div>
      )}

      {/* Tree view */}
      {treeData.length === 0 ? <div className="text-center py-8 text-muted-foreground">No groups created yet. Click &quot;Add Main Group&quot; to get started.</div> : <div className="border rounded-md p-2">{renderTree(treeData)}</div>}
    </div>
  )
}
