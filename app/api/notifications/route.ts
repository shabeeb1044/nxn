import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { NotificationRecipientType } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get('role') as NotificationRecipientType | null
    const entityId = request.nextUrl.searchParams.get('entityId')
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 30, 50)
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true'

    if (!role || !entityId) {
      return NextResponse.json(
        { error: 'role and entityId are required' },
        { status: 400 }
      )
    }

    const allowed: NotificationRecipientType[] = [
      'company',
      'agency',
      'agent',
      'admin',
      'candidate',
    ]
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const notifications = await db.notifications.getByRecipient(role, entityId, {
      limit,
      unreadOnly: unreadOnly || undefined,
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
