import { Injectable } from '@nestjs/common';
import type { DocumentProps } from '@react-pdf/renderer';
import { ReactElement, createElement } from 'react';
import { DecompteDocument } from './documents/decompte-document';
import { OrdreDocument, OrdresBatchDocument } from './documents/ordre-document';
import { DecomptePdfData } from './mappers/decompte.mapper';
import { OrdrePdfData } from './mappers/ordre.mapper';
import { loadReactPdf } from './react-pdf-runtime';
import { registerFonts } from './theme';

// Our components return a <Document>; react-pdf's typing only sees the wrapper props.
const asDocument = (el: ReactElement) => el as ReactElement<DocumentProps>;

@Injectable()
export class PdfService {
  private readonly ready = loadReactPdf().then(() => registerFonts());

  private async render(el: ReactElement): Promise<Buffer> {
    await this.ready;
    const { renderToBuffer } = await loadReactPdf();
    return renderToBuffer(asDocument(el));
  }

  renderOrdre(data: OrdrePdfData): Promise<Buffer> {
    return this.render(createElement(OrdreDocument, { data }));
  }

  /** Several ordres in one PDF, in the given order. */
  renderOrdres(items: OrdrePdfData[]): Promise<Buffer> {
    return this.render(createElement(OrdresBatchDocument, { items }));
  }

  renderDecompte(data: DecomptePdfData): Promise<Buffer> {
    return this.render(createElement(DecompteDocument, { data }));
  }
}
