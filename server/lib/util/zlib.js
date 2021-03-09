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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3psaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLGdFQUFvQztBQUd2QixRQUFBLE9BQU8sR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBc0IsRUFBQyxFQUFFO0lBRXRELFNBQVMsaUJBQWlCLENBQUMsUUFBMEU7UUFDakcsSUFBSSxRQUFRLEtBQUssU0FBUztZQUFFLE9BQU8sSUFBSSxtQkFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pELElBQUksUUFBUSxLQUFLLE1BQU07WUFBRSxPQUFPLElBQUksbUJBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNoRCxJQUFJLFFBQVEsS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLG1CQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxRQUFRLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7UUFDM0UsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsSUFBSTtZQUNBLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwQztnQkFBUztZQUNOLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNwQjtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUE7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB6bGliIGZyb20gXCJmYXN0LXpsaWJcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XG5cbmV4cG9ydCBjb25zdCB1c2VabGliID0gbWVtb2l6ZWQoKG9wdGlvbnM6TW9kZXJub09wdGlvbnMpPT57XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb21wcmVzc2lvbihlbmNvZGluZzogXCJnemlwXCIgfCBcImJyb3RsaVwiIHwgXCJiclwiIHwgXCJkZWZsYXRlXCIgfCBcImRlZmxhdGUtcmF3XCIgfCB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGVuY29kaW5nID09PSBcImRlZmxhdGVcIikgcmV0dXJuIG5ldyB6bGliLkRlZmxhdGUoKTtcbiAgICAgICAgZWxzZSBpZiAoZW5jb2RpbmcgPT09IFwiZ3ppcFwiKSByZXR1cm4gbmV3IHpsaWIuR3ppcCgpO1xuICAgICAgICBlbHNlIGlmIChlbmNvZGluZyA9PT0gXCJiclwiKSByZXR1cm4gbmV3IHpsaWIuQnJvdGxpQ29tcHJlc3MoKTtcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoYGVuY29kaW5nICcke2VuY29kaW5nfScgbm90IHN1cHBvcnRlZC5gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseUNvbXByZXNzaW9uKGNvbnRlbnQ6IHN0cmluZyB8IEJ1ZmZlciwgZW5jb2RpbmcgPSBvcHRpb25zLmVuY29kaW5nKSB7XG4gICAgICAgIGxldCBjb21wcmVzcyA9IGNyZWF0ZUNvbXByZXNzaW9uKGVuY29kaW5nKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBjb21wcmVzcy5wcm9jZXNzKGNvbnRlbnQpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgY29tcHJlc3MuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFwcGx5Q29tcHJlc3Npb25cbiAgICB9XG59KTsiXX0=