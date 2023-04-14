export interface ClientResponse {
    statusCode: number,
    headers: Headers,
    body: any
}

export const Methods = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
    PATCH: "PATCH"
} as const;
export type Methods = typeof Methods[keyof typeof Methods];

export class HttpClient {
    public async request(
        urlOptions: { path: string, method: Methods, headers?: Headers },
        data?: string,
    ): Promise<any> {
        const url = new URL(urlOptions.path);

        if (data) {
            if (!urlOptions.headers) {
                urlOptions.headers = new Headers()
            }
            const contentLength = this.calculateContentLength(data);
            urlOptions.headers.append("Content-Length", contentLength);
        }

        try {
            const resp = await fetch(url.href, { headers: urlOptions.headers, method: urlOptions.method, body: data });
            const statusCode = resp.status;
            const headers = resp.headers;
            const body = await resp.text();
            if (resp.status >= 200 && resp.status <= 299) {
                return { statusCode, headers, body };
            } else {
                throw new Error(`Request failed. status: ${statusCode}`);
            }
        } catch (e) {
            throw e;
        }
    }

    async requestWithParsing<Type>(
        urlOptions: { path: string, method: Methods, headers?: Headers },
        data?: string
    ): Promise<Type> {
        const response = await this.request(urlOptions, data);
        return this.parseResponse<Type>(response);
    }

    async requestWithTransform<T, R>(
        urlOptions: { path: string, method: Methods, headers?: Headers },
        parseResponse: (arg: T) => R,
        data?: string
    ) {
        const response = await this.requestWithParsing<T>(urlOptions, data)
        return parseResponse(response)
    }

    private parseResponse<Type>(response: ClientResponse) {
        if ((response.statusCode >= 200 && response.statusCode <= 299) && response.body) {
            return JSON.parse(response.body) as Type;
        } else if (response.statusCode >= 200 && response.statusCode <= 299) {
            return {} as Type;
        } else {
            throw new Error(`Request failed. status: ${response.statusCode}`);
        }
    }

    private calculateContentLength(data: string) {
        if (typeof window !== "undefined" &&
            typeof window.Blob === "function") {
            return new window.Blob([data]).size.toString();
        } else {
            return Buffer.byteLength(data).toString();
        }
    }
}