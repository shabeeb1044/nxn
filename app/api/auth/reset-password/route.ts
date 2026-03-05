import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { apiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const { token, newPassword, confirmPassword } = await request.json()

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, new password, and confirm password are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const resetRecord = await db.passwordResetTokens.getByToken(token)
    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new password reset.' },
        { status: 400 }
      )
    }

    const email = resetRecord.email
    // Update password in whichever collection owns this email
    const admin = await db.users.getByEmail(email)
    if (admin) {
      await db.users.update(admin.id, { password: hashPassword(newPassword) })
    } else {
      const agency = await db.agencies.getByEmail(email)
      if (agency) {
        await db.agencies.update(agency.id, { password: hashPassword(newPassword) } as any)
      } else {
        const company = await db.companies.getByEmail(email)
        if (company) {
          await db.companies.update(company.id, { password: hashPassword(newPassword) } as any)
        } else {
          const candidate = await db.candidates.getByEmail(email)
          if (candidate) {
            await db.candidates.update(candidate.id, { password: hashPassword(newPassword) } as any)
          } else {
            const agent = await db.agents.getByEmail(email)
            if (agent) {
              await db.agents.update(agent.id, { password: hashPassword(newPassword) } as any)
            } else {
              return NextResponse.json(
                { error: 'User not found' },
                { status: 400 }
              )
            }
          }
        }
      }
    }
    await db.passwordResetTokens.deleteByToken(token)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    })
  } catch (error) {
    return apiError(error, 500)
  }
}
