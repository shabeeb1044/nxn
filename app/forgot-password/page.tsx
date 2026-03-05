"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react"

function ForgotPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "agency" // agency | company | candidate | admin
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loginHref =
    type === "company"
      ? "/login/company"
      : type === "candidate"
        ? "/login/candidate"
        : type === "admin"
          ? "/admin/login"
          : "/login/agency"

  const title =
    type === "company"
      ? "Company"
      : type === "candidate"
        ? "Candidate"
        : type === "admin"
          ? "Admin"
          : "Agency"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your email for a link to reset your password."
                : `Enter the email address you used for your ${title} account.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={
                      type === "company"
                        ? "contact@company.com"
                        : type === "candidate"
                          ? "your@email.com"
                          : type === "admin"
                            ? "admin@example.com"
                            : "agency@example.com"
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  We’ve sent a password reset link to your email. The link expires in 1 hour.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm">
              <Link href={loginHref} className="inline-flex items-center gap-1 text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to {title} login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

export default function ForgotPasswordPage() {
  // `useSearchParams()` requires a Suspense boundary in Next.js prerendering.
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  )
}
