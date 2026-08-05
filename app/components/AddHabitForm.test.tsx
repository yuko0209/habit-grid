import AddHabitForm from "./AddHabitForm";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("AddHabitForm", () => {
  it("submits the entered name with the suggested color", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddHabitForm onAdd={onAdd} suggestedColor="blue" />);

    await user.type(screen.getByPlaceholderText(/新しい習慣/), "  朝ラン  ");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).toHaveBeenCalledWith("  朝ラン  ", "blue");
  });

  it("submits the color the user picked instead of the suggestion", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddHabitForm onAdd={onAdd} suggestedColor="blue" />);

    await user.type(screen.getByPlaceholderText(/新しい習慣/), "瞑想");
    await user.click(screen.getByRole("button", { name: "パープル" }));
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).toHaveBeenCalledWith("瞑想", "purple");
  });

  it("disables submit until a name is entered, and clears it afterwards", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddHabitForm onAdd={onAdd} suggestedColor="green" />);

    const input = screen.getByPlaceholderText(/新しい習慣/);
    const submit = screen.getByRole("button", { name: "追加" });
    expect(submit).toBeDisabled();

    await user.type(input, "水を飲む");
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(input).toHaveValue("");
  });
});
