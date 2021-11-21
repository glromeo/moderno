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
    process.on("SIGTERM", async () => {
        logger_1.default.info("terminating...");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw2REFBa0M7QUFDbEMsa0RBQTBCO0FBQzFCLDJDQUE0QztBQUM1QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QyxnQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsaUJBQWlCLENBQUM7S0FDN0IsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0tBQ3hCLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDZCxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsNEVBQTRFO0lBQ3pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsTUFBTSxFQUFFO0lBQ1osS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztJQUN2QixXQUFXLEVBQUUsb0VBQW9FO0lBQ2pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDBCQUEwQjtJQUN2QyxJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRTtJQUNiLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxPQUFPO0lBQ3BCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxJQUFJLEVBQUU7S0FDTixLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztLQUNsQixJQUFZLENBQUM7QUFFbEIsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUM7QUFDaEMsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUM7QUFDakMsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDO0FBRTNCLG9CQUFXLENBQUMscUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtJQUV4QyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNDLGdCQUFHLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLEVBQUU7UUFDbEMsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1QixnQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDckIsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixVQUFVLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM3QixnQkFBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDckIsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixVQUFVLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFDcEIsZ0JBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckIsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDYixnQkFBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxyXG5pbXBvcnQgbG9nIGZyb20gXCJAbW9kZXJuby9sb2dnZXJcIjtcclxuaW1wb3J0IHlhcmdzIGZyb20gXCJ5YXJnc1wiO1xyXG5pbXBvcnQge0FyZ3MsIGNvbmZpZ3VyZX0gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7c3RhcnRTZXJ2ZXJ9IGZyb20gXCIuL3NlcnZlclwiO1xyXG5cclxucmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgCpcclxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilIAqXHJcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5sb2cuaW5mbyhcInN0YXJ0aW5nIHNlcnZlci4uLlwiKTtcclxuXHJcbmNvbnN0IGFyZ3MgPSB5YXJnc1xyXG4gICAgLnNjcmlwdE5hbWUoXCJAbW9kZXJuby9zZXJ2ZXJcIilcclxuICAgIC51c2FnZShcIiQwIDxjbWQ+IFthcmdzXVwiKVxyXG4gICAgLm9wdGlvbihcImNvbmZpZ1wiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcImNcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU3BlY2lmeSBzZXJ2ZXIgY29uZmlnIGZpbGUgKHRoaXMgd2lsbCBvdmVycmlkZSBiYXNlIGNvbmZpZyBhcyBhcHByb3ByaWF0ZSlcIixcclxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcInJvb3RcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJyb290RGlyXCIsIFwiclwiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJyb290IGRpcmVjdG9yeSAoZGVmYXVsdHMgdG8gdGhlIHByb2Nlc3MgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeSlcIixcclxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcInBsdWdpblwiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcIm1cIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQWRkIHBsdWdpbiB0byB0aGUgc2VydmVyXCIsXHJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJkZWJ1Z1wiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcImRcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiZGVidWdcIixcclxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxyXG4gICAgfSlcclxuICAgIC5oZWxwKClcclxuICAgIC5hbGlhcyhcImhlbHBcIiwgXCJoXCIpXHJcbiAgICAuYXJndiBhcyBBcmdzO1xyXG5cclxuY29uc3QgU0hVVERPV05fVElNRU9VVCA9IDEyMDAwMDtcclxuY29uc3QgVEVSTUlOQVRFRF9CWV9DVFJMX0MgPSAxMzA7XHJcbmNvbnN0IENBTk5PVF9FWEVDVVRFID0gMTI2O1xyXG5cclxuc3RhcnRTZXJ2ZXIoY29uZmlndXJlKGFyZ3MpKS50aGVuKHJ1bnRpbWUgPT4ge1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgKHJlYXNvbiwgcCkgPT4ge1xyXG4gICAgICAgIGxvZy5lcnJvcihcIlVuaGFuZGxlZCBSZWplY3Rpb24gYXQgUHJvbWlzZVwiLCBwLCByZWFzb24pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGVyciA9PiB7XHJcbiAgICAgICAgbG9nLmVycm9yKFwiVW5jYXVnaHQgRXhjZXB0aW9uIHRocm93blwiLCBlcnIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcIlNJR0lOVFwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgbG9nLmluZm8oXCJjdHJsK2MgZGV0ZWN0ZWQuLi5cIik7XHJcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoZG9uZSA9PiB7XHJcbiAgICAgICAgICAgIHJ1bnRpbWUuc2h1dGRvd24oKS50aGVuKGRvbmUpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGRvbmUsIFNIVVRET1dOX1RJTUVPVVQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb2Nlc3MuZXhpdChURVJNSU5BVEVEX0JZX0NUUkxfQyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwcm9jZXNzLm9uKFwiU0lHVEVSTVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgbG9nLmluZm8oXCJ0ZXJtaW5hdGluZy4uLlwiKTtcclxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShkb25lID0+IHtcclxuICAgICAgICAgICAgcnVudGltZS5zaHV0ZG93bigpLnRoZW4oZG9uZSk7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZG9uZSwgU0hVVERPV05fVElNRU9VVCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KFRFUk1JTkFURURfQllfQ1RSTF9DKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJleGl0XCIsICgpID0+IHtcclxuICAgICAgICBsb2cuaW5mbyhcImRvbmVcIik7XHJcbiAgICB9KTtcclxuXHJcbn0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgIGxvZy5lcnJvcihcInVuYWJsZSB0byBzdGFydCBzZXJ2ZXJcIiwgZXJyb3IpO1xyXG4gICAgcHJvY2Vzcy5leGl0KENBTk5PVF9FWEVDVVRFKTtcclxufSk7XHJcblxyXG4iXX0=