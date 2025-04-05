
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Camera, Car, FileVideo, Gauge, Mail, Shield } from 'lucide-react';
import VideoUploader from '@/components/VideoUploader';
import ViolationDetector from '@/components/ViolationDetector';
import PlateRecognition from '@/components/PlateRecognition';
import EmailTicket from '@/components/EmailTicket';
import { 
  ProcessingStatus, 
  DetectedObject, 
  ViolationData, 
  LicensePlateData,
  ViolationTicket
} from '@/types';
import { 
  detectObjectsInVideo, 
  analyzeForViolations, 
  detectLicensePlate,
  extractVideoFrame
} from '@/services/detection';
import { toast } from 'sonner';

const Index = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<ViolationData | null>(null);
  const [licensePlate, setLicensePlate] = useState<LicensePlateData | null>(null);
  const [isDetectingPlate, setIsDetectingPlate] = useState(false);
  const [violationImage, setViolationImage] = useState<string | null>(null);
  const [sentTickets, setSentTickets] = useState<ViolationTicket[]>([]);

  const handleVideoUploaded = (file: File, url: string) => {
    setVideoFile(file);
    setVideoUrl(url);
    resetState();
  };

  const resetState = () => {
    setProcessingStatus(null);
    setIsProcessing(false);
    setDetectedObjects([]);
    setViolations([]);
    setSelectedViolation(null);
    setLicensePlate(null);
    setViolationImage(null);
  };

  const handleProcessVideo = async () => {
    if (!videoFile) {
      toast.error('Please upload a video first');
      return;
    }

    setIsProcessing(true);
    setActiveTab('analyze');

    try {
      // Step 1: Process video with YOLO
      setProcessingStatus({
        stage: 'processing',
        progress: 0,
        message: 'Processing video with YOLO v8 model'
      });

      const objects = await detectObjectsInVideo(
        videoFile, 
        (progress) => {
          setProcessingStatus({
            stage: 'processing',
            progress,
            message: 'Processing video with YOLO v8 model'
          });
        }
      );
      
      setDetectedObjects(objects);
      
      // Step 2: Analyze for violations
      setProcessingStatus({
        stage: 'analyzing',
        progress: 0,
        message: 'Analyzing footage for traffic violations'
      });
      
      const detectedViolations = await analyzeForViolations(
        objects,
        videoFile,
        (progress) => {
          setProcessingStatus({
            stage: 'analyzing',
            progress,
            message: 'Analyzing footage for traffic violations'
          });
        }
      );
      
      setViolations(detectedViolations);
      
      if (detectedViolations.length > 0) {
        // Select the first violation by default
        setSelectedViolation(detectedViolations[0]);
        
        // Extract a frame for the violation
        const frameUrl = await extractVideoFrame(videoFile, detectedViolations[0].timestamp);
        setViolationImage(frameUrl);
        
        // Try to detect license plate
        await handleDetectLicensePlate();
      }
      
      // Complete processing
      setProcessingStatus({
        stage: 'complete',
        progress: 100,
        message: 'Processing complete'
      });
      
      toast.success(`Analysis complete: ${detectedViolations.length} violations detected`);
      
    } catch (error) {
      console.error('Error processing video:', error);
      setProcessingStatus({
        stage: 'error',
        progress: 0,
        message: 'Error processing video'
      });
      toast.error('Error processing video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectViolation = async (violation: ViolationData) => {
    setSelectedViolation(violation);
    
    // Extract frame for this violation
    if (videoFile) {
      const frameUrl = await extractVideoFrame(videoFile, violation.timestamp);
      setViolationImage(frameUrl);
    }
  };

  const handleDetectLicensePlate = async () => {
    if (!violationImage) {
      toast.error('No violation image available');
      return;
    }
    
    setIsDetectingPlate(true);
    
    try {
      // Convert image URL to blob for processing
      const response = await fetch(violationImage);
      const blob = await response.blob();
      
      // Detect license plate
      const plate = await detectLicensePlate(blob);
      setLicensePlate(plate);
      
      if (plate) {
        toast.success(`License plate detected: ${plate.text}`);
      } else {
        toast.warning('No license plate detected in the image');
      }
    } catch (error) {
      console.error('Error detecting license plate:', error);
      toast.error('Error detecting license plate. Please try again.');
    } finally {
      setIsDetectingPlate(false);
    }
  };

  const handleLicensePlateChange = (plate: string) => {
    setLicensePlate({
      text: plate,
      confidence: 1.0, // Manual entry has 100% confidence
      boundingBox: { x: 0, y: 0, width: 0, height: 0 }
    });
  };

  const handleLookupVehicle = () => {
    if (!licensePlate?.text) {
      toast.error('No license plate available');
      return;
    }
    
    toast.info(`Looking up information for plate: ${licensePlate.text}`);
    // In a real app, this would query a database or API
  };

  const handleTicketSent = (ticket: ViolationTicket) => {
    setSentTickets([...sentTickets, ticket]);
  };

  // Move to the ticket tab when all required data is available
  useEffect(() => {
    if (selectedViolation && licensePlate && violationImage && activeTab === 'analyze') {
      setTimeout(() => {
        setActiveTab('ticket');
      }, 1000);
    }
  }, [selectedViolation, licensePlate, violationImage, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-primary-foreground py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Traffic Sentinel</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm">
              <Camera className="h-4 w-4 mr-1" />
              Live Feed
            </Button>
            <Button variant="secondary" size="sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Reports
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid grid-cols-3 w-[400px]">
              <TabsTrigger value="upload" disabled={isProcessing}>
                <FileVideo className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="analyze" disabled={!videoFile || isProcessing}>
                <Gauge className="h-4 w-4 mr-2" />
                Analyze
              </TabsTrigger>
              <TabsTrigger 
                value="ticket" 
                disabled={!selectedViolation || !licensePlate}
              >
                <Mail className="h-4 w-4 mr-2" />
                Ticket
              </TabsTrigger>
            </TabsList>
            
            {videoFile && !isProcessing && activeTab === "upload" && (
              <Button onClick={handleProcessVideo}>
                Process Video
              </Button>
            )}
          </div>

          <TabsContent value="upload" className="mt-0">
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <VideoUploader 
                  onVideoUploaded={handleVideoUploaded}
                  processingStatus={processingStatus}
                  isProcessing={isProcessing}
                />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs font-medium">1</span>
                    </div>
                    <p>Upload dashcam footage to analyze for traffic violations</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs font-medium">2</span>
                    </div>
                    <p>AI-powered analysis detects vehicles, traffic signs, and potential violations</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs font-medium">3</span>
                    </div>
                    <p>Automatically recognize license plates of violating vehicles</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs font-medium">4</span>
                    </div>
                    <p>Generate and send violation tickets with evidence images</p>
                  </li>
                </ol>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ViolationDetector 
                violations={violations}
                detectedObjects={detectedObjects}
                onSelectViolation={handleSelectViolation}
                selectedViolation={selectedViolation}
                isProcessing={isProcessing}
              />
              
              <div className="space-y-6">
                {violationImage && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="rounded-md overflow-hidden border">
                        <img 
                          src={violationImage} 
                          alt="Traffic violation" 
                          className="w-full h-auto"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-sm text-muted-foreground">
                          {selectedViolation && (
                            <span>Timestamp: {formatTimestamp(selectedViolation.timestamp)}</span>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDetectLicensePlate}
                          disabled={isDetectingPlate}
                        >
                          <Car className="h-4 w-4 mr-1" />
                          {isDetectingPlate ? 'Detecting...' : 'Detect Plate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <PlateRecognition 
                  licensePlate={licensePlate}
                  isLoading={isDetectingPlate}
                  onLicensePlateChange={handleLicensePlateChange}
                  onSearch={handleLookupVehicle}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ticket" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EmailTicket 
                licensePlate={licensePlate}
                selectedViolation={selectedViolation}
                violationImage={violationImage}
                onTicketSent={handleTicketSent}
              />
              
              <div className="space-y-6">
                {violationImage && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="rounded-md overflow-hidden border">
                        <img 
                          src={violationImage} 
                          alt="Traffic violation" 
                          className="w-full h-auto"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {sentTickets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sent Tickets</CardTitle>
                      <CardDescription>
                        Recently issued violation notices
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {sentTickets.map((ticket, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{ticket.licensePlate}</div>
                              <div className="text-sm text-muted-foreground">
                                {ticket.violationType} - ${ticket.fine}
                              </div>
                            </div>
                            <div className="text-sm text-right">
                              <div>{new Date(ticket.date).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">{ticket.recipientEmail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-gray-100 py-6 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium">Traffic Sentinel</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>Traffic violation detection powered by YOLOv8</p>
              <p>© 2025 Traffic Sentinel. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper function for formatting timestamps
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default Index;
