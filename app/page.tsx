export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium">Total Deals</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium">Active Loans</div>
          <div className="text-2xl font-bold">$0.00</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium">Inventory Value</div>
          <div className="text-2xl font-bold">$0.00</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium">Cash Balance</div>
          <div className="text-2xl font-bold">$0.00</div>
        </div>
      </div>
    </div>
  );
}
