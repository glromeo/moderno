"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHotModuleReplacement = exports.EsmHmrEngine = void 0;
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const ws_1 = __importDefault(require("ws"));
class EsmHmrEngine {
    constructor(server) {
        this.clients = new Set();
        this.dependencyTree = new Map();
        const wss = new ws_1.default.Server({ noServer: true });
        server.on("upgrade", (req, socket, head) => {
            if (req.headers["sec-websocket-protocol"] === "esm-hmr") {
                wss.handleUpgrade(req, socket, head, (client) => {
                    wss.emit("connection", client, req);
                });
            }
        });
        wss.on("connection", (client) => {
            this.connectClient(client);
            this.registerListener(client);
        });
    }
    registerListener(client) {
        client.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === "hotAccept") {
                const entry = this.getEntry(message.id, true);
                entry.isHmrAccepted = true;
            }
        });
    }
    createEntry(sourceUrl) {
        const newEntry = {
            dependencies: new Set(),
            dependents: new Set(),
            needsReplacement: false,
            isHmrEnabled: false,
            isHmrAccepted: false
        };
        this.dependencyTree.set(sourceUrl, newEntry);
        return newEntry;
    }
    getEntry(sourceUrl, createIfNotFound = false) {
        const result = this.dependencyTree.get(sourceUrl);
        if (result) {
            return result;
        }
        if (createIfNotFound) {
            return this.createEntry(sourceUrl);
        }
        return null;
    }
    setEntry(sourceUrl, imports, isHmrEnabled = false) {
        const result = this.getEntry(sourceUrl, true);
        const outdatedDependencies = new Set(result.dependencies);
        result.isHmrEnabled = isHmrEnabled;
        for (const importUrl of imports) {
            this.addRelationship(sourceUrl, importUrl);
            outdatedDependencies.delete(importUrl);
        }
        for (const importUrl of outdatedDependencies) {
            this.removeRelationship(sourceUrl, importUrl);
        }
    }
    removeRelationship(sourceUrl, importUrl) {
        let importResult = this.getEntry(importUrl);
        importResult && importResult.dependents.delete(sourceUrl);
        const sourceResult = this.getEntry(sourceUrl);
        sourceResult && sourceResult.dependencies.delete(importUrl);
    }
    addRelationship(sourceUrl, importUrl) {
        if (importUrl !== sourceUrl) {
            let importResult = this.getEntry(importUrl, true);
            importResult.dependents.add(sourceUrl);
            const sourceResult = this.getEntry(sourceUrl, true);
            sourceResult.dependencies.add(importUrl);
        }
    }
    markEntryForReplacement(entry, state) {
        entry.needsReplacement = state;
    }
    broadcastMessage(data) {
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(JSON.stringify(data));
            }
            else {
                this.disconnectClient(client);
            }
        });
    }
    connectClient(client) {
        this.clients.add(client);
    }
    disconnectClient(client) {
        client.terminate();
        this.clients.delete(client);
    }
    disconnectAllClients() {
        for (const client of this.clients) {
            this.disconnectClient(client);
        }
    }
}
exports.EsmHmrEngine = EsmHmrEngine;
exports.useHotModuleReplacement = nano_memoize_1.default(function (options) {
    return {
        engine: null,
        connect(server) {
            this.engine = new EsmHmrEngine(server);
            server.on("close", () => {
                this.engine.disconnectAllClients();
            });
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG1yLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9obXItc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLGdFQUFvQztBQUNwQyw0Q0FBMkI7QUFXM0IsTUFBYSxZQUFZO0lBSXJCLFlBQVksTUFBaUM7UUFIN0MsWUFBTyxHQUFtQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3BDLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7UUFHM0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxZQUFTLENBQUMsTUFBTSxDQUFDLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3ZDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLFNBQVMsRUFBRTtnQkFDckQsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxDQUFDO2FBQ047UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsTUFBaUI7UUFDOUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUMxQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7Z0JBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQWUsQ0FBQztnQkFDNUQsS0FBSyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7YUFDOUI7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxXQUFXLENBQUMsU0FBaUI7UUFDekIsTUFBTSxRQUFRLEdBQWU7WUFDekIsWUFBWSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ3ZCLFVBQVUsRUFBRSxJQUFJLEdBQUcsRUFBRTtZQUNyQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1lBQ25CLGFBQWEsRUFBRSxLQUFLO1NBQ3ZCLENBQUM7UUFDRixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDN0MsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUVELFFBQVEsQ0FBQyxTQUFpQixFQUFFLGdCQUFnQixHQUFHLEtBQUs7UUFDaEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEQsSUFBSSxNQUFNLEVBQUU7WUFDUixPQUFPLE1BQU0sQ0FBQztTQUNqQjtRQUNELElBQUksZ0JBQWdCLEVBQUU7WUFDbEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3RDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELFFBQVEsQ0FBQyxTQUFpQixFQUFFLE9BQWlCLEVBQUUsWUFBWSxHQUFHLEtBQUs7UUFDL0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDL0MsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDbkMsS0FBSyxNQUFNLFNBQVMsSUFBSSxPQUFPLEVBQUU7WUFDN0IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDM0Msb0JBQW9CLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsS0FBSyxNQUFNLFNBQVMsSUFBSSxvQkFBb0IsRUFBRTtZQUMxQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQ2pEO0lBQ0wsQ0FBQztJQUVELGtCQUFrQixDQUFDLFNBQWlCLEVBQUUsU0FBaUI7UUFDbkQsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1QyxZQUFZLElBQUksWUFBWSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QyxZQUFZLElBQUksWUFBWSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELGVBQWUsQ0FBQyxTQUFpQixFQUFFLFNBQWlCO1FBQ2hELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUN6QixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUNuRCxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUNyRCxZQUFZLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM1QztJQUNMLENBQUM7SUFFRCx1QkFBdUIsQ0FBQyxLQUFpQixFQUFFLEtBQWM7UUFDckQsS0FBSyxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztJQUNuQyxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsSUFBWTtRQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQzVCLElBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxZQUFTLENBQUMsSUFBSSxFQUFFO2dCQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNyQztpQkFBTTtnQkFDSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDakM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxhQUFhLENBQUMsTUFBaUI7UUFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELGdCQUFnQixDQUFDLE1BQWlCO1FBQzlCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsb0JBQW9CO1FBQ2hCLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUMvQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDakM7SUFDTCxDQUFDO0NBQ0o7QUE3R0Qsb0NBNkdDO0FBT1ksUUFBQSx1QkFBdUIsR0FBRyxzQkFBUSxDQUFDLFVBQVUsT0FBc0I7SUFDNUUsT0FBTztRQUNILE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxDQUFDLE1BQU07WUFDVixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDcEIsSUFBSSxDQUFDLE1BQU8sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUNKLENBQUE7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIGh0dHAgZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IHtIdHRwMlNlcnZlcn0gZnJvbSBcImh0dHAyXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBXZWJTb2NrZXQgZnJvbSBcIndzXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcblxyXG5pbnRlcmZhY2UgRGVwZW5kZW5jeSB7XHJcbiAgICBkZXBlbmRlbnRzOiBTZXQ8c3RyaW5nPjtcclxuICAgIGRlcGVuZGVuY2llczogU2V0PHN0cmluZz47XHJcbiAgICBpc0htckVuYWJsZWQ6IGJvb2xlYW47XHJcbiAgICBpc0htckFjY2VwdGVkOiBib29sZWFuO1xyXG4gICAgbmVlZHNSZXBsYWNlbWVudDogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVzbUhtckVuZ2luZSB7XHJcbiAgICBjbGllbnRzOiBTZXQ8V2ViU29ja2V0PiA9IG5ldyBTZXQoKTtcclxuICAgIGRlcGVuZGVuY3lUcmVlID0gbmV3IE1hcDxzdHJpbmcsIERlcGVuZGVuY3k+KCk7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2VydmVyOiBodHRwLlNlcnZlciB8IEh0dHAyU2VydmVyKSB7XHJcbiAgICAgICAgY29uc3Qgd3NzID0gbmV3IFdlYlNvY2tldC5TZXJ2ZXIoe25vU2VydmVyOiB0cnVlfSk7XHJcbiAgICAgICAgc2VydmVyLm9uKFwidXBncmFkZVwiLCAocmVxLCBzb2NrZXQsIGhlYWQpID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlcS5oZWFkZXJzW1wic2VjLXdlYnNvY2tldC1wcm90b2NvbFwiXSA9PT0gXCJlc20taG1yXCIpIHtcclxuICAgICAgICAgICAgICAgIHdzcy5oYW5kbGVVcGdyYWRlKHJlcSwgc29ja2V0LCBoZWFkLCAoY2xpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd3NzLmVtaXQoXCJjb25uZWN0aW9uXCIsIGNsaWVudCwgcmVxKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgd3NzLm9uKFwiY29ubmVjdGlvblwiLCAoY2xpZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdENsaWVudChjbGllbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyTGlzdGVuZXIoY2xpZW50KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZWdpc3Rlckxpc3RlbmVyKGNsaWVudDogV2ViU29ja2V0KSB7XHJcbiAgICAgICAgY2xpZW50Lm9uKFwibWVzc2FnZVwiLCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShkYXRhLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS50eXBlID09PSBcImhvdEFjY2VwdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0RW50cnkobWVzc2FnZS5pZCwgdHJ1ZSkgYXMgRGVwZW5kZW5jeTtcclxuICAgICAgICAgICAgICAgIGVudHJ5LmlzSG1yQWNjZXB0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRW50cnkoc291cmNlVXJsOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBuZXdFbnRyeTogRGVwZW5kZW5jeSA9IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBuZXcgU2V0KCksXHJcbiAgICAgICAgICAgIGRlcGVuZGVudHM6IG5ldyBTZXQoKSxcclxuICAgICAgICAgICAgbmVlZHNSZXBsYWNlbWVudDogZmFsc2UsXHJcbiAgICAgICAgICAgIGlzSG1yRW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGlzSG1yQWNjZXB0ZWQ6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLmRlcGVuZGVuY3lUcmVlLnNldChzb3VyY2VVcmwsIG5ld0VudHJ5KTtcclxuICAgICAgICByZXR1cm4gbmV3RW50cnk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RW50cnkoc291cmNlVXJsOiBzdHJpbmcsIGNyZWF0ZUlmTm90Rm91bmQgPSBmYWxzZSkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZGVwZW5kZW5jeVRyZWUuZ2V0KHNvdXJjZVVybCk7XHJcbiAgICAgICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY3JlYXRlSWZOb3RGb3VuZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFbnRyeShzb3VyY2VVcmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBzZXRFbnRyeShzb3VyY2VVcmw6IHN0cmluZywgaW1wb3J0czogc3RyaW5nW10sIGlzSG1yRW5hYmxlZCA9IGZhbHNlKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5nZXRFbnRyeShzb3VyY2VVcmwsIHRydWUpITtcclxuICAgICAgICBjb25zdCBvdXRkYXRlZERlcGVuZGVuY2llcyA9IG5ldyBTZXQocmVzdWx0LmRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgcmVzdWx0LmlzSG1yRW5hYmxlZCA9IGlzSG1yRW5hYmxlZDtcclxuICAgICAgICBmb3IgKGNvbnN0IGltcG9ydFVybCBvZiBpbXBvcnRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkUmVsYXRpb25zaGlwKHNvdXJjZVVybCwgaW1wb3J0VXJsKTtcclxuICAgICAgICAgICAgb3V0ZGF0ZWREZXBlbmRlbmNpZXMuZGVsZXRlKGltcG9ydFVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoY29uc3QgaW1wb3J0VXJsIG9mIG91dGRhdGVkRGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlUmVsYXRpb25zaGlwKHNvdXJjZVVybCwgaW1wb3J0VXJsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlUmVsYXRpb25zaGlwKHNvdXJjZVVybDogc3RyaW5nLCBpbXBvcnRVcmw6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBpbXBvcnRSZXN1bHQgPSB0aGlzLmdldEVudHJ5KGltcG9ydFVybCk7XHJcbiAgICAgICAgaW1wb3J0UmVzdWx0ICYmIGltcG9ydFJlc3VsdC5kZXBlbmRlbnRzLmRlbGV0ZShzb3VyY2VVcmwpO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZVJlc3VsdCA9IHRoaXMuZ2V0RW50cnkoc291cmNlVXJsKTtcclxuICAgICAgICBzb3VyY2VSZXN1bHQgJiYgc291cmNlUmVzdWx0LmRlcGVuZGVuY2llcy5kZWxldGUoaW1wb3J0VXJsKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRSZWxhdGlvbnNoaXAoc291cmNlVXJsOiBzdHJpbmcsIGltcG9ydFVybDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKGltcG9ydFVybCAhPT0gc291cmNlVXJsKSB7XHJcbiAgICAgICAgICAgIGxldCBpbXBvcnRSZXN1bHQgPSB0aGlzLmdldEVudHJ5KGltcG9ydFVybCwgdHJ1ZSkhO1xyXG4gICAgICAgICAgICBpbXBvcnRSZXN1bHQuZGVwZW5kZW50cy5hZGQoc291cmNlVXJsKTtcclxuICAgICAgICAgICAgY29uc3Qgc291cmNlUmVzdWx0ID0gdGhpcy5nZXRFbnRyeShzb3VyY2VVcmwsIHRydWUpITtcclxuICAgICAgICAgICAgc291cmNlUmVzdWx0LmRlcGVuZGVuY2llcy5hZGQoaW1wb3J0VXJsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWFya0VudHJ5Rm9yUmVwbGFjZW1lbnQoZW50cnk6IERlcGVuZGVuY3ksIHN0YXRlOiBib29sZWFuKSB7XHJcbiAgICAgICAgZW50cnkubmVlZHNSZXBsYWNlbWVudCA9IHN0YXRlO1xyXG4gICAgfVxyXG5cclxuICAgIGJyb2FkY2FzdE1lc3NhZ2UoZGF0YTogb2JqZWN0KSB7XHJcbiAgICAgICAgdGhpcy5jbGllbnRzLmZvckVhY2goKGNsaWVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY2xpZW50LnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XHJcbiAgICAgICAgICAgICAgICBjbGllbnQuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RDbGllbnQoY2xpZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbm5lY3RDbGllbnQoY2xpZW50OiBXZWJTb2NrZXQpIHtcclxuICAgICAgICB0aGlzLmNsaWVudHMuYWRkKGNsaWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzY29ubmVjdENsaWVudChjbGllbnQ6IFdlYlNvY2tldCkge1xyXG4gICAgICAgIGNsaWVudC50ZXJtaW5hdGUoKTtcclxuICAgICAgICB0aGlzLmNsaWVudHMuZGVsZXRlKGNsaWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzY29ubmVjdEFsbENsaWVudHMoKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBjbGllbnQgb2YgdGhpcy5jbGllbnRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdENsaWVudChjbGllbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHR5cGUgSG90TW9kdWxlUmVwbGFjZW1lbnQgPSB7XHJcbiAgICBlbmdpbmU6IEVzbUhtckVuZ2luZXxudWxsXHJcbiAgICBjb25uZWN0KHNlcnZlcjpodHRwLlNlcnZlciB8IEh0dHAyU2VydmVyKTp2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB1c2VIb3RNb2R1bGVSZXBsYWNlbWVudCA9IG1lbW9pemVkKGZ1bmN0aW9uIChvcHRpb25zOiBFU05leHRPcHRpb25zKTpIb3RNb2R1bGVSZXBsYWNlbWVudCB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGVuZ2luZTogbnVsbCxcclxuICAgICAgICBjb25uZWN0KHNlcnZlcikge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZSA9IG5ldyBFc21IbXJFbmdpbmUoc2VydmVyKTtcclxuICAgICAgICAgICAgc2VydmVyLm9uKFwiY2xvc2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbmdpbmUhLmRpc2Nvbm5lY3RBbGxDbGllbnRzKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7Il19