"use client";

import { useState } from "react";
import { generateHardwareList, GenerateHardwareListOutput } from "@/ai/flows/generate-hardware-list";
import { RigProject } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, ClipboardCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HardwareListGeneratorProps {
  project: RigProject;
}

export function HardwareListGenerator({ project }: HardwareListGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateHardwareListOutput | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateHardwareList({
        projectName: project.name,
        vesselName: project.vesselName,
        components: project.components,
        miscellaneousHardware: project.miscellaneousHardware.map(m => ({
          item: m.item,
          quantity: m.quantity,
          notes: m.notes
        }))
      });
      setResult(data);
    } catch (error) {
      console.error("Failed to generate hardware list:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Sparkles className="w-5 h-5" />
              AI Hardware Specification
            </CardTitle>
            <CardDescription>
              Analyze your survey data and generate a comprehensive hardware list with suggested replacement parts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGenerate} 
              disabled={loading || project.components.length === 0}
              className="w-full bg-accent hover:bg-accent/80 text-background font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Survey Data...
                </>
              ) : (
                "Generate Hardware List"
              )}
            </Button>
            {project.components.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Add at least one component to generate a list.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-accent flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Generated Hardware List
              </CardTitle>
              <CardDescription>
                AI-compiled parts list based on your rig survey.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              Recalculate
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-4">
                  {result.hardwareList.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-primary">{item.itemName}</h4>
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-mono">
                          QTY: {item.quantity}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">Specs: <span className="text-muted-foreground font-normal">{item.specifications}</span></p>
                      {item.suggestedReplacementPart && (
                        <p className="text-sm font-medium mb-1">Suggested: <span className="text-accent font-normal">{item.suggestedReplacementPart}</span></p>
                      )}
                      {item.notes && (
                        <p className="text-xs italic text-muted-foreground mt-2 border-t border-border pt-2">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {result.summary && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h5 className="text-xs font-bold uppercase tracking-wider mb-2 text-primary/80">Expert Summary</h5>
                  <p className="text-sm text-foreground/90">{result.summary}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}