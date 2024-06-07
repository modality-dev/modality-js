# modality-js

## Installation

```bash
pnpm i
```

## Running a node

To run a node you'll find configs in `packages/fixtures/network-node/fixtures/config`

```bash
node packages/network-node/src/cmds/run_sequencer.js --config packages/network-node/fixtures/configs/node1.json
```

You should now see in the terminal that you are now listening on the addresses set in the config `node1.json`

## Communication between nodes

### Ping

To start a 2nd node and ping node 1 from node 2 you can run passing in for `target` the addresses you are listening to from when you started `node1`

```bash
node packages/network-node/src/cmds/ping.js --config packages/network-node/fixtures/configs/node2.json --target /ip4/127.0.0.1/tcp/10001/ws/p2p/12D3KooWPBRNBzgceXh7Z27wGoyYYz9ggwaYg2dWiwXXe8ieyFCN --times 10
```

### ReqRes

You can communicate directly between nodes and pass data by running ReqRes command and passing in a `path` and `data`

#### Valid Paths

- /consensus/status
- /consensus/sign_vertex
- /consensus/submit_commits

```bash
node packages/network-node/src/cmds/request.js --config packages/network-node/fixtures/configs/node2.json --target /ip4/127.0.0.1/tcp/10001/ws/p2p/12D3KooWPBRNBzgceXh7Z27wGoyYYz9ggwaYg2dWiwXXe8ieyFCN --path "/consensus/status" --data "{\"hello\": \"world\"}"
```
