import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  type: 'stat' | 'progress' | 'list' | 'calendar';
  visible: boolean;
  data?: any;
}

interface DashboardWidgetsProps {
  widgets: Widget[];
  onToggleWidget: (widgetId: string) => void;
  onConfigureWidget?: (widgetId: string) => void;
}

export function DashboardWidgets({ widgets, onToggleWidget, onConfigureWidget }: DashboardWidgetsProps) {
  const [showConfig, setShowConfig] = useState(false);

  const renderWidget = (widget: Widget) => {
    if (!widget.visible) return null;

    switch (widget.type) {
      case 'stat':
        return (
          <Card key={widget.id} className="relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConfigureWidget?.(widget.id)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{widget.data?.value || 0}</div>
              <p className="text-xs text-muted-foreground">
                {widget.data?.change && (
                  <span className={`inline-flex items-center ${
                    widget.data.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {widget.data.change > 0 ? '+' : ''}{widget.data.change}%
                  </span>
                )}
                {widget.data?.description}
              </p>
            </CardContent>
          </Card>
        );

      case 'progress':
        return (
          <Card key={widget.id} className="relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConfigureWidget?.(widget.id)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {widget.data?.items?.map((item: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 'list':
        return (
          <Card key={widget.id} className="relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConfigureWidget?.(widget.id)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {widget.data?.items?.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {item.type === 'task' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {item.type === 'deadline' && <Clock className="h-4 w-4 text-orange-500" />}
                      {item.type === 'issue' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'calendar':
        return (
          <Card key={widget.id} className="relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConfigureWidget?.(widget.id)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {widget.data?.events?.slice(0, 4).map((event: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Widgets do Dashboard</h2>
        <Button
          variant="outline"
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Configurar</span>
        </Button>
      </div>

      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração dos Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{widget.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleWidget(widget.id)}
                  >
                    {widget.visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {widgets.map(renderWidget)}
      </div>
    </div>
  );
}