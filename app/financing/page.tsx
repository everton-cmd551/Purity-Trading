import { getFinancingRegister } from "@/app/actions/financing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function FinancingPage() {
    const loans = await getFinancingRegister();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Financing Register</h1>
                <p className="text-muted-foreground">Track loan funding, repayments, and outstanding balances.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Loan Portfolio</CardTitle>
                    <CardDescription>
                        Overview of all funded deals and their repayment status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                        No active financing records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                loans.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.dealId}</TableCell>
                                        <TableCell>{record.financierName}</TableCell>
                                        <TableCell>-</TableCell> {/* Placeholder for Source */}
                                        <TableCell>{format(record.disbursementDate, "MMM d, yyyy")}</TableCell>
                                        <TableCell className="text-right">{record.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell>{format(record.maturityDate, "MMM d, yyyy")}</TableCell>
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
