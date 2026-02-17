import { useState, useRef, useMemo } from "react";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import { Upload, FolderOpen, Trash2, Download, FileText, Image, File, Copy, Eye, EyeOff, Pencil, Plus, Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUserDealerId } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import {
  useDocumentTemplates, useDuplicateTemplate, useUpdateTemplate,
  useGeneratedDocuments, useUploadedFiles, useUploadFile, useDeleteUploadedFile,
  useDealerInfo,
} from "@/hooks/useDocumentLibrary";
import GenerateDocumentDialog from "@/components/app/documents/GenerateDocumentDialog";

const TEMPLATE_CATEGORIES = ["PDI", "VALETING", "HANDOVER", "COURTESY_CAR", "WARRANTY", "AFTERSALES", "SALES", "COMPLIANCE", "OTHER"];

export default function DocumentList() {
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const { data: dealer } = useDealerInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("templates");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Templates
  const { data: templates, isLoading: loadingTemplates } = useDocumentTemplates();
  const duplicateMut = useDuplicateTemplate();
  const updateMut = useUpdateTemplate();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  // Generated docs
  const { data: generatedDocs, isLoading: loadingGenerated } = useGeneratedDocuments();

  // Uploads
  const { data: uploadedFiles, isLoading: loadingUploads } = useUploadedFiles();
  const uploadMut = useUploadFile();
  const deleteMut = useDeleteUploadedFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach((f) => uploadMut.mutate(f));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadUpload = async (fileUrl: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("dealer-uploads").download(fileUrl);
    if (error) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
    await logAuditEvent({ dealerId: dealerId || null, actorUserId: user?.id || null, actionType: "FILE_DOWNLOADED", entityType: "Documents", summary: `Downloaded "${fileName}"` });
  };

  const handleDownloadGenerated = async (pdfUrl: string, name: string) => {
    const { data, error } = await supabase.storage.from("generated-documents").download(pdfUrl);
    if (error) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = name + ".html"; a.click();
    URL.revokeObjectURL(url);
    await logAuditEvent({ dealerId: dealerId || null, actorUserId: user?.id || null, actionType: "DOWNLOAD_PDF", entityType: "Documents", summary: `Downloaded "${name}"` });
  };

  const handlePrintGenerated = async (pdfUrl: string) => {
    const { data, error } = await supabase.storage.from("generated-documents").download(pdfUrl);
    if (error) { toast.error("Failed to load document"); return; }
    const text = DOMPurify.sanitize(await data.text());
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(text);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const filteredTemplates = useMemo(() => {
    let list = templates || [];
    if (search) list = list.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter);
    return list;
  }, [templates, search, categoryFilter]);

  const filteredGenerated = useMemo(() => {
    let list = generatedDocs || [];
    if (search) list = list.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== "all") list = list.filter((d) => d.category === categoryFilter);
    return list;
  }, [generatedDocs, search, categoryFilter]);

  const filteredUploads = useMemo(() => {
    let list = uploadedFiles || [];
    if (search) list = list.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== "all") list = list.filter((f) => f.category === categoryFilter);
    return list;
  }, [uploadedFiles, search, categoryFilter]);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">Templates, generated documents &amp; file uploads</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setGenerateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Generate Document
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" disabled={uploadMut.isPending}>
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TEMPLATE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="generated">Generated ({filteredGenerated.length})</TabsTrigger>
          <TabsTrigger value="uploads">Uploads ({filteredUploads.length})</TabsTrigger>
        </TabsList>

        {/* ─── Templates Tab ─── */}
        <TabsContent value="templates">
          {loadingTemplates ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : !filteredTemplates.length ? (
            <EmptyState icon={FileText} text="No templates found" />
          ) : (
            <div className="grid gap-3">
              {filteredTemplates.map((t) => {
                const isDefault = !t.dealer_id;
                return (
                  <div key={t.id} className="rounded-xl border border-border/50 bg-card/50 p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">{t.name}</span>
                        <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                        {isDefault && <Badge variant="secondary" className="text-[10px]">Platform Default</Badge>}
                        {!t.is_active && <Badge variant="destructive" className="text-[10px]">Disabled</Badge>}
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreviewTemplate(t)} title="Preview">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {isDefault ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => duplicateMut.mutate(t.id)} disabled={duplicateMut.isPending}>
                          <Copy className="h-3 w-3 mr-1" /> Duplicate
                        </Button>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTemplate(t)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => updateMut.mutate({ id: t.id, is_active: !t.is_active })}
                            title={t.is_active ? "Disable" : "Enable"}
                          >
                            {t.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Generated Tab ─── */}
        <TabsContent value="generated">
          {loadingGenerated ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : !filteredGenerated.length ? (
            <EmptyState icon={FileText} text="No generated documents yet" sub="Use 'Generate Document' to create one" />
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Created</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGenerated.map((doc) => (
                    <tr key={doc.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate max-w-xs">{doc.name}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                        {format(new Date(doc.created_at), "d MMM yyyy HH:mm")}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePrintGenerated(doc.pdf_url)} title="Print">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownloadGenerated(doc.pdf_url, doc.name)} title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ─── Uploads Tab ─── */}
        <TabsContent value="uploads">
          {loadingUploads ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : !filteredUploads.length ? (
            <EmptyState icon={FolderOpen} text="No uploaded files yet">
              <Button onClick={() => fileInputRef.current?.click()} size="sm" className="mt-3">
                <Upload className="h-4 w-4 mr-2" /> Upload your first file
              </Button>
            </EmptyState>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Size</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Uploaded</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUploads.map((f) => (
                    <tr key={f.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate max-w-xs">{f.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">{formatSize(f.file_size)}</td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                        {format(new Date(f.created_at), "d MMM yyyy")}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownloadUpload(f.file_url, f.file_name)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate({ id: f.id, file_url: f.file_url, name: f.name })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white text-black" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewTemplate?.template_html || "") }} />
        </DialogContent>
      </Dialog>

      {/* Template Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editingTemplate.name} onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editingTemplate.description || ""} onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Template HTML</Label>
                  <p className="text-[10px] text-muted-foreground">Variables: {"{{DealerName}}, {{CustomerName}}, {{VehicleReg}}, {{DateGenerated}}, etc."}</p>
                </div>
                <Textarea rows={12} className="font-mono text-xs" value={editingTemplate.template_html} onChange={(e) => setEditingTemplate({ ...editingTemplate, template_html: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                <Button onClick={() => {
                  updateMut.mutate({ id: editingTemplate.id, name: editingTemplate.name, description: editingTemplate.description, template_html: editingTemplate.template_html });
                  setEditingTemplate(null);
                }}>Save</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Document Dialog */}
      <GenerateDocumentDialog open={generateOpen} onOpenChange={setGenerateOpen} dealer={dealer} />
    </motion.div>
  );
}

function EmptyState({ icon: Icon, text, sub, children }: { icon: any; text: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
      <Icon className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-muted-foreground">{text}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {children}
    </div>
  );
}
