"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createCustomerPayment, updateCustomerPayment } from "@/app/actions/customer-payments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface PaymentDialogProps {
    invoices: any[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function PaymentDialog({ invoices, initialData, open: controlledOpen, onOpenChange: setControlledOpen, trigger, onSuccess }: PaymentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen || setInternalOpen;

    const [selectedDeliveryId, setSelectedDeliveryId] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("CASH");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const router = useRouter();

    useEffect(() => {
        if (initialData) {
            setSelectedDeliveryId(initialData.dealId || ""); // In edit mode, we might just show deal ID text, not select from dropdown
            // Actually, initialData usually has flattened structure from the table. 
            // We'll trust the parent to pass the right simple object or we parse it.
            // Let's assume initialData is: { id, date, amount, method, deliveryId, invoiceNumber ... }
            setDate(new Date(initialData.date).toISOString().split('T')[0]);
            setAmount(initialData.amount.toString());
            setMethod(initialData.method);
            // We don't set selectedDeliveryId for dropdown because it's disabled in edit mode usually
        } else {
            if (open) {
                // Reset for new
                setAmount("");
                setMethod("CASH");
                setSelectedDeliveryId("");
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [initialData, open]);

    // Derived State for New Payment
    const selectedInvoice = useMemo(() =>
        invoices.find(inv => inv.id === selectedDeliveryId),
        [selectedDeliveryId, invoices]);

    // Auto-fill amount logic (only for new)
    useEffect(() => {
        if (selectedInvoice && !initialData) {
            setAmount(selectedInvoice.outstandingAmount.toFixed(2));
        }
    }, [selectedInvoice, initialData]);

    async function handleSubmit() {
        if ((!selectedDeliveryId && !initialData) || !amount || parseFloat(amount) <= 0) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        if (selectedInvoice && parseFloat(amount) > selectedInvoice.outstandingAmount + 0.01 && !initialData) {
            toast.warning("Note: Payment exceeds outstanding balance.");
        }

        let result;
        if (initialData) {
            result = await updateCustomerPayment(initialData.id, {
                date: new Date(date),
                amount: parseFloat(amount),
                method: method
            });
        } else {
            result = await createCustomerPayment({
                deliveryId: selectedDeliveryId,
                date: new Date(date),
                amount: parseFloat(amount),
                method: method
            });
        }

        if (result.success) {
            toast.success(initialData ? "Payment updated successfully." : "Payment recorded successfully.");
            setOpen(false);
            if (!initialData) {
                setAmount("");
                setSelectedDeliveryId("");
            }
            if (onSuccess) onSuccess();
            router.refresh();
        } else {
            toast.error(result.error || "Failed to save payment.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Payment" : "Record Customer Receipt"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Modify payment details." : "Records a consolidated receipt against a specific invoice."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Invoice / Deal</Label>
                        {initialData ? (
                            <div className="col-span-3 p-2 bg-muted rounded-md text-sm font-medium">
                                {initialData.invoiceNumber} (Deal: {initialData.dealId})
                            </div>
                        ) : (
                            <Select value={selectedDeliveryId} onValueChange={setSelectedDeliveryId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Invoice to Pay" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoices.map((inv) => (
                                        <SelectItem key={inv.id} value={inv.id}>
                                            {inv.dealId} | {inv.invoiceNumber} | {inv.customerName} (Outst: ${inv.outstandingAmount.toLocaleString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {selectedInvoice && !initialData && (
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
                    <Button onClick={handleSubmit}>{initialData ? "Update Payment" : "Save Receipt"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
