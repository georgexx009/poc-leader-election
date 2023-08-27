import { BaseNode } from './base-node'
import { IRequest, IResponse, Network } from './network'

type processState = 'follower' | 'candidate' | 'leader'

interface IElectionData { 
  votes: Record<string, number>
  inProgess: boolean 
  votesDoneByNode: Record<number, string>
} 

interface IReceiveVoteResponse {
  votedForYou: boolean
}

interface IReceiveVoteRequest {
  electionTerm: number,
  voteFor: string
}

export class NodeProcess extends BaseNode {
  private name: string
  private state: processState = 'follower'
  private electionTerm = 0
  private heartBeatReceived = false
  private TIME_BETWEEN_HEARTBEATS = 4
  private HEART_BEAT_TIMEOUT = 1 // sec
  private otherProccesses: string[] = []
  private electionData: IElectionData = {
    votes: {}, // TODO - need to refactor because these are the votes for this node
    inProgess: false,
    votesDoneByNode: {}
  }
  private TIME_WAIT_BETWEEN_ELECTIONS = [1,2,3,4,5,6,7,8,9] // sec

  constructor(network: Network, baseUrl: string) {
    super(network, baseUrl);
    this.name = baseUrl;
  }

  // this is for timeouts, not to simulate latency
  private async sleep(s: number = 1) {
    const ms = s * 100
    console.log('starting sleep', ms)
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  run(processes: string[]) {
    this.updateRunStatus('run')
    this.otherProccesses = processes
    this.initHearbeatListener()
    this.registerHandlers();
  }

  private registerHandlers() {
    this.registerHandler('/heartbeat', 'GET', this.receiveHeartBeat)
    this.registerHandler('/vote', 'POST', this.receiveVoteRequest)
  }

  private async initHearbeatListener() {
    while (this.state !== 'leader') {
      await this.sleep(this.HEART_BEAT_TIMEOUT)
      console.log('timeout')
      if (this.electionData.inProgess) return

        if (!this.heartBeatReceived) {
          this.startElection()
        } else {
          this.heartBeatReceived = false
        }
    }
  }

  private async initHeartbeatProducer() {
    while (this.state === 'leader') {
      for (const p of this.otherProccesses) {
        await this.sendRequest({
          url: p + '/heartbeat',
          httpMethod: 'GET'
        })
      }
      await this.sleep(this.TIME_BETWEEN_HEARTBEATS)
    }
  }

  private async receiveHeartBeat(): Promise<IResponse> {
    await this.sleep()

    // if was false and I was a candidate then means a new leader is set
    // do I need the leader name or election term?
    if (!this.heartBeatReceived) {
      this.heartBeatReceived = true
      if (this.state === 'candidate') {
        this.state = 'follower'
      }
    }

    return {
      ok: true,
      statusCode: 200
    }
  }

  private async receiveVoteRequest(req: IRequest): Promise<IResponse> {
    await this.sleep()
    if (!req.body) {
      return {
        ok: false,
        statusCode: 400
      }
    }
    const body = this.parseReqBody<IReceiveVoteRequest>(req.body)
    const votedResult = this.voteFor(body.voteFor, body.electionTerm)
    const responseBody = JSON.stringify({
      votedForYou: votedResult
    })
    return {
      ok: true,
      statusCode: 200,
      body: responseBody
    }
  }

  private async startElection() {
    // if a hearbeat has been received, then we already have a leader
    if (this.heartBeatReceived) {
      return
    }

    // change data for election state
    this.electionData.inProgess = true
    this.state = 'candidate'
    this.electionTerm++
    this.electionData.votes[this.name] = 1
    this.voteFor(this.name, this.electionTerm)

    // ask other nodes to vote for me
    // WATCH OUT - NO ASYNC OR AWAIT FOR PROMISES ARRAY
    const voteRequests = this.otherProccesses.map(url => {
      const body = {
        electionTerm: this.electionTerm,
        voteFor: this.name
      }
      return this.sendRequest({
        url: `${url}/vote`,
        httpMethod: 'POST',
        body: JSON.stringify(body)
      })
    })

    // check if other nodes vote for me
    const votesResult = await Promise.allSettled(voteRequests)
    for (const voteResult of votesResult) {
      if (voteResult.status === 'rejected') {
        continue
      }
      if (!voteResult.value.body) {
        continue
      }
      const body = this.parseReqBody<IReceiveVoteResponse>(voteResult.value.body)
      // TODO - change it for ??
      const votedForYou = body.votedForYou || false;
      if (!votedForYou) {
        // didn't vote for me
        continue
      }
      this.electionData.votes[this.name]++
    }

    // nobody voted for me and we still don't have a leader because I haven't received a hearbeat
    // so I'll start again an election after some time
    if (this.electionData.votes[this.name] === 1 && !this.heartBeatReceived) {
      const num = Math.floor(Math.random() * this.TIME_WAIT_BETWEEN_ELECTIONS.length)
      const timeUntilNextElection = this.TIME_WAIT_BETWEEN_ELECTIONS[num]
      await this.sleep(timeUntilNextElection)
      this.startElection()
    }

    // I got more than one vote and still don't have a leader because I haven't received a heartbeat
    // so I'm the new leader
    if (this.electionData.votes[this.name] > 1 && !this.heartBeatReceived) {
      this.state = 'leader'
      this.electionData.inProgess = false
      this.initHeartbeatProducer()
      // do I need to set heartBeatReceived true?
      // this.heartBeatReceived = true
    }
  }

  private voteFor(nodeVoteFor: string, electionTerm: number): boolean {
    if (this.electionData.votesDoneByNode[electionTerm]) return false

    this.electionData.votesDoneByNode[electionTerm] = nodeVoteFor
    return true
  }
}
