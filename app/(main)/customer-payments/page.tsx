"use client";

import { useState, useEffect } from "react";
import { getCustomerPayments, getOpenInvoices, deleteCustomerPayment } from "@/app/(main)/actions/customer-payments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, MoreHorizontal, Trash, Edit } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentDialog } from "@/components/receivables/PaymentDialog";

export default function CustomerPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Edit State
    const [editingPayment, setEditingPayment] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [paymentsData, invoicesData] = await Promise.all([
                getCustomerPayments(),
                getOpenInvoices()
            ]);
            setPayments(paymentsData || []);
            setInvoices(invoicesData || []);
        } catch (error) {
            console.error("Failed to load payment data:", error);
            toast.error("Failed to load data. Please refresh.");
        }
    }

    const handleCreate = () => {
        setIsCreateDialogOpen(true);
    };

    const handleEdit = (payment: any) => {
        setEditingPayment(payment);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment?")) return;
        toast.info("Deleting payment...");
        const result = await deleteCustomerPayment(id);
        if (result.success) {
            toast.success("Payment deleted successfully");
            loadData();
            router.refresh();
        } else {
            toast.error("Failed to delete payment");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Payments Sheet</h1>
                    <p className="text-muted-foreground">Authoritative ledger for all customer receipts.</p>
                </div>
                <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Record New Payment</Button>
            </div>

            <PaymentDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                invoices={invoices}
                onSuccess={loadData}
            />

            <PaymentDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                invoices={[]} // Not needed for edit
                initialData={editingPayment}
                onSuccess={loadData}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Receipts Ledger</CardTitle>
                    <CardDescription>
                        Transactional history of all money received from customers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Deal Note</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Commodity</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount ($)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No payments recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>
                                            <div className="font-medium">{format(new Date(p.date), "MMM d, yyyy")}</div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Badge variant="outline">{p.dealId}</Badge>
                                        </TableCell>
                                        <TableCell>{p.customerName}</TableCell>
                                        <TableCell>{p.invoiceNumber}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{p.commodityName}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {p.method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-green-600">
                                            {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                                        onClick={() => handleEdit(p)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(p.id)}
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
