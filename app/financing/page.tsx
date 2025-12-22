import { getFinancingRegister } from "@/app/actions/financing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancingTable } from "@/components/financing/FinancingTable";

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
                    <FinancingTable data={loans} />
                </CardContent>
            </Card>
        </div>
    );
}
