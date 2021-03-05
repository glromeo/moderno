#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@moderno/logger"));
const yargs_1 = __importDefault(require("yargs"));
const configure_1 = require("./configure");
const server_1 = require("./server");
require('source-map-support').install();
/********************************************
 *──────────────────────────────────────────*
 *─██████████████─██████─────────██████████─*
 *─██░░░░░░░░░░██─██░░██─────────██░░░░░░██─*
 *─██░░██████████─██░░██─────────████░░████─*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██████████─██░░██████████─████░░████─*
 *─██░░░░░░░░░░██─██░░░░░░░░░░██─██░░░░░░██─*
 *─██████████████─██████████████─██████████─*
 *──────────────────────────────────────────*
 ********************************************/
logger_1.default.info("starting server...");
const args = yargs_1.default
    .scriptName("@moderno/server")
    .usage("$0 <cmd> [args]")
    .option("config", {
    alias: ["c"],
    description: "Specify server config file (this will override base config as appropriate)",
    type: "string"
})
    .option("root", {
    alias: ["rootDir", "r"],
    description: "root directory (defaults to the process current working directory)",
    type: "string"
})
    .option("plugin", {
    alias: ["m"],
    description: "Add plugin to the server",
    type: "string"
})
    .option("debug", {
    alias: ["d"],
    description: "debug",
    type: "boolean"
})
    .option("production", {
    alias: ["p"],
    description: "production mode",
    type: "boolean"
})
    .help()
    .alias("help", "h")
    .argv;
process.env.NODE_ENV = args.production ? "production" : "development";
const SHUTDOWN_TIMEOUT = 120000;
const TERMINATED_BY_CTRL_C = 130;
const CANNOT_EXECUTE = 126;
server_1.startServer(configure_1.configure(args)).then(runtime => {
    process.on("unhandledRejection", (reason, p) => {
        logger_1.default.error("Unhandled Rejection at Promise", p, reason);
    });
    process.on("uncaughtException", err => {
        logger_1.default.error("Uncaught Exception thrown", err);
    });
    process.on("SIGINT", async () => {
        logger_1.default.info("ctrl+c detected...");
        await new Promise(done => {
            runtime.shutdown().then(done);
            setTimeout(done, SHUTDOWN_TIMEOUT);
        });
        process.exit(TERMINATED_BY_CTRL_C);
    });
    process.on("exit", () => {
        logger_1.default.info("done");
    });
}).catch(error => {
    logger_1.default.error("unable to start server", error);
    process.exit(CANNOT_EXECUTE);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw2REFBa0M7QUFDbEMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QyxnQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsaUJBQWlCLENBQUM7S0FDN0IsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0tBQ3hCLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDZCxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsNEVBQTRFO0lBQ3pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsTUFBTSxFQUFFO0lBQ1osS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztJQUN2QixXQUFXLEVBQUUsb0VBQW9FO0lBQ2pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDBCQUEwQjtJQUN2QyxJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRTtJQUNiLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxPQUFPO0lBQ3BCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxNQUFNLENBQUMsWUFBWSxFQUFFO0lBQ2xCLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsSUFBSSxFQUFFLFNBQVM7Q0FDbEIsQ0FBQztLQUNELElBQUksRUFBRTtLQUNOLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDO0tBQ2xCLElBQUksQ0FBQztBQUVWLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0FBRXRFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDO0FBQ2hDLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDO0FBQ2pDLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUUzQixvQkFBVyxDQUFDLHFCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7SUFFeEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMzQyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxFQUFFO1FBQ2xDLGdCQUFHLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2hELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDNUIsZ0JBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUMvQixNQUFNLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsVUFBVSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1FBQ3BCLGdCQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0FBRVAsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO0lBQ2IsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0MsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcclxuaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XHJcbmltcG9ydCB5YXJncyBmcm9tIFwieWFyZ3NcIjtcclxuaW1wb3J0IHtjb25maWd1cmV9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge3N0YXJ0U2VydmVyfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcclxuXHJcbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcclxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilojilojilojilojilojilojilojilojilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXHJcbiAq4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxubG9nLmluZm8oXCJzdGFydGluZyBzZXJ2ZXIuLi5cIik7XHJcblxyXG5jb25zdCBhcmdzID0geWFyZ3NcclxuICAgIC5zY3JpcHROYW1lKFwiQG1vZGVybm8vc2VydmVyXCIpXHJcbiAgICAudXNhZ2UoXCIkMCA8Y21kPiBbYXJnc11cIilcclxuICAgIC5vcHRpb24oXCJjb25maWdcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJjXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlNwZWNpZnkgc2VydmVyIGNvbmZpZyBmaWxlICh0aGlzIHdpbGwgb3ZlcnJpZGUgYmFzZSBjb25maWcgYXMgYXBwcm9wcmlhdGUpXCIsXHJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJyb290XCIsIHtcclxuICAgICAgICBhbGlhczogW1wicm9vdERpclwiLCBcInJcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwicm9vdCBkaXJlY3RvcnkgKGRlZmF1bHRzIHRvIHRoZSBwcm9jZXNzIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkpXCIsXHJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJwbHVnaW5cIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJtXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkZCBwbHVnaW4gdG8gdGhlIHNlcnZlclwiLFxyXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcclxuICAgIH0pXHJcbiAgICAub3B0aW9uKFwiZGVidWdcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJkXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcImRlYnVnXCIsXHJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcclxuICAgIH0pXHJcbiAgICAub3B0aW9uKFwicHJvZHVjdGlvblwiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcInBcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwicHJvZHVjdGlvbiBtb2RlXCIsXHJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcclxuICAgIH0pXHJcbiAgICAuaGVscCgpXHJcbiAgICAuYWxpYXMoXCJoZWxwXCIsIFwiaFwiKVxyXG4gICAgLmFyZ3Y7XHJcblxyXG5wcm9jZXNzLmVudi5OT0RFX0VOViA9IGFyZ3MucHJvZHVjdGlvbiA/IFwicHJvZHVjdGlvblwiIDogXCJkZXZlbG9wbWVudFwiO1xyXG5cclxuY29uc3QgU0hVVERPV05fVElNRU9VVCA9IDEyMDAwMDtcclxuY29uc3QgVEVSTUlOQVRFRF9CWV9DVFJMX0MgPSAxMzA7XHJcbmNvbnN0IENBTk5PVF9FWEVDVVRFID0gMTI2O1xyXG5cclxuc3RhcnRTZXJ2ZXIoY29uZmlndXJlKGFyZ3MpKS50aGVuKHJ1bnRpbWUgPT4ge1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgKHJlYXNvbiwgcCkgPT4ge1xyXG4gICAgICAgIGxvZy5lcnJvcihcIlVuaGFuZGxlZCBSZWplY3Rpb24gYXQgUHJvbWlzZVwiLCBwLCByZWFzb24pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGVyciA9PiB7XHJcbiAgICAgICAgbG9nLmVycm9yKFwiVW5jYXVnaHQgRXhjZXB0aW9uIHRocm93blwiLCBlcnIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcIlNJR0lOVFwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgbG9nLmluZm8oXCJjdHJsK2MgZGV0ZWN0ZWQuLi5cIik7XHJcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoZG9uZSA9PiB7XHJcbiAgICAgICAgICAgIHJ1bnRpbWUuc2h1dGRvd24oKS50aGVuKGRvbmUpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGRvbmUsIFNIVVRET1dOX1RJTUVPVVQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb2Nlc3MuZXhpdChURVJNSU5BVEVEX0JZX0NUUkxfQyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCAoKSA9PiB7XHJcbiAgICAgICAgbG9nLmluZm8oXCJkb25lXCIpO1xyXG4gICAgfSk7XHJcblxyXG59KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICBsb2cuZXJyb3IoXCJ1bmFibGUgdG8gc3RhcnQgc2VydmVyXCIsIGVycm9yKTtcclxuICAgIHByb2Nlc3MuZXhpdChDQU5OT1RfRVhFQ1VURSk7XHJcbn0pO1xyXG5cclxuIl19