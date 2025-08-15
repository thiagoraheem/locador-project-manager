import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTicketList } from "@/components/responsive/responsive-ticket-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateTicketModal from "@/components/ticket/create-ticket-modal";
import TicketFilters, { type TicketFilters as TicketFiltersType } from "@/components/ticket/ticket-filters";
import { Ticket, AlertCircle, Clock, CheckCircle, Plus } from "lucide-react";
import type { Ticket as TicketType } from "@shared/schema";

export default function Tickets() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<TicketFiltersType>({
    search: "",
    status: "all",
    priority: "all",
    projectId: "all",
  });

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

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== "all" && ticket.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== "all" && ticket.priority !== filters.priority) {
        return false;
      }

      // Project filter
      if (filters.projectId !== "all" && ticket.projectId !== filters.projectId) {
        return false;
      }

      return true;
    });
  }, [tickets, filters]);

  const filterTicketsByStatus = (status: string) => {
    return filteredTickets.filter(ticket => ticket.status === status);
  };

  const handleFiltersChange = (newFilters: TicketFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      priority: "all",
      projectId: "all",
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Chamados"
        subtitle="Gerencie chamados de suporte, relatórios de bugs e solicitações de recursos."
        onCreateNew={() => setShowCreateModal(true)}
        createButtonText="Novo Chamado"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6">
          <TicketFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">
                Todos os Chamados
                <Badge variant="secondary" className="ml-2">
                  {filteredTickets.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="open">
                Abertos
                <Badge variant="secondary" className="ml-2">
                  {filterTicketsByStatus('open').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                Em Progresso
                <Badge variant="secondary" className="ml-2">
                  {filterTicketsByStatus('in_progress').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolvidos
                <Badge variant="secondary" className="ml-2">
                  {filterTicketsByStatus('resolved').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed">
                Fechados
                <Badge variant="secondary" className="ml-2">
                  {filterTicketsByStatus('closed').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            {filteredTickets.length !== tickets.length && (
              <div className="text-sm text-gray-500">
                Mostrando {filteredTickets.length} de {tickets.length} chamados
              </div>
            )}
          </div>

          <TabsContent value="all" className="mt-6">
            <ResponsiveTicketList tickets={filteredTickets} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="open" className="mt-6">
            <ResponsiveTicketList tickets={filterTicketsByStatus('open')} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="in_progress" className="mt-6">
            <ResponsiveTicketList tickets={filterTicketsByStatus('in_progress')} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            <ResponsiveTicketList tickets={filterTicketsByStatus('resolved')} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="closed" className="mt-6">
            <ResponsiveTicketList tickets={filterTicketsByStatus('closed')} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateTicketModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );


}