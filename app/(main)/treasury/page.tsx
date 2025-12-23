"use client";

import { useState, useEffect, useMemo } from "react";
import { getCashBook } from "@/app/(main)/actions/treasury";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TreasuryPage() {
    const [entries, setEntries] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const data = await getCashBook();
        setEntries(data);
    }

    const balances = useMemo(() => {
        let cash = 0;
        let bank = 0;
        // Note: This is a simple running total of fetched entries. 
        // For accurate total balance, we'd need a separate aggregate query or scan all history.
        // For now, assuming fetched entries are enough or we display "Movement" vs "Balance".
        // Let's just sum what we see for movement analysis.

        entries.forEach(e => {
            cash += (Number(e.cashIn) - Number(e.cashOut));
            bank += (Number(e.bankIn) - Number(e.bankOut));
        });
        return { cash, bank };
    }, [entries]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cash Book</h1>
                <p className="text-muted-foreground">Detailed record of daily cash and bank transactions.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Cash Movement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${balances.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Bank Movement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${balances.bank.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction Ledger</CardTitle>
                    <CardDescription>
                        chronological list of receipts and payments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Cash In</TableHead>
                                <TableHead className="text-right">Cash Out</TableHead>
                                <TableHead className="text-right">Bank In</TableHead>
                                <TableHead className="text-right">Bank Out</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No transactions recorded.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((e) => (
                                    <TableRow key={e.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {format(new Date(e.date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>{e.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{e.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            {Number(e.cashIn) > 0 ? Number(e.cashIn).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-destructive">
                                            {Number(e.cashOut) > 0 ? Number(e.cashOut).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            {Number(e.bankIn) > 0 ? Number(e.bankIn).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-destructive">
                                            {Number(e.bankOut) > 0 ? Number(e.bankOut).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
