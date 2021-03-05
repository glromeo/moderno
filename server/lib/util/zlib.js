"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZlib = void 0;
const fast_zlib_1 = __importDefault(require("fast-zlib"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
exports.useZlib = nano_memoize_1.default((options) => {
    function createCompression(encoding) {
        if (encoding === "deflate")
            return new fast_zlib_1.default.Deflate();
        else if (encoding === "gzip")
            return new fast_zlib_1.default.Gzip();
        else if (encoding === "br")
            return new fast_zlib_1.default.BrotliCompress();
        else
            throw new Error(`encoding '${encoding}' not supported.`);
    }
    function applyCompression(content, encoding = options.encoding) {
        let compress = createCompression(encoding);
        try {
            return compress.process(content);
        }
        finally {
            compress.close();
        }
    }
    return {
        applyCompression
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3psaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLGdFQUFvQztBQUd2QixRQUFBLE9BQU8sR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBc0IsRUFBQyxFQUFFO0lBRXRELFNBQVMsaUJBQWlCLENBQUMsUUFBMEU7UUFDakcsSUFBSSxRQUFRLEtBQUssU0FBUztZQUFFLE9BQU8sSUFBSSxtQkFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pELElBQUksUUFBUSxLQUFLLE1BQU07WUFBRSxPQUFPLElBQUksbUJBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNoRCxJQUFJLFFBQVEsS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLG1CQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxRQUFRLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7UUFDM0UsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsSUFBSTtZQUNBLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwQztnQkFBUztZQUNOLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNwQjtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUE7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB6bGliIGZyb20gXCJmYXN0LXpsaWJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHtNb2Rlcm5vT3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVpsaWIgPSBtZW1vaXplZCgob3B0aW9uczpNb2Rlcm5vT3B0aW9ucyk9PntcclxuXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVDb21wcmVzc2lvbihlbmNvZGluZzogXCJnemlwXCIgfCBcImJyb3RsaVwiIHwgXCJiclwiIHwgXCJkZWZsYXRlXCIgfCBcImRlZmxhdGUtcmF3XCIgfCB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoZW5jb2RpbmcgPT09IFwiZGVmbGF0ZVwiKSByZXR1cm4gbmV3IHpsaWIuRGVmbGF0ZSgpO1xyXG4gICAgICAgIGVsc2UgaWYgKGVuY29kaW5nID09PSBcImd6aXBcIikgcmV0dXJuIG5ldyB6bGliLkd6aXAoKTtcclxuICAgICAgICBlbHNlIGlmIChlbmNvZGluZyA9PT0gXCJiclwiKSByZXR1cm4gbmV3IHpsaWIuQnJvdGxpQ29tcHJlc3MoKTtcclxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihgZW5jb2RpbmcgJyR7ZW5jb2Rpbmd9JyBub3Qgc3VwcG9ydGVkLmApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGx5Q29tcHJlc3Npb24oY29udGVudDogc3RyaW5nIHwgQnVmZmVyLCBlbmNvZGluZyA9IG9wdGlvbnMuZW5jb2RpbmcpIHtcclxuICAgICAgICBsZXQgY29tcHJlc3MgPSBjcmVhdGVDb21wcmVzc2lvbihlbmNvZGluZyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXByZXNzLnByb2Nlc3MoY29udGVudCk7XHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgY29tcHJlc3MuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBhcHBseUNvbXByZXNzaW9uXHJcbiAgICB9XHJcbn0pOyJdfQ==