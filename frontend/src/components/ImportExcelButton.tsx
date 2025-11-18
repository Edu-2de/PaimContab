'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { apiClient } from '@/utils/apiClient';
import { HiArrowUpTray, HiXMark } from 'react-icons/hi2';

interface ImportExcelButtonProps {
  endpoint: string;
  requiredColumns: string[];
  onSuccess: () => void;
  entityName: string;
  templateData?: Record<string, string>[];
}

export default function ImportExcelButton({
  endpoint,
  requiredColumns,
  onSuccess,
  entityName,
  templateData = [],
}: ImportExcelButtonProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template =
      templateData.length > 0 ? templateData : [requiredColumns.reduce((acc, col) => ({ ...acc, [col]: '' }), {})];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, `template_${entityName.toLowerCase()}.xlsx`);
  };

  const validateColumns = (data: Record<string, unknown>[]): boolean => {
    if (data.length === 0) {
      setError('O arquivo está vazio');
      return false;
    }

    const fileColumns = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

    if (missingColumns.length > 0) {
      setError(`Colunas obrigatórias faltando: ${missingColumns.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];

      if (!validateColumns(jsonData)) {
        return;
      }

      setPreview(jsonData.slice(0, 5)); // Mostrar apenas 5 primeiras linhas
      setShowModal(true);
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
      setError('Erro ao ler o arquivo Excel');
    }
  };

  const handleImport = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    try {
      setImporting(true);
      setError('');

      const file = fileInputRef.current.files[0];
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const response = await apiClient.post(endpoint, { data: jsonData });

      if (response.success) {
        setShowModal(false);
        setPreview([]);
        onSuccess();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(response.error || 'Erro ao importar dados');
      }
    } catch (err) {
      console.error('Erro ao importar:', err);
      setError('Erro ao importar dados');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="relative group">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center w-10 h-10 bg-transparent text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HiArrowUpTray className="w-5 h-5" />
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Importar Excel
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        <button
          onClick={downloadTemplate}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          Baixar Modelo
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileSelect} className="hidden" />

      {error && <div className="mt-2 text-sm text-red-600 font-medium">{error}</div>}

      {/* Modal de Preview */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Preview da Importação</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Verifique os dados antes de importar ({preview.length} primeiras linhas)
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiXMark className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-96">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {requiredColumns.map(col => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {requiredColumns.map(col => (
                          <td key={col} className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {importing ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
