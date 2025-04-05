
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MailCheck, Send } from 'lucide-react';
import { ViolationData, ViolationTicket, LicensePlateData } from '@/types';
import { sendViolationTicket } from '@/services/detection';

interface EmailTicketProps {
  licensePlate: LicensePlateData | null;
  selectedViolation: ViolationData | null;
  violationImage: string | null;
  onTicketSent: (ticket: ViolationTicket) => void;
}

const EmailTicket: React.FC<EmailTicketProps> = ({
  licensePlate,
  selectedViolation,
  violationImage,
  onTicketSent,
}) => {
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [fine, setFine] = useState('100');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const isFormValid = () => {
    return (
      email.includes('@') &&
      location.trim() !== '' &&
      licensePlate?.text &&
      selectedViolation &&
      !isNaN(Number(fine)) &&
      Number(fine) > 0
    );
  };

  const handleSendTicket = async () => {
    if (!isFormValid() || !licensePlate?.text || !selectedViolation) return;
    
    setIsSending(true);
    
    const ticket: ViolationTicket = {
      id: generateTicketId(),
      date: new Date(),
      location: location,
      licensePlate: licensePlate.text,
      violationType: formatViolationType(selectedViolation.type),
      description: selectedViolation.description,
      evidenceImageUrl: violationImage || undefined,
      fine: Number(fine),
      recipientEmail: email,
    };
    
    const success = await sendViolationTicket(ticket);
    
    if (success) {
      setIsSent(true);
      onTicketSent(ticket);
    }
    
    setIsSending(false);
  };

  const resetForm = () => {
    setEmail('');
    setLocation('');
    setFine('100');
    setAdditionalNotes('');
    setIsSent(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Violation Ticket</CardTitle>
        <CardDescription>
          Send an automated traffic violation notice
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <MailCheck className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Ticket Successfully Sent</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              A traffic violation ticket has been sent to {email}
            </p>
            <Button className="mt-6" onClick={resetForm}>
              Issue Another Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fine">Fine Amount ($)</Label>
                <Input
                  id="fine"
                  type="number"
                  min="1"
                  value={fine}
                  onChange={(e) => setFine(e.target.value)}
                  disabled={isSending}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Violation Location</Label>
              <Input
                id="location"
                placeholder="e.g. Main St & 5th Ave, City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSending}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Plate</Label>
                <div className="border border-input rounded-md p-2 bg-muted">
                  {licensePlate?.text || 'No plate detected'}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Violation Type</Label>
                <div className="border border-input rounded-md p-2 bg-muted">
                  {selectedViolation 
                    ? formatViolationType(selectedViolation.type) 
                    : 'No violation selected'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional information..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                disabled={isSending}
              />
            </div>
            
            {violationImage && (
              <div className="space-y-2">
                <Label>Evidence</Label>
                <div className="border border-input rounded-md overflow-hidden">
                  <img 
                    src={violationImage} 
                    alt="Violation evidence" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {!isSent && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled={isSending}>
            Preview Ticket
          </Button>
          <Button 
            onClick={handleSendTicket}
            disabled={!isFormValid() || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Ticket
              </>
            )}
          </Button>
        </CardFooter>
      )}
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

function generateTicketId(): string {
  return 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

export default EmailTicket;
