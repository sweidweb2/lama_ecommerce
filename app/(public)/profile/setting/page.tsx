export const metadata = {
    title: 'Settings | LAMA',
    description: 'Manage your account settings and preferences.',
}

export default function SettingsPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-10">
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="space-y-8">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <p className="text-muted-foreground">
                        Settings page coming soon...
                    </p>
                </div>
            </div>
        </div>
    )
}
