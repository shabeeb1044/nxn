import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log(body,"ppppppppppp")
    if (body.password) {
      body.password = hashPassword(body.password)
    }
    const updated = await db.agents.update(id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    const { password: _, ...agentWithoutPassword } = updated
    return NextResponse.json({ success: true, agent: agentWithoutPassword })
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await db.agents.delete(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
