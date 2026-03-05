"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Briefcase,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Link2,
} from "lucide-react"
import { PersonalInfoStep } from "./steps/personal-info-step"
import { JobProfileStep } from "./steps/job-profile-step"

const steps = [
  { id: 1, name: "Personal Information", icon: User },
  { id: 2, name: "Job & Profile", icon: Briefcase },
]

export type CandidateFormData = {
  // Personal Info (Step 1)
  fullName: string
  // Optional split fields used by other step components
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  whatsapp: string
  // Alias used by some step components
  phone: string
  gender: string
  nationality: string
  dateOfBirth: string
  currentLocation: string
  preferredLocations: string[]
  maritalStatus: string
  languages: string[]
  // Job & Profile (Step 2)
  jobCategories: string[]
  totalExperience: string
  noticePeriod: string
  currentJobTitle: string
  currentCompany: string
  currentSalary: string
  expectedSalary: string
  industries: string[]
  jobTypes: string[]
  qualification: string
  highestEducation: string
  fieldOfStudy: string
  skills: string[]
  certifications: string[]
  cvFile: File | null
  videoFile: File | null
  photoFile: File | null
  passportFile: File | null
  salaryRange: { min: number; max: number } | null
  visaCategory: string
  acceptTerms: boolean
  acceptServiceCharge: boolean
}

const initialFormData: CandidateFormData = {
  fullName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  whatsapp: "",
  phone: "",
  gender: "",
  nationality: "",
  dateOfBirth: "",
  currentLocation: "",
  preferredLocations: [],
  maritalStatus: "",
  languages: [],
  jobCategories: [],
  totalExperience: "",
  noticePeriod: "",
  currentJobTitle: "",
  currentCompany: "",
  currentSalary: "",
  expectedSalary: "",
  industries: [],
  jobTypes: [],
  qualification: "",
  highestEducation: "",
  fieldOfStudy: "",
  skills: [],
  certifications: [],
  cvFile: null,
  videoFile: null,
  photoFile: null,
  passportFile: null,
  salaryRange: null,
  visaCategory: "",
  acceptTerms: false,
  acceptServiceCharge: false,
}

export function CandidateRegistrationWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CandidateFormData>(initialFormData)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    const ref = searchParams.get("ref")?.trim() || null
    setReferralCode(ref)
  }, [searchParams])

  const progress = (currentStep / steps.length) * 100

  const updateFormData = (data: Partial<CandidateFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.fullName || !formData.email || !formData.whatsapp || !formData.gender || !formData.nationality) {
      alert('Please complete all personal information fields.')
      return
    }
    if (!formData.password || formData.password.length < 6) {
      alert('Please set a password with at least 6 characters.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Password and confirm password must match.')
      return
    }
    if (!formData.jobCategories || formData.jobCategories.length === 0) {
      alert('Please select at least one job category.')
      return
    }
    if (!formData.totalExperience || !formData.qualification) {
      alert('Please fill in experience and qualification.')
      return
    }
    if (!formData.cvFile) {
      alert('Please upload your CV.')
      return
    }
    if (!formData.videoFile) {
      alert('Please record or upload your video introduction.')
      return
    }
    if (!formData.salaryRange) {
      alert('Please set your expected salary range.')
      return
    }
    if (!formData.acceptTerms) {
      alert('Please accept the terms and conditions.')
      return
    }

    try {
      const formDataToSend = new FormData()
      const refToSend = referralCode || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") : null)

      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('whatsapp', formData.whatsapp)
      formDataToSend.append('gender', formData.gender)
      formDataToSend.append('nationality', formData.nationality)
      if (formData.dateOfBirth) formDataToSend.append('dateOfBirth', formData.dateOfBirth)
      if (formData.currentLocation) formDataToSend.append('currentLocation', formData.currentLocation)
      if (formData.preferredLocations?.length) formDataToSend.append('preferredLocations', JSON.stringify(formData.preferredLocations))
      if (formData.maritalStatus) formDataToSend.append('maritalStatus', formData.maritalStatus)
      formDataToSend.append('jobCategories', JSON.stringify(formData.jobCategories))
      formDataToSend.append('totalExperience', formData.totalExperience)
      formDataToSend.append('qualification', formData.qualification)
      formDataToSend.append('salaryRange', JSON.stringify(formData.salaryRange))
      formDataToSend.append('acceptTerms', formData.acceptTerms.toString())

      if (refToSend) {
        formDataToSend.append('referralLink', refToSend)
      }
      
      // Add files
      if (formData.cvFile) {
        formDataToSend.append('cvFile', formData.cvFile)
      }
      if (formData.videoFile) {
        formDataToSend.append('videoFile', formData.videoFile)
      }

      // Submit form data to API
      const response = await fetch('/api/register/candidate', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Registration failed. Please try again.')
        return
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', 'candidate_token_' + Date.now())
      }

      const redirect = searchParams.get('redirect')
      router.push(redirect?.startsWith('/') ? redirect : '/')
    } catch (error) {
      console.error('Registration error:', error)
      alert('Network error. Please try again.')
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />
      case 2:
        return <JobProfileStep formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Header */}
      <div className="mx-auto mb-8 max-w-4xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-foreground">
          Create Your Profile
        </h1>
        <p className="mb-4 text-center text-muted-foreground">
          Complete your profile to get discovered by top companies
        </p>
        <p className="mb-6 text-center text-xs text-muted-foreground">
          Fill in your details below to create your profile.
        </p>
        {referralCode && (
          <div className="mb-6 flex justify-center">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Link2 className="h-3.5 w-3.5" />
              You were referred — your profile will be linked to the referrer
            </Badge>
          </div>
        )}

        {/* Progress Bar */}
        <Progress value={progress} className="mb-6 h-2" />

        {/* Step Indicators */}
        <div className="flex justify-between">
          {steps.map((step) => {
            const StepIcon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-2 hidden text-xs font-medium sm:block ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mx-auto max-w-4xl border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between border-t border-border pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-2" disabled={!formData.acceptTerms}>
                Submit Profile
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
