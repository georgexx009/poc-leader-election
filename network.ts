// this simulates the network
// it will be like a buffer 

interface INode {
  receiveRequest: (body: any) => any
}

export type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500 | 503

export interface IResponse<Body = never> {
  ok: boolean
  body: Body
  statusCode: StatusCode
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface IRequest<Body = never> {
  url: string
  httpMethod: HttpMethod
  body: Body
  headers?: Record<string, string>
}

export class Network {
  // key is the URL
 private registeredNodes: Record<string, INode> = {}

  private async sleep(ms: number = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  registerIP(url: string, node: INode) {
    this.registeredNodes[url] = node
  }

  async send<ReqBody, ResBody>(req: IRequest<ReqBody>): Promise<IResponse<ResBody>> {
    await this.sleep()
    if (!this.registeredNodes?.[req.url]) {
      return {
        ok: false,
        statusCode: 503,
      }
    }

    return this.registeredNodes[req.url].receiveRequest(req)
  }
}
