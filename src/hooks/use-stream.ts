import { useEffect, useRef, useState, useCallback } from 'react'

export interface StreamOptions {
    enabled?: boolean
    onOpen?: () => void
    onError?: (error: any) => void
}

// export const useStream = (url: string | null, options: StreamOptions = {}) => {
//     const { enabled = true, onOpen, onError } = options;
//     const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('closed');
//     const eventSourceRef = useRef<EventSource | null>(null);
    
//     // 用来保存所有的回调，key 是事件名（如 'task_update'）
//     const handlersRef = useRef<Record<string, Set<(data: any) => void>>>({});

//     const connect = useCallback(() => {
//         if (!url || !enabled) return;
//         if (eventSourceRef.current) eventSourceRef.current.close();

//         const es = new EventSource(url);
//         eventSourceRef.current = es;
//         setStatus('connecting');

//         // 通用的消息处理函数
//         const handleEvent = (type: string, e: MessageEvent) => {
//             try {
//                 const data = JSON.parse(e.data);
//                 handlersRef.current[type]?.forEach(cb => cb(data));
//             } catch (err) {
//                 console.warn(`[useStream] Parse error for ${type}:`, err);
//             }
//         };

//         // 默认监听 message 事件
//         es.onmessage = (e) => handleEvent('message', e);

//         // 【关键】预先监听你后端可能发送的所有命名事件
//         // 或者动态根据目前已有的 handlers 注册
//         const currentEvents = Object.keys(handlersRef.current);
//         currentEvents.forEach(type => {
//             es.addEventListener(type, (e) => handleEvent(type, e as MessageEvent));
//         });

//         // 也可以硬编码监听后端已知的事件名
//         es.addEventListener('task_update', (e) => handleEvent('task_update', e as MessageEvent));
//         es.addEventListener('ping', (e) => handleEvent('ping', e as MessageEvent));

//         es.onopen = () => { setStatus('open'); onOpen?.(); };
//         es.onerror = (err) => { setStatus('closed'); onError?.(err); es.close(); };

//         return es;
//     }, [url, enabled, onOpen, onError]);

//     useEffect(() => {
//         const es = connect();
//         return () => { es?.close(); setStatus('closed'); };
//     }, [connect]);

//     const listen = useCallback((event: string, callback: (data: any) => void) => {
//         if (!handlersRef.current[event]) handlersRef.current[event] = new Set();
//         handlersRef.current[event].add(callback);

//         // 如果连接已经建立，动态添加监听器
//         if (eventSourceRef.current) {
//             const wrapper = (e: any) => {
//                 try { callback(JSON.parse(e.data)); } catch(err) {}
//             };
//             eventSourceRef.current.addEventListener(event, wrapper);
//             return () => {
//                 handlersRef.current[event].delete(callback);
//                 eventSourceRef.current?.removeEventListener(event, wrapper);
//             };
//         }

//         return () => handlersRef.current[event].delete(callback);
//     }, []);

//     return { status, listen };
// };

export const useStream = (url: string | null, options: StreamOptions = {}) => {
    const { enabled = true, onOpen, onError } = options
    const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('closed')
    const eventSourceRef = useRef<EventSource | null>(null)
    const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())

    const connect = useCallback(() => {
        if (!url || !enabled) return

        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        console.log(`[useStream] Connecting to ${url}`)
        const es = new EventSource(url)
        eventSourceRef.current = es
        setStatus('connecting')

        es.onopen = () => {
            console.log(`[useStream] Connected to ${url}`)
            setStatus('open')
            onOpen?.()
        }

        es.onerror = (err) => {
            console.error('[useStream] SSE Error:', err)
            setStatus('closed')
            onError?.(err)
            es.close()
        }

        es.onmessage = (event) => {
            try {
                if (event.data === '') return // Heartbeat
                const data = JSON.parse(event.data)
                listenersRef.current.get('message')?.forEach(cb => cb(data))
            } catch (e) {
                // Ignore parse errors for heartbeats/pings
            }
        }

        // Handle named events
        const eventTypes = Array.from(listenersRef.current.keys())
        eventTypes.forEach(type => {
            if (type === 'message') return
            es.addEventListener(type, (e: any) => {
                try {
                    const data = JSON.parse(e.data)
                    listenersRef.current.get(type)?.forEach(cb => cb(data))
                } catch (err) {
                    console.error(`[useStream] Failed to parse ${type} event:`, err)
                }
            })
        })

        return es
    }, [url, enabled, onOpen, onError])

    useEffect(() => {
        const es = connect()
        return () => {
            if (es) {
                console.log('[useStream] Closing connection')
                es.close()
                setStatus('closed')
            }
        }
    }, [connect])

    const listen = useCallback((event: string, callback: (data: any) => void) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set())
        }
        listenersRef.current.get(event)!.add(callback)

        // If we already have an active connection, we need to register the listener on the EventSource too
        if (eventSourceRef.current && event !== 'message') {
            const handler = (e: MessageEvent) => {
                try {
                    const data = JSON.parse(e.data)
                    callback(data)
                } catch (err) { }
            }
            eventSourceRef.current.addEventListener(event, handler)
            return () => {
                listenersRef.current.get(event)?.delete(callback)
                eventSourceRef.current?.removeEventListener(event, handler)
            }
        }

        return () => {
            listenersRef.current.get(event)?.delete(callback)
        }
    }, [])

    return { status, listen }
}
