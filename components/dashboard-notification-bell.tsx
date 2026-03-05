"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export type NotificationRecipientType =
  | "company"
  | "agency"
  | "agent"
  | "admin"
  | "candidate"

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

interface DashboardNotificationBellProps {
  role: NotificationRecipientType
  entityId: string
  className?: string
  /** Optional: link to full notifications page if you have one */
  viewAllHref?: string
}

function formatTime(createdAt: string): string {
  const d = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export function DashboardNotificationBell({
  role,
  entityId,
  className,
  viewAllHref,
}: DashboardNotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!role || !entityId) return
    try {
      const params = new URLSearchParams({ role, entityId, limit: "30" })
      const res = await fetch(`/api/notifications?${params}`)
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [role, entityId])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, role, entityId }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[280px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="py-1">
              {notifications.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    item={n}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        {viewAllHref && notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href={viewAllHref} onClick={() => setOpen(false)}>
                View all
              </Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationRow({
  item,
  onNavigate,
}: {
  item: NotificationItem
  onNavigate: () => void
}) {
  const content = (
    <div
      className={cn(
        "flex flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
        !item.read && "bg-primary/5"
      )}
    >
      <span className="text-sm font-medium text-foreground">{item.title}</span>
      <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
      <span className="mt-1 text-xs text-muted-foreground">
        {formatTime(item.createdAt)}
      </span>
    </div>
  )

  if (item.link) {
    return (
      <Link href={item.link} onClick={onNavigate}>
        {content}
      </Link>
    )
  }
  return content
}
