import { getDeals, getMasterDataOptions } from "@/app/actions/deal";
import { DealForm } from "@/components/deals/DealForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function DealRegisterPage() {
    const deals = await getDeals();
    const masterData = await getMasterDataOptions();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deal Register</h1>
                    <p className="text-muted-foreground">Master commercial contract table.</p>
                </div>
            </div>

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">Deal List</TabsTrigger>
                    <TabsTrigger value="new">New Deal Note</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Deals</CardTitle>
                            <CardDescription>
                                Overview of all commercial contracts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Deal Note</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Commodity</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Financier</TableHead>
                                        <TableHead className="text-right">Tonnage</TableHead>
                                        <TableHead className="text-right">Deal Value ($)</TableHead>
                                        <TableHead className="text-right">Sales Value ($)</TableHead>
                                        <TableHead>Disburs. Date</TableHead>
                                        <TableHead>Maturity</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deals.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                                                No deals found. Create a new deal note to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        deals.map((deal) => {
                                            const loan = deal.loan;
                                            return (
                                                <TableRow key={deal.id}>
                                                    <TableCell className="font-medium">{deal.id}</TableCell>
                                                    <TableCell>{format(deal.date || new Date(), "MMM d, yyyy")}</TableCell>
                                                    <TableCell>{deal.commodity?.name}</TableCell>
                                                    <TableCell>{deal.supplier?.name}</TableCell>
                                                    <TableCell>{deal.customer?.name}</TableCell>
                                                    <TableCell>{deal.financier?.name || '-'}</TableCell>
                                                    <TableCell className="text-right">{Number(deal.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell className="text-right">{Number(deal.costValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell className="text-right">{Number(deal.expectedSalesValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell>
                                                        {loan?.disbursementDate ? format(loan.disbursementDate, "MMM d, yyyy") : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {loan?.maturityDate ? format(loan.maturityDate, "MMM d, yyyy") : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={deal.status === 'Open' ? 'default' : 'secondary'}>
                                                            {deal.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="new">
                    <DealForm masterData={masterData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
