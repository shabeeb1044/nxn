"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, ArrowRight, Loader2, Upload, Check, FileText, X } from "lucide-react"

const industries = [
  "Construction", "Healthcare", "Hospitality", "IT & Technology",
  "Manufacturing", "Retail", "Finance & Banking", "Education",
  "Transportation & Logistics", "Oil & Gas", "Real Estate", "Other"
]

const companySizes = [
  "1-10 employees", "11-50 employees", "51-200 employees",
  "201-500 employees", "501-1000 employees", "1000+ employees"
]

const countries = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait",
  "Bahrain", "Oman", "Jordan", "Egypt", "India", "Pakistan", "Other"
]

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    companyName: "",
    tradeLicense: "",
    industry: "",
    companySize: "",
    website: "",
    country: "",
    city: "",
    address: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactPosition: "",
    password: "",
    confirmPassword: "",
    logoFile: null as File | null,
    companyProofFile: null as File | null,
    acceptTerms: false,
  })
  const [error, setError] = useState("")
  const [uploadingProof, setUploadingProof] = useState(false)

  const updateForm = (field: string, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const uploadCompanyProof = async (): Promise<string | null> => {
    if (!formData.companyProofFile) return null
    setUploadingProof(true)
    try {
      const fd = new FormData()
      fd.append("file", formData.companyProofFile)
      fd.append("type", "proof")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      return data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Document upload failed")
      return null
    } finally {
      setUploadingProof(false)
    }
  }

  const handleSubmit = async () => {
    setError("")
    if (!formData.companyProofFile) {
      setError("Please upload a proof document (PDF/DOC/DOCX)")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password do not match")
      return
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    try {
      const proofDocumentUrl = await uploadCompanyProof()
      if (!proofDocumentUrl) {
        setLoading(false)
        return
      }
      const response = await fetch("/api/register/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          tradeLicense: formData.tradeLicense,
          industry: formData.industry,
          companySize: formData.companySize,
          website: formData.website || undefined,
          country: formData.country,
          city: formData.city,
          address: formData.address || undefined,
          description: formData.description || undefined,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          contactPosition: formData.contactPosition,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          proofDocumentUrl,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Registration failed")
        setLoading(false)
        return
      }
      router.push("/login/company?status=registered")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Register Your Company</CardTitle>
              <CardDescription>
                {step === 1 ? "Company Information" : "Contact Details"}
              </CardDescription>
              {/* Step Indicator */}
              <div className="mt-4 flex justify-center gap-2">
                <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 ? (
                <>
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={(e) => updateForm("companyName", e.target.value)}
                    />
                  </div>

                  {/* Trade License */}
                  <div className="space-y-2">
                    <Label htmlFor="tradeLicense">Trade License Number *</Label>
                    <Input
                      id="tradeLicense"
                      placeholder="Enter trade license number"
                      value={formData.tradeLicense}
                      onChange={(e) => updateForm("tradeLicense", e.target.value)}
                    />
                  </div>

                  {/* Company Proof (document upload) */}
                  <div className="space-y-2">
                    <Label>Company Proof Document *</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload trade license or company registration document (PDF, DOC, DOCX, max 10MB)
                    </p>
                    <div className="flex items-center gap-4">
                      <label className="flex h-20 min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted px-4 hover:border-primary">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const valid = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
                            if (!valid.includes(file.type)) {
                              setError("Only PDF, DOC, or DOCX files are allowed")
                              return
                            }
                            if (file.size > 10 * 1024 * 1024) {
                              setError("File size must be under 10 MB")
                              return
                            }
                            setError("")
                            updateForm("companyProofFile", file)
                          }}
                        />
                        {formData.companyProofFile ? (
                          <>
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="truncate text-sm font-medium max-w-[100px]">{formData.companyProofFile.name}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateForm("companyProofFile", null) }}
                              className="rounded p-1 hover:bg-muted-foreground/20"
                              aria-label="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <FileText className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Upload document</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Industry & Size */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Industry *</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => updateForm("industry", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind.toLowerCase()}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Size *</Label>
                      <Select
                        value={formData.companySize}
                        onValueChange={(value) => updateForm("companySize", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size.toLowerCase()}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Country & City */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Country *</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => updateForm("country", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country.toLowerCase()}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Enter city"
                        value={formData.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      placeholder="https://www.company.com"
                      value={formData.website}
                      onChange={(e) => updateForm("website", e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your company..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Company Logo (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted hover:border-primary">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => updateForm("logoFile", e.target.files?.[0] || null)}
                        />
                        {formData.logoFile ? (
                          <Check className="h-6 w-6 text-success" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                      </label>
                      <div className="text-sm text-muted-foreground">
                        {formData.logoFile ? formData.logoFile.name : "PNG, JPG up to 2MB"}
                      </div>
                    </div>
                  </div>

                  <Button className="w-full gap-2" onClick={() => setStep(2)}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  {/* Contact Name */}
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Person Name *</Label>
                    <Input
                      id="contactName"
                      placeholder="Full name"
                      value={formData.contactName}
                      onChange={(e) => updateForm("contactName", e.target.value)}
                    />
                  </div>

                  {/* Contact Position */}
                  <div className="space-y-2">
                    <Label htmlFor="contactPosition">Position/Title *</Label>
                    <Input
                      id="contactPosition"
                      placeholder="e.g., HR Manager"
                      value={formData.contactPosition}
                      onChange={(e) => updateForm("contactPosition", e.target.value)}
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email Address *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contact@company.com"
                      value={formData.contactEmail}
                      onChange={(e) => updateForm("contactEmail", e.target.value)}
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone / WhatsApp *</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={formData.contactPhone}
                      onChange={(e) => updateForm("contactPhone", e.target.value)}
                    />
                  </div>

                  {/* Password - used for login */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateForm("confirmPassword", e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Terms */}
                  <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => updateForm("acceptTerms", checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                      I agree to the{" "}
                      <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                      {" "}and{" "}
                      <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                      I confirm that I am authorized to register this company.
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleSubmit}
                      disabled={loading || uploadingProof || !formData.acceptTerms}
                    >
                      {loading || uploadingProof ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Register Company
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/login/company" className="font-medium text-primary hover:underline">
                  Login
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
