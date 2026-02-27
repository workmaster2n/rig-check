"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { RiggingComponent, MiscHardware, ChecklistItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiggingComponentForm } from "@/components/RiggingComponentForm";
import { 
  Ship, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  Package, 
  Ruler, 
  Settings,
  Info,
  Image as ImageIcon,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Loader2,
  ClipboardList,
  Layers,
  Wrench,
  Dna
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const [showCompForm, setShowCompForm] = useState(false);
  const [editingComp, setEditingComp] = useState<RiggingComponent | undefined>();
  const [newMisc, setNewMisc] = useState({ item: "", quantity: 1 });
  const [newCheckItem, setNewCheckItem] = useState("");

  const projectRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, "users", user.uid, "riggingProjects", id as string);
  }, [firestore, user, id]);

  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || isProjectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!project) return <div className="p-20 text-center">Project not found or access denied.</div>;

  const handleSaveComponent = (comp: RiggingComponent) => {
    if (!projectRef) return;
    const components = [...(project.components || [])];
    const index = components.findIndex(c => c.id === comp.id);
    if (index >= 0) {
      components[index] = comp;
    } else {
      components.push(comp);
    }
    updateDocumentNonBlocking(projectRef, { components, updatedAt: new Date().toISOString() });
    setShowCompForm(false);
    setEditingComp(undefined);
  };

  const handleDeleteComponent = (compId: string) => {
    if (!projectRef) return;
    const components = (project.components || []).filter(c => c.id !== compId);
    updateDocumentNonBlocking(projectRef, { components, updatedAt: new Date().toISOString() });
  };

  const handleAddMisc = () => {
    if (!newMisc.item || !projectRef) return;
    const misc: MiscHardware = {
      id: Math.random().toString(36).substr(2, 9),
      item: newMisc.item,
      quantity: newMisc.quantity
    };
    const miscellaneousHardware = [...(project.miscellaneousHardware || []), misc];
    updateDocumentNonBlocking(projectRef, { miscellaneousHardware, updatedAt: new Date().toISOString() });
    setNewMisc({ item: "", quantity: 1 });
  };

  const handleDeleteMisc = (miscId: string) => {
    if (!projectRef) return;
    const miscellaneousHardware = (project.miscellaneousHardware || []).filter(m => m.id !== miscId);
    updateDocumentNonBlocking(projectRef, { miscellaneousHardware, updatedAt: new Date().toISOString() });
  };

  const handleAddChecklistItem = () => {
    if (!newCheckItem.trim() || !projectRef) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      task: newCheckItem
    };
    const checklist = [...(project.checklist || []), newItem];
    updateDocumentNonBlocking(projectRef, { checklist, updatedAt: new Date().toISOString() });
    setNewCheckItem("");
  };

  const handleDeleteChecklistItem = (cid: string) => {
    if (!projectRef) return;
    const checklist = (project.checklist || []).filter(i => i.id !== cid);
    updateDocumentNonBlocking(projectRef, { checklist, updatedAt: new Date().toISOString() });
  };

  const parseLengthInMeters = (l: string | undefined) => {
    if (!l) return 0;
    const num = parseFloat(l);
    if (isNaN(num)) return 0;
    if (l.toLowerCase().includes('ft') || l.includes("'")) return num * 0.3048;
    return num;
  };

  const totalLengthMeters = (project.components || []).reduce((acc, c) => acc + parseLengthInMeters(c.length) * c.quantity, 0);

  // Pick List Aggregation Logic
  const wireTotals: Record<string, { material: string; diameter: string; length: number }> = {};
  const fittingTotals: Record<string, { type: string; pinSize: string; diameter: string; quantity: number }> = {};
  const pinTotals: Record<string, { size: string; quantity: number }> = {};

  (project.components || []).forEach((comp: any) => {
    const qty = comp.quantity || 0;
    const dia = comp.diameter || "N/A";
    const mat = comp.material || "N/A";
    const len = parseLengthInMeters(comp.length) * qty;

    // Aggregate Wire
    if (mat !== "N/A" || dia !== "N/A") {
      const wireKey = `${mat}-${dia}`;
      if (!wireTotals[wireKey]) {
        wireTotals[wireKey] = { material: mat, diameter: dia, length: 0 };
      }
      wireTotals[wireKey].length += len;
    }

    // Aggregate Upper Fitting & Pins
    if (comp.upperTermination && comp.upperTermination !== "None") {
      const pin = comp.pinSizeUpper || "N/A";
      const fittingKey = `${comp.upperTermination}-${pin}-${dia}`;
      if (!fittingTotals[fittingKey]) {
        fittingTotals[fittingKey] = { type: comp.upperTermination, pinSize: pin, diameter: dia, quantity: 0 };
      }
      fittingTotals[fittingKey].quantity += qty;

      if (pin !== "N/A") {
        if (!pinTotals[pin]) pinTotals[pin] = { size: pin, quantity: 0 };
        pinTotals[pin].quantity += qty;
      }
    }

    // Aggregate Lower Fitting & Pins
    if (comp.lowerTermination && comp.lowerTermination !== "None") {
      const pin = comp.pinSizeLower || "N/A";
      const fittingKey = `${comp.lowerTermination}-${pin}-${dia}`;
      if (!fittingTotals[fittingKey]) {
        fittingTotals[fittingKey] = { type: comp.lowerTermination, pinSize: pin, diameter: dia, quantity: 0 };
      }
      fittingTotals[fittingKey].quantity += qty;

      if (pin !== "N/A") {
        if (!pinTotals[pin]) pinTotals[pin] = { size: pin, quantity: 0 };
        pinTotals[pin].quantity += qty;
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:text-accent">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Ship className="w-8 h-8 text-accent" />
              {project.vesselName}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">{project.projectName}</p>
              {project.boatType && (
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
                  {project.boatType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Tabs defaultValue="components" className="w-full">
            <TabsList className="bg-secondary/30 border border-border p-1 w-full flex overflow-x-auto">
              <TabsTrigger value="components" className="flex-1 gap-2 px-6">
                <Package className="w-4 h-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex-1 gap-2 px-6">
                <ClipboardCheck className="w-4 h-4" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="misc" className="flex-1 gap-2 px-6">
                <Settings className="w-4 h-4" />
                Misc
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex-1 gap-2 px-6">
                <ClipboardList className="w-4 h-4" />
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Rigging Inventory</h3>
                {!showCompForm && (
                  <Button onClick={() => setShowCompForm(true)} className="bg-primary hover:bg-primary/80 gap-2">
                    <Plus className="w-4 h-4" />
                    Add Component
                  </Button>
                )}
              </div>

              {showCompForm ? (
                <Card className="border-accent/30 nautical-gradient">
                  <CardHeader>
                    <CardTitle>{editingComp ? "Edit Component" : "Add New Component"}</CardTitle>
                    <CardDescription>Enter dimensions and terminations for this piece of rigging.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RiggingComponentForm 
                      initialData={editingComp} 
                      onSubmit={handleSaveComponent} 
                      onCancel={() => { setShowCompForm(false); setEditingComp(undefined); }} 
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(project.components || []).length === 0 ? (
                    <div className="p-12 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                      <Ruler className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No components listed. Start adding shrouds, stays, or halyards.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {project.components.map(comp => (
                        <Card key={comp.id} className="bg-secondary/40 hover:border-primary/50 transition-colors overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-accent">{comp.type}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                                  <span className="text-foreground/80 font-mono">L: {comp.length || "-"}</span>
                                  <span className="text-foreground/80 font-mono">D: {comp.diameter || "-"}</span>
                                  <span className="text-primary/90 font-medium">QTY: {comp.quantity}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="icon" variant="ghost" onClick={() => { setEditingComp(comp); setShowCompForm(true); }}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => handleDeleteComponent(comp.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="p-2 rounded bg-background/50">
                                <span className="block text-muted-foreground uppercase mb-1 font-bold tracking-tighter">Upper</span>
                                <p className="font-medium truncate">{comp.upperTermination || "Not specified"}</p>
                                {comp.pinSizeUpper && <p className="text-accent">Pin: {comp.pinSizeUpper}</p>}
                              </div>
                              <div className="p-2 rounded bg-background/50">
                                <span className="block text-muted-foreground uppercase mb-1 font-bold tracking-tighter">Lower</span>
                                <p className="font-medium truncate">{comp.lowerTermination || "Not specified"}</p>
                                {comp.pinSizeLower && <p className="text-accent">Pin: {comp.pinSizeLower}</p>}
                              </div>
                            </div>
                            
                            {comp.photos && comp.photos.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/30">
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                  {comp.photos.map((photo, i) => (
                                    <div key={i} className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border">
                                      <img src={photo} alt={`${comp.type} ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="mt-6">
              <Card className="nautical-gradient border-border">
                <CardHeader>
                  <CardTitle className="text-xl">Job Checklist</CardTitle>
                  <CardDescription>Ensure all critical measurements and inspections are completed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add custom measurement or task..." 
                      value={newCheckItem} 
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                    />
                    <Button onClick={handleAddChecklistItem} className="bg-primary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mt-6">
                    {(project.checklist || []).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 italic border border-dashed rounded-lg">
                        No checklist items. Add tasks to track your progress.
                      </p>
                    ) : (
                      project.checklist.map((item) => {
                        const isCompleted = (project.components || []).some(c => 
                          item.task.toLowerCase().includes(c.type.toLowerCase())
                        );

                        return (
                          <div key={item.id} className="flex justify-between items-center p-4 rounded-lg border border-border bg-background/30 group hover:border-primary/50 transition-all">
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-accent" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground/30" />
                              )}
                              <span className={isCompleted ? "text-accent font-medium line-through opacity-70" : "font-medium"}>
                                {item.task}
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100" 
                              onClick={() => handleDeleteChecklistItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="misc" className="mt-6">
              <Card className="border-border bg-secondary/20">
                <CardHeader>
                  <CardTitle>Custom Hardware</CardTitle>
                  <CardDescription>Add miscellaneous items like pins, rings, or custom plates.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Item Description</Label>
                      <Input 
                        placeholder="e.g. M10 Clevis Pins" 
                        value={newMisc.item} 
                        onChange={(e) => setNewMisc({...newMisc, item: e.target.value})}
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Qty</Label>
                      <Input 
                        type="number" 
                        value={newMisc.quantity} 
                        onChange={(e) => setNewMisc({...newMisc, quantity: parseInt(e.target.value)})}
                      />
                    </div>
                    <Button onClick={handleAddMisc} className="bg-primary">Add</Button>
                  </div>

                  <div className="mt-8 space-y-2">
                    {(project.miscellaneousHardware || []).map(m => (
                      <div key={m.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/30">
                        <div>
                          <span className="font-bold text-primary mr-3">{m.quantity}x</span>
                          <span>{m.item}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMisc(m.id)}>
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-6">
              <Card className="nautical-gradient border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-accent" />
                    Bill of Materials (Pick List)
                  </CardTitle>
                  <CardDescription>Consolidated hardware requirements for {project.vesselName}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Wire & Cable Summary */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Wire & Cable
                    </h4>
                    {Object.keys(wireTotals).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No wire specifications recorded.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.values(wireTotals).map((wire, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-border bg-background/20 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-foreground">{wire.material}</p>
                              <p className="text-xs text-muted-foreground">Diameter: {wire.diameter}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-mono font-bold text-accent">{wire.length.toFixed(2)}m</p>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-tighter">Total length</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fittings Summary */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Fittings & Terminations
                    </h4>
                    {Object.keys(fittingTotals).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No terminations recorded.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.values(fittingTotals).sort((a, b) => a.type.localeCompare(b.type)).map((fitting, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-border bg-background/20 flex justify-between items-center group hover:border-accent/30 transition-colors">
                            <div>
                              <p className="font-bold text-foreground">{fitting.type}</p>
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                <span>Pin: {fitting.pinSize}</span>
                                <span>Wire: {fitting.diameter}</span>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-secondary rounded font-mono font-bold text-accent text-lg">
                              {fitting.quantity}x
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clevis Pins Summary */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                      <Dna className="w-4 h-4" />
                      Clevis Pins & Fasteners
                    </h4>
                    {Object.keys(pinTotals).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No pins recorded from terminations.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.values(pinTotals).sort((a, b) => a.size.localeCompare(b.size)).map((pin, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-border bg-background/20 flex justify-between items-center group hover:border-accent/30 transition-colors">
                            <div>
                              <p className="font-bold text-foreground">Clevis Pin: {pin.size}</p>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-tighter">Required for fittings</p>
                            </div>
                            <div className="px-3 py-1 bg-secondary rounded font-mono font-bold text-accent text-lg">
                              {pin.quantity}x
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Misc Hardware Summary */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Miscellaneous Hardware
                    </h4>
                    {(project.miscellaneousHardware || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No additional items recorded.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {project.miscellaneousHardware.map((misc: any) => (
                          <div key={misc.id} className="p-4 rounded-lg border border-border bg-background/20 flex justify-between items-center group hover:border-accent/30 transition-colors">
                            <span className="font-medium text-foreground/90">{misc.item}</span>
                            <span className="px-3 py-1 bg-secondary rounded font-mono font-bold text-accent text-lg">{misc.quantity}x</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="nautical-gradient border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Survey Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Checklist Progress</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-white">
                    {project.checklist ? 
                      Math.round((project.checklist.filter(item => 
                        (project.components || []).some(c => item.task.toLowerCase().includes(c.type.toLowerCase()))
                      ).length / Math.max(1, project.checklist.length)) * 100) : 0
                    }%
                  </p>
                  <p className="text-sm text-muted-foreground pb-1">Complete</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Est. Total Length</p>
                <p className="text-2xl font-mono text-white">
                  {totalLengthMeters.toFixed(2)}m
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  Vessel: <span className="text-foreground not-italic">{project.boatType || "Custom"}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
