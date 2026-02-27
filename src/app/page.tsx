"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects, deleteProject, RigProject } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor, Plus, Ship, Calendar, Trash2, ArrowRight, Settings2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const [projects, setProjects] = useState<RigProject[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(getProjects());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Anchor className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-black tracking-tight text-white">RigSurvey</h1>
          </div>
          <p className="text-muted-foreground text-lg">Marine Rigging Survey & Specification Tool</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin">
            <Button variant="outline" size="lg" className="border-border hover:bg-secondary/50 font-semibold gap-2">
              <Settings2 className="w-5 h-5" />
              Configure Library
            </Button>
          </Link>
          <Link href="/projects/new">
            <Button size="lg" className="bg-accent hover:bg-accent/80 text-background font-bold gap-2 shadow-lg shadow-accent/20">
              <Plus className="w-5 h-5" />
              New Survey
            </Button>
          </Link>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-2xl border-2 border-dashed border-border text-center px-6">
          <Ship className="w-20 h-20 text-muted-foreground/30 mb-6" />
          <h2 className="text-2xl font-bold mb-2">No Survey Projects Yet</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Create your first rigging survey to start managing components, measuring lengths, and generating hardware lists.
          </p>
          <Link href="/projects/new">
            <Button variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-background">
              Start New Survey
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:border-accent/50 transition-all duration-300 nautical-gradient relative overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Ship className="w-6 h-6 text-primary" />
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Survey Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the survey for <strong>{project.vesselName}</strong> and all associated component data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Project
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <CardTitle className="text-xl group-hover:text-accent transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="font-semibold text-foreground/80">{project.vesselName}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(project.createdAt, "PPP")}
                </div>
                <div className="mt-4 flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary/70">Components</span>
                    <span className="text-lg font-mono">{project.components.length}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/projects/${project.id}`} className="w-full">
                  <Button className="w-full bg-secondary hover:bg-primary gap-2 transition-all">
                    View Survey
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}