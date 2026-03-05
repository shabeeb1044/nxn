\"use client\"

import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, CreditCard, ShieldCheck } from "lucide-react"
import { FormEvent, useState } from "react"

const PLAN_LABELS: Record<string, { title: string; subtitle: string }> = {
  starter: {
    title: "Starter (Free)",
    subtitle: "No payment required. Finish setup to start posting up to 3 jobs.",
  },
  pro: {
    title: "Pro Plan",
    subtitle: "Ideal for growing teams that hire frequently.",
  },
  team: {
    title: "Team Plan",
    subtitle: "Best for larger HR teams managing multiple recruiters.",
  },
}

export default function CompanyCheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const plan = searchParams.get("plan") || "starter"
  const planMeta = PLAN_LABELS[plan] ?? PLAN_LABELS.starter

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Dummy delay to simulate processing
    setTimeout(() => {
      setLoading(false)
      // In real integration, you would call your payment API here.
      router.push("/company/dashboard")
    }, 900)
  }

  const isFreePlan = plan === "starter"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-10">
        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-[2fr,1.4fr]">
          {/* Checkout card */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  3
                </span>
                <span>Step 3 of 4 · Payment</span>
              </div>
              <CardTitle className="text-xl">Complete your plan setup</CardTitle>
              <CardDescription>{planMeta.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                {isFreePlan ? (
                  <div className="rounded-lg border border-dashed border-emerald-400/60 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                      <Check className="h-4 w-4" />
                      No payment required for Starter
                    </div>
                    You&apos;re on the free plan. Click &ldquo;Finish Setup&rdquo; to go straight to your
                    company dashboard and start posting jobs.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card number</Label>
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          placeholder="4242 4242 4242 4242"
                          className="pr-10"
                          disabled={loading}
                        />
                        <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry</Label>
                        <Input id="expiry" placeholder="MM / YY" disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on card</Label>
                        <Input id="cardName" placeholder="Company card name" disabled={loading} />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="mt-2 w-full justify-center"
                  disabled={loading}
                >
                  {loading ? "Processing..." : isFreePlan ? "Finish Setup" : "Confirm & Pay (Demo)"}
                </Button>

                <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Payments are in demo mode. No real charges will be applied.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Order summary */}
          <Card className="h-fit border-border bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plan summary</CardTitle>
              <CardDescription className="text-xs">
                You can change or cancel your plan anytime from billing settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{planMeta.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Billed monthly. No long-term contracts.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {plan === "starter" ? "$0" : plan === "pro" ? "$8" : "$12"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">per month</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/70 p-3">
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    Cancel anytime, keep your data.
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    Full access to company dashboard.
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    Priority support for paid plans.
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-muted-foreground">
                This is a demo checkout page. Replace this with your real payment gateway (Stripe,
                Razorpay, etc.) when you are ready for production.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

