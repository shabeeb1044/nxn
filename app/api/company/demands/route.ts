import { NextRequest, NextResponse } from 'next/server'
import { db, type BenefitType, type NationalityType } from '@/lib/db'
import { apiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    }
    const demands = await db.demands.getByCompanyId(companyId)
    const withPositions = demands.map(d => ({ ...d, positions: d.quantity }))
    return NextResponse.json({ success: true, demands: withPositions })
  } catch (error) {
    return apiError(error, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyId,
      companyName,
      roles,
      description = '',
      location = '',
      requirements = [],
      skills = [],
      salaryAmount = 0,
      currency = 'AED',
      dutyHoursPerDay = 0,
      breakTimeHours = 0,
      dayOffPerMonth = 0,
      benefits = [],
      gender = 'any',
      nationality = ['any'],
      joining = 'immediate',
      status = 'open',
      deadline,
    } = body as {
      companyId: string
      companyName: string
      roles: Array<{ jobTitle: string; quantity: number }>
      description?: string
      location?: string
      requirements?: string[]
      skills?: string[]
      salaryAmount?: number
      currency?: string
      dutyHoursPerDay?: number
      breakTimeHours?: number
      dayOffPerMonth?: number
      benefits?: BenefitType[]
      gender?: 'male' | 'female' | 'any'
      nationality?: NationalityType[]
      joining?: 'immediate' | 'scheduled'
      status?: 'open' | 'closed' | 'on_hold'
      deadline?: string
    }

    if (!companyId || !companyName || !roles?.length) {
      return NextResponse.json(
        { error: 'companyId, companyName, and roles (array of { jobTitle, positions }) are required' },
        { status: 400 }
      )
    }

    const company = await db.companies.getById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const name = companyName || company.name
    const deadlineDate = deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const created: Array<{ id: string; jobTitle: string; quantity: number }> = []
    for (const role of roles) {
      if (!role.jobTitle?.trim() || (role.quantity ?? 0) < 1) continue
      const demand = await db.demands.create({
        companyId,
        companyName: name,
        jobTitle: role.jobTitle.trim(),
        description,
        // Hiring details
        quantity: Math.max(1, Number(role.quantity)),
        filledPositions: 0,
        requirements,
        skills,
        // Salary
        salary: { amount: salaryAmount, currency },
        // Work schedule
        dutyHoursPerDay,
        breakTimeHours,
        dayOffPerMonth,
        // Benefits & eligibility
        benefits,
        gender,
        nationality,
        // Location & timing
        location: location || company.city || '',
        joining,
        status,
        deadline: deadlineDate,
      })
      created.push({ id: demand.id, jobTitle: demand.jobTitle, quantity: demand.quantity })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created.length} demand(s)`,
      demands: created,
    })
  } catch (error) {
    return apiError(error, 500)
  }
}
