"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings, saveSettings, RigSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Trash2, Settings2, Package, Anchor } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [settings, setSettings] = useState<RigSettings | null>(null);
  const [newComponentType, setNewComponentType] = useState("");
  const [newTerminationType, setNewTerminationType] = useState("");

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return <div className="p-20 text-center">Loading Settings...</div>;

  const handleAddComponentType = () => {
    if (!newComponentType.trim()) return;
    const updated = {
      ...settings,
      componentTypes: [...settings.componentTypes, newComponentType.trim()]
    };
    saveSettings(updated);
    setSettings(updated);
    setNewComponentType("");
    toast({ title: "Success", description: "Component type added." });
  };

  const handleDeleteComponentType = (type: string) => {
    const updated = {
      ...settings,
      componentTypes: settings.componentTypes.filter(t => t !== type)
    };
    saveSettings(updated);
    setSettings(updated);
    toast({ title: "Removed", description: `${type} removed.` });
  };

  const handleAddTerminationType = () => {
    if (!newTerminationType.trim()) return;
    const updated = {
      ...settings,
      terminationTypes: [...settings.terminationTypes, newTerminationType.trim()]
    };
    saveSettings(updated);
    setSettings(updated);
    setNewTerminationType("");
    toast({ title: "Success", description: "Termination type added." });
  };

  const handleDeleteTerminationType = (type: string) => {
    const updated = {
      ...settings,
      terminationTypes: settings.terminationTypes.filter(t => t !== type)
    };
    saveSettings(updated);
    setSettings(updated);
    toast({ title: "Removed", description: `${type} removed.` });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <p className="text-muted-foreground">Manage your rigging library options</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Component Types */}
        <Card className="nautical-gradient border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Component Types
            </CardTitle>
            <CardDescription>Define the available types of stays, shrouds, and halyards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="New component type..." 
                value={newComponentType}
                onChange={(e) => setNewComponentType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComponentType()}
              />
              <Button onClick={handleAddComponentType} className="bg-primary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {settings.componentTypes.map((type) => (
                <div key={type} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/30 group hover:border-primary/50 transition-colors">
                  <span className="text-sm">{type}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => handleDeleteComponentType(type)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Termination Types */}
        <Card className="nautical-gradient border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-accent" />
              Termination Types
            </CardTitle>
            <CardDescription>Configure terminals, fittings, and ends for your inventory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="New termination type..." 
                value={newTerminationType}
                onChange={(e) => setNewTerminationType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTerminationType()}
              />
              <Button onClick={handleAddTerminationType} className="bg-accent text-background hover:bg-accent/80">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {settings.terminationTypes.map((type) => (
                <div key={type} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/30 group hover:border-accent/50 transition-colors">
                  <span className="text-sm">{type}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => handleDeleteTerminationType(type)}
                  >
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