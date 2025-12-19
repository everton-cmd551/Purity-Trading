"use client";

import { useState, useEffect, useMemo } from "react";
import { getCustomerPayments, getOpenInvoices, createCustomerPayment } from "@/app/actions/customer-payments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CustomerPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    // Form State
    const [selectedDeliveryId, setSelectedDeliveryId] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("CASH");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Derived Form State
    const selectedInvoice = useMemo(() =>
        invoices.find(inv => inv.id === selectedDeliveryId),
        [selectedDeliveryId, invoices]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [paymentsData, invoicesData] = await Promise.all([
            getCustomerPayments(),
            getOpenInvoices()
        ]);
        setPayments(paymentsData);
        setInvoices(invoicesData);
    }

    async function handleSubmit() {
        if (!selectedDeliveryId || !amount || parseFloat(amount) <= 0) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        if (selectedInvoice && parseFloat(amount) > selectedInvoice.outstandingAmount + 0.01) {
            toast.warning("Note: Payment exceeds outstanding balance.");
            // Non-blocking warning
        }

        const result = await createCustomerPayment({
            deliveryId: selectedDeliveryId,
            date: new Date(date),
            amount: parseFloat(amount),
            method: method
        });

        if (result.success) {
            toast.success("Payment recorded successfully.");
            setIsDialogOpen(false);
            setAmount("");
            setSelectedDeliveryId("");
            loadData();
            router.refresh();
        } else {
            toast.error("Failed to record payment.");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Payments Sheet</h1>
                    <p className="text-muted-foreground">Authoritative ledger for all customer receipts.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Record New Payment</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Record Customer Receipt</DialogTitle>
                            <DialogDescription>
                                This will record a consolidated receipt against a specific invoice.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Invoice / Deal</Label>
                                <Select value={selectedDeliveryId} onValueChange={setSelectedDeliveryId}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Invoice to Pay" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {invoices.map((inv) => (
                                            <SelectItem key={inv.id} value={inv.id}>
                                                {inv.invoiceNumber} | {inv.dealId} | {inv.customerName} (Outst: ${inv.outstandingAmount.toLocaleString()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedInvoice && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Customer</Label>
                                    <div className="col-span-3 p-2 bg-muted rounded-md text-sm font-medium">
                                        {selectedInvoice.customerName}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Date Received</Label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Method</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">CASH</SelectItem>
                                        <SelectItem value="NOSTRO">NOSTRO</SelectItem>
                                        <SelectItem value="NOSTRO / BANK">NOSTRO / BANK</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Amount ($)</Label>
                                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" placeholder="0.00" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit}>Save Receipt</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
