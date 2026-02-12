import { useState, useEffect } from "react";
import { Plus, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplianceDocuments, useCreateComplianceDoc, useUpdateComplianceDoc } from "@/hooks/useCompliance";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { toast } from "sonner";

const DOC_TYPES = [
  "privacy_notice", "complaints_policy", "data_retention_policy",
  "customer_dispute_template", "subject_access_template", "erasure_confirmation_template", "other",
];

const DEFAULT_TEMPLATES: Record<string, { title: string; content: string }> = {
  privacy_notice: {
    title: "Privacy Notice",
    content: `[Dealer Name] Privacy Notice\n\nWe collect and process personal data in accordance with the UK GDPR and Data Protection Act 2018.\n\nData we collect:\n- Name, address, email, phone number\n- Vehicle details and purchase history\n- Financial information (for finance applications)\n\nHow we use your data:\n- To process vehicle sales and aftersales\n- To communicate about your vehicle\n- Marketing (with your consent)\n\nYour rights:\n- Access your data\n- Request correction or deletion\n- Withdraw consent\n- Lodge a complaint with the ICO\n\nContact our Data Protection contact at [email].`,
  },
  complaints_policy: {
    title: "Complaints Handling Policy",
    content: `Complaints Handling Policy\n\n1. All complaints are logged and acknowledged within 3 business days.\n2. We aim to resolve complaints within 14 days.\n3. If you are not satisfied with our response, you may escalate to:\n   - The Motor Ombudsman\n   - Citizens Advice\n   - Trading Standards\n\nTo make a complaint:\n- Email: [email]\n- Phone: [phone]\n- In person at our showroom`,
  },
  data_retention_policy: {
    title: "Data Retention Policy",
    content: `Data Retention Policy\n\nWe retain personal data only for as long as necessary:\n\n- Customer records: 6 years after last transaction\n- Invoice records: 6 years (legal requirement)\n- Warranty records: Duration of warranty + 6 years\n- Vehicle check records: 2 years\n- Marketing consents: Until withdrawn\n\nData is reviewed periodically and securely deleted when retention periods expire.`,
  },
  customer_dispute_template: {
    title: "Customer Dispute Response Template",
    content: `Dear [Customer Name],\n\nThank you for raising your concerns regarding [subject].\n\nWe take all customer feedback seriously and have reviewed the matter carefully.\n\n[Insert findings and response]\n\nIf you remain dissatisfied, you may wish to contact:\n- The Motor Ombudsman: www.themotorombudsman.org\n- Citizens Advice: www.citizensadvice.org.uk\n\nKind regards,\n[Dealer Name]`,
  },
  subject_access_template: {
    title: "SAR Acknowledgement Template",
    content: `Dear [Requester Name],\n\nWe acknowledge receipt of your Subject Access Request dated [date].\n\nUnder the UK GDPR, we will respond within one calendar month. If we need to extend this period, we will inform you.\n\nTo verify your identity, we may require [proof of ID].\n\nKind regards,\n[Dealer Name] - Data Protection`,
  },
  erasure_confirmation_template: {
    title: "Erasure Confirmation Template",
    content: `Dear [Requester Name],\n\nFurther to your request for erasure of your personal data, we confirm that:\n\n- Your personal data has been deleted/anonymised from our systems\n- We have retained only data required by law (e.g. financial records)\n- Third parties have been notified where applicable\n\nIf you have any questions, please contact us.\n\nKind regards,\n[Dealer Name] - Data Protection`,
  },
};

export default function PoliciesTab() {
  const { data: docs, isLoading } = useComplianceDocuments();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const createDoc = useCreateComplianceDoc();
  const updateDoc = useUpdateComplianceDoc();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [seeded, setSeeded] = useState(false);

  // Seed defaults if none exist
  useEffect(() => {
    if (!dealerId || !user || seeded || isLoading || !docs) return;
    if (docs.length > 0) { setSeeded(true); return; }

    const seedDocs = async () => {
      for (const [docType, template] of Object.entries(DEFAULT_TEMPLATES)) {
        await createDoc.mutateAsync({
          dealer_id: dealerId,
          doc_type: docType,
          title: template.title,
          content: template.content,
          updated_by_user_id: user.id,
        });
      }
      setSeeded(true);
      toast.success("Default compliance templates created");
    };
    seedDocs();
  }, [dealerId, user, docs, isLoading, seeded]);

  const handleSave = async (id: string) => {
    if (!user || !dealerId) return;
    const doc = docs?.find((d: any) => d.id === id) as any;
    if (!doc) return;
    const [major, minor] = (doc.version || "1.0").split(".").map(Number);
    const newVersion = `${major}.${minor + 1}`;
    await updateDoc.mutateAsync({ id, content: editContent, version: newVersion, updated_by_user_id: user.id });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "compliance_doc_updated",
      entityType: "compliance_document", entityId: id,
      summary: `${doc.title} updated to v${newVersion}`,
    });
    toast.success(`Saved as v${newVersion}`);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />)}</div>
      ) : !docs?.length ? (
        <p className="text-sm text-muted-foreground text-center py-12">Creating default templates...</p>
      ) : (
        docs.map((doc: any) => (
          <Card key={doc.id} className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{doc.title}</CardTitle>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{doc.version}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(doc.updated_at), "d MMM yyyy")}</span>
                  {editingId === doc.id ? (
                    <Button size="sm" onClick={() => handleSave(doc.id)}><Save className="h-3 w-3 mr-1" /> Save</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(doc.id); setEditContent(doc.content); }}>Edit</Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === doc.id ? (
                <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12} className="font-mono text-xs" />
              ) : (
                <pre className="text-xs whitespace-pre-wrap font-sans bg-muted/30 rounded-lg p-4 border border-border/50 max-h-48 overflow-auto">
                  {doc.content}
                </pre>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
