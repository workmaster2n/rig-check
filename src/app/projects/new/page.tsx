"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSettings, RigSettings } from "@/lib/store";
import { useUser, useFirestore } from "@/firebase";
import { doc, collection, serverTimestamp } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Anchor, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewProject() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [projectName, setProjectName] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [boatType, setBoatType] = useState("");
  const [settings, setSettings] = useState<RigSettings | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !vesselName || !settings || !user || !firestore) return;

    const projectId = Math.random().toString(36).substr(2, 9);
    
    // Start with global default checklist
    const tasks = [...settings.defaultChecklist];
    
    // Add boat-specific items if they exist
    if (boatType && settings.boatSpecificChecklists?.[boatType]) {
      tasks.push(...settings.boatSpecificChecklists[boatType]);
    }

    // Initialize checklist items with unique IDs
    const checklist = tasks.map(task => ({
      id: Math.random().toString(36).substr(2, 9),
      task
    }));

    const projectData = {
      id: projectId,
      projectName,
      vesselName,
      boatType,
      checklist,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      surveyDate: new Date().toISOString(),
    };

    const projectRef = doc(firestore, "users", user.uid, "riggingProjects", projectId);
    setDocumentNonBlocking(projectRef, projectData, { merge: true });
    
    router.push(`/projects/${projectId}`);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <Card className="nautical-gradient border-accent/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Anchor className="w-6 h-6 text-accent" />
          </div>
          <CardTitle className="text-3xl font-black">New Rigging Survey</CardTitle>
          <CardDescription>Enter the project details to begin your survey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vessel">Vessel Name</Label>
              <Input 
                id="vessel" 
                placeholder="e.g. S/V Sea Breeze" 
                value={vesselName} 
                onChange={(e) => setVesselName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="boatType">Boat Type / Model</Label>
              {settings ? (
                <SearchableSelect 
                  options={settings.productionBoats}
                  value={boatType}
                  onChange={setBoatType}
                  placeholder="Select production boat..."
                />
              ) : (
                <Input placeholder="Loading boat types..." disabled />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Project Name / Reference</Label>
              <Input 
                id="name" 
                placeholder="e.g. Standing Rigging Replacement 2024" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/80 text-background font-bold text-lg py-6 mt-4">
              Create Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
