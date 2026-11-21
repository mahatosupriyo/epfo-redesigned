'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

export default function ClarityProvider() {
    useEffect(() => {
        const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

        // Optional: Only run in production to avoid tracking local dev clicks
        if (projectId && process.env.NODE_ENV === 'production') {
            Clarity.init(projectId);
        }
    }, []);

    return null;
}
