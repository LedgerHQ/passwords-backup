import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import { listen } from "@ledgerhq/logs";

export const GET_VERSION_COMMAND = 0x03;
export const GET_APP_NAME_COMMAND = 0x04;
export const DUMP_METADATAS_COMMAND = 0x05;
export const LOAD_METADATAS_COMMAND = 0x06;

class PasswordsManager {
    constructor(metadatas_size_on_device = 4096) {
        this.allowedStatuses = [0x9000, 0x6985, 0x6A86, 0x6A87, 0x6D00, 0x6E00, 0xB000];
        this.connected = false;
        this.metadatas_size_on_device = metadatas_size_on_device;
        this.metadatas = new Buffer.alloc(metadatas_size_on_device);
        this.busy = false
    }

    async connect() {
        if (!this.connected) {
            this.transport = await TransportWebUSB.create();
            try {
                this.version = await this.getVersion();
                let appName = await this.getAppName();
                if (appName.toString() !== "Passwords") throw new Error(appName);
                this.connected = true;
            }
            catch (error) {
                await this.transport.close();
                this.disconnect();
                throw error;
            }
        }
    }
    isSuccess(result) {
        return result.length >= 2 && result.readUInt16BE(result.length - 2) === 0x9000;
    }

    disconnect() {
        this.connected = false;
    }

    mapProtocolError(result) {
        if (result.length < 2) throw new Error("Response length is too small");

        var errors = {
            0x6985: "Action cancelled",
            0x6A86: "SW_WRONG_P1P2",
            0x6A87: "SW_WRONG_DATA_LENGTH",
            0x6D00: "SW_INS_NOT_SUPPORTED",
            0x6E00: "SW_CLA_NOT_SUPPORTED",
            0xB000: "SW_APPNAME_TOO_LONG"
        }

        let error = result.readUInt16BE(result.length - 2);
        if (error in errors) {
            throw new Error(errors[error]);
        }
    }

    async dispatchRequest(request, args) {
        if (this.busy) {
            throw new Error("Device is busy");
        }
        this.busy = true;

        let response;
        try {
            switch (request) {
                case GET_VERSION_COMMAND:
                    response = await this.getVersion();
                    break;

                case GET_APP_NAME_COMMAND:
                    response = await this.getAppName();
                    break;

                case DUMP_METADATAS_COMMAND:
                    response = await this.dump_metadatas();
                    break;

                case LOAD_METADATAS_COMMAND:
                    this._toBytes(args);
                    await this.load_metadatas();
                    break;

                default:
                    throw new Error("Unknown instruction");
            }
        }
        finally {
            this.busy = false;
        }
        return response;
    }

    async getVersion() {
        let result = await this.transport.send(0xE0, GET_VERSION_COMMAND, 0x00, 0x00, Buffer(0), this.allowedStatuses);
        if (!this.isSuccess(result)) this.mapProtocolError(result);
        return result.slice(0, result.length - 2);
    }

    async getAppName() {
        let result = await this.transport.send(0xE0, GET_APP_NAME_COMMAND, 0x00, 0x00, Buffer(0), this.allowedStatuses);
        if (!this.isSuccess(result)) this.mapProtocolError(result);
        return result.slice(0, result.length - 2);
    }

    _toBytes(json_metadatas) {
        let metadatas = this.metadatas;
        let parsed_metadatas = JSON.parse(json_metadatas)["parsed"];
        let offset = 0;
        parsed_metadatas.forEach(element => {
            let nickname = element["nickname"];
            let charsets = element["charsets"];
            if (nickname.length > 19) throw new Error(`Nickname too long (19 max): ${nickname} has length ${nickname.length}`);
            metadatas[offset++] = nickname.length + 1;
            metadatas[offset++] = 0x00;
            metadatas[offset++] = charsets;
            metadatas.write(nickname, offset);
            offset += nickname.length;
        });
    }

    _toJSON() {

        let metadatas = this.metadatas;
        let metadatas_list = [];
        let erased_list = [];
        let offset = 0;
        let corruptions = [];
        while (true) {
            let len = metadatas[offset];
            if (len === 0) break;
            let erased = metadatas[offset + 1] === 0xFF ? true : false;
            let charsets = metadatas[offset + 2];
            if (len > 19 + 1) corruptions += [offset, `nickname too long ${len}, max is 19`]
            if (!erased) {
                metadatas_list.push({
                    "nickname": metadatas.slice(offset + 3, offset + 2 + len).toString(),
                    "charsets": charsets
                });
            }
            else {
                erased_list.push({
                    "nickname": metadatas.slice(offset + 3, offset + 2 + len).toString(),
                    "charsets": charsets
                });
            }
            offset += len + 2;
        }
        return {
            "parsed": metadatas_list,
            "nicknames_erased_but_still_stored": erased_list,
            "corruptions_encountered": corruptions,
            "raw_metadatas": metadatas.toString("hex")
        };
    }

    async _load_metadatas_chunk(chunk, is_last) {
        let result = await this.transport.send(0xE0, LOAD_METADATAS_COMMAND, is_last ? 0xFF : 0x00, 0x00, Buffer.from(chunk), this.allowedStatuses);
        if (!this.isSuccess(result)) this.mapProtocolError(result);
        return result;
    }

    async dump_metadatas() {
        this.metadatas = Buffer.alloc(0)
        while (this.metadatas.length < this.metadatas_size_on_device) {
            let result = await this.transport.send(0xE0, DUMP_METADATAS_COMMAND, 0x00, 0x00, Buffer(0), this.allowedStatuses);
            if (!this.isSuccess(result)) this.mapProtocolError(result);
            this.metadatas = Buffer.concat([this.metadatas, Buffer.from(result.slice(1, -2))]);
            if (result[0] === 0xFF && this.metadatas.length < this.metadatas_size_on_device) {
                throw new Error(`${this.metadatas_size_on_device} bytes requested but only ${this.metadatas.length} bytes available`);
            }
        }
        return this._toJSON();
    }

    async load_metadatas() {
        if (this.metadatas.length === 0) {
            throw new Error("No data to load");
        }
        for (let i = 0; i < this.metadatas.length; i += 0xFF) {
            let chunk = this.metadatas.slice(i, i + 0xFF);
            await this._load_metadatas_chunk(chunk, i + chunk.length === this.metadatas.length ? true : false)
        }
    }

}

export default PasswordsManager