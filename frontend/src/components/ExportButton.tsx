'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { apiClient } from '@/utils/apiClient';

interface ExportButtonProps {
  endpoint: string;
  filename: string;
  disabled?: boolean;
}

export default function ExportButton({ endpoint, filename, disabled = false }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    try {
      setExporting(true);
      setError('');

      const response = await apiClient.get(endpoint);

      if (!response.success || !response.data) {
        setError(response.error || 'Erro ao exportar dados');
        return;
      }

      // Verificar se response.data tem a propriedade data
      const exportData = (response.data as { data?: unknown[] }).data || response.data;

      if (!Array.isArray(exportData) || exportData.length === 0) {
        setError('Nenhum dado disponível para exportar');
        return;
      }

      // Criar planilha Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

      // Ajustar largura das colunas automaticamente
      const cols = Object.keys(exportData[0] as Record<string, unknown>).map(key => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet['!cols'] = cols;

      // Gerar nome do arquivo com timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${filename}_${timestamp}.xlsx`;

      // Download do arquivo
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      setError('Erro ao exportar dados');
    } finally {
      setExporting(false);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleExport}
        disabled={disabled || exporting}
        className="inline-flex items-center justify-center w-10 h-10 bg-transparent text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Exportar Excel
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
      </div>

      {error && (
        <div className="absolute top-full left-0 mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
