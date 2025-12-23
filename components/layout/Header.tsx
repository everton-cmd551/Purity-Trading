"use client";

import { useSession, signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, User } from "lucide-react";

export function Header() {
    const { data: session, status } = useSession();
    const isLoading = status === "loading";

    return (
        <header className="h-16 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="font-semibold text-lg">
                Control System
            </div>

            <div className="flex items-center gap-4">
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground hidden md:block">
                            {session?.user?.name || session?.user?.email || "User"}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-secondary">
                                    <User className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-muted-foreground">
                                    {session?.user?.email}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </header>
    );
}
