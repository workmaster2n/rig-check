"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject, saveProject, RigProject, RiggingComponent, MiscHardware } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiggingComponentForm } from "@/components/RiggingComponentForm";
import { HardwareListGenerator } from "@/components/HardwareListGenerator";
import { 
  Ship, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  Package, 
  Ruler, 
  Settings,
  Info
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<RigProject | null>(null);
  const [showCompForm, setShowCompForm] = useState(false);
  const [editingComp, setEditingComp] = useState<RiggingComponent | undefined>();
  const [newMisc, setNewMisc] = useState({ item: "", quantity: 1 });

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
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="components" className="w-full">
            <TabsList className="bg-secondary/30 border border-border p-1 w-full md:w-auto">
              <TabsTrigger value="components" className="flex-1 md:flex-none gap-2 px-6">
                <Package className="w-4 h-4" />
                Components
              </TabsTrigger>
              <TabsTrigger value="misc" className="flex-1 md:flex-none gap-2 px-6">
                <Settings className="w-4 h-4" />
                Miscellaneous
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
                    <CardDescription>Enter the dimensions and terminations for this piece of rigging.</CardDescription>
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
                        <Card key={comp.id} className="bg-secondary/40 hover:border-primary/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-accent">{comp.type}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                                  <span className="text-foreground/80 font-mono">L: {comp.lengthInMeters}m</span>
                                  <span className="text-foreground/80 font-mono">D: {comp.diameterInMM}mm</span>
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
                                {comp.pinSizeUpperInMM && <p className="text-accent">Pin: {comp.pinSizeUpperInMM}mm</p>}
                              </div>
                              <div className="p-2 rounded bg-background/50">
                                <span className="block text-muted-foreground uppercase mb-1 font-bold tracking-tighter">Lower</span>
                                <p className="font-medium truncate">{comp.lowerTermination || "Not specified"}</p>
                                {comp.pinSizeLowerInMM && <p className="text-accent">Pin: {comp.pinSizeLowerInMM}mm</p>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="misc" className="mt-6">
              <div className="space-y-6">
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
                          placeholder="e.g. M10 Clevis Pins, Split rings" 
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
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <HardwareListGenerator project={project} />
          
          <Card className="nautical-gradient border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Survey Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Length</p>
                <p className="text-2xl font-mono text-white">
                  {project.components.reduce((acc, c) => acc + (c.lengthInMeters || 0) * c.quantity, 0).toFixed(2)}m
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Component Count</p>
                <p className="text-2xl font-mono text-white">
                  {project.components.reduce((acc, c) => acc + c.quantity, 0)}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  Tip: Always double-check pin diameters with a vernier caliper before ordering terminals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}