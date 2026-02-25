import { useEffect, useRef } from 'react';
import axios from 'axios';


export function useLearningSession() {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const ping = () => {
        axios.post('/session/ping').catch(() => {
        });
    };

    useEffect(() => {
        intervalRef.current = setInterval(ping, 60_000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);
}
