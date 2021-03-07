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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw2REFBa0M7QUFDbEMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QyxnQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsaUJBQWlCLENBQUM7S0FDN0IsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0tBQ3hCLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDZCxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsNEVBQTRFO0lBQ3pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsTUFBTSxFQUFFO0lBQ1osS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztJQUN2QixXQUFXLEVBQUUsb0VBQW9FO0lBQ2pGLElBQUksRUFBRSxRQUFRO0NBQ2pCLENBQUM7S0FDRCxNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDBCQUEwQjtJQUN2QyxJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRTtJQUNiLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxPQUFPO0lBQ3BCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxNQUFNLENBQUMsWUFBWSxFQUFFO0lBQ2xCLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsSUFBSSxFQUFFLFNBQVM7Q0FDbEIsQ0FBQztLQUNELElBQUksRUFBRTtLQUNOLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDO0tBQ2xCLElBQUksQ0FBQztBQUVWLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0FBRXRFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDO0FBQ2hDLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDO0FBQ2pDLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUUzQixvQkFBVyxDQUFDLHFCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7SUFFeEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMzQyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxFQUFFO1FBQ2xDLGdCQUFHLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2hELENBQUMsQ0FBQyxDQUFDO0lBRUgscUNBQXFDO0lBQ3JDLHNDQUFzQztJQUN0QyxrQ0FBa0M7SUFDbEMseUNBQXlDO0lBQ3pDLDhDQUE4QztJQUM5QyxVQUFVO0lBQ1YsMENBQTBDO0lBQzFDLE1BQU07SUFFTixPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFDcEIsZ0JBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckIsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDYixnQkFBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxyXG5pbXBvcnQgbG9nIGZyb20gXCJAbW9kZXJuby9sb2dnZXJcIjtcclxuaW1wb3J0IHlhcmdzIGZyb20gXCJ5YXJnc1wiO1xyXG5pbXBvcnQge2NvbmZpZ3VyZX0gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7c3RhcnRTZXJ2ZXJ9IGZyb20gXCIuL3NlcnZlclwiO1xyXG5cclxucmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgCpcclxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilIAqXHJcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5sb2cuaW5mbyhcInN0YXJ0aW5nIHNlcnZlci4uLlwiKTtcclxuXHJcbmNvbnN0IGFyZ3MgPSB5YXJnc1xyXG4gICAgLnNjcmlwdE5hbWUoXCJAbW9kZXJuby9zZXJ2ZXJcIilcclxuICAgIC51c2FnZShcIiQwIDxjbWQ+IFthcmdzXVwiKVxyXG4gICAgLm9wdGlvbihcImNvbmZpZ1wiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcImNcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU3BlY2lmeSBzZXJ2ZXIgY29uZmlnIGZpbGUgKHRoaXMgd2lsbCBvdmVycmlkZSBiYXNlIGNvbmZpZyBhcyBhcHByb3ByaWF0ZSlcIixcclxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcInJvb3RcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJyb290RGlyXCIsIFwiclwiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJyb290IGRpcmVjdG9yeSAoZGVmYXVsdHMgdG8gdGhlIHByb2Nlc3MgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeSlcIixcclxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcInBsdWdpblwiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcIm1cIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQWRkIHBsdWdpbiB0byB0aGUgc2VydmVyXCIsXHJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJkZWJ1Z1wiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcImRcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiZGVidWdcIixcclxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJwcm9kdWN0aW9uXCIsIHtcclxuICAgICAgICBhbGlhczogW1wicFwiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJwcm9kdWN0aW9uIG1vZGVcIixcclxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxyXG4gICAgfSlcclxuICAgIC5oZWxwKClcclxuICAgIC5hbGlhcyhcImhlbHBcIiwgXCJoXCIpXHJcbiAgICAuYXJndjtcclxuXHJcbnByb2Nlc3MuZW52Lk5PREVfRU5WID0gYXJncy5wcm9kdWN0aW9uID8gXCJwcm9kdWN0aW9uXCIgOiBcImRldmVsb3BtZW50XCI7XHJcblxyXG5jb25zdCBTSFVURE9XTl9USU1FT1VUID0gMTIwMDAwO1xyXG5jb25zdCBURVJNSU5BVEVEX0JZX0NUUkxfQyA9IDEzMDtcclxuY29uc3QgQ0FOTk9UX0VYRUNVVEUgPSAxMjY7XHJcblxyXG5zdGFydFNlcnZlcihjb25maWd1cmUoYXJncykpLnRoZW4ocnVudGltZSA9PiB7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcInVuaGFuZGxlZFJlamVjdGlvblwiLCAocmVhc29uLCBwKSA9PiB7XHJcbiAgICAgICAgbG9nLmVycm9yKFwiVW5oYW5kbGVkIFJlamVjdGlvbiBhdCBQcm9taXNlXCIsIHAsIHJlYXNvbik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZXJyID0+IHtcclxuICAgICAgICBsb2cuZXJyb3IoXCJVbmNhdWdodCBFeGNlcHRpb24gdGhyb3duXCIsIGVycik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBwcm9jZXNzLm9uKFwiU0lHSU5UXCIsIGFzeW5jICgpID0+IHtcclxuICAgIC8vICAgICBsb2cuaW5mbyhcImN0cmwrYyBkZXRlY3RlZC4uLlwiKTtcclxuICAgIC8vICAgICBhd2FpdCBuZXcgUHJvbWlzZShkb25lID0+IHtcclxuICAgIC8vICAgICAgICAgcnVudGltZS5zaHV0ZG93bigpLnRoZW4oZG9uZSk7XHJcbiAgICAvLyAgICAgICAgIHNldFRpbWVvdXQoZG9uZSwgU0hVVERPV05fVElNRU9VVCk7XHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyAgICAgcHJvY2Vzcy5leGl0KFRFUk1JTkFURURfQllfQ1RSTF9DKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJleGl0XCIsICgpID0+IHtcclxuICAgICAgICBsb2cuaW5mbyhcImRvbmVcIik7XHJcbiAgICB9KTtcclxuXHJcbn0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgIGxvZy5lcnJvcihcInVuYWJsZSB0byBzdGFydCBzZXJ2ZXJcIiwgZXJyb3IpO1xyXG4gICAgcHJvY2Vzcy5leGl0KENBTk5PVF9FWEVDVVRFKTtcclxufSk7XHJcblxyXG4iXX0=