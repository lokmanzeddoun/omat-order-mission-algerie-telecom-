# 02 — One PDF for the whole lot

Status: done
Type: task
Blocked by: 01

## Do

- `PdfService.renderOrdres(items)` + `OrdresBatchDocument`: each ordre keeps its two pages in one document.
- The batch response streams that PDF as `missions-lot-<id>.pdf`.

## Acceptance

- `pdf.service.spec.ts`: a batch of 3 ordres renders 6 pages.
- e2e: the PDF service receives one entry per created mission, in request order.
