"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { InductionWizard } from "@/components/assets/InductionWizard"

export default function AssetInductPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Induction</h1>
          <p className="text-muted-foreground">Induct a new truck, trailer, or driver</p>
        </div>
      </div>

      {/* Induction Wizard */}
      <InductionWizard />
    </div>
  )
}
