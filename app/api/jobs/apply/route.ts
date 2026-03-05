import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DIRECT_AGENCY_ID = 'direct'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { demandId, candidateId } = body

    if (!demandId || !candidateId) {
      return NextResponse.json(
        { error: 'demandId and candidateId are required' },
        { status: 400 }
      )
    }

    const demand = await db.demands.getById(demandId)
    if (!demand) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (demand.status !== 'open') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      )
    }

    const candidate = await db.candidates.getById(candidateId)
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const existingApps = await db.applications.getByDemandId(demandId)
    const alreadyApplied = existingApps.some(
      (a) => a.candidateId === candidateId
    )
    if (alreadyApplied) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    const application = await db.applications.create({
      candidateId,
      candidateName: `${candidate.firstName} ${candidate.lastName}`.trim() || candidate.email,
      demandId,
      demandTitle: demand.jobTitle,
      companyId: demand.companyId,
      companyName: demand.companyName,
      agencyId: DIRECT_AGENCY_ID,
      agentId: undefined,
      status: 'submitted',
      commission: 0,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await db.notifications.create({
      recipientType: 'company',
      recipientId: demand.companyId,
      type: 'new_submission',
      title: 'New application',
      message: `${application.candidateName} applied for ${demand.jobTitle}.`,
      link: `/company/demands`,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id,
    })
  } catch (error) {
    console.error('Failed to submit application:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
