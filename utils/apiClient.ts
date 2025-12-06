import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  customCacheKey?: string,
  forceRefresh: boolean = false
): Promise<T> {
  const now = Date.now();
  const cacheKey = customCacheKey || `${options.method || 'GET'}:${url}`;
  const cacheTimeKey = `${cacheKey}_time`;

  if (!forceRefresh) {
    const [cachedData, lastFetched] = await Promise.all([
      AsyncStorage.getItem(cacheKey),
      AsyncStorage.getItem(cacheTimeKey),
    ]);

    if (cachedData && lastFetched && now - Number(lastFetched) < CACHE_DURATION) {
      return JSON.parse(cachedData) as T;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    const headers = {
      ...(options.headers || {}),
      'Cache-Control': 'no-cache',
      ...(cachedData ? {
        'If-None-Match': `"${hashString(cachedData)}"`,
        'If-Modified-Since': new Date(Number(await AsyncStorage.getItem(cacheTimeKey))).toUTCString()
      } : {})
    };

    const response = await fetch(url, { 
      ...options, 
      headers: headers as HeadersInit,
      signal: controller.signal 
    });
    clearTimeout(timeoutId);

    if (response.status === 304) {
      return JSON.parse(cachedData!) as T;
    }

    // Handle empty responses
    if (response.status === 204) {
      return [] as unknown as T;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return [] as unknown as T;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : [];
    
    await Promise.all([
      AsyncStorage.setItem(cacheKey, JSON.stringify(data)),
      AsyncStorage.setItem(cacheTimeKey, now.toString()),
    ]);

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (!forceRefresh) {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
    }
    
    throw error;
  }
}