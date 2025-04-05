
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProcessingStatus } from '@/types';

interface VideoUploaderProps {
  onVideoUploaded: (file: File, videoUrl: string) => void;
  processingStatus: ProcessingStatus | null;
  isProcessing: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onVideoUploaded, 
  processingStatus, 
  isProcessing 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection via the file input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle the selected file
  const handleFile = (file: File) => {
    // Check if it's a video file
    if (!file.type.match('video.*')) {
      toast.error('Please upload a video file');
      return;
    }
    
    // Create URL for the video preview
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setVideoUrl(url);
    onVideoUploaded(file, url);
  };

  // Trigger the hidden file input
  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove the selected file
  const removeFile = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setSelectedFile(null);
    setVideoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {!selectedFile ? (
          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              <Upload className="h-12 w-12 mb-4 text-primary" />
              <p className="text-lg font-medium mb-1">
                Drag and drop your dashcam footage here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files (MP4, AVI, MOV up to 500MB)
              </p>
              <Button onClick={onButtonClick}>
                Select Video
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleChange}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            {videoUrl && (
              <div className="relative rounded-lg overflow-hidden mb-4">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-auto"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="text-sm">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            
            {processingStatus && (
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium">{processingStatus.message}</p>
                  <p className="text-sm">{processingStatus.progress.toFixed(0)}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full upload-progress"
                    style={{ width: `${processingStatus.progress}%` }}
                  ></div>
                </div>
                {processingStatus.stage === 'processing' && (
                  <div className="flex justify-center mt-2 processing-animation">
                    <div className="w-2 h-2 bg-primary rounded-full mx-1"></div>
                    <div className="w-2 h-2 bg-primary rounded-full mx-1"></div>
                    <div className="w-2 h-2 bg-primary rounded-full mx-1"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUploader;
