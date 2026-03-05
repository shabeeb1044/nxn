import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const demands = await db.demands.getOpen()
    const jobs = demands.map((d) => ({
      id: d.id,
      jobTitle: d.jobTitle,
      description: d.description,
      skills: d.skills ?? [],
      salary: d.salary,
      location: d.location,
      deadline: d.deadline,
      createdAt: d.createdAt,
      joining: d.joining,
      companyName: d.companyName,
      quantity: d.quantity,
      filledPositions: d.filledPositions,
      status: d.status,
    }))
    return NextResponse.json({ success: true, jobs })
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
