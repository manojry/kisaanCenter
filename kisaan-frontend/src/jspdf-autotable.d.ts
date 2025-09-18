declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  export default function autotable(doc: jsPDF, ...args: any[]): void;
  export {};
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (...args: any[]) => void;
  }
}
