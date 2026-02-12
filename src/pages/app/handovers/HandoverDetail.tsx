import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Camera, Printer, Pen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useHandover, useHandoverItems, useHandoverPhotos, useUpdateHandover,
  useUpdateHandoverItem, useUploadHandoverPhoto, HANDOVER_STATUS_LABELS, SECTION_LABELS,
} from "@/hooks/useHandovers";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-500",
  awaiting_signature: "bg-yellow-500/10 text-yellow-500",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function HandoverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: handover, isLoading } = useHandover(id);
  const { data: items } = useHandoverItems(id);
  const { data: photos } = useHandoverPhotos(id);
  const updateHandover = useUpdateHandover();
  const updateItem = useUpdateHandoverItem();
  const uploadPhoto = useUploadHandoverPhoto();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoType, setPhotoType] = useState("other");
  const [showSign, setShowSign] = useState(false);
  const [sigName, setSigName] = useState("");
  const [sigMode, setSigMode] = useState<"digital" | "printed">("digital");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const h: any = handover;
  const completed = items?.filter((i: any) => i.completed).length || 0;
  const total = items?.length || 0;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const toggleItem = async (item: any) => {
    const nowCompleted = !item.completed;
    await updateItem.mutateAsync({
      id: item.id,
      completed: nowCompleted,
      completed_at: nowCompleted ? new Date().toISOString() : null,
      completed_by_user_id: nowCompleted ? user?.id : null,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !dealerId) return;
    try {
      await uploadPhoto.mutateAsync({ handoverId: id, dealerId, file, photoType });
      toast.success("Photo uploaded");
    } catch { toast.error("Upload failed"); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSign = async () => {
    if (!id || !sigName.trim()) { toast.error("Please enter your name"); return; }
    try {
      let signatureUrl: string | null = null;
      if (sigMode === "digital" && canvasRef.current) {
        const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve));
        if (blob) {
          const path = `${dealerId}/${id}/signature.png`;
          await supabase.storage.from("handover-signatures").upload(path, blob, { upsert: true });
          const { data } = supabase.storage.from("handover-signatures").getPublicUrl(path);
          signatureUrl = data.publicUrl;
        }
      }
      await updateHandover.mutateAsync({
        id,
        status: "completed",
        signature_name: sigName,
        signature_mode: sigMode,
        signature_image_url: signatureUrl,
        signed_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      });
      setShowSign(false);
      toast.success("Handover completed!");
    } catch { toast.error("Failed to complete"); }
  };

  // Canvas drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); }
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000"; ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke(); }
  };
  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const printHandover = () => {
    if (!h) return;
    const cust = h.customers as any;
    const veh = h.vehicles as any;
    const sections: Record<string, any[]> = {};
    items?.forEach((item: any) => {
      if (!sections[item.section]) sections[item.section] = [];
      sections[item.section].push(item);
    });

    const checklistHtml = Object.entries(sections).map(([section, sectionItems]) => `
      <h3 style="margin:12px 0 6px;font-size:13px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:4px;">
        ${SECTION_LABELS[section] || section}
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        ${(sectionItems as any[]).map((item: any) => `
          <tr><td style="padding:4px 8px;border:1px solid #ddd;width:30px;text-align:center;">${item.completed ? "✓" : "☐"}</td>
          <td style="padding:4px 8px;border:1px solid #ddd;">${item.item_label}</td>
          <td style="padding:4px 8px;border:1px solid #ddd;width:200px;">${item.notes || ""}</td></tr>
        `).join("")}
      </table>
    `).join("");

    const html = `<!DOCTYPE html><html><head><title>Handover Pack ${h.handover_number}</title>
      <style>body{font-family:Arial,sans-serif;color:#000;max-width:800px;margin:0 auto;padding:20px;}
      @media print{body{padding:0;}}</style></head><body>
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:20px;">
        <h1 style="margin:0;font-size:22px;">VEHICLE HANDOVER PACK</h1>
        <p style="margin:4px 0;font-size:14px;">${h.handover_number} · ${format(new Date(h.created_at), "d MMMM yyyy")}</p>
      </div>
      <div style="display:flex;gap:20px;margin-bottom:20px;">
        <div style="flex:1;"><h3 style="font-size:13px;margin:0 0 6px;">Customer</h3>
          <p style="font-size:12px;margin:2px 0;">${cust?.first_name || ""} ${cust?.last_name || ""}</p>
          <p style="font-size:12px;margin:2px 0;">${cust?.phone || ""}</p>
          <p style="font-size:12px;margin:2px 0;">${cust?.email || ""}</p>
        </div>
        <div style="flex:1;"><h3 style="font-size:13px;margin:0 0 6px;">Vehicle</h3>
          <p style="font-size:12px;margin:2px 0;">VRM: ${veh?.vrm || ""}</p>
          <p style="font-size:12px;margin:2px 0;">${veh?.make || ""} ${veh?.model || ""}</p>
          <p style="font-size:12px;margin:2px 0;">VIN: ${veh?.vin || "N/A"}</p>
          <p style="font-size:12px;margin:2px 0;">Mileage: ${h.mileage_at_handover || "N/A"}</p>
          <p style="font-size:12px;margin:2px 0;">Fuel: ${(h.fuel_level || "").replace(/_/g, " ")}</p>
          <p style="font-size:12px;margin:2px 0;">Keys: ${h.keys_count}</p>
        </div>
      </div>
      ${checklistHtml}
      ${h.signature_name ? `
        <div style="margin-top:30px;border-top:2px solid #000;padding-top:12px;">
          <p style="font-size:12px;"><strong>Signed by:</strong> ${h.signature_name}</p>
          <p style="font-size:12px;"><strong>Date:</strong> ${h.signed_at ? format(new Date(h.signed_at), "d MMM yyyy HH:mm") : ""}</p>
          ${h.signature_image_url ? `<img src="${h.signature_image_url}" style="max-width:250px;max-height:100px;" />` : ""}
          <p style="font-size:11px;margin-top:8px;color:#666;">I confirm I have received the vehicle and the above items have been explained/handed over.</p>
        </div>
      ` : `
        <div style="margin-top:30px;border-top:1px solid #ccc;padding-top:12px;">
          <p style="font-size:12px;">Customer Signature: _________________________</p>
          <p style="font-size:12px;">Date: _________________________</p>
        </div>
      `}
      <footer style="margin-top:40px;text-align:center;font-size:10px;color:#999;">Generated by DealerOps</footer>
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  if (isLoading) return <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />;
  if (!h) return <div className="text-center py-20"><p className="text-muted-foreground">Handover not found</p></div>;

  const cust: any = h.customers;
  const veh: any = h.vehicles;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/handovers")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{h.handover_number}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[h.status]}`}>{HANDOVER_STATUS_LABELS[h.status]}</span>
            </div>
            <p className="text-xs text-muted-foreground">{cust?.first_name} {cust?.last_name} · {veh?.vrm} {veh?.make} {veh?.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={printHandover}><Printer className="h-4 w-4 mr-1" />Print PDF</Button>
          {h.status !== "completed" && h.status !== "cancelled" && (
            <Button size="sm" onClick={() => { setShowSign(true); setSigName(""); }}>
              <Pen className="h-4 w-4 mr-1" />Sign & Complete
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Checklist Progress</span>
          <span className="text-xs font-medium">{completed}/{total}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-2">
              <h3 className="text-sm font-semibold">Customer</h3>
              <p className="text-sm">{cust?.first_name} {cust?.last_name}</p>
              <p className="text-xs text-muted-foreground">{cust?.phone || "No phone"}</p>
              <p className="text-xs text-muted-foreground">{cust?.email || "No email"}</p>
              {cust?.address_line1 && <p className="text-xs text-muted-foreground">{cust.address_line1}, {cust.city} {cust.postcode}</p>}
            </div>
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-2">
              <h3 className="text-sm font-semibold">Vehicle</h3>
              <p className="text-sm font-medium">{veh?.vrm} – {veh?.make} {veh?.model}</p>
              <p className="text-xs text-muted-foreground">VIN: {veh?.vin || "N/A"}</p>
              <p className="text-xs text-muted-foreground">Mileage at handover: {h.mileage_at_handover || "—"}</p>
              <p className="text-xs text-muted-foreground">Fuel: {(h.fuel_level || "—").replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground">Keys: {h.keys_count}</p>
            </div>
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-2">
              <h3 className="text-sm font-semibold">Delivery</h3>
              <p className="text-sm capitalize">{h.delivery_type}</p>
              {h.delivery_address && <p className="text-xs text-muted-foreground">{h.delivery_address}</p>}
              {h.scheduled_delivery_at && <p className="text-xs text-muted-foreground">Scheduled: {format(new Date(h.scheduled_delivery_at), "d MMM yyyy HH:mm")}</p>}
              {h.delivered_at && <p className="text-xs text-muted-foreground">Delivered: {format(new Date(h.delivered_at), "d MMM yyyy HH:mm")}</p>}
            </div>
            {h.notes && (
              <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-2">
                <h3 className="text-sm font-semibold">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{h.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          {(() => {
            const sections: Record<string, any[]> = {};
            items?.forEach((item: any) => {
              if (!sections[item.section]) sections[item.section] = [];
              sections[item.section].push(item);
            });
            return Object.entries(sections).map(([section, sectionItems]) => (
              <div key={section} className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">{SECTION_LABELS[section] || section}</h3>
                <div className="space-y-1">
                  {(sectionItems as any[]).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 transition-colors">
                      <Checkbox checked={item.completed} onCheckedChange={() => toggleItem(item)} disabled={h.status === "completed"} />
                      <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.item_label}</span>
                      {item.completed_at && <span className="text-xs text-muted-foreground">{format(new Date(item.completed_at), "HH:mm")}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </TabsContent>

        <TabsContent value="photos">
          {h.status !== "completed" && (
            <div className="flex gap-3 mb-4">
              <Select value={photoType} onValueChange={setPhotoType}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["front","rear","left","right","dash","odometer","damage","other"].map(t =>
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-1" />Upload Photo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {photos?.map((photo: any) => (
              <div key={photo.id} className="rounded-lg border border-border/50 overflow-hidden">
                <img src={photo.file_url} alt={photo.caption || photo.photo_type} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <p className="text-xs font-medium capitalize">{photo.photo_type}</p>
                  {photo.caption && <p className="text-xs text-muted-foreground">{photo.caption}</p>}
                </div>
              </div>
            ))}
            {!photos?.length && <p className="text-sm text-muted-foreground col-span-4 text-center py-8">No photos uploaded</p>}
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
            <h3 className="text-sm font-semibold">Handover Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Checklist:</span> {completed}/{total} items completed</div>
              <div><span className="text-muted-foreground">Photos:</span> {photos?.length || 0} uploaded</div>
              <div><span className="text-muted-foreground">Status:</span> {HANDOVER_STATUS_LABELS[h.status]}</div>
              <div><span className="text-muted-foreground">Delivery:</span> {h.delivery_type}</div>
            </div>
            {h.signature_name && (
              <div className="mt-4 p-4 rounded-lg border border-border/30 bg-muted/20">
                <p className="text-sm font-medium">Signed by: {h.signature_name}</p>
                <p className="text-xs text-muted-foreground">{h.signed_at ? format(new Date(h.signed_at), "d MMM yyyy HH:mm") : ""}</p>
                {h.signature_image_url && <img src={h.signature_image_url} alt="Signature" className="mt-2 max-w-[250px] max-h-[100px]" />}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Signature dialog */}
      <Dialog open={showSign} onOpenChange={setShowSign}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sign & Complete Handover</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="Customer full name" className="mt-1" />
            </div>
            <div>
              <Label>Signature Mode</Label>
              <Select value={sigMode} onValueChange={(v: any) => setSigMode(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital Signature</SelectItem>
                  <SelectItem value="printed">Signed on Paper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sigMode === "digital" && (
              <div>
                <Label>Draw Signature</Label>
                <div className="mt-1 border rounded-lg bg-white relative">
                  <canvas ref={canvasRef} width={400} height={150}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
                  <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={clearCanvas}>Clear</Button>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Checkbox id="confirm" />
              <label htmlFor="confirm" className="text-xs text-muted-foreground">
                I confirm I have received the vehicle and the above items have been explained/handed over.
              </label>
            </div>
            <Button onClick={handleSign} className="w-full">Complete Handover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
