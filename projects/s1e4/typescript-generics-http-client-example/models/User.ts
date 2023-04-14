export interface ResponseUser {
    login: string,
    id: number,
    "node_id": string
}

export interface User {
    login: string,
    id: number,
    nodeId: string
}

export const parseUser = (user: ResponseUser): User => {
    return {
        login: user.login,
        id: user.id,
        nodeId: user.node_id
    } as User
}