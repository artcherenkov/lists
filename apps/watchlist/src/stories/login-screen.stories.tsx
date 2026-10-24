import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { type LoginBot, LoginScreen } from "../screens/login-screen.tsx";
import { CODE_LENGTH, type CodeEntry, pastedCode, typedCode } from "../session/code-input.ts";

const BOT: LoginBot = { name: "@lists_v2_bot", link: "https://t.me/lists_v2_bot?start=login" };

interface DemoArgs {
  bot: LoginBot;
  code: string;
  checking: boolean;
  problem?: string;
  onUpdate?: () => void;
}

/** Поле кода работает: можно набрать и вставить код, проверка не идёт. */
function LoginScreenDemo({ bot, code: initialCode, checking, problem, onUpdate }: DemoArgs) {
  const [code, setCode] = useState(initialCode);
  const enter = (entry: CodeEntry | undefined) => {
    if (entry !== undefined) setCode(entry.code);
    return entry !== undefined;
  };
  return (
    <LoginScreen
      bot={bot}
      code={code}
      codeLength={CODE_LENGTH}
      checking={checking}
      problem={problem}
      onCodeChange={(value) => void enter(typedCode(value, code))}
      onCodePaste={(text) => enter(pastedCode(text))}
      onSubmit={() => {}}
      onUpdate={onUpdate}
    />
  );
}

const meta = {
  title: "Компоненты/LoginScreen",
  render: (args) => <LoginScreenDemo {...args} />,
  args: { bot: BOT, code: "", checking: false },
  argTypes: { bot: { control: false }, onUpdate: { control: false } },
} satisfies Meta<DemoArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BotLoading: Story = {
  args: { bot: "loading" },
};

export const NoConnection: Story = {
  args: { bot: "unavailable" },
};

export const Checking: Story = {
  args: { code: "12345678", checking: true },
};

export const WrongCode: Story = {
  args: { problem: "Код неверный или устарел. Наберите его снова или получите новый у бота." },
};

export const TooOften: Story = {
  args: { code: "12345679", problem: "Слишком много попыток. Попробуйте через 42 мин." },
};

export const WithNewVersion: Story = {
  args: { onUpdate: () => {} },
};
