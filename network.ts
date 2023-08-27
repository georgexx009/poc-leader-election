// this simulates the network
// it will be like a buffer 

interface INode {
  receiveRequest: (body: any) => any
}

export type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500 | 503

export interface IResponse {
  ok: boolean
  body?: string // stringify json
  statusCode: StatusCode
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface IRequest {
  url: string
  httpMethod: HttpMethod
  body?: string // stringify json
  headers?: Record<string, string>
}

export class Network {
  // key is the URL
  private registeredNodes: Record<string, INode> = {}

  // log network traffic
  private log({ req, res, sender }: { req: IRequest, res?: IResponse, sender: string, status: 'request send' | 'response send' }) {
    console.log('--------------------------------------')
    console.log(`${sender} -> ${req.url}`)
  }

  private async latency(ms: number = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  registerIP(url: string, node: INode) {
    this.registeredNodes[url] = node
  }

  // sender param is for debugging purposes
  async send(req: IRequest, sender = 'unknown'): Promise<IResponse> {
    this.log({ req, sender, status: 'request send' })
    await this.latency()
    if (!this.registeredNodes[req.url]) {
      return {
        ok: false,
        statusCode: 503,
      }
    }

    const res = await this.registeredNodes[req.url].receiveRequest(req)
    this.log({ req, res, sender, status: 'response send' })
    return res
  }
}
