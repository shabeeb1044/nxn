  "use client"

  import { useEffect, useState } from "react"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
  import { Switch } from "@/components/ui/switch"
  import { MessageBanner } from "@/components/ui/message-banner"
  import { ConfirmDialog } from "@/components/ui/confirm-dialog"
  import {
    Plus,
    Edit,
    Trash2,
    UserCog,
    Loader2,
  } from "lucide-react"
  import { PageLoader } from "@/components/page-loader"

  interface Agent {
    id: string
    name: string
    email: string
    phone: string
    commissionPercent: number
    referralCode: string
    isActive: boolean
    totalReferrals: number
    totalPlacements: number
    totalEarnings: number
    createdAt: string
  }

  const emptyAgent = { name: "", email: "", password: "", phone: "", commissionPercent: 10 }

  export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [agencyId, setAgencyId] = useState("")
    const [addOpen, setAddOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [formData, setFormData] = useState(emptyAgent)
    const [editId, setEditId] = useState("")
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" })

    useEffect(() => {
      const user = localStorage.getItem("user")
      if (!user) return
      const { agencyId: aid } = JSON.parse(user)
      setAgencyId(aid)
      loadAgents(aid)
    }, [])

    const loadAgents = async (aid: string) => {
      try {
        const res = await fetch(`/api/agency/agents?agencyId=${aid}`)
        const data = await res.json()
        if (data.success) setAgents(data.agents)
      } catch {
        setMessage({ type: "error", text: "Failed to load agents" })
      } finally {
        setLoading(false)
      }
    }

    const handleAdd = async () => {
      if (!formData.name || !formData.email || !formData.password) {
        setMessage({ type: "error", text: "Name, email, and password are required" })
        return
      }
      setMessage(null)
      setSaving(true)
      try {
        const res = await fetch("/api/agency/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, agencyId }),
        })
        const data = await res.json()
        if (data.success) {
          setMessage({ type: "success", text: "Agent added successfully" })
          setAddOpen(false)
          setFormData(emptyAgent)
          loadAgents(agencyId)
        } else {
          setMessage({ type: "error", text: data.error || "Failed to add agent" })
        }
      } catch {
        setMessage({ type: "error", text: "Failed to add agent" })
      } finally {
        setSaving(false)
      }
    }

    const handleEdit = async () => {
      setMessage(null)
      setSaving(true)
      try {
        const { password, ...rest } = formData
        const payload = password ? { ...rest, password } : rest
        const res = await fetch(`/api/agency/agent/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success) {
          setMessage({ type: "success", text: "Agent updated" })
          setEditOpen(false)
          loadAgents(agencyId)
        } else {
          setMessage({ type: "error", text: data.error || "Update failed" })
        }
      } catch {
        setMessage({ type: "error", text: "Update failed" })
      } finally {
        setSaving(false)
      }
    }

    const handleDelete = async (id: string) => {
      setDeleteConfirm({ open: true, id })
    }

    const confirmDelete = async () => {
      const id = deleteConfirm.id
      try {
        const res = await fetch(`/api/agency/agent/${id}`, { method: "DELETE" })
        const data = await res.json()
        if (data.success) {
          setMessage({ type: "success", text: "Agent deleted" })
          setAgents(prev => prev.filter(a => a.id !== id))
        } else {
          setMessage({ type: "error", text: data.error || "Delete failed" })
        }
      } catch {
        setMessage({ type: "error", text: "Delete failed" })
      }
    }

    const toggleActive = async (agent: Agent) => {
      const newStatus = !agent.isActive
    
      // ✅ Optimistic UI update (instant change)
      setAgents(prev =>
        prev.map(a =>
          a.id === agent.id ? { ...a, isActive: newStatus } : a
        )
      )
    
      try {
        const res = await fetch(`/api/agency/agent/${agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newStatus }),
        })
    
        const data = await res.json()
    
  
        if (!data.success) {
          setAgents(prev =>
            prev.map(a =>
              a.id === agent.id ? { ...a, isActive: agent.isActive } : a
            )
          )
          setMessage({ type: "error", text: "Failed to update status" })
        }
      } catch {
      
        setAgents(prev =>
          prev.map(a =>
            a.id === agent.id ? { ...a, isActive: agent.isActive } : a
          )
        )
        setMessage({ type: "error", text: "Failed to update status" })
      }
    }

    if (loading) {
      return <PageLoader />
    }

    return (
      <div className="space-y-6">
        <MessageBanner message={message} onDismiss={() => setMessage(null)} className="mb-2" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Agents ({agents.length})</h1>
            <p className="text-sm text-muted-foreground">Manage your internal recruiters</p>
          </div>
          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (o) setFormData(emptyAgent) }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Agent</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
                <DialogDescription>Create a new recruiter agent for your agency</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="add-name">Name *</Label>
                  <Input id="add-name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-email">Email *</Label>
                  <Input id="add-email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-password">Password *</Label>
                  <Input id="add-password" type="password" placeholder="Enter password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-phone">Phone</Label>
                  <Input id="add-phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-commission">Commission % (0-100)</Label>
                  <Input id="add-commission" type="number" min={0} max={100} value={formData.commissionPercent} onChange={e => setFormData(p => ({ ...p, commissionPercent: Number(e.target.value) }))} />
                </div>
                <Button onClick={handleAdd} disabled={saving} className="w-full">
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Agent"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <UserCog className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">No agents yet</p>
                <p className="text-sm text-muted-foreground">Add your first recruiter agent</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Placements</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map(agent => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-muted-foreground">{agent.email}</TableCell>
                        <TableCell>{agent.commissionPercent}%</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-xs">{agent.referralCode}</code>
                        </TableCell>
                        <TableCell>{agent.totalReferrals}</TableCell>
                        <TableCell>{agent.totalPlacements}</TableCell>
                        <TableCell>₹{agent.totalEarnings.toLocaleString()}</TableCell>
                        <TableCell>
                          <Switch checked={agent.isActive} onCheckedChange={() => toggleActive(agent)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditId(agent.id)
                                setFormData({ name: agent.name, email: agent.email, password: "", phone: agent.phone, commissionPercent: agent.commissionPercent })
                                setEditOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(agent.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>Update agent details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input id="edit-name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input id="edit-email" type="email" value={formData.email} disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                <Input id="edit-password" type="password" placeholder="Leave blank to keep current" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-commission">Commission % (0-100)</Label>
                <Input id="edit-commission" type="number" min={0} max={100} value={formData.commissionPercent} onChange={e => setFormData(p => ({ ...p, commissionPercent: Number(e.target.value) }))} />
              </div>
              <Button onClick={handleEdit} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
          title="Delete agent?"
          description="This will permanently remove this agent. They will no longer be able to access the portal. This action cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    )
  }
