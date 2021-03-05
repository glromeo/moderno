module.exports = {
    "plugins": [
        ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
        ["@babel/plugin-proposal-class-properties"],
        ["@babel/plugin-syntax-dynamic-import"]
    ],
    "presets": [
        "@babel/preset-typescript"
    ],
    "env": {
        "test": {
            "presets": [['@babel/preset-env', {targets: {node: 'current'}}]]
        }
    },
    "ignore": [
        "**/components/showcase/pace.js",
    ]
};
