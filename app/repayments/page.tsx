"use client";

import { useState, useEffect, useMemo } from "react";
import { getRepaymentData, getOpenLoans, deleteRepayment } from "@/app/actions/repayment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, RotateCcw, MoreHorizontal, Trash, Edit } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RepaymentDialog } from "@/components/repayments/RepaymentDialog";

export default function RepaymentsPage() {
    const [repayments, setRepayments] = useState<any[]>([]);
    const [loans, setLoans] = useState<any[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Edit State
    const [editingRepayment, setEditingRepayment] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const router = useRouter();

    // Filter State
    const [filterDealId, setFilterDealId] = useState("");
    const [filterFinancier, setFilterFinancier] = useState("ALL");
    const [filterMethod, setFilterMethod] = useState("ALL");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [repaymentData, loanData] = await Promise.all([
            getRepaymentData(),
            getOpenLoans()
        ]);
        setRepayments(repaymentData);
        setLoans(loanData);
    }

    const handleCreate = () => {
        setIsCreateDialogOpen(true);
    };

    const handleEdit = (repayment: any) => {
        setEditingRepayment(repayment);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this repayment?")) return;
        toast.info("Deleting repayment...");
        const result = await deleteRepayment(id);
        if (result.success) {
            toast.success("Repayment deleted successfully");
            loadData();
            router.refresh();
        } else {
            toast.error("Failed to delete repayment");
        }
    };

    // Derived Data
    const uniqueFinanciers = useMemo(() => {
        const financiers = new Set(repayments.map(r => r.financierName));
        return Array.from(financiers).sort();
    }, [repayments]);

    const filteredRepayments = useMemo(() => {
        return repayments.filter(r => {
            const matchesDeal = filterDealId ? r.dealId.toLowerCase().includes(filterDealId.toLowerCase()) : true;
            const matchesFinancier = filterFinancier !== "ALL" ? r.financierName === filterFinancier : true;
            const matchesMethod = filterMethod !== "ALL" ? r.method === filterMethod : true;

            let matchesDate = true;
            if (filterStartDate) {
                matchesDate = matchesDate && new Date(r.date) >= new Date(filterStartDate);
            }
            if (filterEndDate) {
                matchesDate = matchesDate && new Date(r.date) <= new Date(filterEndDate);
            }

            return matchesDeal && matchesFinancier && matchesMethod && matchesDate;
        });
    }, [repayments, filterDealId, filterFinancier, filterMethod, filterStartDate, filterEndDate]);

    const stats = useMemo(() => {
        const total = filteredRepayments.reduce((sum, r) => sum + r.amount, 0);
        return {
            total,
            count: filteredRepayments.length
        };
    }, [filteredRepayments]);

    const resetFilters = () => {
        setFilterDealId("");
        setFilterFinancier("ALL");
        setFilterMethod("ALL");
        setFilterStartDate("");
        setFilterEndDate("");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Repayment Ledger</h1>
                    <p className="text-muted-foreground">Manage and track loan repayments to financiers.</p>
                </div>
                <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Record Repayment</Button>
            </div>

            <RepaymentDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                loans={loans}
                onSuccess={loadData}
            />

            <RepaymentDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                loans={loans}
                initialData={editingRepayment}
                onSuccess={() => {
                    setEditingRepayment(null);
                    loadData();
                }}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Repaid</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {stats.count} transaction{stats.count !== 1 && 's'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Repayment Transactions</CardTitle>
                            <CardDescription>
                                Detailed ledger of all repayments.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={resetFilters} className="h-8">
                            <RotateCcw className="mr-2 h-3 w-3" />
                            Reset Filters
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <Input
                            placeholder="Filter Deal Note..."
                            value={filterDealId}
                            onChange={(e) => setFilterDealId(e.target.value)}
                        />
                        <Select value={filterFinancier} onValueChange={setFilterFinancier}>
                            <SelectTrigger>
                                <SelectValue placeholder="Financier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Financiers</SelectItem>
                                {uniqueFinanciers.map(f => (
                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterMethod} onValueChange={setFilterMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Payment Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Methods</SelectItem>
                                <SelectItem value="CASH">CASH</SelectItem>
                                <SelectItem value="NOSTRO">NOSTRO</SelectItem>
                                <SelectItem value="NOSTRO / BANK">NOSTRO / BANK</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                className="text-xs"
                            />
                            <Input
                                type="date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Deal Note</TableHead>
                                <TableHead>Financier</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount ($)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRepayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No repayments found matching filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRepayments.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <div className="font-medium">{format(new Date(r.date), "MMM d, yyyy")}</div>
                                            <div className="text-xs text-muted-foreground hidden md:block">
                                                {format(new Date(r.date), "EEEE")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Badge variant="outline">{r.dealId}</Badge>
                                        </TableCell>
                                        <TableCell>{r.financierName}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {r.method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(r)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(r.id)}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
