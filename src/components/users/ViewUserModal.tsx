"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@/types"

interface ViewUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  rolesMap: Record<string, string>
}

export function ViewUserModal({ user, isOpen, onClose, rolesMap }: ViewUserModalProps) {
  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/blank-avatar.jpg" alt="User Avatar" />
              <AvatarFallback className="text-2xl">{((user.firstName || user.email || "U").charAt(0) + (user.lastName || "").charAt(0)).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium">Role</h4>
            <div>
              <Badge variant={rolesMap[user.roleId] === "Admin" ? "neutral" : "info"}>{rolesMap[user.roleId] || "N/A"}</Badge>
            </div>
          </div>
          <div>
            <h4 className="font-medium">Joined</h4>
            <p>{new Date(user.createdDate || 0).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="font-medium">Last Updated</h4>
            <p>{new Date(user.modifiedDate || 0).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
