import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { apiError } from '@/lib/api-utils'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

const ALLOWED_CV_TYPES = ['application/pdf']
const ALLOWED_VIDEO_TYPES = [
  'video/webm',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]
const MAX_CV_SIZE = 5 * 1024 * 1024       // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024    // 50 MB

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100)
}

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

async function saveFile(file: File, prefix: string): Promise<string> {
  ensureUploadsDir()

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeName = sanitizeFileName(file.name)
  const fileName = `${prefix}-${Date.now()}-${safeName}`
  const filePath = path.join(UPLOADS_DIR, fileName)

  fs.writeFileSync(filePath, buffer)
  return `/uploads/${fileName}`
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const formData = await request.formData()

    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const whatsapp = formData.get('whatsapp') as string
    const gender = formData.get('gender') as string
    const nationality = formData.get('nationality') as string
    const dateOfBirth = (formData.get('dateOfBirth') as string) || ''
    const currentLocation = (formData.get('currentLocation') as string) || ''
    const maritalStatus = (formData.get('maritalStatus') as string) || ''
    const jobCategoriesStr = formData.get('jobCategories') as string
    const preferredLocationsStr = formData.get('preferredLocations') as string
    const totalExperience = formData.get('totalExperience') as string
    const qualification = formData.get('qualification') as string
    const salaryRangeStr = formData.get('salaryRange') as string
    const acceptTerms = formData.get('acceptTerms') === 'true'
    const password = formData.get('password') as string

    const cvFile = formData.get('cvFile') as File | null
    const videoFile = formData.get('videoFile') as File | null

    const referralCodeOrLink = (formData.get('referralLink') as string | null)?.trim() || null

    let jobCategories: string[] = []
    let salaryRange: any = null

    try {
      jobCategories = jobCategoriesStr ? JSON.parse(jobCategoriesStr) : []
    } catch {}

    let preferredLocations: string[] = []
    try {
      preferredLocations = preferredLocationsStr ? JSON.parse(preferredLocationsStr) : []
    } catch {}

    try {
      salaryRange = salaryRangeStr ? JSON.parse(salaryRangeStr) : null
    } catch {}

    if (!fullName || !email || !whatsapp || !gender || !nationality) {
      return NextResponse.json(
        { error: 'Required personal information missing' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password is required and must be at least 6 characters long' },
        { status: 400 }
      )
    }

    if (!jobCategories.length) {
      return NextResponse.json(
        { error: 'Select at least one job category' },
        { status: 400 }
      )
    }

    if (!totalExperience || !qualification) {
      return NextResponse.json(
        { error: 'Experience and qualification required' },
        { status: 400 }
      )
    }

    if (!cvFile) {
      return NextResponse.json({ error: 'CV required' }, { status: 400 })
    }

    if (!videoFile) {
      return NextResponse.json({ error: 'Video required' }, { status: 400 })
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: 'Accept terms first' },
        { status: 400 }
      )
    }

    // CV validation
    if (!ALLOWED_CV_TYPES.includes(cvFile.type)) {
      return NextResponse.json(
        { error: 'CV must be a PDF file' },
        { status: 400 }
      )
    }

    if (cvFile.size > MAX_CV_SIZE) {
      return NextResponse.json(
        { error: 'CV must be under 5 MB' },
        { status: 400 }
      )
    }

    // Video validation
    if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { error: 'Video must be MP4, WebM, MOV, AVI, or MKV' },
        { status: 400 }
      )
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: 'Video must be under 50 MB' },
        { status: 400 }
      )
    }

    // Check for duplicate email
    const exists =
      (await db.candidates.getByEmail(email)) ||
      (await db.agencies.getByEmail(email)) ||
      (await db.companies.getByEmail(email)) ||
      (await db.users.getByEmail(email))

    if (exists) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const parts = fullName.trim().split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''

    // Resolve referral: ref can be agent's referralCode (e.g. AGT...) or agency's referralLink (ref_...)
    let agencyId: string | undefined
    let agentId: string | undefined
    if (referralCodeOrLink) {
      const agentByCode = await db.agents.getByReferralCode(referralCodeOrLink)
      if (agentByCode) {
        agentId = agentByCode.id
        agencyId = agentByCode.agencyId
      } else {
        const agencyByLink = await db.agencies.getByReferralLink(referralCodeOrLink)
        if (agencyByLink) {
          agencyId = agencyByLink.id
        }
      }
    }

    // Save files to public/uploads
    const cvUrl = await saveFile(cvFile, 'cv')
    const videoUrl = await saveFile(videoFile, 'video')

    const candidate = await db.candidates.create({
      role: 'candidate',
      firstName,
      lastName,
      email,
      phone: whatsapp,
      gender,
      nationality,
      dateOfBirth,
      currentLocation,
      preferredLocations,
      languages: [],
      maritalStatus,
      jobCategories,
      totalExperience,
      expectedSalary: salaryRange ? `${salaryRange.min}-${salaryRange.max}` : '',
      noticePeriod: '',
      industries: [],
      jobTypes: [],
      highestEducation: qualification,
      fieldOfStudy: '',
      skills: [],
      certifications: [],
      salaryRange,
      cvUrl,
      videoUrl,
      password: hashPassword(password),
      isActive: true,
      status: 'available',
      ...(agencyId && { agencyId }),
    })

    if (agencyId) {
      await db.candidateSources.create({
        candidateId: candidate.id,
        agentId: agentId || undefined,
        agencyId,
        sourceType: agentId ? 'referral' : 'link',
      })
    }
    if (agentId) {
      const agent = await db.agents.getById(agentId)
      if (agent) {
        await db.agents.update(agentId, {
          totalReferrals: agent.totalReferrals + 1,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate registered successfully',
      user: {
        id: candidate.id,
        email: candidate.email,
        name: `${candidate.firstName} ${candidate.lastName}`,
        cvUrl,
        videoUrl,
      },
    })
  } catch (error) {
    return apiError(error, 500)
  }
}
