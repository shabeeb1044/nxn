"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function ShortlistedPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <FileText className="h-6 w-6" />
            Shortlisted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Shortlisted candidates and comparison tools are{" "}
            <span className="font-semibold">coming soon</span>.
            You&apos;ll be able to review and manage shortlisted profiles here.
          </p>
          <Button asChild variant="outline">
            <Link href="/company/demands">Back to My Demands</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

