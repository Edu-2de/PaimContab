"use client";
import { useState } from "react";

// Utilitário de formatação
function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Row = { type: "Receita" | "Despesa"; desc: string; value: number };

export default function BriefExamples() {
  // Dados da planilha
  const [data, setData] = useState<Row[]>([
    { type: "Receita", desc: "Serviços", value: 1500 },
    { type: "Despesa", desc: "Materiais", value: 400 },
  ]);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Paleta neutra (ex: Tailwind Zinc/Stone)
  const receitaColor = "text-zinc-700 bg-zinc-50";
  const despesaColor = "text-stone-600 bg-stone-50";
  const lucroColor = "text-stone-800 bg-stone-100";
  const impostoColor = "text-zinc-500";
  const saldoColor = "text-zinc-900 bg-zinc-100";

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
    <section className="relative bg-neutral-50 w-full px-4 py-20 flex flex-col items-center">
      <div className="max-w-5xl w-full mx-auto flex flex-col md:flex-row gap-10 md:gap-16 items-center justify-center">
        {/* Lado esquerdo */}
        <div className="flex-1 max-w-md mb-10 md:mb-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-800 mb-2">
            Controle Simples e Neutro
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg mb-4 max-w-sm">
            Gerencie receitas e despesas, veja lucros e impostos <b>em tempo real</b> numa planilha neutra e moderna.<br />
            Adicione, edite ou remova itens rapidamente.
          </p>
          <ul className="text-neutral-600 text-sm pl-4 mb-2 list-disc">
            <li>Visual super clean</li>
            <li>Cores neutras e harmônicas</li>
            <li>Adição e edição rápida de linhas</li>
          </ul>
          <div className="mt-4">
            <span className="inline-block text-xs text-neutral-600 bg-neutral-200 rounded px-2 py-1">
              <b>Exemplo interativo:</b> esta planilha é apenas uma demonstração e serve somente para testes.
            </span>
          </div>
          <span className="text-xs text-neutral-500 bg-neutral-200 rounded px-2 py-1 mt-3 inline-block">
            Material exclusivo para download aos participantes
          </span>
        </div>

        {/* Lado direito: planilha */}
        <div className="flex-1 w-full max-w-2xl min-w-[320px]">
          <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white/95 overflow-x-auto">
            <div className="flex justify-between items-center px-6 py-3 border-b border-neutral-100 bg-neutral-100/70">
              <span className="text-neutral-700 font-semibold text-base tracking-tight">Planilha MEI</span>
              <div className="flex gap-1">
                <button
                  className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1 text-xs font-medium transition"
                  onClick={() => addRow("Receita")}
                  type="button"
                >
                  + Receita
                </button>
                <button
                  className="rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1 text-xs font-medium transition"
                  onClick={() => addRow("Despesa")}
                  type="button"
                >
                  + Despesa
                </button>
              </div>
            </div>
            <table className="w-full min-w-[340px] text-sm">
              <thead>
                <tr className="text-neutral-400 uppercase text-xs tracking-wide">
                  <th className="font-normal py-2 px-3 text-left w-[90px]">Tipo</th>
                  <th className="font-normal py-2 px-3 text-left">Descrição</th>
                  <th className="font-normal py-2 px-3 text-right w-[90px]">Valor</th>
                  <th className="font-normal py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}
                    className={`border-b border-neutral-100 group transition
                      ${editIdx === idx ? "bg-neutral-100/60" : "hover:bg-neutral-100/40"}`}>
                    <td className={row.type === "Receita" ? receitaColor : despesaColor + " rounded-l"}>
                      <select
                        className="bg-transparent px-1 py-1 text-inherit focus:outline-none"
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
                        className="w-full bg-transparent px-1 py-1 border-b border-dashed border-neutral-200 focus:border-zinc-400 focus:outline-none text-neutral-800 placeholder:text-neutral-400"
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
                        className="w-24 bg-transparent px-2 py-1 border border-transparent rounded focus:border-zinc-400 text-right text-neutral-800 font-medium transition"
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
                        className="opacity-0 group-hover:opacity-100 transition px-2 text-neutral-300 hover:text-red-400"
                        tabIndex={0}
                        type="button"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className={"py-2 px-3 font-medium " + receitaColor}>Total Receita</td>
                  <td className={"py-2 px-3 text-right font-semibold " + receitaColor}>{formatCurrency(totalReceita)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className={"py-2 px-3 font-medium " + despesaColor}>Total Despesa</td>
                  <td className={"py-2 px-3 text-right font-semibold " + despesaColor}>{formatCurrency(totalDespesa)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className={"py-2 px-3 font-medium " + lucroColor}>Lucro</td>
                  <td className={"py-2 px-3 text-right font-semibold " + lucroColor}>{formatCurrency(lucro)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className={"py-2 px-3 font-medium " + impostoColor}>DAS (6%)</td>
                  <td className={"py-2 px-3 text-right font-medium " + impostoColor}>{formatCurrency(imposto)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className={"py-2 px-3 font-bold " + saldoColor + " border-t border-neutral-200"}>Saldo Final</td>
                  <td className={"py-2 px-3 text-right font-extrabold " + saldoColor + " border-t border-neutral-200"}>
                    {formatCurrency(saldoFinal)}
                  </td>
                  <td className={saldoColor + " border-t border-neutral-200"}></td>
                </tr>
              </tfoot>
            </table>
            <div className="px-6 py-2 bg-neutral-50 text-xs text-neutral-400 text-center border-t border-neutral-100">
              * Esta planilha é apenas um exemplo para testes e demonstração.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}