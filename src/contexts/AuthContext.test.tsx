import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

const mocks = vi.hoisted(() => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  queryArgs: [] as unknown[],
  user: { _id: "u1", name: "Test", email: "t@example.com" },
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

const STORAGE_KEY = "kovan_session_token";

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
    localStorage.clear();
    vi.clearAllMocks();
    mocks.queryArgs.length = 0;
  });

  it("restores the persisted session token on mount (page reload)", () => {
    localStorage.setItem(STORAGE_KEY, "saved-token");
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId("token")).toHaveTextContent("saved-token");
    expect(mocks.queryArgs).toContainEqual({ sessionToken: "saved-token" });
  });

  it("persists the session token to storage on login", async () => {
    mocks.loginUser.mockResolvedValue({ sessionToken: "fresh-token" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBe("fresh-token"));
    expect(screen.getByTestId("token")).toHaveTextContent("fresh-token");
  });

  it("clears the persisted token on logout", async () => {
    localStorage.setItem(STORAGE_KEY, "saved-token");
    mocks.logoutUser.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBeNull());
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(mocks.logoutUser).toHaveBeenCalledWith({ sessionToken: "saved-token" });
  });
});
