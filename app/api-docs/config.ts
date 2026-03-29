export const scalarConfig = {
  darkMode: true,
  layout: 'modern' as const,
  theme: 'elysiajs' as const,
  proxyUrl: 'https://proxy.scalar.com',
  defaultOpenAllTags: true,
  showSidebar: true,
  withDefaultFonts: true,
  documentDownloadType: 'both' as const,
  orderSchemaPropertiesBy: 'alpha' as const,
  orderRequiredPropertiesFirst: true,
  customCss: `
    :root {
      --scalar-background-1: #0a0712;
      --scalar-background-2: #110d1f;
      --scalar-background-3: #1a1330;
      --scalar-background-accent: #00c9ff1a;
      --scalar-color-1: #f4f4f5;
      --scalar-color-2: #a1a1aa;
      --scalar-color-3: #71717a;
      --scalar-color-accent: #00c9ff;
      --scalar-border-color: rgba(255,255,255,0.08);
      --scalar-sidebar-background-1: #0d0a1a;
      --scalar-sidebar-color-1: #f4f4f5;
      --scalar-sidebar-color-2: #a1a1aa;
      --scalar-sidebar-border-color: rgba(255,255,255,0.08);
    }
  `,
}
