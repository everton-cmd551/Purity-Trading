"use client";

import { useState, useEffect } from "react";
import { getReportsData, ReportsData } from "@/app/(main)/actions/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Package, TrendingUp, CreditCard, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const reportData = await getReportsData();
                setData(reportData);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (!data) return <div>Failed to load data.</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
                <p className="text-muted-foreground">Real-time overview of business performance and financial health.</p>
            </div>

            {/* Top Level Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Profit (Realized)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.pl.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.pl.marginPercentage.toFixed(1)}% Margin on ${data.pl.totalRevenue.toLocaleString()} Revenue
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.receivables.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Invoiced: ${data.receivables.totalInvoiced.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Inventory (Contra)</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.inventory.totalOutstanding.toLocaleString()} MT</div>
                        <p className="text-xs text-muted-foreground">
                            Est. Value: ${data.inventory.stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Debt Exposure</CardTitle>
                        <CreditCard className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.debt.outstandingPrincipal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Original Principal: ${data.debt.totalBorrowed.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Profit & Loss Summary</CardTitle>
                        <CardDescription>Breakdown of realized revenue, COGS, and margins.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* Simple table style presentation since we don't have charts installed */}
                        <div className="space-y-4 px-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="font-medium">Total Revenue (Invoiced)</span>
                                <span>${data.pl.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2 text-muted-foreground">
                                <span>Cost of Goods Sold</span>
                                <span>-${data.pl.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="font-bold">Gross Profit</span>
                                <span className="font-bold text-green-600">${data.pl.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                                <span>Margin Efficiency</span>
                                <span>{data.pl.marginPercentage.toFixed(2)}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Key Performance Indicators</CardTitle>
                        <CardDescription>Operational metrics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Collection Rate</p>
                                    <p className="text-sm text-muted-foreground">
                                        Percentage of invoiced amount collected
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">
                                    {data.receivables.totalInvoiced > 0
                                        ? ((data.receivables.totalReceived / data.receivables.totalInvoiced) * 100).toFixed(1) + "%"
                                        : "N/A"}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Fulfillment Rate</p>
                                    <p className="text-sm text-muted-foreground">
                                        Contracted tons vs Delivered tons
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">
                                    {data.inventory.totalContracted > 0
                                        ? ((data.inventory.totalDelivered / data.inventory.totalContracted) * 100).toFixed(1) + "%"
                                        : "N/A"}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Debt Service Coverage</p>
                                    <p className="text-sm text-muted-foreground">
                                        Gross Profit / Total Debt
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">
                                    {data.debt.totalBorrowed > 0
                                        ? (data.pl.grossProfit / data.debt.totalBorrowed).toFixed(2) + "x"
                                        : "∞"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
