"use client";
import { useState, RefObject } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Row = { type: "Receita" | "Despesa"; desc: string; value: number };

interface BriefProps {
  briefRef: RefObject<HTMLDivElement | null>;
}

export default function BriefExamples({ briefRef }: BriefProps) {
  const [data, setData] = useState<Row[]>([
    { type: "Receita", desc: "Serviços", value: 1500 },
    { type: "Despesa", desc: "Materiais", value: 400 },
  ]);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  function addRow(type: "Receita" | "Despesa") {
    setData(d => [...d, { type, desc: "", value: 0 }]);
    setEditIdx(data.length);
  }

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

  function removeRow(idx: number) {
    setData(d => d.filter((_, i) => i !== idx));
    setEditIdx(null);
  }

  const totalReceita = data.filter(x => x.type === "Receita").reduce((a, b) => a + b.value, 0);
  const totalDespesa = data.filter(x => x.type === "Despesa").reduce((a, b) => a + b.value, 0);
  const lucro = totalReceita - totalDespesa;
  const imposto = Math.round(totalReceita * 0.06 * 100) / 100;
  const saldoFinal = lucro - imposto;

  // Para mobile, a tabela vira blocos empilhados responsivos
  // A tabela tradicional só aparece em telas md+ (>=768px)
  return (
    <section ref={briefRef} className="w-full min-h-[80vh] bg-white flex flex-col items-center justify-center px-3 py-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-7">
        <div className="w-full flex flex-col items-center mb-1 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight mb-1">
            Planilha MEI Automatizada
          </h2>
          <br />
          <p className="text-neutral-700 text-base md:text-lg font-medium mb-2 max-w-2xl">
            Experimente uma demonstração prática de um dos materiais exclusivos do seu plano.
            Você poderá baixar e utilizar esta planilha no Excel sempre que quiser, facilitando o controle de receitas e despesas do seu negócio.
          </p>
        </div>
        <div className="w-full bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-x-auto">
          <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-neutral-50 border-b border-neutral-200">
            <div className="font-bold text-neutral-900 text-lg tracking-tight">Planilha</div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1 rounded bg-neutral-900 hover:bg-neutral-700 text-white px-3 md:px-4 py-1.5 text-xs font-semibold shadow-sm transition cursor-pointer"
                onClick={() => addRow("Receita")}
                type="button"
                title="Adicionar receita"
              >
                <FiPlus /> Receita
              </button>
              <button
                className="inline-flex items-center gap-1 rounded bg-white hover:bg-neutral-100 text-neutral-900 px-3 md:px-4 py-1.5 text-xs font-semibold shadow-sm border border-neutral-200 transition cursor-pointer"
                onClick={() => addRow("Despesa")}
                type="button"
                title="Adicionar despesa"
              >
                <FiPlus /> Despesa
              </button>
            </div>
          </div>

          {/* TABELA PARA DESKTOP */}
          <div className="w-full justify-center hidden md:flex">
            <table
              className="text-sm font-mono w-full max-w-5xl"
              style={{
                borderCollapse: "separate",
                borderSpacing: 0,
                minWidth: 900,
                maxWidth: 1200,
                marginLeft: "auto",
                marginRight: "auto",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "13%" }} />
                <col style={{ width: "62%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "5%" }} />
              </colgroup>
              <thead>
                <tr className="bg-neutral-100 text-neutral-500 uppercase text-[11px]">
                  <th className="font-semibold py-2 px-4 text-left border-b border-neutral-200 border-r">Tipo</th>
                  <th className="font-semibold py-2 px-4 text-left border-b border-neutral-200 border-r">Descrição</th>
                  <th className="font-semibold py-2 px-4 text-right border-b border-neutral-200 border-r">Valor</th>
                  <th className="font-semibold py-2 px-2 border-b border-neutral-200"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`group border-b border-neutral-200 transition duration-100
                      ${editIdx === idx ? "bg-neutral-100/80" : "hover:bg-neutral-50"}
                    `}
                  >
                    <td className="border-r border-neutral-200">
                      <select
                        className="bg-transparent px-1 py-1 focus:outline-none w-full text-neutral-900 cursor-pointer"
                        value={row.type}
                        onChange={e => handleRowChange(idx, "type", e.target.value as Row["type"])}
                        aria-label="Tipo"
                        tabIndex={0}
                      >
                        <option value="Receita">Receita</option>
                        <option value="Despesa">Despesa</option>
                      </select>
                    </td>
                    <td className="border-r border-neutral-200">
                      <input
                        type="text"
                        className="w-full bg-transparent px-2 py-1 border-b border-dashed border-neutral-300 focus:border-neutral-900 focus:outline-none text-neutral-900 placeholder:text-neutral-400"
                        value={row.desc}
                        placeholder={row.type === "Receita" ? "Ex: Serviço, Venda..." : "Ex: Conta, Compra..."}
                        onFocus={() => setEditIdx(idx)}
                        onBlur={() => setEditIdx(null)}
                        onChange={e => handleRowChange(idx, "desc", e.target.value)}
                        aria-label="Descrição"
                        tabIndex={0}
                      />
                    </td>
                    <td className="border-r border-neutral-200">
                      <input
                        type="number"
                        className="w-full bg-transparent px-2 py-1 border border-transparent rounded focus:border-neutral-900 text-right text-neutral-900 font-medium transition "
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
                        className="opacity-0 group-hover:opacity-100 transition px-1 text-neutral-400 hover:text-red-500 cursor-pointer"
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
                <tr>
                  <td colSpan={2} className="py-2 px-4 text-right font-bold border-t border-neutral-200 bg-neutral-50 text-neutral-900 border-r">Total Receita</td>
                  <td className="py-2 px-4 text-right font-bold border-t border-neutral-200 bg-neutral-50 text-neutral-900 border-r">{formatCurrency(totalReceita)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 px-4 text-right font-bold border-t border-neutral-200 bg-neutral-50 text-neutral-900 border-r">Total Despesa</td>
                  <td className="py-2 px-4 text-right font-bold border-t border-neutral-200 bg-neutral-50 text-neutral-900 border-r">{formatCurrency(totalDespesa)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 px-4 text-right font-bold border-t border-neutral-200 bg-neutral-50 text-neutral-900 border-r">Lucro</td>
                  <td className="py-2 px-4 text-right font-bold border-t border-neutral-200 bg-neutral-50 text-neutral-900 border-r">{formatCurrency(lucro)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 px-4 text-right border-t border-neutral-200 bg-white border-r text-neutral-500 font-medium">DAS (6%)</td>
                  <td className="py-2 px-4 text-right border-t border-neutral-200 bg-white border-r text-neutral-500 font-medium">{formatCurrency(imposto)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right font-extrabold border-t-2 border-neutral-300 bg-neutral-100 border-r text-neutral-900">Saldo Final</td>
                  <td className="py-3 px-4 text-right font-extrabold border-t-2 border-neutral-300 bg-neutral-100 border-r text-neutral-900">{formatCurrency(saldoFinal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* MOBILE (até md: < 768px) */}
          <div className="w-full flex flex-col gap-1 md:hidden px-1 sm:px-2 py-2">
            <div className="grid grid-cols-3 gap-1 text-[11px] font-medium text-neutral-500 uppercase px-1 pb-1">
              <span>Tipo</span>
              <span>Descrição</span>
              <span className="text-right">Valor</span>
            </div>
            {data.map((row, idx) => (
              <div key={idx} className={`flex gap-1 bg-white border border-neutral-200 rounded-xl px-2 py-2 items-center shadow-sm relative group`}>
                {/* Tipo */}
                <select
                  className="bg-transparent px-1 py-1 focus:outline-none w-[28%] text-xs text-neutral-900 cursor-pointer"
                  value={row.type}
                  onChange={e => handleRowChange(idx, "type", e.target.value as Row["type"])}
                  aria-label="Tipo"
                  tabIndex={0}
                >
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                </select>
                {/* Descrição */}
                <input
                  type="text"
                  className="flex-1 min-w-0 bg-transparent px-2 py-1 border-b border-dashed border-neutral-300 focus:border-neutral-900 focus:outline-none text-neutral-900 placeholder:text-neutral-400 text-xs"
                  value={row.desc}
                  placeholder={row.type === "Receita" ? "Serviço, Venda..." : "Conta, Compra..."}
                  onFocus={() => setEditIdx(idx)}
                  onBlur={() => setEditIdx(null)}
                  onChange={e => handleRowChange(idx, "desc", e.target.value)}
                  aria-label="Descrição"
                  tabIndex={0}
                  maxLength={32}
                />
                {/* Valor */}
                <input
                  type="number"
                  className="w-[75px] bg-transparent px-2 py-1 border border-transparent rounded focus:border-neutral-900 text-right text-neutral-900 font-medium transition text-xs"
                  value={row.value}
                  min={0}
                  step={10}
                  onFocus={() => setEditIdx(idx)}
                  onBlur={() => setEditIdx(null)}
                  onChange={e => handleRowChange(idx, "value", e.target.value)}
                  aria-label="Valor"
                  tabIndex={0}
                  inputMode="numeric"
                />
                <button
                  onClick={() => removeRow(idx)}
                  aria-label="Remover linha"
                  className="ml-1 px-1 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                  tabIndex={0}
                  type="button"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
            {/* Totais Mobile */}
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-neutral-700 font-semibold">
                  <span>Total Receita</span>
                  <span>{formatCurrency(totalReceita)}</span>
                </div>
                <div className="flex justify-between text-neutral-700 font-semibold">
                  <span>Total Despesa</span>
                  <span>{formatCurrency(totalDespesa)}</span>
                </div>
                <div className="flex justify-between text-neutral-900 font-bold border-t border-neutral-200 pt-1">
                  <span>Lucro</span>
                  <span>{formatCurrency(lucro)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-neutral-500">
                  <span>DAS (6%)</span>
                  <span>{formatCurrency(imposto)}</span>
                </div>
                <div className="flex justify-between text-neutral-900 font-extrabold border-t-2 border-neutral-300 pt-1">
                  <span>Saldo Final</span>
                  <span>{formatCurrency(saldoFinal)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 md:px-6 py-2 bg-neutral-50 text-xs text-neutral-500 border-t border-neutral-200 text-center">
            * Planilha automatizada para simulação rápida. Edite, adicione ou remova linhas para testar. Depois, baixe para usar no Excel e torne o seu controle financeiro ainda mais eficiente!
          </div>
        </div>
      </div>
    </section>
  );
}