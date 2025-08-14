import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateTicketModal from "@/components/ticket/create-ticket-modal";
import { Ticket, AlertCircle, Clock, CheckCircle } from "lucide-react";
import type { Ticket as TicketType } from "@shared/schema";

export default function Tickets() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
  });

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

  const filterTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title="Tickets" 
        subtitle="Manage support tickets, bug reports, and feature requests."
        onCreateNew={() => setShowCreateModal(true)}
        createButtonText="New Ticket"
      />
      
      <div className="p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Tickets</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <TicketsList tickets={tickets} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="open" className="mt-6">
            <TicketsList tickets={filterTicketsByStatus('open')} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="in_progress" className="mt-6">
            <TicketsList tickets={filterTicketsByStatus('in_progress')} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            <TicketsList tickets={filterTicketsByStatus('resolved')} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="closed" className="mt-6">
            <TicketsList tickets={filterTicketsByStatus('closed')} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateTicketModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );

  function TicketsList({ tickets, isLoading }: { tickets: TicketType[], isLoading: boolean }) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (tickets.length === 0) {
      return (
        <div className="text-center py-12">
          <Ticket className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tickets found</h3>
          <p className="mt-2 text-sm text-gray-500">
            No tickets match the current filter. Try a different status or create a new ticket.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card 
            key={ticket.id} 
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
        ))}
      </div>
    );
  }
}
