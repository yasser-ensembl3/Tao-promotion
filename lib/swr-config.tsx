"use client"

import { SWRConfig } from "swr"
import { ReactNode } from "react"

// Default fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Cache duration in milliseconds (60 seconds)
const CACHE_DURATION = 60 * 1000

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // Keep data fresh for 60 seconds before revalidating
        dedupingInterval: CACHE_DURATION,
        // Don't revalidate on focus (optional - keeps cache longer)
        revalidateOnFocus: false,
        // Don't revalidate on reconnect
        revalidateOnReconnect: false,
        // Keep previous data while fetching new data
        keepPreviousData: true,
        // Error retry configuration
        errorRetryCount: 2,
        errorRetryInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
