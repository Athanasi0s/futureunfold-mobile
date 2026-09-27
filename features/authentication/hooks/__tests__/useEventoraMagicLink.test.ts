import { extractEventoraToken } from "../useEventoraMagicLink";

describe("extractEventoraToken", () => {
  it("extracts a token from the Future Unfold custom scheme", () => {
    expect(
      extractEventoraToken("futureunfold://auth/eventora?token=signed-token"),
    ).toBe("signed-token");
  });

  it("extracts a token from a verified HTTPS app link", () => {
    expect(
      extractEventoraToken("https://example.org/auth/eventora?token=signed-token"),
    ).toBe("signed-token");
  });

  it("rejects unrelated links and missing tokens", () => {
    expect(extractEventoraToken("futureunfold://user/42?token=nope")).toBeNull();
    expect(extractEventoraToken("futureunfold://auth/eventora")).toBeNull();
  });
});
