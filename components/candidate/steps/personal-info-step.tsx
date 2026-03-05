"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CandidateFormData } from "../registration-wizard"

const nationalities = [
  "Indian", "Pakistani", "Filipino", "Bangladeshi", "Nepali", "Sri Lankan",
  "Egyptian", "Jordanian", "Lebanese", "Syrian", "Moroccan", "Tunisian",
  "Nigerian", "Kenyan", "Ugandan", "Ethiopian", "South African",
  "British", "American", "Canadian", "Australian", "Other"
]

const genders = ["Male", "Female", "Prefer not to say"]

const maritalStatuses = ["Single", "Married", "Divorced", "Widowed", "Prefer not to say"]

interface PersonalInfoStepProps {
  formData: CandidateFormData
  updateFormData: (data: Partial<CandidateFormData>) => void
}

export function PersonalInfoStep({ formData, updateFormData }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold text-foreground">Personal Information</h2>
        <p className="text-sm text-muted-foreground">
          Please provide your basic details
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          required
        />
      </div>

      {/* Password */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password (min 6 characters)"
            value={formData.password}
            onChange={(e) => updateFormData({ password: e.target.value })}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
            required
            minLength={6}
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp Number *</Label>
        <Input
          id="whatsapp"
          type="tel"
          placeholder="+971 50 123 4567"
          value={formData.whatsapp}
          onChange={(e) => updateFormData({ whatsapp: e.target.value, phone: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">
          Include country code (e.g., +971 for UAE)
        </p>
      </div>

      {/* Gender & Nationality */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Gender *</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => updateFormData({ gender: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genders.map((gender) => (
                <SelectItem key={gender} value={gender.toLowerCase()}>
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nationality *</Label>
          <Select
            value={formData.nationality}
            onValueChange={(value) => updateFormData({ nationality: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              {nationalities.map((nat) => (
                <SelectItem key={nat} value={nat.toLowerCase()}>
                  {nat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
        />
      </div>

      {/* Marital Status */}
      <div className="space-y-2">
        <Label>Marital Status</Label>
        <Select
          value={formData.maritalStatus}
          onValueChange={(value) => updateFormData({ maritalStatus: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {maritalStatuses.map((status) => (
              <SelectItem key={status} value={status.toLowerCase()}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Location */}
      <div className="space-y-2">
        <Label htmlFor="currentLocation">Current Location</Label>
        <Input
          id="currentLocation"
          placeholder="e.g. Dubai, UAE"
          value={formData.currentLocation}
          onChange={(e) => updateFormData({ currentLocation: e.target.value })}
        />
      </div>

      {/* Preferred Locations */}
      <div className="space-y-2">
        <Label htmlFor="preferredLocations">Preferred job locations</Label>
        <Input
          id="preferredLocations"
          placeholder="e.g. Dubai, Abu Dhabi, Sharjah (comma-separated)"
          value={(formData.preferredLocations || []).join(", ")}
          onChange={(e) =>
            updateFormData({
              preferredLocations: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </div>
  )
}
