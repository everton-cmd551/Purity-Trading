import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck, Wallet, ShoppingBag } from "lucide-react";

const modules = [
    {
        title: "Suppliers",
        description: "Manage grain suppliers and contact details",
        href: "/master-data/suppliers",
        icon: Truck,
    },
    {
        title: "Customers",
        description: "Manage offtake customers and buyers",
        href: "/master-data/customers",
        icon: Users,
    },
    {
        title: "Financiers",
        description: "Manage financier relationships and terms",
        href: "/master-data/financiers",
        icon: Wallet,
    },
    {
        title: "Commodities",
        description: "Define tradeable commodities (e.g. White Maize)",
        href: "/master-data/commodities",
        icon: ShoppingBag,
    },
];

export default function MasterDataPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
                <p className="text-muted-foreground">Manage core entities and settings.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {modules.map((module) => (
                    <Link key={module.href} href={module.href}>
                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {module.title}
                                </CardTitle>
                                <module.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{module.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
