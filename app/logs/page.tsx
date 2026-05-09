import { prisma } from "@/lib/prisma"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function LogsPage() {
    const logs = await prisma.log.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
            post: {
                select: {
                    keyword: true,
                },
            },
        },
    })

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
                <p className="text-muted-foreground mt-2">
                    Real-time system logs and processing activity.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Last 100 log entries</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm max-h-[600px] overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="opacity-50 text-center py-10">
                                No logs yet. Start processing a batch to see activity.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 py-1 border-b border-slate-800 last:border-0">
                                        <span className="text-slate-500 text-xs shrink-0">
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                        </span>
                                        <Badge
                                            variant={
                                                log.level === "SUCCESS"
                                                    ? "success"
                                                    : log.level === "ERROR"
                                                        ? "destructive"
                                                        : log.level === "WARN"
                                                            ? "warning"
                                                            : "secondary"
                                            }
                                            className="shrink-0 text-xs"
                                        >
                                            {log.level}
                                        </Badge>
                                        {log.post && (
                                            <span className="text-blue-400 shrink-0">
                                                [{log.post.keyword}]
                                            </span>
                                        )}
                                        <span className="flex-1">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
