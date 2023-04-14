import { HttpClient, Methods } from './client/HttpClient'
import { ResponseUser, User, parseUser } from './models/User'

(async () => {
    const client = new HttpClient()
    const urlOptions = { path: "https://api.github.com/users/allenmichael", method: Methods.GET }

    const response = await client.request(urlOptions)
    console.log(response)

    const parsedResponse = await client.requestWithParsing<ResponseUser>(urlOptions);
    console.log(parsedResponse.node_id)

    const parsedUser = await client.requestWithTransform<ResponseUser, User>(urlOptions, parseUser);
    console.log(parsedUser.nodeId)
})()