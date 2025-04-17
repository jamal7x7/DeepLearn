import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuickCreateTeamForm } from "../components/quick-create/quick-create-team-form";

// Mock next/navigation and sonner toast
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

describe("QuickCreateTeamForm", () => {
  it("renders form fields", () => {
    render(<QuickCreateTeamForm />);
    expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create team/i })).toBeInTheDocument();
  });

  it("shows validation error for short team name", async () => {
    render(<QuickCreateTeamForm />);
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: /create team/i }));
    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it("submits valid data and calls onSuccess", async () => {
    const onSuccess = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    render(<QuickCreateTeamForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Math Club" } });
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: "club" } });
    fireEvent.click(screen.getByRole("button", { name: /create team/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("shows error toast on API error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to create team" })
    });
    render(<QuickCreateTeamForm />);
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Science Club" } });
    fireEvent.click(screen.getByRole("button", { name: /create team/i }));
    await waitFor(() => {
      // @ts-ignore
      expect(require("sonner").toast.error).toHaveBeenCalledWith("Failed to create team");
    });
  });

  it("shows error toast on unexpected error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<QuickCreateTeamForm />);
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Other Club" } });
    fireEvent.click(screen.getByRole("button", { name: /create team/i }));
    await waitFor(() => {
      // @ts-ignore
      expect(require("sonner").toast.error).toHaveBeenCalledWith("Unexpected error creating team");
    });
  });
});
