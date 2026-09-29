import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

const mocks = vi.hoisted(() => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  queryArgs: [] as unknown[],
  user: { _id: "u1", name: "Test", email: "t@example.com" },
  fetch: vi.fn(),
}));

vi.mock("convex/react", () => {
  const order = [mocks.loginUser, mocks.registerUser, mocks.logoutUser];
  let i = 0;
  return {
    useMutation: () => order[i++ % order.length],
    useQuery: (_ref: unknown, args: unknown) => {
      mocks.queryArgs.push(args);
      return args === "skip" ? undefined : mocks.user;
    },
  };
});

vi.stubGlobal("fetch", mocks.fetch);

const SESSION_URL = "https://test.convex.site/auth/session";

function sessionCalls(method: string) {
  return mocks.fetch.mock.calls.filter(
    ([, init]) => (init as RequestInit | undefined)?.method === method
  );
}

function Probe() {
  const { sessionToken, login, logout } = useAuth();
  return (
    <>
      <div data-testid="token">{sessionToken ?? "none"}</div>
      <button onClick={() => void login("a@b.c", "pw")}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </>
  );
}

describe("AuthProvider session persistence", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CONVEX_URL", "https://test.convex.cloud");
    vi.clearAllMocks();
    mocks.queryArgs.length = 0;
    mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("restores the persisted session via the HttpOnly cookie on mount", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ sessionToken: "saved-token" }),
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("saved-token")
    );
    expect(mocks.fetch).toHaveBeenCalledWith(SESSION_URL, {
      credentials: "include",
    });
    expect(mocks.queryArgs).toContainEqual({ sessionToken: "saved-token" });
  });

  it("stays logged out when there is no persisted session", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() =>
      expect(mocks.fetch).toHaveBeenCalledWith(SESSION_URL, {
        credentials: "include",
      })
    );
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });

  it("persists the session cookie on login", async () => {
    mocks.loginUser.mockResolvedValue({ sessionToken: "fresh-token" });
    mocks.fetch.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("fresh-token")
    );
    const [persist] = sessionCalls("POST");
    expect(persist[0]).toBe(SESSION_URL);
    expect((persist[1] as RequestInit).credentials).toBe("include");
    expect(JSON.parse((persist[1] as RequestInit).body as string)).toEqual({
      sessionToken: "fresh-token",
    });
  });

  it("clears the persisted session on logout", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ sessionToken: "saved-token" }),
    });
    mocks.logoutUser.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("saved-token")
    );
    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("none")
    );
    expect(sessionCalls("DELETE")).toHaveLength(1);
    expect(mocks.logoutUser).toHaveBeenCalledWith({ sessionToken: "saved-token" });
  });
});
