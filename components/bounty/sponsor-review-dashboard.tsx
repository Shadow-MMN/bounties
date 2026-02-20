"use client"

import * as React from "react"
import { format } from "date-fns"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReviewSubmission } from "@/types/participation"

type Action = 'approve' | 'reject' | 'request_revision'

interface SponsorReviewDashboardProps {
  submissions: ReviewSubmission[]
  onAction?: (submissionId: string, action: Action) => Promise<void> | void
}

export function SponsorReviewDashboard({ submissions, onAction }: SponsorReviewDashboardProps) {
  const [items, setItems] = React.useState<ReviewSubmission[]>(() => submissions)
  const [loadingIds, setLoadingIds] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => setItems(submissions), [submissions])

  const handleAction = async (id: string, action: Action) => {
    // optimistic update
    setLoadingIds(s => ({ ...s, [id]: true }))
    const prev = items
    setItems(curr => curr.map(it => (it.submissionId === id ? { ...it, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending' } : it)))

    try {
      const maybe = onAction && onAction(id, action)
      if (maybe && maybe instanceof Promise) await maybe
    } catch (err) {
      // revert on error
      setItems(prev)
    } finally {
      setLoadingIds(s => {
        const copy = { ...s }
        delete copy[id]
        return copy
      })
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && <div className="text-sm text-muted-foreground">No submissions to review.</div>}

      <ul className="space-y-2">
        {items.map(sub => (
          <li key={sub.submissionId} className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div className="flex items-center gap-3">
              <Avatar>
                {sub.contributor.avatarUrl ? (
                  <AvatarImage src={sub.contributor.avatarUrl} alt={sub.contributor.username} />
                ) : (
                  <AvatarFallback>{sub.contributor.username?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="font-medium">{sub.contributor.username}</div>
                <div className="text-xs text-muted-foreground">Submitted {format(new Date(sub.submittedAt), 'Pp')}</div>
                {sub.milestoneId && <div className="text-xs text-muted-foreground">Milestone: {sub.milestoneId}</div>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="mr-4 text-sm">
                {sub.status === 'pending' && <span className="text-yellow-600">Pending</span>}
                {sub.status === 'approved' && <span className="text-green-600">Approved</span>}
                {sub.status === 'rejected' && <span className="text-red-600">Rejected</span>}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleAction(sub.submissionId, 'request_revision')} disabled={!!loadingIds[sub.submissionId]}>
                  Request revision
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(sub.submissionId, 'reject')} disabled={!!loadingIds[sub.submissionId]} className="text-red-600">
                  Reject
                </Button>
                <Button size="sm" onClick={() => handleAction(sub.submissionId, 'approve')} disabled={!!loadingIds[sub.submissionId]} className="text-green-600">
                  Approve
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SponsorReviewDashboard
