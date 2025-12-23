"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateLoan } from "@/app/(main)/actions/financing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoanDialogProps {
    initialData: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function LoanDialog({ initialData, open, onOpenChange, onSuccess }: LoanDialogProps) {
    const [disbursementDate, setDisbursementDate] = useState("");
    const [principal, setPrincipal] = useState("");
    const [maturityDate, setMaturityDate] = useState("");
    const [repaymentAmount, setRepaymentAmount] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (initialData && open) {
            setDisbursementDate(new Date(initialData.disbursementDate).toISOString().split('T')[0]);
            setPrincipal(initialData.principal.toString());
            setMaturityDate(new Date(initialData.maturityDate).toISOString().split('T')[0]);
            setRepaymentAmount(initialData.maturityValue.toString());
        }
    }, [initialData, open]);

    async function handleSubmit() {
        if (!disbursementDate || !principal || !maturityDate || !repaymentAmount) {
            toast.error("Please fill in all fields.");
            return;
        }

        const result = await updateLoan(initialData.id, {
            disbursementDate: new Date(disbursementDate),
            principal: parseFloat(principal),
            maturityDate: new Date(maturityDate),
            repaymentAmount: parseFloat(repaymentAmount)
        });

        if (result.success) {
            toast.success("Loan updated successfully.");
            onOpenChange(false);
            if (onSuccess) onSuccess();
            router.refresh();
        } else {
            toast.error("Failed to update loan.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Loan Details</DialogTitle>
                    <DialogDescription>
                        Modify the terms of the financing arrangement.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Deal / Financier</Label>
                        <div className="col-span-3 p-2 bg-muted rounded-md text-sm font-medium">
                            {initialData?.dealId} - {initialData?.financierName}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Disbursement Date</Label>
                        <Input type="date" value={disbursementDate} onChange={(e) => setDisbursementDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Principal ($)</Label>
                        <Input type="number" step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Maturity Date</Label>
                        <Input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Maturity Value ($)</Label>
                        <Input type="number" step="0.01" value={repaymentAmount} onChange={(e) => setRepaymentAmount(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Update Loan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
