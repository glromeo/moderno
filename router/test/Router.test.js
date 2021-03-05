"use strict";

const Router = require("../index");

const assert = require("assert").strict;
const createRouter = require("./helpers/createRouter");

describe("Router", () => {

    describe(".register()", () => {

        it("throws if the path is not a string", () => {
            const router = new Router();

            assert.throws(() => router.register(), new TypeError("path must be a string"));
            assert.throws(() => router.register(null), new TypeError("path must be a string"));
            assert.throws(() => router.register(true), new TypeError("path must be a string"));
            assert.throws(() => router.register({}), new TypeError("path must be a string"));
            assert.throws(() => router.register(1), new TypeError("path must be a string"));
        });

        it("throws if the path does not beging with a \"/\"", () => {
            const router = new Router();

            assert.throws(() => router.register(""), /path must be absolute/);
            assert.throws(() => router.register("hello"), /path must be absolute/);
            assert.throws(() => router.register("C:/"), /path must be absolute/);
        });

        it("returns the store created by the storeFactory (default storeFactory)", () => {
            const router = new Router();

            const rootStore = router.register("/");
            assert.deepEqual(rootStore, Object.create(null));
            assert.equal(router.register("/"), rootStore);

            const userStore = router.register("/user/:id");
            assert.deepEqual(userStore, Object.create(null));
            assert.equal(router.register("/user/:id"), userStore);

            const staticStore = router.register("/static/*");
            assert.deepEqual(staticStore, Object.create(null));
            assert.equal(router.register("/static/*"), staticStore);

            assert.notEqual(rootStore, userStore);
            assert.notEqual(userStore, staticStore);
        });

        it("returns the store created by the storeFactory (custom storeFactory)", () => {
            const router = new Router();

            router.createStore = () => Symbol("route");

            const rootStore = router.register("/");
            assert.equal(typeof rootStore, "symbol");
            assert.equal(router.register("/"), rootStore);

            const userStore = router.register("/user/:id");
            assert.equal(typeof userStore, "symbol");
            assert.equal(router.register("/user/:id"), userStore);

            const staticStore = router.register("/static/*");
            assert.equal(typeof staticStore, "symbol");
            assert.equal(router.register("/static/*"), staticStore);

            assert.notEqual(rootStore, userStore);
            assert.notEqual(userStore, staticStore);
        });

    });


    describe(".find()", () => {

        it("returns `null` if the route is not found", () => {
            const router = createRouter([
                "/",
                "/hello/world",
                "/user/:id",
                "/events/:type/subtypes",
                "/static/*"
            ]);

            assert.equal(router.find(""), null);
            assert.equal(router.find("hello/world"), null);
            assert.equal(router.find("/user/"), null);
            assert.equal(router.find("/user/?foo"), null);
            assert.equal(router.find("/events/change"), null);
            assert.equal(router.find("/events/change/"), null);
            assert.equal(router.find("/events/change/sub"), null);
        });

    });


    describe(".debugTree()", () => {

        it("returns a representation of the radix tree as a string", () => {
            const router = createRouter([
                "/",
                "/hello/world",
                "/user/:id",
                "/user/all",
                "/user/all/:or",
                "/user/all/nothing",
                "/user/*",
                "/events/:type/subtypes",
                "/static/*",
                "/posts/:id",
                "/posts/:id/comments",
                "/r/:roomID",
                "/api/:version/status",
                "/api/*"
            ]);
            const str = router.debugTree();
            console.log(str);
            assert.equal(typeof str, "string");
            assert.equal(str[0], "/");
        });

    });

});
