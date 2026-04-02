import { useMemo } from 'react'
import useSWR from 'swr'
import { apiClient } from '@/lib/api'

export interface MetaMapping {
    [key: string]: string | number
}

export interface ModelMeta {
    [mappingName: string]: MetaMapping
}

export interface SystemMeta {
    models: {
        [modelName: string]: ModelMeta
    }
    system: {
        version: string
        environment: string
    }
}

export const useMeta = () => {
    const { data, error, isLoading } = useSWR<SystemMeta>('/meta', (url: string) => apiClient.get(url) as Promise<SystemMeta>)

    const getOptions = useMemo(() => (modelName: string, mappingName: string) => {
        if (!data?.models[modelName]) return []
        
        const mapping = data.models[modelName][mappingName]
        if (!mapping) return []

        return Object.entries(mapping).map(([value, label]) => ({
            label: String(label),
            value: isNaN(Number(value)) ? value : Number(value)
        }))
    }, [data])

    const getLabel = useMemo(() => (modelName: string, mappingName: string, value: unknown) => {
        if (!data?.models[modelName]) return String(value)
        const mapping = data.models[modelName][mappingName]
        return mapping?.[String(value)] || String(value)
    }, [data])

    return {
        meta: data,
        isLoading,
        error,
        getOptions,
        getLabel
    }
}
