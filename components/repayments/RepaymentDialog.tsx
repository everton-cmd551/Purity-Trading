"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRepayment, updateRepayment } from "@/app/(main)/actions/repayment";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface RepaymentDialogProps {
    loans: any[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function RepaymentDialog({ loans, initialData, open: controlledOpen, onOpenChange: setControlledOpen, trigger, onSuccess }: RepaymentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen || setInternalOpen;

    const [selectedLoanId, setSelectedLoanId] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("CASH");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const router = useRouter();

    useEffect(() => {
        if (initialData) {
            // initialData is likely flat: { id, dealId, financierName, date, method, amount }
            // We can't easily change the Deal/Loan it is linked to in Update mode usually.
            // But we need to set the states.
            setDate(new Date(initialData.date).toISOString().split('T')[0]);
            setAmount(initialData.amount.toString());
            setMethod(initialData.method);
            // We don't really set selectedLoanId here because we probably won't let them change the loan for an existing repayment record easily 
            // without re-fetching everything. Display only.
        } else {
            if (open) {
                // Reset for new
                setAmount("");
                setMethod("CASH");
                setSelectedLoanId("");
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [initialData, open]);

    async function handleSubmit() {
        if ((!selectedLoanId && !initialData) || !amount || parseFloat(amount) <= 0) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        let result;
        if (initialData) {
            result = await updateRepayment(initialData.id, {
                date: new Date(date),
                amount: parseFloat(amount),
                method: method
            });
        } else {
            result = await createRepayment({
                loanId: selectedLoanId,
                date: new Date(date),
                amount: parseFloat(amount),
                method: method
            });
        }

        if (result.success) {
            toast.success(initialData ? "Repayment updated successfully." : "Repayment recorded successfully.");
            setOpen(false);
            if (!initialData) {
                setAmount("");
                setSelectedLoanId("");
            }
            if (onSuccess) onSuccess();
            router.refresh();
        } else {
            toast.error(result.error || "Failed to save repayment.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Repayment" : "Record New Repayment"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Modify repayment details." : "This will add a repayment record and update the Cash Book automatically."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Deal Note</Label>
                        {initialData ? (
                            <div className="col-span-3 p-2 bg-muted rounded-md text-sm font-medium">
                                {initialData.dealId} - {initialData.financierName}
                            </div>
                        ) : (
                            <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Deal Note" />
                                </SelectTrigger>
                                <SelectContent>
                                    {loans.map((loan) => (
                                        <SelectItem key={loan.id} value={loan.id}>
                                            {loan.dealId} - {loan.financierName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date</Label>
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
                    <Button onClick={handleSubmit}>{initialData ? "Update Repayment" : "Save Repayment"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
