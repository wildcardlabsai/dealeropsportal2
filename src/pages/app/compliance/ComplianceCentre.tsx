import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, FileText, Users, Clock, AlertTriangle, Clipboard, BookOpen, Bell, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDataSubjectRequests, useComplaints, useRetentionQueue, useComplianceIncidents } from "@/hooks/useCompliance";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import ConsentsTab from "./tabs/ConsentsTab";
import DSRTab from "./tabs/DSRTab";
import RetentionTab from "./tabs/RetentionTab";
import ComplaintsTab from "./tabs/ComplaintsTab";
import PoliciesTab from "./tabs/PoliciesTab";
import IncidentsTab from "./tabs/IncidentsTab";
import AuditTab from "./tabs/AuditTab";

export default function ComplianceCentre() {
  const { data: dsrs } = useDataSubjectRequests();
  const { data: complaints } = useComplaints();
  const { data: retentionItems } = useRetentionQueue("pending");
  const { data: incidents } = useComplianceIncidents();

  const openDSR = dsrs?.filter((d: any) => !["completed", "rejected"].includes(d.status)).length ?? 0;
  const overdueDSR = dsrs?.filter((d: any) => {
    if (["completed", "rejected"].includes(d.status)) return false;
    return new Date(d.due_at) < new Date();
  }).length ?? 0;
  const pendingRetention = retentionItems?.length ?? 0;
  const openComplaints = complaints?.filter((c: any) => !["resolved", "closed"].includes(c.status)).length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-xs text-amber-300">
          Decision support only, not legal advice. Templates provided are starting points — always seek professional legal guidance.
        </AlertDescription>
      </Alert>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Compliance Centre
        </h1>
        <p className="text-sm text-muted-foreground">GDPR, complaints, data retention & audit management</p>
      </div>

      {/* Dashboard tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Open Data Requests</span>
            </div>
            <p className="text-2xl font-bold">{openDSR}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Overdue Requests</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{overdueDSR}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Pending Deletions</span>
            </div>
            <p className="text-2xl font-bold">{pendingRetention}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clipboard className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Open Complaints</span>
            </div>
            <p className="text-2xl font-bold">{openComplaints}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="consents">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="consents"><Users className="h-3 w-3 mr-1" /> Consents</TabsTrigger>
          <TabsTrigger value="dsr"><FileText className="h-3 w-3 mr-1" /> Data Requests</TabsTrigger>
          <TabsTrigger value="retention"><Clock className="h-3 w-3 mr-1" /> Retention</TabsTrigger>
          <TabsTrigger value="complaints"><Clipboard className="h-3 w-3 mr-1" /> Complaints</TabsTrigger>
          <TabsTrigger value="policies"><BookOpen className="h-3 w-3 mr-1" /> Policies</TabsTrigger>
          <TabsTrigger value="incidents"><Bell className="h-3 w-3 mr-1" /> Incidents</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="h-3 w-3 mr-1" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="consents"><ConsentsTab /></TabsContent>
        <TabsContent value="dsr"><DSRTab /></TabsContent>
        <TabsContent value="retention"><RetentionTab /></TabsContent>
        <TabsContent value="complaints"><ComplaintsTab /></TabsContent>
        <TabsContent value="policies"><PoliciesTab /></TabsContent>
        <TabsContent value="incidents"><IncidentsTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
      </Tabs>
    </motion.div>
  );
}
