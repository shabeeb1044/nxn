import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { NotificationRecipientType } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { ids, all, role, entityId } = body as {
      ids?: string[]
      all?: boolean
      role?: NotificationRecipientType
      entityId?: string
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await Promise.all(ids.map((id: string) => db.notifications.markAsRead(id)))
      return NextResponse.json({ success: true, marked: ids.length })
    }

    if (all && role && entityId) {
      const count = await db.notifications.markAllAsRead(role, entityId)
      return NextResponse.json({ success: true, marked: count })
    }

    return NextResponse.json(
      { error: 'Provide ids[] or all with role and entityId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Notifications PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
