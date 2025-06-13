"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { userProfile, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(userProfile?.full_name || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const { error } = await updateProfile({
        full_name: fullName,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess("プロフィールが更新されました")
      }
    } catch (err: any) {
      setError(err.message || "プロフィールの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
          <CardDescription>プロフィール情報を更新します</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" value={userProfile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">氏名</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">会社</Label>
              <Input id="company" value={userProfile.company_name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">役割</Label>
              <Input id="role" value={userProfile.role} disabled />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              更新
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
