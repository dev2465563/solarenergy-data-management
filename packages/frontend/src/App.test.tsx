import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.js";

vi.mock("./hooks/useHasData.js", () => ({
  useHasData: () => ({ data: true, isLoading: false }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("App", () => {
  it("renders dashboard with title when has data", () => {
    render(<App />, { wrapper: Wrapper });
    expect(screen.getByText("Solar Energy Data")).toBeInTheDocument();
  });
});
