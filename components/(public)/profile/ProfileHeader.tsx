import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types/user'
import { User } from 'lucide-react'

interface ProfileHeaderProps {
    profile: Profile
    email?: string | null
}

export function ProfileHeader({ profile, email }: ProfileHeaderProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-black tracking-tight">
                            {profile.full_name || 'User'}
                        </h2>
                        {email && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {email}
                            </p>
                        )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {profile.role}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground">
                    <p>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                    })}</p>
                </div>
            </CardContent>
        </Card>
    )
}

