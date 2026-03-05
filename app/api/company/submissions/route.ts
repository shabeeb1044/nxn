import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const demandId = searchParams.get('demandId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    }

    let applications
    if (demandId) {
      applications = await db.applications.getByDemandId(demandId)
      applications = applications.filter((a) => a.companyId === companyId)
    } else {
      applications = await db.applications.getByCompanyId(companyId)
    }

    const withCandidate = await Promise.all(
      applications.map(async (app) => {
        const candidate = await db.candidates.getById(app.candidateId)
        const agent = app.agentId ? await db.agents.getById(app.agentId) : null
        const agency = app.agencyId === 'direct' ? null : await db.agencies.getById(app.agencyId)
        return {
          ...app,
          candidate: candidate
            ? {
                id: candidate.id,
                name: `${candidate.firstName} ${candidate.lastName}`,
                email: candidate.email,
                phone: candidate.phone,
                skills: candidate.skills,
                cvUrl: candidate.cvUrl,
                videoUrl: candidate.videoUrl,
              }
            : null,
          agentName: agent?.name ?? (app.agencyId === 'direct' ? 'Direct' : null),
          agencyName: agency?.name ?? (app.agencyId === 'direct' ? 'Self-applied' : null),
        }
      })
    )

    return NextResponse.json({ success: true, submissions: withCandidate })
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

