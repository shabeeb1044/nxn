// Simple authentication helper
// In production, use NextAuth.js or similar

import { db, User } from './db'
import crypto from 'crypto'

// Simple password hashing (use bcrypt in production) - exported for registration/reset
export function hashPassword(password: string): string {
  // For demo purposes, simple hash. Use bcrypt in production!
  return crypto.createHash('sha256').update(password).digest('hex')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const normalizedEmail = email.trim()

  // 1) Admin/Super admin still live in `users`
  const adminUser = await db.users.getByEmail(normalizedEmail)
  if (adminUser && (adminUser.password === password || verifyPassword(password, adminUser.password))) {
    return adminUser
  }

  // 2) Agency users live in `agencies`
  const agency = await db.agencies.getByEmail(normalizedEmail)
  if (agency && (agency.password === password || verifyPassword(password, agency.password))) {
    return {
      id: agency.id,
      email: agency.email,
      phone: agency.phone,
      password: agency.password,
      role: agency.role,
      name: agency.name,
      isActive: agency.isActive,
      agencyId: agency.id,
      createdAt: agency.createdAt,
      updatedAt: agency.updatedAt,
    }
  }

  // 3) Agent users live in `agents`
  const agent = await db.agents.getByEmail(normalizedEmail)
  if (agent && (agent.password === password || verifyPassword(password, agent.password))) {
    return {
      id: agent.id,
      email: agent.email,
      phone: agent.phone,
      password: agent.password,
      role: 'agent' as const,
      name: agent.name,
      isActive: agent.isActive,
      agencyId: agent.agencyId,
      agentId: agent.id,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    }
  }

  // 4) Company users live in `companies`
  const company = await db.companies.getByEmail(normalizedEmail)
  if (company && (company.password === password || verifyPassword(password, company.password))) {
    return {
      id: company.id,
      email: company.email,
      phone: company.phone,
      password: company.password,
      role: company.role,
      name: company.contactName,
      isActive: company.isActive,
      companyId: company.id,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }
  }

  // 5) Candidate users live in `candidates`
  const candidate = await db.candidates.getByEmail(normalizedEmail)
  if (candidate && (candidate.password === password || verifyPassword(password, candidate.password))) {
    return {
      id: candidate.id,
      email: candidate.email,
      phone: candidate.phone,
      password: candidate.password,
      role: 'candidate' as const,
      name: `${candidate.firstName} ${candidate.lastName}`.trim() || candidate.email,
      isActive: candidate.isActive,
      candidateId: candidate.id,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    }
  }

  return null
}

export async function createSession(user: User): Promise<string> {
  // Simple session token (use JWT in production)
  const token = crypto.randomBytes(32).toString('hex')
  // Store session (in production, use Redis or database)
  return token
}

export function requireAuth(role?: string[]) {
  // Middleware helper
  return (req: any, res: any, next: any) => {
    // Implement auth check
    next()
  }
}
