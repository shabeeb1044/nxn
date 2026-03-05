import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    const url = new URL(request.url)
    const companyId = url.searchParams.get('companyId')
    const candidateId = url.searchParams.get('candidateId')

    if (!companyId || !candidateId) {
      return NextResponse.json(
        { error: 'companyId and candidateId are required' },
        { status: 400 }
      )
    }

    const company = await db.companies.getById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const candidate = await db.candidates.getById(candidateId)
    if (!candidate || !candidate.cvUrl) {
      return NextResponse.json({ error: 'Candidate CV not found' }, { status: 404 })
    }

    // Corporate companies always have unlimited access
    const isCorporate = company.isCorporate
    const subscriptionPlan = company.subscriptionPlan ?? null
    const subscriptionStatus = company.subscriptionStatus ?? null
    const currentDownloads = company.totalCVDownloads ?? 0

    let limit: number | null = null

    if (isCorporate) {
      limit = -1
    } else if (subscriptionPlan && subscriptionStatus === 'active') {
      const plans = await db.plans.getAll()
      const matchingPlan = plans.find(
        (p) => p.type === 'company' && p.level === subscriptionPlan && p.isActive
      )
      if (matchingPlan) {
        limit =
          typeof matchingPlan.features?.cvDownloads === 'number'
            ? matchingPlan.features.cvDownloads
            : null
      }
    } else {
      // Free tier: no CV downloads
      limit = 0
    }

    if (typeof limit === 'number' && limit >= 0 && currentDownloads >= limit) {
      return NextResponse.json(
        { error: 'CV download limit reached for your current plan' },
        { status: 403 }
      )
    }

    // Increment download counter and record audit entry
    await db.companies.update(company.id, {
      totalCVDownloads: (company.totalCVDownloads ?? 0) + 1,
    })

    try {
      await db.payments.create({
        userId: company.userId,
        entityType: 'company',
        entityId: company.id,
        type: 'cv_download',
        amount: 0,
        status: 'completed',
        paymentMethod: 'plan',
        transactionId: undefined,
      })
    } catch {
      // If audit logging fails, do not block the download
    }

    // Redirect to the actual CV file (usually /uploads/...)
    const rawCvUrl = candidate.cvUrl

    // Build an absolute URL so redirect always has a valid Location header
    const cvUrl =
      rawCvUrl.startsWith('http://') || rawCvUrl.startsWith('https://')
        ? rawCvUrl
        : new URL(rawCvUrl, request.url).toString()

    return NextResponse.redirect(cvUrl)
  } catch (error) {
    console.error('CV download error:', error)
    return NextResponse.json(
      { error: 'Failed to process CV download' },
      { status: 500 }
    )
  }
}

