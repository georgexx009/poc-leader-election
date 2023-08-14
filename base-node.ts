import { Network, IRequest, IResponse, HttpMethod, StatusCode } from "network";

type HandlerFunc = (r: IRequest) => Promise<IResponse>

export abstract class BaseNode {
  // key is the path
  private handlers: Record<string, Record<HttpMethod, HandlerFunc>> = {}
  private running = false

  constructor(private network: Network, private baseUrl: string){}

  protected updateRunStatus(status: 'run' | 'stop' | 'crash') {
    this.running = status === 'run'
  }

  protected registerHandler(
    path: string,
    httpMethod: HttpMethod,
    handlerFunc: HandlerFunc
  ) {
    this.handlers[path][httpMethod] = handlerFunc
  }

  sendRequest<ReqBody, ResBody>(req: IRequest<ReqBody>) {
    return this.network.send<ReqBody, ResBody>(req)
  }

  async receiveRequest(req: IRequest) {
    await this.latency(3)
    const path = this.getPathFromUrl(req.url)
    return this.handlers[path][req.httpMethod](req)
  }

  private getPathFromUrl(url: string) {
    return url.replace(this.baseUrl, '')
  }

  private async latency(s: number = 1) {
    const ms = s * 1000
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
