import { Client } from "eris";
import { ClusterManager } from "./ClusterManager";

export class Cluster {
    public client: Client;
    public manager: ClusterManager;

    public id = -1;

    public shardCount = 0;
    public maxShards = 0;
    public firstShardID = 0;
    public lastShardID = 0;

    public constructor(manager: ClusterManager) {
        Object.defineProperty(this, "manager", { value: manager });
    }

    public spawn() {
        // TODO - uncaughtException
        // TODO - unhandledRejection

        process.on("message", message => {
            if (!message.name) return;

            switch (message.name) {
                case "connect":
                    this.firstShardID = message.firstShardID;
                    this.lastShardID = message.lastShardID;
                    this.id = message.clusterID;
                    this.shardCount = message.shardCount;
                    if (this.shardCount > 0) this.connect();
                    break;
            }
        });
    }

    public connect() {
        const loggerSource = `Cluster ${this.id}`;
        let { logger, clientOptions, token, clientBase } = this.manager;

        logger.info(loggerSource, `Connecting with ${this.shardCount} shards`);

        // Overwrite passed clientOptions
        const options = {
            autoreconnect: true,
            firstShardID: this.firstShardID,
            lastShardID: this.lastShardID,
            maxShards: this.shardCount
        };

        Object.assign(clientOptions, options);

        // Initialise the client
        const client = new clientBase(token, clientOptions);
        this.client = client;

        client.on("connect", (id) => {
            logger.debug(loggerSource, `Shard ${id} established connection`);
        });

        client.on("shardReady", (id) => {
            logger.debug(loggerSource, `Shard ${id} is ready`);
        });

        client.on("ready", () => {
           logger.debug(loggerSource, `Shards ${this.firstShardID} - ${this.lastShardID} are ready`)
        });

        client.connect();
    }
}

export interface RawCluster {
    workerID: number;
    shardCount: number
    firstShardID: number;
    lastShardID: number;
}