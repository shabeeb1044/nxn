import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const POINTS_PER_HIRE = 10
const DEFAULT_COMMISSION_AMOUNT = 100

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { companyId, status } = body as { companyId: string; status: string }

    if (!id || !companyId || !status) {
      return NextResponse.json(
        { error: 'submission id, companyId, and status required' },
        { status: 400 }
      )
    }

    const app = await db.applications.getById(id)
    if (!app || app.companyId !== companyId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const newStatus = status as 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'withdrawn'
    const allowed = ['shortlisted', 'interview', 'hired', 'rejected', 'withdrawn']
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await db.applications.update(id, {
      status: newStatus === 'hired' ? 'hired' : newStatus,
      updatedAt: new Date().toISOString(),
    })

    const statusLabel =
      newStatus === 'hired' ? 'hired' : newStatus === 'interview' ? 'selected for interview' : newStatus
    await db.notifications.create({
      recipientType: 'candidate',
      recipientId: app.candidateId,
      type: 'application_status',
      title: 'Application update',
      message: `Your application for ${app.demandTitle} at ${app.companyName} was ${statusLabel}.`,
      link: '/candidate/applications',
    }).catch(() => {})
    if (app.agencyId && app.agencyId !== 'direct') {
      await db.notifications.create({
        recipientType: 'agency',
        recipientId: app.agencyId,
        type: 'application_status',
        title: 'Application status update',
        message: `${app.candidateName} – ${app.demandTitle} at ${app.companyName}: ${statusLabel}.`,
        link: '/agency/applications',
      }).catch(() => {})
    }
    if (app.agentId) {
      await db.notifications.create({
        recipientType: 'agent',
        recipientId: app.agentId,
        type: 'application_status',
        title: 'Application status update',
        message: `${app.candidateName} – ${app.demandTitle} at ${app.companyName}: ${statusLabel}.`,
        link: '/agent/applications',
      }).catch(() => {})
    }

    if (newStatus === 'hired') {
      const demand = await db.demands.getById(app.demandId)
      if (demand) {
        await db.demands.update(app.demandId, {
          filledPositions: demand.filledPositions + 1,
          updatedAt: new Date().toISOString(),
        })
      }

      if (app.agentId) {
        const agent = await db.agents.getById(app.agentId)
        if (agent) {
          const commissionAmount = (agent.commissionPercent / 100) * DEFAULT_COMMISSION_AMOUNT
          await db.agentPoints.create({
            agentId: agent.id,
            agencyId: app.agencyId,
            points: POINTS_PER_HIRE,
            reason: 'hired',
            applicationId: app.id,
            demandId: app.demandId,
            companyId: app.companyId,
          })
          await db.agents.update(agent.id, {
            totalPlacements: agent.totalPlacements + 1,
            totalEarnings: agent.totalEarnings + commissionAmount,
            updatedAt: new Date().toISOString(),
          })
        }
      }

      const agency = await db.agencies.getById(app.agencyId)
      if (agency) {
        await db.agencies.update(app.agencyId, {
          totalSelections: agency.totalSelections + 1,
          totalRevenue: agency.totalRevenue + DEFAULT_COMMISSION_AMOUNT,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    const updated = await db.applications.getById(id)
    return NextResponse.json({ success: true, submission: updated })
  } catch (error) {
    console.error('Update submission failed:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
