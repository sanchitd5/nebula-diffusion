import { Server } from '@hapi/hapi';
import { Server as SocketServer, ServerOptions as SocketServerOptions } from "socket.io";
import config from '../config';

type SocketEmitMessage = {
    message: {
        type: string;
        statusCode: number;
        statusMessage: string;
        data: any
    }
}

interface ServerToClientEvents {
    message: (arg0: SocketEmitMessage) => any;
}

interface ClientToServerEvents {
    hello: () => void;
}

interface InterServerEvents {
    ping: () => void;
}

interface SocketData {
    name: string;
    age: number;
}

class SocketManager {
    private readonly declare server: SocketServer | undefined;
    constructor(server: Server, options?: Partial<SocketServerOptions>) {
        if (!config.APP_CONFIG.useSocket) global.socketLogger.info("Socket Server disabled");
        else {
            const io = new SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server.app, options);
            global.socketLogger.info("Server Initalized");
            this.server = io;
        }
    }

    /**
     * @returns {SocketServer|undefined} Socket Server Instance;
     */
    connectSocket(): SocketServer | undefined {
        this.server?.on('connection', (socket) => {
            global.socketLogger.info("Connection established: ", socket.id);
            const messageToSend: SocketEmitMessage = {
                message: {
                    type: 'connection',
                    statusCode: 200,
                    statusMessage: 'WELCOME TO ',
                    data: ""
                }
            };
            socket.emit('message', messageToSend);
        });
        return this.server;
    }

    disconnectSocketServer() {
        if (!config.APP_CONFIG.useSocket) return global.socketLogger.info("Socket Server Disabled");
        this.server?.disconnectSockets(true);
    }

    emit(data: SocketEmitMessage) {
        this.server?.emit('message', data);
    }
}

export default SocketManager;



