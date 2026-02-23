// MongoDB database implementation
import { getDatabase } from './mongodb'
import { ObjectId } from 'mongodb'

export type UserRole = 'super_admin' | 'admin' | 'agency' | 'agent' | 'company' | 'corporate' | 'candidate'

export interface User {
  id: string
  email: string
  phone?: string
  password: string // Hashed in production
  role: UserRole
  name: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  // Role-specific IDs
  candidateId?: string
  agencyId?: string
  agentId?: string
  companyId?: string
}

export interface Candidate {
  id: string
  userId: string
  agencyId?: string // If registered via agency link
  role: 'candidate'
  password: string
  isActive: boolean
  // Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  nationality: string
  currentLocation: string
  preferredLocations: string[]
  languages: string[]
  maritalStatus: string
  // Work Experience
  totalExperience: string
  currentJobTitle?: string
  currentCompany?: string
  currentSalary?: string
  expectedSalary: string
  noticePeriod: string
  industries: string[]
  jobTypes: string[]
  jobCategories: string[]
  // Education & Skills
  highestEducation: string
  fieldOfStudy: string
  skills: string[]
  certifications: string[]
  // Documents
  cvUrl?: string
  photoUrl?: string
  passportUrl?: string
  // Video
  videoUrl?: string
  // Status
  status: 'available' | 'under_bidding' | 'interviewed' | 'selected' | 'on_hold'
  visaCategory?: string
  salaryRange?: { min: number; max: number }
  createdAt: string
  updatedAt: string
}

export interface Agency {
  id: string
  userId: string
  role: 'agency'
  password: string
  isActive: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'spam'
  name: string
  email: string
  phone: string
  proofDocumentUrl?: string
  referralLink: string // Unique referral link
  subscriptionPlan: 'basic' | 'silver' | 'gold' | 'platinum'
  subscriptionStatus: 'active' | 'expired' | 'cancelled'
  subscriptionExpiresAt?: string
  // Limits based on plan
  cvUploadLimit: number
  cvUploadsUsed: number
  biddingLimit: number
  bidsUsed: number
  jobOfferLimit: number
  jobOffersUsed: number
  // Stats
  totalCandidates: number
  totalInterviews: number
  totalSelections: number
  totalRevenue: number
  totalCommission: number
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
  // Companies are stored in the `companies` collection and are treated as an auth entity.
  // `userId` is kept for back-compat with earlier code and is set to the same value as `id`.
  userId: string
  role: 'company' | 'corporate'
  password: string
  isActive: boolean
  // Company profile
  name: string
  tradeLicense: string
  industry: string
  companySize: string
  website?: string
  country: string
  city: string
  address?: string
  description?: string
  logoUrl?: string

  // Primary contact (also duplicated to email/phone for convenience in UI/admin tables)
  contactName: string
  contactEmail: string
  contactPhone: string
  contactPosition: string

  // Back-compat / convenience fields used across the UI
  email: string
  phone: string
  type: 'regular' | 'corporate'
  subscriptionPlan?: 'bronze' | 'silver' | 'gold',
  subscriptionStatus?: 'active' | 'expired' | 'cancelled'
  subscriptionExpiresAt?: string
  // Corporate companies get free access
  isCorporate: boolean
  // Stats
  totalCVDownloads: number
  totalBids: number
  totalInterviews: number
  totalHires: number
  createdAt: string
  updatedAt: string
}

export interface Bid {
  id: string
  candidateId: string
  companyId: string
  agencyId?: string
  amount: number
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  message?: string
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  userId: string
  entityType: 'agency' | 'company'
  entityId: string
  plan: string
  amount: number
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  createdAt: string
}

export interface Plan {
  id: string
  name: string
  type: 'agency' | 'company'
  level: string // basic/silver/gold/platinum or bronze/silver/gold
  price: number
  features: {
    cvUploads?: number
    biddingLimit?: number
    jobOffers?: number
    cvDownloads?: number
    unlimitedDownloads?: boolean
  }
  isActive: boolean
  createdAt: string
}

export interface Interview {
  id: string
  candidateId: string
  companyId: string
  agencyId?: string
  scheduledAt: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  videoUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Payment{
  id: string
  userId: string
  entityType: 'agency' | 'company' | 'candidate'
  entityId: string
  type: 'subscription' | 'cv_download' | 'bid' | 'commission'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  transactionId?: string
  createdAt: string
}


export interface Agent {
  id: string
  agencyId: string
  name: string
  email: string
  password: string
  phone: string
  commissionPercent: number
  referralCode: string
  isActive: boolean
  totalReferrals: number
  totalPlacements: number
  totalEarnings: number
  createdAt: string
  updatedAt: string
}

export interface Demand {
  id: string
  companyId: string
  companyName: string
  jobTitle: string
  description: string
  requirements: string[]
  skills: string[]
  salary: { min: number; max: number; currency: string }
  gender: string
  location: string
  positions: number
  filledPositions: number
  status: 'open' | 'closed' | 'on_hold'
  deadline: string
  createdAt: string
  updatedAt: string
}

export type ApplicationStatus = 'submitted' | 'pending' | 'shortlisted' | 'interview' | 'hired' | 'selected' | 'rejected' | 'withdrawn'

export interface Application {
  id: string
  candidateId: string
  candidateName: string
  demandId: string
  demandTitle: string
  companyId: string
  companyName: string
  agencyId: string
  agentId?: string
  status: ApplicationStatus
  commission: number
  submittedAt: string
  updatedAt: string
}

export interface AgentPoint{
  id: string
  agentId: string
  agencyId: string
  points: number
  reason: 'hired' | 'placement' | 'bonus'
  applicationId: string
  demandId: string
  companyId: string
  createdAt: string
}

export interface CandidateSource {
  id: string
  candidateId: string
  agentId?: string
  agencyId: string
  sourceType: 'referral' | 'bulk_upload' | 'manual' | 'link'
  createdAt: string
}

export interface Settings {
  id: string
  key: string
  value: any
  updatedAt: string
}

export interface PasswordResetToken {
  id: string
  email: string
  token: string
  expiresAt: string
  createdAt: string
}

export type CreateCandidateInput = Omit<Candidate, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string
}

export type CreateAgencyInput = Omit<Agency, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'referralLink'> & {
  userId?: string
}

export type CreateCompanyInput = Omit<Company, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string
}

// Helper function to convert MongoDB document to our interface format
function toInterface<T>(doc: any): T {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return { ...rest, id: _id?.toString() || doc.id || rest.id } as T
}

// Helper function to safely convert string ID to ObjectId
function toObjectId(id: string): ObjectId | string {
  if (ObjectId.isValid(id)) {
    return new ObjectId(id)
  }
  return id
}

export const db = {
  users: {
    getAll: async (): Promise<User[]> => {
      const db = await getDatabase()
      const users = await db.collection('users').find({}).toArray()
      return users.map(doc => toInterface<User>(doc))
    },
    getById: async (id: string): Promise<User | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const user = await db.collection('users').findOne(query)
      return user ? toInterface<User>(user) : undefined
    },
    getByEmail: async (email: string): Promise<User | undefined> => {
      const db = await getDatabase()
      const user = await db.collection('users').findOne({ email })
      return user ? toInterface<User>(user) : undefined
    },
    create: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const newUser = {
        ...user,
        createdAt: now,
        updatedAt: now,
      }
      const result = await db.collection('users').insertOne(newUser)
      return toInterface<User>({ ...newUser, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const db = await getDatabase()
      const updateDoc = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('users').findOneAndUpdate(
        query,
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
      return result?.value ? toInterface<User>(result.value) : null
    },
  },
  candidates: {
    getAll: async (): Promise<Candidate[]> => {
      const db = await getDatabase()
      const candidates = await db.collection('candidates').find({}).toArray()
      return candidates.map(doc => toInterface<Candidate>(doc))
    },
    getById: async (id: string): Promise<Candidate | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const candidate = await db.collection('candidates').findOne(query)
      return candidate ? toInterface<Candidate>(candidate) : undefined
    },
    getByUserId: async (userId: string): Promise<Candidate | undefined> => {
      const db = await getDatabase()
      const candidate = await db.collection('candidates').findOne({ userId })
      return candidate ? toInterface<Candidate>(candidate) : undefined
    },
    getByEmail: async (email: string): Promise<Candidate | undefined> => {
      const db = await getDatabase()
      const candidate = await db.collection('candidates').findOne({ email })
      return candidate ? toInterface<Candidate>(candidate) : undefined
    },
    create: async (candidate: CreateCandidateInput): Promise<Candidate> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const _id = new ObjectId()
      const newCandidate: Omit<Candidate, 'id'> & { _id: ObjectId } = {
        _id,
        userId: candidate.userId ?? _id.toString(),
        ...candidate,
        status: (candidate as any).status ?? ('available' as const),
        createdAt: now,
        updatedAt: now,
      }
      const result = await db.collection('candidates').insertOne(newCandidate)
      return toInterface<Candidate>({ ...newCandidate, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Candidate>): Promise<Candidate | null> => {
      const db = await getDatabase()
      const updateDoc = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('candidates').findOneAndUpdate(
        query,
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Candidate>(result.value) : null
    },
  },
  agencies: {
    getAll: async (): Promise<Agency[]> => {
      const db = await getDatabase()
      const agencies = await db.collection('agencies').find({}).toArray()
      return agencies.map(doc => toInterface<Agency>(doc))
    },
    getById: async (id: string): Promise<Agency | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const agency = await db.collection('agencies').findOne(query)
      return agency ? toInterface<Agency>(agency) : undefined
    },
    getByUserId: async (userId: string): Promise<Agency | undefined> => {
      const db = await getDatabase()
      const agency = await db.collection('agencies').findOne({ userId })
      return agency ? toInterface<Agency>(agency) : undefined
    },
    getByEmail: async (email: string): Promise<Agency | undefined> => {
      const db = await getDatabase()
      const agency = await db.collection('agencies').findOne({ email })
      return agency ? toInterface<Agency>(agency) : undefined
    },
    getByReferralLink: async (referralLink: string): Promise<Agency | undefined> => {
      const db = await getDatabase()
      const agency = await db.collection('agencies').findOne({ referralLink })
      return agency ? toInterface<Agency>(agency) : undefined
    },
    create: async (agency: CreateAgencyInput): Promise<Agency> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const _id = new ObjectId()
      const newAgency: Omit<Agency, 'id'> & { _id: ObjectId } = {
        _id,
        userId: agency.userId ?? _id.toString(),
        ...agency,
        referralLink: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        createdAt: now,
        updatedAt: now,
      }
      const result = await db.collection('agencies').insertOne(newAgency)
      return toInterface<Agency>({ ...newAgency, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Agency>): Promise<Agency | null> => {
      const db = await getDatabase()
      const updateDoc = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('agencies').findOneAndUpdate(
        query,
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Agency>(result.value) : null
    },
    delete: async (id: string): Promise<boolean> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('agencies').deleteOne(query)
      return (result?.deletedCount ?? 0) > 0
    },
  },
  companies: {
    getAll: async (): Promise<Company[]> => {
      const db = await getDatabase()
      const companies = await db.collection('companies').find({}).toArray()
      return companies.map(doc => toInterface<Company>(doc))
    },
    getById: async (id: string): Promise<Company | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const company = await db.collection('companies').findOne(query)
      return company ? toInterface<Company>(company) : undefined
    },
    getByUserId: async (userId: string): Promise<Company | undefined> => {
      const db = await getDatabase()
      const company = await db.collection('companies').findOne({ userId })
      return company ? toInterface<Company>(company) : undefined
    },
    getByEmail: async (email: string): Promise<Company | undefined> => {
      const db = await getDatabase()
      const company = await db.collection('companies').findOne({ email })
      return company ? toInterface<Company>(company) : undefined
    },
    create: async (company: CreateCompanyInput): Promise<Company> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const _id = new ObjectId()
      const newCompany: Omit<Company, 'id'> & { _id: ObjectId } = {
        _id,
        userId: company.userId ?? _id.toString(),
        ...company,
        createdAt: now,
        updatedAt: now,
      }
      const result = await db.collection('companies').insertOne(newCompany)
      return toInterface<Company>({ ...newCompany, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Company>): Promise<Company | null> => {
      const db = await getDatabase()
      const updateDoc = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('companies').findOneAndUpdate(
        query,
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Company>(result.value) : null
    },
  },
  bids: {
    getAll: async (): Promise<Bid[]> => {
      const db = await getDatabase()
      const bids = await db.collection('bids').find({}).toArray()
      return bids.map(doc => toInterface<Bid>(doc))
    },
    getById: async (id: string): Promise<Bid | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const bid = await db.collection('bids').findOne(query)
      return bid ? toInterface<Bid>(bid) : undefined
    },
    getByCandidateId: async (candidateId: string): Promise<Bid[]> => {
      const db = await getDatabase()
      const bids = await db.collection('bids').find({ candidateId }).toArray()
      return bids.map(doc => toInterface<Bid>(doc))
    },
    create: async (bid: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bid> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const newBid = {
        ...bid,
        createdAt: now,
        updatedAt: now,
      }
      const result = await db.collection('bids').insertOne(newBid)
      return toInterface<Bid>({ ...newBid, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Bid>): Promise<Bid | null> => {
      const db = await getDatabase()
      const updateDoc = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('bids').findOneAndUpdate(
        query,
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Bid>(result.value) : null
    },
  },
  subscriptions: {
    getAll: async (): Promise<Subscription[]> => {
      const db = await getDatabase()
      const subscriptions = await db.collection('subscriptions').find({}).toArray()
      return subscriptions.map(doc => toInterface<Subscription>(doc))
    },
    create: async (sub: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> => {
      const db = await getDatabase()
      const newSub = {
        ...sub,
        createdAt: new Date().toISOString(),
      }
      const result = await db.collection('subscriptions').insertOne(newSub)
      return toInterface<Subscription>({ ...newSub, _id: result.insertedId })
    },
  },
  plans: {
    getAll: async (): Promise<Plan[]> => {
      const db = await getDatabase()
      const plans = await db.collection('plans').find({}).toArray()
      return plans.map(doc => toInterface<Plan>(doc))
    },
    getById: async (id: string): Promise<Plan | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const plan = await db.collection('plans').findOne(query)
      return plan ? toInterface<Plan>(plan) : undefined
    },
    create: async (plan: Omit<Plan, 'id' | 'createdAt'>): Promise<Plan> => {
      const db = await getDatabase()
      const newPlan = {
        ...plan,
        createdAt: new Date().toISOString(),
      }
      const result = await db.collection('plans').insertOne(newPlan)
      return toInterface<Plan>({ ...newPlan, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Plan>): Promise<Plan | null> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('plans').findOneAndUpdate(
        query,
        { $set: updates },
        { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Plan>(result.value) : null
    },
  },
  interviews: {
    getAll: async (): Promise<Interview[]> => {
      const db = await getDatabase()
      const interviews = await db.collection('interviews').find({}).toArray()
      return interviews.map(doc => toInterface<Interview>(doc))
    },
    create: async (interview: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interview> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const newInterview = {
        ...interview,
        createdAt: now,
        updatedAt: now,
      }
      const result = await db.collection('interviews').insertOne(newInterview)
      return toInterface<Interview>({ ...newInterview, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Interview>): Promise<Interview | null> => {
      const db = await getDatabase()
      const updateDoc = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('interviews').findOneAndUpdate(
        query,
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Interview>(result.value) : null
    },
  },
  payments: {
    getAll: async (): Promise<Payment[]> => {
      const db = await getDatabase()
      const payments = await db.collection('payments').find({}).toArray()
      return payments.map(doc => toInterface<Payment>(doc))
    },
    create: async (payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
      const db = await getDatabase()
      const newPayment = {
        ...payment,
        createdAt: new Date().toISOString(),
      }
      const result = await db.collection('payments').insertOne(newPayment)
      return toInterface<Payment>({ ...newPayment, _id: result.insertedId })
    },
  },
  settings: {
    getAll: async (): Promise<Settings[]> => {
      const db = await getDatabase()
      const settings = await db.collection('settings').find({}).toArray()
      return settings.map(doc => toInterface<Settings>(doc))
    },
    get: async (key: string): Promise<Settings | undefined> => {
      const db = await getDatabase()
      const setting = await db.collection('settings').findOne({ key })
      return setting ? toInterface<Settings>(setting) : undefined
    },
    set: async (key: string, value: any): Promise<Settings> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const setting = {
        key,
        value,
        updatedAt: now,
      }
      await db.collection('settings').updateOne(
        { key },
        { $set: setting },
        { upsert: true }
      )
      const result = await db.collection('settings').findOne({ key })
      return toInterface<Settings>(result)
    },
  },
  passwordResetTokens: {
    getAll: async (): Promise<PasswordResetToken[]> => {
      const db = await getDatabase()
      const tokens = await db.collection('passwordResetTokens').find({}).toArray()
      return tokens.map(doc => toInterface<PasswordResetToken>(doc))
    },
    getByToken: async (token: string): Promise<PasswordResetToken | undefined> => {
      const db = await getDatabase()
      const resetToken = await db.collection('passwordResetTokens').findOne({
        token,
        expiresAt: { $gt: new Date().toISOString() },
      })
      return resetToken ? toInterface<PasswordResetToken>(resetToken) : undefined
    },
    create: async (email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> => {
      const db = await getDatabase()
      const newToken = {
        email,
        token,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      }
      const result = await db.collection('passwordResetTokens').insertOne(newToken)
      return toInterface<PasswordResetToken>({ ...newToken, _id: result.insertedId })
    },
    deleteByToken: async (token: string): Promise<void> => {
      const db = await getDatabase()
      await db.collection('passwordResetTokens').deleteOne({ token })
    },
    deleteByEmail: async (email: string): Promise<void> => {
      const db = await getDatabase()
      await db.collection('passwordResetTokens').deleteMany({ email })
    },
  },
  agents: {
    getAll: async (): Promise<Agent[]> => {
      const db = await getDatabase()
      const agents = await db.collection('agents').find({}).toArray()
      return agents.map(doc => toInterface<Agent>(doc))
    },
    getByAgencyId: async (agencyId: string): Promise<Agent[]> => {
      const db = await getDatabase()
      const agents = await db.collection('agents').find({ agencyId }).toArray()
      return agents.map(doc => toInterface<Agent>(doc))
    },
    getById: async (id: string): Promise<Agent | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const agent = await db.collection('agents').findOne(query)
      return agent ? toInterface<Agent>(agent) : undefined
    },
    getByEmail: async (email: string): Promise<Agent | undefined> => {
      const db = await getDatabase()
      const agent = await db.collection('agents').findOne({ email })
      return agent ? toInterface<Agent>(agent) : undefined
    },
    getByReferralCode: async (referralCode: string): Promise<Agent | undefined> => {
      const db = await getDatabase()
      const agent = await db.collection('agents').findOne({ referralCode })
      return agent ? toInterface<Agent>(agent) : undefined
    },
    create: async (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const newAgent = { ...agent, createdAt: now, updatedAt: now }
      const result = await db.collection('agents').insertOne(newAgent)
      return toInterface<Agent>({ ...newAgent, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Agent>): Promise<Agent | null> => {
      const db = await getDatabase()
      const updateDoc = { ...updates, updatedAt: new Date().toISOString() }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('agents').findOneAndUpdate(
        query, { $set: updateDoc }, { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Agent>(result.value) : null
    },
    delete: async (id: string): Promise<boolean> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('agents').deleteOne(query)
      return result.deletedCount > 0
    },
  },
  demands: {
    getAll: async (): Promise<Demand[]> => {
      const db = await getDatabase()
      const demands = await db.collection('demands').find({}).sort({ createdAt: -1 }).toArray()
      return demands.map(doc => toInterface<Demand>(doc))
    },
    getOpen: async (): Promise<Demand[]> => {
      const db = await getDatabase()
      const demands = await db.collection('demands').find({ status: 'open' }).sort({ createdAt: -1 }).toArray()
      return demands.map(doc => toInterface<Demand>(doc))
    },
    getByCompanyId: async (companyId: string): Promise<Demand[]> => {
      const db = await getDatabase()
      const demands = await db.collection('demands').find({ companyId }).sort({ createdAt: -1 }).toArray()
      return demands.map(doc => toInterface<Demand>(doc))
    },
    getById: async (id: string): Promise<Demand | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const demand = await db.collection('demands').findOne(query)
      return demand ? toInterface<Demand>(demand) : undefined
    },
    create: async (demand: Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Demand> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const newDemand = { ...demand, createdAt: now, updatedAt: now }
      const result = await db.collection('demands').insertOne(newDemand)
      return toInterface<Demand>({ ...newDemand, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Demand>): Promise<Demand | null> => {
      const db = await getDatabase()
      const updateDoc = { ...updates, updatedAt: new Date().toISOString() }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('demands').findOneAndUpdate(
        query, { $set: updateDoc }, { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Demand>(result.value) : null
    },
  },
  applications: {
    getAll: async (): Promise<Application[]> => {
      const db = await getDatabase()
      const apps = await db.collection('applications').find({}).sort({ submittedAt: -1 }).toArray()
      return apps.map(doc => toInterface<Application>(doc))
    },
    getByAgencyId: async (agencyId: string): Promise<Application[]> => {
      const db = await getDatabase()
      const apps = await db.collection('applications').find({ agencyId }).sort({ submittedAt: -1 }).toArray()
      return apps.map(doc => toInterface<Application>(doc))
    },
    getByCompanyId: async (companyId: string): Promise<Application[]> => {
      const db = await getDatabase()
      const apps = await db.collection('applications').find({ companyId }).sort({ submittedAt: -1 }).toArray()
      return apps.map(doc => toInterface<Application>(doc))
    },
    getByDemandId: async (demandId: string): Promise<Application[]> => {
      const db = await getDatabase()
      const apps = await db.collection('applications').find({ demandId }).sort({ submittedAt: -1 }).toArray()
      return apps.map(doc => toInterface<Application>(doc))
    },
    getById: async (id: string): Promise<Application | undefined> => {
      const db = await getDatabase()
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const app = await db.collection('applications').findOne(query)
      return app ? toInterface<Application>(app) : undefined
    },
    create: async (app: Omit<Application, 'id'>): Promise<Application> => {
      const db = await getDatabase()
      const result = await db.collection('applications').insertOne(app)
      return toInterface<Application>({ ...app, _id: result.insertedId })
    },
    update: async (id: string, updates: Partial<Application>): Promise<Application | null> => {
      const db = await getDatabase()
      const updateDoc = { ...updates, updatedAt: new Date().toISOString() }
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
      const result = await db.collection('applications').findOneAndUpdate(
        query, { $set: updateDoc }, { returnDocument: 'after' }
      )
      return result?.value ? toInterface<Application>(result.value) : null
    },
  },
  candidateSources: {
    getByAgencyId: async (agencyId: string): Promise<CandidateSource[]> => {
      const db = await getDatabase()
      const sources = await db.collection('candidateSources').find({ agencyId }).toArray()
      return sources.map(doc => toInterface<CandidateSource>(doc))
    },
    getByAgentId: async (agentId: string): Promise<CandidateSource[]> => {
      const db = await getDatabase()
      const sources = await db.collection('candidateSources').find({ agentId }).toArray()
      return sources.map(doc => toInterface<CandidateSource>(doc))
    },
    create: async (source: Omit<CandidateSource, 'id' | 'createdAt'>): Promise<CandidateSource> => {
      const db = await getDatabase()
      const newSource = { ...source, createdAt: new Date().toISOString() }
      const result = await db.collection('candidateSources').insertOne(newSource)
      return toInterface<CandidateSource>({ ...newSource, _id: result.insertedId })
    },
  },
  agentPoints: {
    create: async (point: Omit<AgentPoint, 'id' | 'createdAt'>): Promise<AgentPoint> => {
      const db = await getDatabase()
      const now = new Date().toISOString()
      const newPoint = { ...point, createdAt: now }
      const result = await db.collection('agentPoints').insertOne(newPoint)
      return toInterface<AgentPoint>({ ...newPoint, _id: result.insertedId })
    },
    getByAgentId: async (agentId: string): Promise<AgentPoint[]> => {
      const db = await getDatabase()
      const points = await db.collection('agentPoints').find({ agentId }).sort({ createdAt: -1 }).toArray()
      return points.map(doc => toInterface<AgentPoint>(doc))
    },
    getByAgencyId: async (agencyId: string): Promise<AgentPoint[]> => {
      const db = await getDatabase()
      const points = await db.collection('agentPoints').find({ agencyId }).sort({ createdAt: -1 }).toArray()
      return points.map(doc => toInterface<AgentPoint>(doc))
    },
  },
}

// Initialize default plans and super admin
export async function initializeDatabase() {
  // Ensure collections + indexes exist
  try {
    const database = await getDatabase()
    await database.collection('users').createIndex({ email: 1 }, { unique: true })

    await database.collection('candidates').createIndex({ userId: 1 }, { unique: true })
    await database.collection('candidates').createIndex({ email: 1 }, { unique: true })

    await database.collection('agencies').createIndex({ userId: 1 }, { unique: true })
    await database.collection('agencies').createIndex({ email: 1 }, { unique: true })
    await database.collection('agencies').createIndex({ referralLink: 1 }, { unique: true })

    await database.collection('companies').createIndex({ userId: 1 }, { unique: true })
    await database.collection('companies').createIndex({ email: 1 }, { unique: true })
    await database.collection('companies').createIndex({ contactEmail: 1 })
    await database.collection('companies').createIndex({ tradeLicense: 1 })

    await database.collection('passwordResetTokens').createIndex({ token: 1 }, { unique: true })

    await database.collection('agents').createIndex({ agencyId: 1 })
    await database.collection('agents').createIndex({ email: 1 }, { unique: true })
    await database.collection('agents').createIndex({ referralCode: 1 }, { unique: true, sparse: true })
    await database.collection('demands').createIndex({ status: 1 })
    await database.collection('demands').createIndex({ companyId: 1 })
    await database.collection('applications').createIndex({ agencyId: 1 })
    await database.collection('applications').createIndex({ companyId: 1 })
    await database.collection('applications').createIndex({ demandId: 1 })
    await database.collection('applications').createIndex({ candidateId: 1 })
    await database.collection('agentPoints').createIndex({ agentId: 1 })
    await database.collection('agentPoints').createIndex({ agencyId: 1 })
    await database.collection('candidateSources').createIndex({ agencyId: 1 })
    await database.collection('candidateSources').createIndex({ agentId: 1 })
  } catch (e) {
    // If indexes already exist or duplicates are present, don't block app startup
    console.warn('Index initialization warning:', e)
  }

  // Create default plans if they don't exist
  const existingPlans = await db.plans.getAll()
  if (existingPlans.length === 0) {
    // Agency plans
    await db.plans.create({
      name: 'Basic',
      type: 'agency',
      level: 'basic',
      price: 99,
      features: { cvUploads: 50, biddingLimit: 20, jobOffers: 10 },
      isActive: true,
    })
    await db.plans.create({
      name: 'Silver',
      type: 'agency',
      level: 'silver',
      price: 199,
      features: { cvUploads: 150, biddingLimit: 60, jobOffers: 30 },
      isActive: true,
    })
    await db.plans.create({
      name: 'Gold',
      type: 'agency',
      level: 'gold',
      price: 399,
      features: { cvUploads: 500, biddingLimit: 200, jobOffers: 100 },
      isActive: true,
    })
    await db.plans.create({
      name: 'Platinum',
      type: 'agency',
      level: 'platinum',
      price: 799,
      features: { cvUploads: -1, biddingLimit: -1, jobOffers: -1 }, // -1 = unlimited
      isActive: true,
    })
    
    // Company plans
    await db.plans.create({
      name: 'Bronze',
      type: 'company',
      level: 'bronze',
      price: 149,
      features: { cvDownloads: 25 },
      isActive: true,
    })
    await db.plans.create({
      name: 'Silver',
      type: 'company',
      level: 'silver',
      price: 299,
      features: { cvDownloads: 100 },
      isActive: true,
    })
    await db.plans.create({
      name: 'Gold',
      type: 'company',
      level: 'gold',
      price: 599,
      features: { cvDownloads: -1 }, // unlimited
      isActive: true,
    })
  }

  // Create super admin if doesn't exist
  const existingAdmin = await db.users.getByEmail('shabeeb')
  if (!existingAdmin) {
    // Simple password hash (use bcrypt in production)
    const adminUser = await db.users.create({
      email: 'shabeeb',
      password: 'shabeeb255.', // In production, hash this
      role: 'super_admin',
      name: 'Super Admin',
      isActive: true,
    })
    console.log('Super admin created:', adminUser.email)
  }

  // Initialize settings
  await db.settings.set('videoRequired', false)
  await db.settings.set('commissionRate', 0.15) // 15% commission
}
