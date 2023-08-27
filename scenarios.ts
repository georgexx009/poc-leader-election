import { NodeProcess } from './node-process'
import { Network } from './network'

export function setUpProcesses(quantity = 3): NodeProcess[] {
  const network = new Network()
  const urls = Array.from({ length: quantity}, (_, i) => i).map(i => `node-${i}`)
  const processes: NodeProcess[] = []
  
  // key: process url, val: otherProcesses for the process at key
  const mapOtherProccesses = {}

  // create node processes and register them in network
  for (let i=0; i < quantity; i++) {
    const url = urls[i]
    const process = new NodeProcess(network, url)

    // compute the processes that current process will interact with
    const otherProccesses: string[] = []
    for (let j=0; j < quantity; j++) {
      if (j === i) {
        continue
      }
      otherProccesses.push(urls[j])
    }
    mapOtherProccesses[url] = otherProccesses

    network.registerIP(url, process)
    processes.push(process)
  }

  // attempt to run the proccesses at the same time
  processes.forEach(node => node.run(mapOtherProccesses[node.getUrl()]))

  return processes
}

export function startSystem() {
  const runningProcesses = setUpProcesses()
  
}
