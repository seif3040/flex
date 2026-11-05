'use client';

import { useEffect, useState } from 'react';
import type { NormalizedModel } from '@/lib/openrouter/types';

export function useModels() { const [models, setModels] = useState<NormalizedModel[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { fetch('/api/models?free=true').then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load free models'); return (body.data.models as NormalizedModel[]).filter((model) => model.isFree); }).then(setModels).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load free models')).finally(() => setLoading(false)); }, []); return { models, loading, error }; }
