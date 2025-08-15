import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { Ticket as TicketType } from "@shared/schema";
import { formatTimeAgo } from "@/lib/utils";

interface ResponsiveTicketListProps {
  tickets: TicketType[];
  isLoading: boolean;
}

export function ResponsiveTicketList({ tickets, isLoading }: ResponsiveTicketListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Progresso';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 md:p-6">
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
        <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum chamado encontrado</h3>
        <p className="mt-2 text-sm text-gray-500">
          Nenhum chamado corresponde ao filtro atual. Tente um status diferente ou crie um novo chamado.
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
          <CardContent className="p-4 md:p-6">
            {/* Mobile Layout */}
            <div className="block md:hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getPriorityIcon(ticket.priority)}
                  <h3 className="font-semibold text-sm text-text line-clamp-1">{ticket.title}</h3>
                </div>
                <Link href={`/tickets/${ticket.id}`}>
                  <Button variant="outline" size="sm" className="text-xs px-2 py-1">
                    Ver
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityText(ticket.priority)}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(ticket.createdAt.toString())}
                </span>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>#{ticket.id.slice(0, 8)}</span>
                  {ticket.projectId && <span>Projeto: {ticket.projectId.slice(0, 8)}</span>}
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
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
                        {getPriorityText(ticket.priority)}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {getStatusText(ticket.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Link href={`/tickets/${ticket.id}`}>
                  <Button variant="outline" size="sm" data-testid={`view-ticket-${ticket.id}`}>
                    Ver Detalhes
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <span>ID: #{ticket.id.slice(0, 8)}</span>
                  {ticket.projectId && <span>Projeto: {ticket.projectId.slice(0, 8)}</span>}
                </div>
                <span>{formatTimeAgo(ticket.createdAt.toString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}