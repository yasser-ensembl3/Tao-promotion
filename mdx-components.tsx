import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'

// Export as a regular function to avoid hook rules in server components
export function getMDXComponents(components?: Record<string, unknown>) {
  return {
    ...getDocsMDXComponents(),
    ...components,
  }
}

// Keep the hook version for client components that need it
export function useMDXComponents(components?: Record<string, unknown>) {
  return getMDXComponents(components)
}
