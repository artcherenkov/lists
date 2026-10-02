import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProfileSheet } from "../screens/profile-sheet.tsx";
import { Reopenable } from "./reopenable.tsx";

const meta = {
  title: "Компоненты/ProfileSheet",
  render: ({ version }) => (
    <Reopenable>{(onClosed) => <ProfileSheet version={version} onClosed={onClosed} />}</Reopenable>
  ),
  args: { version: "2026-10-02 · d5c28ef" },
} satisfies Meta<{ version: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithChanges: Story = {
  args: { version: "2026-10-02 · d5c28ef · с правками" },
};
