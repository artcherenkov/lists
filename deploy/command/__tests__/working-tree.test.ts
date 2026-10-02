import { describe, expect, it } from "vitest";

import { workingTreeWarning } from "../working-tree.ts";

describe("предупреждение о рабочем дереве", () => {
  it("чистое дерево – без предупреждения", () => {
    expect(workingTreeWarning("")).toBeNull();
  });

  it("незакоммиченная правка – предупреждает, что в релиз она не попадёт", () => {
    expect(workingTreeWarning(" M apps/watchlist/src/App.tsx\nM  README.md\n")).toBe(
      "В рабочем дереве: незакоммиченных изменений – 2. В релиз они не попадут: собирается коммит.",
    );
  });

  it("неотслеживаемый файл – предупреждает отдельно", () => {
    expect(workingTreeWarning("?? apps/watchlist/public/draft.png\n")).toBe(
      "В рабочем дереве: неотслеживаемых файлов – 1. В релиз они не попадут: собирается коммит.",
    );
  });

  it("и правки, и неотслеживаемые файлы – оба счётчика", () => {
    expect(workingTreeWarning(" M a.ts\n?? b.ts\n?? c.ts\n")).toBe(
      "В рабочем дереве: незакоммиченных изменений – 1, неотслеживаемых файлов – 2. В релиз они не попадут: собирается коммит.",
    );
  });
});
