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
    // process.on("SIGINT", async () => {
    //     log.info("ctrl+c detected...");
    //     await new Promise(done => {
    //         runtime.shutdown().then(done);
    //         setTimeout(done, SHUTDOWN_TIMEOUT);
    //     });
    //     process.exit(TERMINATED_BY_CTRL_C);
    // });
    process.on("exit", () => {
        logger_1.default.info("done");
    });
}).catch(error => {
    logger_1.default.error("unable to start server", error);
    process.exit(CANNOT_EXECUTE);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw2REFBa0M7QUFDbEMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QyxnQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsaUJBQWlCLENBQUM7S0FDN0IsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0tBQ3hCLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDZCxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsNEVBQTRFO0lBQ3pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsTUFBTSxFQUFFO0lBQ1osS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztJQUN2QixXQUFXLEVBQUUsb0VBQW9FO0lBQ2pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDBCQUEwQjtJQUN2QyxJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRTtJQUNiLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxPQUFPO0lBQ3BCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxJQUFJLEVBQUU7S0FDTixLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztLQUNsQixJQUFJLENBQUM7QUFFVixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUV0RSxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztBQUNoQyxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFFM0Isb0JBQVcsQ0FBQyxxQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBRXhDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0MsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsRUFBRTtRQUNsQyxnQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVILHFDQUFxQztJQUNyQyxzQ0FBc0M7SUFDdEMsa0NBQWtDO0lBQ2xDLHlDQUF5QztJQUN6Qyw4Q0FBOEM7SUFDOUMsVUFBVTtJQUNWLDBDQUEwQztJQUMxQyxNQUFNO0lBRU4sT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1FBQ3BCLGdCQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0FBRVAsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO0lBQ2IsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0MsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCBsb2cgZnJvbSBcIkBtb2Rlcm5vL2xvZ2dlclwiO1xuaW1wb3J0IHlhcmdzIGZyb20gXCJ5YXJnc1wiO1xuaW1wb3J0IHtjb25maWd1cmV9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtzdGFydFNlcnZlcn0gZnJvbSBcIi4vc2VydmVyXCI7XG5cbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSAKlxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcbiAq4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paI4paI4pSAKlxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilIAqXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxubG9nLmluZm8oXCJzdGFydGluZyBzZXJ2ZXIuLi5cIik7XG5cbmNvbnN0IGFyZ3MgPSB5YXJnc1xuICAgIC5zY3JpcHROYW1lKFwiQG1vZGVybm8vc2VydmVyXCIpXG4gICAgLnVzYWdlKFwiJDAgPGNtZD4gW2FyZ3NdXCIpXG4gICAgLm9wdGlvbihcImNvbmZpZ1wiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJjXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTcGVjaWZ5IHNlcnZlciBjb25maWcgZmlsZSAodGhpcyB3aWxsIG92ZXJyaWRlIGJhc2UgY29uZmlnIGFzIGFwcHJvcHJpYXRlKVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgfSlcbiAgICAub3B0aW9uKFwicm9vdFwiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJyb290RGlyXCIsIFwiclwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwicm9vdCBkaXJlY3RvcnkgKGRlZmF1bHRzIHRvIHRoZSBwcm9jZXNzIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkpXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICB9KVxuICAgIC5vcHRpb24oXCJwbHVnaW5cIiwge1xuICAgICAgICBhbGlhczogW1wibVwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQWRkIHBsdWdpbiB0byB0aGUgc2VydmVyXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICB9KVxuICAgIC5vcHRpb24oXCJkZWJ1Z1wiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJkXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJkZWJ1Z1wiLFxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgIH0pXG4gICAgLmhlbHAoKVxuICAgIC5hbGlhcyhcImhlbHBcIiwgXCJoXCIpXG4gICAgLmFyZ3Y7XG5cbnByb2Nlc3MuZW52Lk5PREVfRU5WID0gYXJncy5wcm9kdWN0aW9uID8gXCJwcm9kdWN0aW9uXCIgOiBcImRldmVsb3BtZW50XCI7XG5cbmNvbnN0IFNIVVRET1dOX1RJTUVPVVQgPSAxMjAwMDA7XG5jb25zdCBURVJNSU5BVEVEX0JZX0NUUkxfQyA9IDEzMDtcbmNvbnN0IENBTk5PVF9FWEVDVVRFID0gMTI2O1xuXG5zdGFydFNlcnZlcihjb25maWd1cmUoYXJncykpLnRoZW4ocnVudGltZSA9PiB7XG5cbiAgICBwcm9jZXNzLm9uKFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIChyZWFzb24sIHApID0+IHtcbiAgICAgICAgbG9nLmVycm9yKFwiVW5oYW5kbGVkIFJlamVjdGlvbiBhdCBQcm9taXNlXCIsIHAsIHJlYXNvbik7XG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZXJyID0+IHtcbiAgICAgICAgbG9nLmVycm9yKFwiVW5jYXVnaHQgRXhjZXB0aW9uIHRocm93blwiLCBlcnIpO1xuICAgIH0pO1xuXG4gICAgLy8gcHJvY2Vzcy5vbihcIlNJR0lOVFwiLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gICAgIGxvZy5pbmZvKFwiY3RybCtjIGRldGVjdGVkLi4uXCIpO1xuICAgIC8vICAgICBhd2FpdCBuZXcgUHJvbWlzZShkb25lID0+IHtcbiAgICAvLyAgICAgICAgIHJ1bnRpbWUuc2h1dGRvd24oKS50aGVuKGRvbmUpO1xuICAgIC8vICAgICAgICAgc2V0VGltZW91dChkb25lLCBTSFVURE9XTl9USU1FT1VUKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICAgIHByb2Nlc3MuZXhpdChURVJNSU5BVEVEX0JZX0NUUkxfQyk7XG4gICAgLy8gfSk7XG5cbiAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCAoKSA9PiB7XG4gICAgICAgIGxvZy5pbmZvKFwiZG9uZVwiKTtcbiAgICB9KTtcblxufSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgIGxvZy5lcnJvcihcInVuYWJsZSB0byBzdGFydCBzZXJ2ZXJcIiwgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdChDQU5OT1RfRVhFQ1VURSk7XG59KTtcblxuIl19