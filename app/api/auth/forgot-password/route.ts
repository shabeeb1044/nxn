import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db, initializeDatabase } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim()
    const admin = await db.users.getByEmail(normalizedEmail)
    const agency = await db.agencies.getByEmail(normalizedEmail)
    const company = await db.companies.getByEmail(normalizedEmail)
    const agent = await db.agents.getByEmail(normalizedEmail)
    const candidate = await db.candidates.getByEmail(normalizedEmail)
    const account = admin || agency || company || agent || candidate

    if (!account) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      )
    }

    // Only allow reset for roles that use email/password login
    const allowedRoles = ['agency', 'company', 'corporate', 'admin', 'super_admin', 'agent', 'candidate']
    const role = (account as any).role
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      )
    }

    // Remove any existing reset tokens for this email
    await db.passwordResetTokens.deleteByEmail(normalizedEmail)

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour

    await db.passwordResetTokens.create(normalizedEmail, token, expiresAt)

    // In production: send email with link e.g. ${process.env.APP_URL}/reset-password?token=${token}
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    const type =
      role === 'company' || role === 'corporate'
        ? 'company'
        : role === 'admin' || role === 'super_admin'
          ? 'admin'
          : role === 'candidate'
            ? 'candidate'
            : 'agency'

    const resetLink = `${baseUrl}/reset-password?token=${token}&type=${type}`

    // Send reset email only after confirming email is registered
    await sendPasswordResetEmail(normalizedEmail, resetLink)

    return NextResponse.json({
      success: true,
      message: 'A password reset link has been sent to your email.',
    })
  } catch (error) {
    return apiError(error, 500)
  }
}
