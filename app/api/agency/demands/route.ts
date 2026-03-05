import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const demands = await db.demands.getAll()
    const withPositions = demands.map(d => ({ ...d, positions: d.quantity }))
    return NextResponse.json({ success: true, demands: withPositions })
  } catch (error) {
    console.error('Failed to fetch demands:', error)
    return NextResponse.json({ error: 'Failed to fetch demands' }, { status: 500 })
  }
}
