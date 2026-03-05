import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { apiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const { email, password, loginType } = await request.json() as {
      email?: string
      password?: string
      loginType?: string
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticate(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.role === 'agency' && loginType !== 'candidate') {
      const agency = await db.agencies.getById(user.agencyId || user.id)
      if (agency) {
        const approvalStatus = (agency as any).approvalStatus || 'pending'
        if (approvalStatus === 'rejected') {
          return NextResponse.json(
            { error: 'Your agency registration has been rejected. Please contact support.' },
            { status: 403 }
          )
        }
        if (!agency.isActive) {
          return NextResponse.json(
            { error: 'Your agency account is inactive. Please contact support.' },
            { status: 403 }
          )
        }
        if (approvalStatus !== 'approved') {
          return NextResponse.json(
            { error: 'Your agency is pending admin approval. Please wait for the super admin to approve your account.' },
            { status: 403 }
          )
        }
      }
    }

    if (user.role === 'agent' && user.agencyId && loginType !== 'candidate') {
      const agency = await db.agencies.getById(user.agencyId)
      if (agency) {
        const approvalStatus = (agency as any).approvalStatus || 'pending'
        if (approvalStatus === 'rejected') {
          return NextResponse.json(
            { error: 'Your agency has been rejected. You cannot sign in. Please contact your agency or support.' },
            { status: 403 }
          )
        }
        if (!agency.isActive) {
          return NextResponse.json(
            { error: 'Your agency account is inactive. You cannot sign in. Please contact your agency or support.' },
            { status: 403 }
          )
        }
        if (approvalStatus !== 'approved') {
          return NextResponse.json(
            { error: 'Your agency is pending approval. You cannot sign in until the agency is approved.' },
            { status: 403 }
          )
        }
      }
    }

    if (user.role === 'company' || user.role === 'corporate') {
      const company = await db.companies.getById(user.companyId || user.id)
      if (company) {
        if (!company.subscriptionStatus || company.subscriptionStatus !== 'active') {
          return NextResponse.json(
            {
              error: 'Your account is currently under review by the administrator. Please wait until your company details are verified and approved.',
            },
            { status: 403 }
          )
        }
        if (!company.isActive) {
          return NextResponse.json(
            {
              error:
                'Your registration could not be approved. Please contact support for assistance.',
            },
            { status: 403 }
          )
        }
      }
    }

    if (!user.isActive) {
      if (user.role === 'agent') {
        await db.agents.update(user.agentId || user.id, { isActive: true })
        user.isActive = true
      } else if (user.role === 'candidate') {
        await db.candidates.update(user.candidateId || user.id, { isActive: true })
        user.isActive = true
      }
    }

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    return apiError(error, 500)
  }
}
