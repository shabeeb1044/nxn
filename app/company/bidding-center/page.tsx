"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gavel } from "lucide-react"
import Link from "next/link"

export default function BiddingCenterPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Gavel className="h-6 w-6" />
            Bidding Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Bidding-related features are <span className="font-semibold">coming soon</span>.
            You&apos;ll be able to manage candidate bids here.
          </p>
          <Button asChild variant="outline">
            <Link href="/company/demands">Back to My Demands</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}