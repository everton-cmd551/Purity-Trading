"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteLoan } from "@/app/(main)/actions/financing";
import { LoanDialog } from "@/components/financing/LoanDialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FinancingTableProps {
    data: any[];
}

export function FinancingTable({ data }: FinancingTableProps) {
    const router = useRouter();
    const [editingLoan, setEditingLoan] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the Loan and ALL associated Repayments. This cannot be undone.")) return;

        toast.info("Deleting loan...");
        const result = await deleteLoan(id);
        if (result.success) {
            toast.success("Loan deleted successfully");
            router.refresh();
        } else {
            toast.error("Failed to delete loan");
        }
    };

    const handleEdit = (loan: any) => {
        setEditingLoan(loan);
        setIsDialogOpen(true);
    };

    return (
        <>
            <LoanDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingLoan}
                onSuccess={() => {
                    setEditingLoan(null);
                    router.refresh(); // Ensure strict refresh
                }}
            />

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Deal Note</TableHead>
                        <TableHead>Financier</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Disb. Date</TableHead>
                        <TableHead className="text-right">Principal ($)</TableHead>
                        <TableHead>Maturity Date</TableHead>
                        <TableHead className="text-right">Maturity Val ($)</TableHead>
                        <TableHead className="text-right">Repaid ($)</TableHead>
                        <TableHead className="text-right">Outstanding ($)</TableHead>
                        <TableHead className="text-right">Days Overdue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                                No active financing records found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.dealId}</TableCell>
                                <TableCell>{record.financierName}</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>{format(new Date(record.disbursementDate), "MMM d, yyyy")}</TableCell>
                                <TableCell className="text-right">{record.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell>{format(new Date(record.maturityDate), "MMM d, yyyy")}</TableCell>
                                <TableCell className="text-right">{record.maturityValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{record.repaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className={record.outstandingBalance > 0 ? "text-right font-bold text-destructive" : "text-right font-bold text-green-600"}>
                                    {record.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right">
                                    {record.daysOverdue > 0 ? <span className="text-destructive font-bold">{record.daysOverdue}</span> : 0}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={record.status === 'Closed' ? 'secondary' : 'default'}>
                                        {record.status}
                                    </Badge>
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
                                                onClick={() => handleEdit(record)}
                                            >
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => handleDelete(record.id)}
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
        </>
    );
}
