import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Image as ImageIcon, Video, Upload, X, Download } from 'lucide-react';
import { toast } from 'sonner';

export function MediaStudio() {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateImage = async () => {
    toast.info("Cloud image generation is disabled in Pure Local mode. Local model integration pending.");
  };

  const generateVideo = async () => {
    toast.error("Video generation requires a cloud sub-processor, which is disabled for privacy.");
  };

  return (
    <div className="flex flex-col h-full bg-background p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Media Studio (Local)</h2>
          <p className="text-muted-foreground">Privacy-first media interface. Cloud processing is disabled.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Input 
                placeholder="Describe what you want to generate..." 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-12"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Image (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-muted/30">
                {imageBase64 ? (
                  <>
                    <img src={imageBase64} alt="Reference" className="max-h-48 object-contain z-10" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop an image, or click to browse</p>
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Select Image
                    </Button>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                className="flex-1 h-12 gap-2" 
                onClick={generateImage}
                disabled={isGenerating}
              >
                <ImageIcon className="h-5 w-5" />
                Generate Image
              </Button>
              <Button 
                className="flex-1 h-12 gap-2" 
                variant="secondary"
                onClick={generateVideo}
                disabled={isGenerating}
              >
                <Video className="h-5 w-5" />
                Generate Video
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px] relative">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Neural core is in local mode. Image synthesis is currently limited to local models.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
