describe("sample test", function () {

    it("expect dom to match snapshot", function () {
        expect(document.body.innerHTML).toMatch("<anything></anything>");
    });
});