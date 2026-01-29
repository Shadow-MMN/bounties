"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface ApplicationDialogProps {
    bountyId: string
    bountyTitle: string
    onApply: (data: { coverLetter: string, portfolioUrl?: string }) => Promise<boolean>
    trigger: React.ReactNode
}

export function ApplicationDialog({ bountyTitle, onApply, trigger }: ApplicationDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState("")
    const [portfolioUrl, setPortfolioUrl] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const success = await onApply({ coverLetter, portfolioUrl })
            if (success) {
                setOpen(false)
            }
        } catch (error) {
            console.error("Failed to submit application", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-background text-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Apply for Bounty</DialogTitle>
                    <DialogDescription>
                        Submit your application for &quot;{bountyTitle}&quot;.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="coverLetter">Cover Letter</Label>
                            <Textarea
                                id="coverLetter"
                                placeholder="Explain why you are a good fit..."
                                className="min-h-[150px]"
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="portfolio">Portfolio URL (Optional)</Label>
                            <Input
                                id="portfolio"
                                placeholder="https://..."
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Submitting..." : "Submit Application"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
