"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject, saveProject, RigProject, RiggingComponent, MiscHardware, ChecklistItem } from "@/lib/store";
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
  Circle
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<RigProject | null>(null);
  const [showCompForm, setShowCompForm] = useState(false);
  const [editingComp, setEditingComp] = useState<RiggingComponent | undefined>();
  const [newMisc, setNewMisc] = useState({ item: "", quantity: 1 });
  const [newCheckItem, setNewCheckItem] = useState("");

  useEffect(() => {
    const p = getProject(id as string);
    if (p) setProject(p);
  }, [id]);

  if (!project) return <div className="p-20 text-center">Loading Project...</div>;

  const handleSaveComponent = (comp: RiggingComponent) => {
    const updated = { ...project };
    const index = updated.components.findIndex(c => c.id === comp.id);
    if (index >= 0) {
      updated.components[index] = comp;
    } else {
      updated.components.push(comp);
    }
    saveProject(updated);
    setProject(updated);
    setShowCompForm(false);
    setEditingComp(undefined);
  };

  const handleDeleteComponent = (compId: string) => {
    const updated = { ...project, components: project.components.filter(c => c.id !== compId) };
    saveProject(updated);
    setProject(updated);
  };

  const handleAddMisc = () => {
    if (!newMisc.item) return;
    const misc: MiscHardware = {
      id: Math.random().toString(36).substr(2, 9),
      item: newMisc.item,
      quantity: newMisc.quantity
    };
    const updated = { ...project, miscellaneousHardware: [...project.miscellaneousHardware, misc] };
    saveProject(updated);
    setProject(updated);
    setNewMisc({ item: "", quantity: 1 });
  };

  const handleDeleteMisc = (miscId: string) => {
    const updated = { ...project, miscellaneousHardware: project.miscellaneousHardware.filter(m => m.id !== miscId) };
    saveProject(updated);
    setProject(updated);
  };

  const handleAddChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      task: newCheckItem
    };
    const updated = { ...project, checklist: [...(project.checklist || []), newItem] };
    saveProject(updated);
    setProject(updated);
    setNewCheckItem("");
  };

  const handleDeleteChecklistItem = (cid: string) => {
    const updated = { ...project, checklist: project.checklist.filter(i => i.id !== cid) };
    saveProject(updated);
    setProject(updated);
  };

  const parseLengthInMeters = (l: string | undefined) => {
    if (!l) return 0;
    const num = parseFloat(l);
    if (isNaN(num)) return 0;
    if (l.toLowerCase().includes('ft') || l.includes("'")) return num * 0.3048;
    return num;
  };

  const totalLengthMeters = project.components.reduce((acc, c) => acc + parseLengthInMeters(c.length) * c.quantity, 0);

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
              <p className="text-muted-foreground">{project.name}</p>
              {project.boatType && (
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
                  {project.boatType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
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
                  {project.components.length === 0 ? (
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
                        // Simple completion logic: if the task name matches a component type in our inventory
                        const isCompleted = project.components.some(c => 
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
                    {project.miscellaneousHardware.map(m => (
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
                        project.components.some(c => item.task.toLowerCase().includes(c.type.toLowerCase()))
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
