export function Header() {
    return (
        <header className="h-16 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="font-semibold text-lg">
                {/* Breadcrumb or dynamic title could go here */}
                Control System
            </div>

            <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                    Admin User
                </div>
                <div className="h-8 w-8 rounded-full bg-secondary" />
            </div>
        </header>
    );
}
