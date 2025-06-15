"use client";
import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

// Utilitário de formatação
function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Row = { type: "Receita" | "Despesa"; desc: string; value: number };

export default function BriefExamples() {
  const [data, setData] = useState<Row[]>([
    { type: "Receita", desc: "Serviços", value: 1500 },
    { type: "Despesa", desc: "Materiais", value: 400 },
  ]);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Excel-like colors and feel: subtle, with clear grid and focus
  const receitaColor = "text-green-700 bg-green-50";
  const despesaColor = "text-red-700 bg-red-50";
  const totalRow = "font-bold bg-neutral-100 border-t border-neutral-200";
  const saldoRow = "font-black bg-blue-50 text-blue-900 border-t-2 border-blue-200";

  // Adicionar linha
  function addRow(type: "Receita" | "Despesa") {
    setData(d => [...d, { type, desc: "", value: 0 }]);
    setEditIdx(data.length);
  }

  // Editar célula
  function handleRowChange(idx: number, key: keyof Row, v: string | number) {
    setData(d =>
      d.map((row, i) =>
        i === idx
          ? {
              ...row,
              [key]: key === "value" ? (isNaN(Number(v)) ? 0 : Number(v)) : v,
            }
          : row
      )
    );
  }

  // Remover linha
  function removeRow(idx: number) {
    setData(d => d.filter((_, i) => i !== idx));
    setEditIdx(null);
  }

  // Cálculos
  const totalReceita = data.filter(x => x.type === "Receita").reduce((a, b) => a + b.value, 0);
  const totalDespesa = data.filter(x => x.type === "Despesa").reduce((a, b) => a + b.value, 0);
  const lucro = totalReceita - totalDespesa;
  const imposto = Math.round(totalReceita * 0.06 * 100) / 100;
  const saldoFinal = lucro - imposto;

  return (
    <section className="relative w-full min-h-[100vh] bg-neutral-50 flex items-center justify-center px-2 py-16">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        <div className="w-full flex flex-col items-center mb-2 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight mb-1">
            Planilha Simples MEI
          </h2>
          <p className="text-neutral-600 text-base md:text-lg font-medium mb-2">
            Adicione receitas e despesas. Veja totais e saldo final<br />
            em um layout inspirado no Excel, limpo e fácil de usar.
          </p>
        </div>

        {/* Planilha */}
        <div className="w-full bg-white rounded-xl shadow border border-neutral-200 overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-100 border-b border-neutral-200">
            <div className="font-bold text-neutral-800 text-base">Planilha</div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1 rounded bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition"
                onClick={() => addRow("Receita")}
                type="button"
                title="Adicionar receita"
              >
                <FiPlus /> Receita
              </button>
              <button
                className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition"
                onClick={() => addRow("Despesa")}
                type="button"
                title="Adicionar despesa"
              >
                <FiPlus /> Despesa
              </button>
            </div>
          </div>
          <table className="w-full min-w-[400px] text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-neutral-500 text-xs tracking-wide uppercase border-b border-neutral-200">
                <th className="font-semibold py-2 px-4 text-left w-[110px] bg-neutral-50 border-b border-neutral-200">Tipo</th>
                <th className="font-semibold py-2 px-4 text-left bg-neutral-50 border-b border-neutral-200">Descrição</th>
                <th className="font-semibold py-2 px-4 text-right w-[120px] bg-neutral-50 border-b border-neutral-200">Valor</th>
                <th className="font-semibold py-2 bg-neutral-50 border-b border-neutral-200"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`group transition duration-100 border-b border-neutral-100
                    ${row.type === "Receita" ? receitaColor : despesaColor}
                    ${editIdx === idx ? "ring-2 ring-blue-200 bg-blue-50/80" : ""}
                  `}
                >
                  <td className="rounded-l">
                    <select
                      className="bg-transparent px-1 py-1 text-inherit focus:outline-none w-full"
                      value={row.type}
                      onChange={e => handleRowChange(idx, "type", e.target.value as Row["type"])}
                      aria-label="Tipo"
                      tabIndex={0}
                    >
                      <option value="Receita">Receita</option>
                      <option value="Despesa">Despesa</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1 border-b border-dashed border-neutral-200 focus:border-blue-400 focus:outline-none text-neutral-800 placeholder:text-neutral-400"
                      value={row.desc}
                      placeholder={row.type === "Receita" ? "Ex: Serviço, Venda..." : "Ex: Conta, Compra..."}
                      onFocus={() => setEditIdx(idx)}
                      onBlur={() => setEditIdx(null)}
                      onChange={e => handleRowChange(idx, "desc", e.target.value)}
                      aria-label="Descrição"
                      tabIndex={0}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-24 bg-transparent px-2 py-1 border border-transparent rounded focus:border-blue-400 text-right text-neutral-800 font-semibold transition"
                      value={row.value}
                      min={0}
                      step={10}
                      onFocus={() => setEditIdx(idx)}
                      onBlur={() => setEditIdx(null)}
                      onChange={e => handleRowChange(idx, "value", e.target.value)}
                      aria-label="Valor"
                      tabIndex={0}
                    />
                  </td>
                  <td className="text-center align-middle">
                    <button
                      onClick={() => removeRow(idx)}
                      aria-label="Remover linha"
                      className="opacity-0 group-hover:opacity-100 transition px-1 text-neutral-300 hover:text-red-500"
                      tabIndex={0}
                      type="button"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={totalRow}>
                <td colSpan={2} className="py-2 px-4 text-right">Total Receita</td>
                <td className="py-2 px-4 text-right">{formatCurrency(totalReceita)}</td>
                <td></td>
              </tr>
              <tr className={totalRow}>
                <td colSpan={2} className="py-2 px-4 text-right">Total Despesa</td>
                <td className="py-2 px-4 text-right">{formatCurrency(totalDespesa)}</td>
                <td></td>
              </tr>
              <tr className={totalRow}>
                <td colSpan={2} className="py-2 px-4 text-right">Lucro</td>
                <td className="py-2 px-4 text-right">{formatCurrency(lucro)}</td>
                <td></td>
              </tr>
              <tr className={totalRow + " text-blue-700"}>
                <td colSpan={2} className="py-2 px-4 text-right">DAS (6%)</td>
                <td className="py-2 px-4 text-right">{formatCurrency(imposto)}</td>
                <td></td>
              </tr>
              <tr className={saldoRow}>
                <td colSpan={2} className="py-3 px-4 text-right">Saldo Final</td>
                <td className="py-3 px-4 text-right">{formatCurrency(saldoFinal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <div className="px-4 py-2 bg-neutral-50 text-xs text-neutral-400 border-t border-neutral-100 text-center">
            * Planilha exemplo, inspire-se e personalize conforme sua rotina!
          </div>
        </div>
      </div>
    </section>
  );
}