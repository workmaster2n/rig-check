"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiggingComponent, RiggingComponentSchema } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface RiggingComponentFormProps {
  initialData?: Partial<RiggingComponent>;
  onSubmit: (data: RiggingComponent) => void;
  onCancel: () => void;
}

const componentTypes = [
  "Main Shroud (Cap)",
  "Lower Shroud",
  "Intermediate Shroud",
  "Forestay",
  "Backstay",
  "Inner Forestay",
  "Seagull Striker",
  "Runner",
  "Checkstay",
  "Halyard",
  "Baby Stay",
  "Other Stay/Shroud"
];

const terminationTypes = [
  "Swage Stud",
  "Toggle Fork",
  "Toggle Eye",
  "T-Ball",
  "Eye Terminal",
  "Stemball",
  "Thimble",
  "Dead-eye",
  "Turnbuckle Body",
  "Mechanical Terminal (Sta-Lok/Norseman)",
  "Spliced Eye (Dyneema)",
  "Other"
];

export function RiggingComponentForm({ initialData, onSubmit, onCancel }: RiggingComponentFormProps) {
  const form = useForm<RiggingComponent>({
    resolver: zodResolver(RiggingComponentSchema),
    defaultValues: {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      type: initialData?.type || "",
      quantity: initialData?.quantity || 1,
      lengthInMeters: initialData?.lengthInMeters,
      diameterInMM: initialData?.diameterInMM,
      material: initialData?.material || "1x19 Stainless Steel",
      upperTermination: initialData?.upperTermination || "",
      lowerTermination: initialData?.lowerTermination || "",
      pinSizeUpperInMM: initialData?.pinSizeUpperInMM,
      pinSizeLowerInMM: initialData?.pinSizeLowerInMM,
      notes: initialData?.notes || ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Component Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {componentTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="lengthInMeters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (m)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="diameterInMM"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diameter (mm)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="material"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 1x19 SS, Dyneema" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-4">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Upper Termination</h4>
            <FormField
              control={form.control}
              name="upperTermination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select termination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {terminationTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pinSizeUpperInMM"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pin Size (mm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Lower Termination</h4>
            <FormField
              control={form.control}
              name="lowerTermination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select termination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {terminationTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pinSizeLowerInMM"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pin Size (mm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Specific requirements, brand names, or installation notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground">Save Component</Button>
        </div>
      </form>
    </Form>
  );
}