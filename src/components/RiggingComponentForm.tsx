"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiggingComponent, RiggingComponentSchema, getSettings, RigSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface RiggingComponentFormProps {
  initialData?: Partial<RiggingComponent>;
  onSubmit: (data: RiggingComponent) => void;
  onCancel: () => void;
}

export function RiggingComponentForm({ initialData, onSubmit, onCancel }: RiggingComponentFormProps) {
  const [settings, setSettings] = useState<RigSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const form = useForm<RiggingComponent>({
    resolver: zodResolver(RiggingComponentSchema),
    defaultValues: {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      type: initialData?.type || "",
      quantity: initialData?.quantity || 1,
      length: initialData?.length || "",
      diameter: initialData?.diameter || "",
      material: initialData?.material || "1x19 Stainless Steel",
      upperTermination: initialData?.upperTermination || "",
      lowerTermination: initialData?.lowerTermination || "",
      pinSizeUpper: initialData?.pinSizeUpper || "",
      pinSizeLower: initialData?.pinSizeLower || "",
      notes: initialData?.notes || ""
    }
  });

  if (!settings) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Component Type</FormLabel>
                <FormControl>
                  <SearchableSelect 
                    options={settings.componentTypes}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select type"
                  />
                </FormControl>
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
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (Metric or Imperial)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 12.5m or 41ft" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="diameter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diameter (Metric or Imperial)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 8mm or 5/16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="material"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Material</FormLabel>
                <FormControl>
                  <SearchableSelect 
                    options={settings.materialTypes || []}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select material"
                  />
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
                <FormItem className="flex flex-col">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <SearchableSelect 
                      options={settings.terminationTypes}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select termination"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pinSizeUpper"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pin Size (mm or fraction)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 12mm or 1/2" {...field} />
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
                <FormItem className="flex flex-col">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <SearchableSelect 
                      options={settings.terminationTypes}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select termination"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pinSizeLower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pin Size (mm or fraction)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 12mm or 1/2" {...field} />
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
