import { NodeProcess } from 'node-process'
import { Network } from 'network'

export function setUpProcesses(quantity = 3): NodeProcess[] {
  const processes: NodeProcess[] = []
  for (let i=0; i < quantity; i++) {
    processes.push(new NodeProcess(`node-${i}`))
  }
  return processes
}

export function startSystem() {
  const processes = setUpProcesses()
  const network = new Network()
  
}
