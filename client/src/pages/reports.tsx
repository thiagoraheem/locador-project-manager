import { ReportsDashboard } from '@/components/reports/reports-dashboard';
import Header from '@/components/layout/header';

export default function Reports() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Relatórios" 
        subtitle="Visualize e exporte relatórios de produtividade, status de projetos e controle de tempo"
      />
      <div className="flex-1 overflow-auto p-6">
        <ReportsDashboard />
      </div>
    </div>
  );
}