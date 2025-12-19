"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    Banknote,
    Package,
    Wallet,
    Settings,
    BarChart3,
    Users
} from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Deal Register", href: "/deals", icon: FileText },
    { name: "Financing", href: "/financing", icon: Banknote },
    { name: "Repayments", href: "/repayments", icon: Banknote },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Cust. Deliveries", href: "/receivables", icon: Users },
    { name: "Cust. Payments", href: "/customer-payments", icon: Wallet },
    { name: "Cash Book", href: "/treasury", icon: Wallet },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Master Data", href: "/master-data", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card px-4 py-6">
            <div className="mb-8 flex items-center gap-2 px-2">
                <div className="h-8 w-8 rounded-lg bg-primary" />
                <span className="text-xl font-bold tracking-tight">Purity Trading</span>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                                isActive ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-4 border-t">
                <div className="px-2 py-2 text-xs text-muted-foreground">
                    System Version 1.0
                </div>
            </div>
        </div>
    );
}
