import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    id: "starter",
    name: "Starter",
    badge: "Free Plan",
    price: "Free",
    subtitle: "Perfect to try the platform with limited jobs.",
    cta: "Start for Free",
    href: "/register/company?plan=starter",
    popular: false,
    features: [
      "Post up to 3 jobs",
      "Basic candidate shortlist",
      "Email support",
      "Access company dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    badge: "$8.00 / Month",
    price: "$8",
    priceSuffix: "/Month",
    subtitle: "For growing teams that hire regularly.",
    cta: "Go Pro Plan",
    href: "/register/company?plan=pro",
    popular: true,
    features: [
      "Unlimited job posts",
      "Priority candidate suggestions",
      "Advanced bidding analytics",
      "Email & chat support",
    ],
  },
  {
    id: "team",
    name: "Team Plan",
    badge: "$12.00 / Month",
    price: "$12",
    priceSuffix: "/Month",
    subtitle: "Best for larger hiring teams and HR orgs.",
    cta: "Get Started",
    href: "/register/company?plan=team",
    popular: false,
    features: [
      "Everything in Pro",
      "Multiple recruiter seats",
      "Centralized team billing",
      "Advanced analytics & reports",
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            {/* Step pill */}
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  1
                </span>
                Step 1 of 4 · Choose your plan
              </span>
            </div>

            {/* Heading */}
            <div className="mb-10 text-center md:mb-14">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
                Our Pricing
              </p>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Get started for free
              </h1>
              <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground md:text-base">
                Pick the plan that matches your hiring needs today. You can start on the free plan
                and upgrade later as your team grows.
              </p>
            </div>

            {/* Plans grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg md:p-7 ${
                    plan.popular ? "border-primary shadow-md" : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-background shadow-sm">
                      Most popular
                    </div>
                  )}

                  <div className="mb-6 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {plan.name}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {plan.id === "starter" ? plan.badge : "Unlock more hiring power."}
                    </p>
                    <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.priceSuffix && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {plan.priceSuffix}
                      </span>
                    )}
                  </div>

                  <Button
                    asChild
                    className={`mb-6 w-full justify-center rounded-full text-sm font-semibold ${
                      plan.popular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
                      {plan.id === "starter" ? "Get started with" : "Everything in Starter plus"}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-[3px] flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-3 w-3 text-primary" />
                          </span>
                          <span className="text-xs text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Helper text */}
            <p className="mt-8 text-center text-xs text-muted-foreground">
              No credit card required for the Starter plan. You can upgrade to Pro or Team anytime
              from your company dashboard.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

