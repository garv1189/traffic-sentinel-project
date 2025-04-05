
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ViolationData, DetectedObject } from '@/types';
import { cn } from '@/lib/utils';

interface ViolationDetectorProps {
  violations: ViolationData[];
  detectedObjects: DetectedObject[];
  onSelectViolation: (violation: ViolationData) => void;
  selectedViolation: ViolationData | null;
  isProcessing: boolean;
}

const ViolationDetector: React.FC<ViolationDetectorProps> = ({
  violations,
  detectedObjects,
  onSelectViolation,
  selectedViolation,
  isProcessing,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Violations Detected</CardTitle>
        <CardDescription>
          {isProcessing 
            ? 'Analyzing footage for traffic violations...'
            : violations.length > 0
              ? `${violations.length} potential violations detected`
              : 'No violations detected'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isProcessing ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2 processing-animation">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                AI is analyzing the footage...
              </p>
            </div>
          </div>
        ) : violations.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              <span className="font-medium">{detectedObjects.length}</span> objects detected
              (
                {detectedObjects
                  .map(obj => obj.class)
                  .filter((value, index, self) => self.indexOf(value) === index)
                  .join(', ')}
              )
            </div>
            
            <div className="space-y-2">
              {violations.map((violation, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-4 border rounded-md cursor-pointer transition-all",
                    selectedViolation === violation 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-gray-300"
                  )}
                  onClick={() => onSelectViolation(violation)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle 
                        className={cn(
                          "h-5 w-5 mt-0.5",
                          violation.type === 'speeding' ? "text-amber-500" : 
                          violation.type === 'redLight' ? "text-red-500" : 
                          "text-secondary"
                        )} 
                      />
                      <div>
                        <h4 className="font-medium leading-none mb-1">
                          {formatViolationType(violation.type)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {violation.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {(violation.confidence * 100).toFixed(1)}% confidence
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(violation.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        selectedViolation === violation ? "opacity-100" : "opacity-0"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectViolation(violation);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Selected
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">No Violations Detected</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              The AI analysis did not detect any traffic violations in the uploaded footage.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper functions
function formatViolationType(type: ViolationData['type']): string {
  switch (type) {
    case 'speeding':
      return 'Speeding Violation';
    case 'redLight':
      return 'Red Light Violation';
    case 'wrongWay':
      return 'Wrong Way Driving';
    case 'noSeatbelt':
      return 'No Seatbelt';
    case 'usingPhone':
      return 'Using Phone While Driving';
    default:
      return 'Traffic Violation';
  }
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default ViolationDetector;
