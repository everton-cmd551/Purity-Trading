"use client";

import { useEffect, useState } from "react";
import { getReportsData, ReportsData } from "@/app/(main)/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Package, CreditCard, Activity } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const reportData = await getReportsData();
        setData(reportData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/reports">
          <Button variant="outline">
            View Full Reports <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.pl.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.pl.marginPercentage.toFixed(1)}% Margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Inventory</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.inventory.totalOutstanding.toLocaleString() ?? "0"} MT
            </div>
            <p className="text-xs text-muted-foreground">
              Contracted not yet Delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receivables</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.receivables.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding Invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Debt</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.debt.outstandingPrincipal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Principal Balance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
