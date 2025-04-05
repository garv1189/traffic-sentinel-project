
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search } from 'lucide-react';
import { LicensePlateData } from '@/types';

interface PlateRecognitionProps {
  licensePlate: LicensePlateData | null;
  isLoading: boolean;
  onLicensePlateChange: (plate: string) => void;
  onSearch: () => void;
}

const PlateRecognition: React.FC<PlateRecognitionProps> = ({
  licensePlate,
  isLoading,
  onLicensePlateChange,
  onSearch,
}) => {
  const [manualInput, setManualInput] = useState('');

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualInput(e.target.value.toUpperCase());
  };

  const handleApplyManual = () => {
    if (manualInput.trim()) {
      onLicensePlateChange(manualInput);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>License Plate Recognition</CardTitle>
        <CardDescription>
          Detected license plate or enter manually
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-2">Detecting license plate...</span>
          </div>
        ) : licensePlate ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold tracking-wider">
                  {licensePlate.text}
                </p>
                <div className="flex mt-1">
                  <Badge variant="outline" className="text-xs">
                    {(licensePlate.confidence * 100).toFixed(1)}% confidence
                  </Badge>
                </div>
              </div>
              <div className="border border-gray-300 rounded p-2 text-center min-w-[100px]">
                <div className="text-xs text-muted-foreground mb-1">Detected</div>
                <div className="text-sm font-medium">License Plate</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-plate">Or enter plate manually:</Label>
              <div className="flex space-x-2">
                <Input
                  id="manual-plate"
                  placeholder="ABC1234"
                  value={manualInput}
                  onChange={handleManualInput}
                  className="uppercase"
                  maxLength={10}
                />
                <Button onClick={handleApplyManual} disabled={!manualInput.trim()}>
                  Apply
                </Button>
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                className="w-full" 
                onClick={onSearch}
                disabled={!licensePlate.text}
              >
                <Search className="h-4 w-4 mr-2" />
                Look Up Vehicle Information
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-sm text-muted-foreground">
                No license plate detected
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-plate">Enter license plate manually:</Label>
              <div className="flex space-x-2">
                <Input
                  id="manual-plate"
                  placeholder="ABC1234"
                  value={manualInput}
                  onChange={handleManualInput}
                  className="uppercase"
                  maxLength={10}
                />
                <Button onClick={handleApplyManual} disabled={!manualInput.trim()}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlateRecognition;
