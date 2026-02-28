
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiggingComponent, RiggingComponentSchema, getSettings, RigSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Camera, X, Image as ImageIcon, Plus, CameraIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface RiggingComponentFormProps {
  initialData?: Partial<RiggingComponent>;
  onSubmit: (data: RiggingComponent) => void;
  onCancel: () => void;
}

export function RiggingComponentForm({ initialData, onSubmit, onCancel }: RiggingComponentFormProps) {
  const [settings, setSettings] = useState<RigSettings | null>(null);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      notes: initialData?.notes || "",
      photos: initialData?.photos || []
    }
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotos(prev => [...prev, base64String]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: RiggingComponent) => {
    onSubmit({ ...data, photos });
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => [...prev, dataUri]);
        stopCamera();
      }
    }
  };

  if (!settings) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                  <Input 
                    type="number" 
                    {...field} 
                    value={field.value ?? 1}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                    }} 
                  />
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
                <FormLabel>Length</FormLabel>
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
                <FormLabel>Diameter</FormLabel>
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
                  <FormLabel>Pin Size</FormLabel>
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
                  <FormLabel>Pin Size</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 12mm or 1/2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-4">
          <Label className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Photos
          </Label>
          <div className="flex flex-wrap gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border">
                <img src={photo} alt={`Component ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition-all bg-background/50"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase text-center px-1">Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition-all bg-background/50"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase">Upload</span>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
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

      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Capture Photo</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline 
            />
            {hasCameraPermission === false && (
              <Alert variant="destructive" className="absolute inset-x-4 top-4">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature.
                </AlertDescription>
              </Alert>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter className="flex-row justify-between gap-2">
            <Button variant="outline" onClick={stopCamera}>Cancel</Button>
            <Button 
              className="bg-accent text-background hover:bg-accent/80 flex-1 gap-2" 
              onClick={capturePhoto}
              disabled={!hasCameraPermission}
            >
              <CameraIcon className="w-4 h-4" />
              Capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
