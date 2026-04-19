"use client";

export function TicketPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg print:hidden"
    >
      Imprimir ticket
    </button>
  );
}
