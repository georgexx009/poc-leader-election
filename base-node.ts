import { Network, IRequest, IResponse, HttpMethod, StatusCode } from "./network";

type HandlerFunc = (r: IRequest) => Promise<IResponse>

export abstract class BaseNode {
  // key is the path
  private handlers: Record<string, Record<HttpMethod, HandlerFunc>> = {}
  private running = false

  constructor(private network: Network, private baseUrl: string){}

  getUrl() {
    return this.baseUrl
  }

  protected updateRunStatus(status: 'run' | 'stop' | 'crash') {
    this.running = status === 'run'
  }

  protected registerHandler(
    path: string,
    httpMethod: HttpMethod,
    handlerFunc: HandlerFunc
  ) {
    const newHandler: Record<string, Record<string, HandlerFunc>> = {
      [path]: {
        [httpMethod]: handlerFunc
      }
    }
    this.handlers = {
      ...this.handlers,
      ...newHandler
    }
  }

  protected sendRequest(req: IRequest) {
    return this.network.send(req, this.baseUrl)
  }

  // should be public to be open to the network
  async receiveRequest(req: IRequest) {
    await this.workingTime(3)
    const path = this.getPathFromUrl(req.url)
    return this.handlers[path][req.httpMethod](req)
  }

  private getPathFromUrl(url: string) {
    return url.replace(this.baseUrl, '')
  }

  private async workingTime(s: number = 1) {
    const ms = s * 1000
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected parseReqBody<Body>(body: string): Body {
    return JSON.parse(body)
  }
}
