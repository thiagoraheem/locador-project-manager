import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, AlertCircle, Clock, CheckCircle } from "lucide-react";
import type { Ticket as TicketType } from "@shared/schema";

interface TicketCardProps {
  ticket: TicketType;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`ticket-card-${ticket.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${getPriorityColor(ticket.priority)} bg-opacity-10`}>
              {getPriorityIcon(ticket.priority)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text mb-1">{ticket.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" data-testid={`view-ticket-${ticket.id}`}>
            View Details
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <span>ID: #{ticket.id.slice(0, 8)}</span>
            {ticket.projectId && <span>Project: {ticket.projectId.slice(0, 8)}</span>}
          </div>
          <span>{formatTimeAgo(ticket.createdAt.toString())}</span>
        </div>
      </CardContent>
    </Card>
  );
}
