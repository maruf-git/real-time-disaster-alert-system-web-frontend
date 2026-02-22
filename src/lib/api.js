const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetcher(url, options = {}) {
    const res = await fetch(`${API_URL}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'API Error');
    }
    return res.json();
}

export const api = {
    get: (url) => fetcher(url),
    post: (url, body) => fetcher(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => fetcher(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (url) => fetcher(url, { method: 'DELETE' }),
};
