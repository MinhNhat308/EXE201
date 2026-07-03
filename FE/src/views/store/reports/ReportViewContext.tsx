'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type ReportViewMode = 'screen' | 'document';

const ReportViewContext = createContext<ReportViewMode>('screen');

export function ReportViewProvider({
  mode,
  children,
}: {
  mode: ReportViewMode;
  children: ReactNode;
}) {
  return (
    <ReportViewContext.Provider value={mode}>{children}</ReportViewContext.Provider>
  );
}

export function useReportViewMode(): ReportViewMode {
  return useContext(ReportViewContext);
}
