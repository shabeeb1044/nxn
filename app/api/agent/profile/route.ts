import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    const agent = await db.agents.getById(agentId)
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { password: _, ...agentData } = agent
    return NextResponse.json({ success: true, agent: agentData })
  } catch (error) {
    console.error('Failed to fetch agent profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, name, phone, password, photoUrl } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (name) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (password) updates.password = hashPassword(password)
    if (photoUrl !== undefined) updates.photoUrl = photoUrl

    const updated = await db.agents.update(agentId, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { password: _, ...agentData } = updated
    return NextResponse.json({ success: true, agent: agentData })
  } catch (error) {
    console.error('Failed to update agent profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
