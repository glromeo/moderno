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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw2REFBa0M7QUFDbEMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QyxnQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsaUJBQWlCLENBQUM7S0FDN0IsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0tBQ3hCLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDZCxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsNEVBQTRFO0lBQ3pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsTUFBTSxFQUFFO0lBQ1osS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztJQUN2QixXQUFXLEVBQUUsb0VBQW9FO0lBQ2pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDBCQUEwQjtJQUN2QyxJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRTtJQUNiLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxPQUFPO0lBQ3BCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxNQUFNLENBQUMsWUFBWSxFQUFFO0lBQ2xCLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsSUFBSSxFQUFFLFNBQVM7Q0FDbEIsQ0FBQztLQUNELElBQUksRUFBRTtLQUNOLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDO0tBQ2xCLElBQUksQ0FBQztBQUVWLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0FBRXRFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDO0FBQ2hDLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDO0FBQ2pDLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUUzQixvQkFBVyxDQUFDLHFCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7SUFFeEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMzQyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxFQUFFO1FBQ2xDLGdCQUFHLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2hELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDNUIsZ0JBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUMvQixNQUFNLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsVUFBVSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1FBQ3BCLGdCQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0FBRVAsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO0lBQ2IsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0MsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCBsb2cgZnJvbSBcIkBtb2Rlcm5vL2xvZ2dlclwiO1xuaW1wb3J0IHlhcmdzIGZyb20gXCJ5YXJnc1wiO1xuaW1wb3J0IHtjb25maWd1cmV9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtzdGFydFNlcnZlcn0gZnJvbSBcIi4vc2VydmVyXCI7XG5cbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSAKlxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcbiAq4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paI4paI4pSAKlxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilIAqXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxubG9nLmluZm8oXCJzdGFydGluZyBzZXJ2ZXIuLi5cIik7XG5cbmNvbnN0IGFyZ3MgPSB5YXJnc1xuICAgIC5zY3JpcHROYW1lKFwiQG1vZGVybm8vc2VydmVyXCIpXG4gICAgLnVzYWdlKFwiJDAgPGNtZD4gW2FyZ3NdXCIpXG4gICAgLm9wdGlvbihcImNvbmZpZ1wiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJjXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTcGVjaWZ5IHNlcnZlciBjb25maWcgZmlsZSAodGhpcyB3aWxsIG92ZXJyaWRlIGJhc2UgY29uZmlnIGFzIGFwcHJvcHJpYXRlKVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgfSlcbiAgICAub3B0aW9uKFwicm9vdFwiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJyb290RGlyXCIsIFwiclwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwicm9vdCBkaXJlY3RvcnkgKGRlZmF1bHRzIHRvIHRoZSBwcm9jZXNzIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkpXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICB9KVxuICAgIC5vcHRpb24oXCJwbHVnaW5cIiwge1xuICAgICAgICBhbGlhczogW1wibVwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQWRkIHBsdWdpbiB0byB0aGUgc2VydmVyXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICB9KVxuICAgIC5vcHRpb24oXCJkZWJ1Z1wiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJkXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJkZWJ1Z1wiLFxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgIH0pXG4gICAgLm9wdGlvbihcInByb2R1Y3Rpb25cIiwge1xuICAgICAgICBhbGlhczogW1wicFwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwicHJvZHVjdGlvbiBtb2RlXCIsXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgfSlcbiAgICAuaGVscCgpXG4gICAgLmFsaWFzKFwiaGVscFwiLCBcImhcIilcbiAgICAuYXJndjtcblxucHJvY2Vzcy5lbnYuTk9ERV9FTlYgPSBhcmdzLnByb2R1Y3Rpb24gPyBcInByb2R1Y3Rpb25cIiA6IFwiZGV2ZWxvcG1lbnRcIjtcblxuY29uc3QgU0hVVERPV05fVElNRU9VVCA9IDEyMDAwMDtcbmNvbnN0IFRFUk1JTkFURURfQllfQ1RSTF9DID0gMTMwO1xuY29uc3QgQ0FOTk9UX0VYRUNVVEUgPSAxMjY7XG5cbnN0YXJ0U2VydmVyKGNvbmZpZ3VyZShhcmdzKSkudGhlbihydW50aW1lID0+IHtcblxuICAgIHByb2Nlc3Mub24oXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgKHJlYXNvbiwgcCkgPT4ge1xuICAgICAgICBsb2cuZXJyb3IoXCJVbmhhbmRsZWQgUmVqZWN0aW9uIGF0IFByb21pc2VcIiwgcCwgcmVhc29uKTtcbiAgICB9KTtcblxuICAgIHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBlcnIgPT4ge1xuICAgICAgICBsb2cuZXJyb3IoXCJVbmNhdWdodCBFeGNlcHRpb24gdGhyb3duXCIsIGVycik7XG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKFwiU0lHSU5UXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbG9nLmluZm8oXCJjdHJsK2MgZGV0ZWN0ZWQuLi5cIik7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKGRvbmUgPT4ge1xuICAgICAgICAgICAgcnVudGltZS5zaHV0ZG93bigpLnRoZW4oZG9uZSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGRvbmUsIFNIVVRET1dOX1RJTUVPVVQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KFRFUk1JTkFURURfQllfQ1RSTF9DKTtcbiAgICB9KTtcblxuICAgIHByb2Nlc3Mub24oXCJleGl0XCIsICgpID0+IHtcbiAgICAgICAgbG9nLmluZm8oXCJkb25lXCIpO1xuICAgIH0pO1xuXG59KS5jYXRjaChlcnJvciA9PiB7XG4gICAgbG9nLmVycm9yKFwidW5hYmxlIHRvIHN0YXJ0IHNlcnZlclwiLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KENBTk5PVF9FWEVDVVRFKTtcbn0pO1xuXG4iXX0=