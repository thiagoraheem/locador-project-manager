import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportData, ProductivityReport, ProjectStatusReport, TimeTrackingReport } from '@/hooks/use-reports';

// Tipos para exportação
export interface ExportOptions {
  filename?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
}

// Função para exportar para CSV
export function exportToCSV(data: any[], filename: string = 'export.csv') {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar aspas e vírgulas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

// Função para exportar para Excel (usando CSV com encoding UTF-8)
export function exportToExcel(report: ReportData, options: ExportOptions = {}) {
  const filename = options.filename || `${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  
  let csvContent = '';
  
  // Adicionar metadados se solicitado
  if (options.includeMetadata !== false) {
    csvContent += `Relatório,${report.name}\n`;
    csvContent += `Descrição,${report.description}\n`;
    csvContent += `Período,${format(report.period.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(report.period.end, 'dd/MM/yyyy', { locale: ptBR })}\n`;
    csvContent += `Gerado em,${format(report.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}\n`;
    csvContent += '\n';
  }

  // Adicionar dados específicos do tipo de relatório
  switch (report.type) {
    case 'productivity':
      csvContent += formatProductivityDataForExcel(report.data as ProductivityReport);
      break;
    case 'project-status':
      csvContent += formatProjectStatusDataForExcel(report.data as ProjectStatusReport);
      break;
    case 'time-tracking':
      csvContent += formatTimeTrackingDataForExcel(report.data as TimeTrackingReport);
      break;
    default:
      throw new Error('Tipo de relatório não suportado para exportação');
  }

  // Adicionar BOM para UTF-8 (para Excel reconhecer acentos)
  const bom = '\uFEFF';
  downloadFile(bom + csvContent, filename, 'text/csv;charset=utf-8');
}

// Função para exportar para PDF (usando HTML e print)
export function exportToPDF(report: ReportData, options: ExportOptions = {}) {
  const filename = options.filename || `${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  
  // Criar HTML para o relatório
  const htmlContent = generateReportHTML(report, options);
  
  // Criar uma nova janela para impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Não foi possível abrir janela de impressão. Verifique se pop-ups estão bloqueados.');
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    printWindow.print();
    // Fechar janela após impressão (opcional)
    setTimeout(() => printWindow.close(), 1000);
  };
}

// Função auxiliar para formatar dados de produtividade para Excel
function formatProductivityDataForExcel(data: ProductivityReport): string {
  let content = 'RESUMO GERAL\n';
  content += `Total de Tarefas,${data.totalTasks}\n`;
  content += `Tarefas Concluídas,${data.completedTasks}\n`;
  content += `Taxa de Conclusão,${data.completionRate.toFixed(1)}%\n`;
  content += `Total de Chamados,${data.totalTickets}\n`;
  content += `Chamados Resolvidos,${data.resolvedTickets}\n`;
  content += `Taxa de Resolução,${data.resolutionRate.toFixed(1)}%\n`;
  content += `Tempo Médio por Tarefa,${data.averageTaskTime.toFixed(1)} horas\n`;
  content += '\n';
  
  content += 'PRODUTIVIDADE POR MEMBRO\n';
  content += 'Nome,Tarefas Concluídas,Tarefas Atribuídas,Chamados Resolvidos,Produtividade (%)\n';
  
  data.teamMembers.forEach(member => {
    content += `${member.name},${member.tasksCompleted},${member.tasksAssigned},${member.ticketsResolved},${member.productivity.toFixed(1)}%\n`;
  });
  
  return content;
}

// Função auxiliar para formatar dados de status de projetos para Excel
function formatProjectStatusDataForExcel(data: ProjectStatusReport): string {
  let content = 'RESUMO GERAL\n';
  content += `Total de Projetos,${data.totalProjects}\n`;
  content += `Projetos no Prazo,${data.projectsOnTime}\n`;
  content += `Projetos Atrasados,${data.projectsDelayed}\n`;
  content += `Duração Média (dias),${data.averageProjectDuration}\n`;
  content += '\n';
  
  content += 'PROJETOS POR STATUS\n';
  content += 'Status,Quantidade,Percentual\n';
  data.projectsByStatus.forEach(status => {
    const statusName = getStatusDisplayName(status.status);
    content += `${statusName},${status.count},${status.percentage.toFixed(1)}%\n`;
  });
  content += '\n';
  
  content += 'DETALHES DOS PROJETOS\n';
  content += 'Nome,Status,Progresso (%),Data Início,Data Fim,Atrasado\n';
  data.projects.forEach(project => {
    const statusName = getStatusDisplayName(project.status);
    content += `${project.name},${statusName},${project.progress}%,${project.startDate},${project.endDate},${project.isDelayed ? 'Sim' : 'Não'}\n`;
  });
  
  return content;
}

// Função auxiliar para formatar dados de controle de tempo para Excel
function formatTimeTrackingDataForExcel(data: TimeTrackingReport): string {
  let content = 'RESUMO GERAL\n';
  content += `Total de Horas,${data.totalHours}\n`;
  content += `Horas Faturáveis,${data.billableHours}\n`;
  content += `Horas Não Faturáveis,${data.nonBillableHours}\n`;
  content += `Média de Horas por Dia,${data.averageHoursPerDay.toFixed(1)}\n`;
  content += '\n';
  
  content += 'TEMPO POR PROJETO\n';
  content += 'Projeto,Horas,Percentual\n';
  data.timeByProject.forEach(project => {
    content += `${project.projectName},${project.hours},${project.percentage.toFixed(1)}%\n`;
  });
  content += '\n';
  
  content += 'TEMPO POR MEMBRO\n';
  content += 'Membro,Horas,Eficiência (%)\n';
  data.timeByMember.forEach(member => {
    content += `${member.memberName},${member.hours},${member.efficiency}%\n`;
  });
  
  return content;
}

// Função para gerar HTML do relatório para PDF
function generateReportHTML(report: ReportData, options: ExportOptions): string {
  const styles = `
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        color: #333;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .header h1 {
        color: #1e40af;
        margin: 0;
      }
      .header p {
        margin: 5px 0;
        color: #6b7280;
      }
      .section {
        margin-bottom: 30px;
      }
      .section h2 {
        color: #1f2937;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 8px 12px;
        text-align: left;
      }
      th {
        background-color: #f3f4f6;
        font-weight: bold;
      }
      .metric {
        display: inline-block;
        margin: 10px 20px 10px 0;
        padding: 10px;
        background-color: #f8fafc;
        border-radius: 6px;
        border-left: 4px solid #3b82f6;
      }
      .metric-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      .metric-value {
        font-size: 18px;
        font-weight: bold;
        color: #1f2937;
      }
      @media print {
        body { margin: 0; }
        .section { page-break-inside: avoid; }
      }
    </style>
  `;

  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${report.name}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>${report.name}</h1>
        <p>${report.description}</p>
        <p><strong>Período:</strong> ${format(report.period.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(report.period.end, 'dd/MM/yyyy', { locale: ptBR })}</p>
        <p><strong>Gerado em:</strong> ${format(report.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
      </div>
  `;

  // Adicionar conteúdo específico do tipo de relatório
  switch (report.type) {
    case 'productivity':
      content += generateProductivityHTML(report.data as ProductivityReport);
      break;
    case 'project-status':
      content += generateProjectStatusHTML(report.data as ProjectStatusReport);
      break;
    case 'time-tracking':
      content += generateTimeTrackingHTML(report.data as TimeTrackingReport);
      break;
  }

  content += `
    </body>
    </html>
  `;

  return content;
}

// Funções auxiliares para gerar HTML específico de cada tipo de relatório
function generateProductivityHTML(data: ProductivityReport): string {
  return `
    <div class="section">
      <h2>Resumo Geral</h2>
      <div class="metric">
        <div class="metric-label">Total de Tarefas</div>
        <div class="metric-value">${data.totalTasks}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Tarefas Concluídas</div>
        <div class="metric-value">${data.completedTasks}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Taxa de Conclusão</div>
        <div class="metric-value">${data.completionRate.toFixed(1)}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Chamados Resolvidos</div>
        <div class="metric-value">${data.resolvedTickets}/${data.totalTickets}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>Produtividade por Membro</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tarefas Concluídas</th>
            <th>Tarefas Atribuídas</th>
            <th>Chamados Resolvidos</th>
            <th>Produtividade</th>
          </tr>
        </thead>
        <tbody>
          ${data.teamMembers.map(member => `
            <tr>
              <td>${member.name}</td>
              <td>${member.tasksCompleted}</td>
              <td>${member.tasksAssigned}</td>
              <td>${member.ticketsResolved}</td>
              <td>${member.productivity.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateProjectStatusHTML(data: ProjectStatusReport): string {
  return `
    <div class="section">
      <h2>Resumo Geral</h2>
      <div class="metric">
        <div class="metric-label">Total de Projetos</div>
        <div class="metric-value">${data.totalProjects}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Projetos no Prazo</div>
        <div class="metric-value">${data.projectsOnTime}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Projetos Atrasados</div>
        <div class="metric-value">${data.projectsDelayed}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>Projetos por Status</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Quantidade</th>
            <th>Percentual</th>
          </tr>
        </thead>
        <tbody>
          ${data.projectsByStatus.map(status => `
            <tr>
              <td>${getStatusDisplayName(status.status)}</td>
              <td>${status.count}</td>
              <td>${status.percentage.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateTimeTrackingHTML(data: TimeTrackingReport): string {
  return `
    <div class="section">
      <h2>Resumo Geral</h2>
      <div class="metric">
        <div class="metric-label">Total de Horas</div>
        <div class="metric-value">${data.totalHours}h</div>
      </div>
      <div class="metric">
        <div class="metric-label">Horas Faturáveis</div>
        <div class="metric-value">${data.billableHours}h</div>
      </div>
      <div class="metric">
        <div class="metric-label">Média por Dia</div>
        <div class="metric-value">${data.averageHoursPerDay.toFixed(1)}h</div>
      </div>
    </div>
    
    <div class="section">
      <h2>Tempo por Projeto</h2>
      <table>
        <thead>
          <tr>
            <th>Projeto</th>
            <th>Horas</th>
            <th>Percentual</th>
          </tr>
        </thead>
        <tbody>
          ${data.timeByProject.map(project => `
            <tr>
              <td>${project.projectName}</td>
              <td>${project.hours}h</td>
              <td>${project.percentage.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Função auxiliar para baixar arquivo
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Função auxiliar para obter nome de exibição do status
function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'planning': 'Planejamento',
    'in_progress': 'Em Progresso',
    'review': 'Em Revisão',
    'completed': 'Concluído',
    'on_hold': 'Em Espera'
  };
  
  return statusMap[status] || status;
}