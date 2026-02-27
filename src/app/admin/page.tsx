"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings, saveSettings, RigSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, Trash2, Settings2, Package, Anchor, Layers, Ship, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [settings, setSettings] = useState<RigSettings | null>(null);
  const [newComponentType, setNewComponentType] = useState("");
  const [newTerminationType, setNewTerminationType] = useState("");
  const [newMaterialType, setNewMaterialType] = useState("");
  const [newBoatType, setNewBoatType] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return <div className="p-20 text-center">Loading Settings...</div>;

  const updateSettings = (updated: RigSettings) => {
    saveSettings(updated);
    setSettings(updated);
  };

  const handleAddComponentType = () => {
    if (!newComponentType.trim()) return;
    updateSettings({
      ...settings,
      componentTypes: [...settings.componentTypes, newComponentType.trim()]
    });
    setNewComponentType("");
    toast({ title: "Success", description: "Component type added." });
  };

  const handleAddTerminationType = () => {
    if (!newTerminationType.trim()) return;
    updateSettings({
      ...settings,
      terminationTypes: [...settings.terminationTypes, newTerminationType.trim()]
    });
    setNewTerminationType("");
    toast({ title: "Success", description: "Termination type added." });
  };

  const handleAddMaterialType = () => {
    if (!newMaterialType.trim()) return;
    updateSettings({
      ...settings,
      materialTypes: [...(settings.materialTypes || []), newMaterialType.trim()]
    });
    setNewMaterialType("");
    toast({ title: "Success", description: "Material type added." });
  };

  const handleAddBoatType = () => {
    if (!newBoatType.trim()) return;
    updateSettings({
      ...settings,
      productionBoats: [...(settings.productionBoats || []), newBoatType.trim()]
    });
    setNewBoatType("");
    toast({ title: "Success", description: "Boat type added." });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    updateSettings({
      ...settings,
      defaultChecklist: [...(settings.defaultChecklist || []), newChecklistItem.trim()]
    });
    setNewChecklistItem("");
    toast({ title: "Success", description: "Checklist item added." });
  };

  const handleDeleteItem = (listKey: keyof RigSettings, value: string) => {
    const list = settings[listKey] as string[];
    updateSettings({
      ...settings,
      [listKey]: list.filter(t => t !== value)
    });
    toast({ title: "Removed", description: `${value} removed.` });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:text-accent">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-accent" />
              Settings & Configuration
            </h1>
            <p className="text-muted-foreground">Manage your rigging library and defaults</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Boat Types */}
        <Card className="nautical-gradient border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-accent" />
              Production Boats
            </CardTitle>
            <CardDescription>Manage the list of searchable vessel types.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="New boat type..." 
                value={newBoatType}
                onChange={(e) => setNewBoatType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBoatType()}
              />
              <Button onClick={handleAddBoatType} className="bg-accent text-background">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {settings.productionBoats.map((type) => (
                <div key={type} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/30 group hover:border-accent/50 transition-colors">
                  <span className="text-sm">{type}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteItem('productionBoats', type)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Checklist Templates */}
        <Card className="nautical-gradient border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Default Checklist
            </CardTitle>
            <CardDescription>Items automatically added to new surveys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="New task..." 
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
              />
              <Button onClick={handleAddChecklistItem} className="bg-primary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {settings.defaultChecklist.map((item) => (
                <div key={item} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/30 group hover:border-primary/50 transition-colors">
                  <span className="text-sm">{item}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteItem('defaultChecklist', item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Component Types */}
        <Card className="nautical-gradient border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Component Types
            </CardTitle>
            <CardDescription>Define types of stays and shrouds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="New type..." 
                value={newComponentType}
                onChange={(e) => setNewComponentType(e.target.value)}
              />
              <Button onClick={handleAddComponentType} className="bg-primary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {settings.componentTypes.map((type) => (
                <div key={type} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/30 group hover:border-primary/50">
                  <span className="text-sm">{type}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('componentTypes', type)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
