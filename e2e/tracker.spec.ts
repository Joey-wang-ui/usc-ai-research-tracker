import { expect, test } from "@playwright/test";
test("complete personal research workflow survives refresh and restores a full backup", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "每一步探索，都离目标更近。" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "研究机会 Opportunities" }).click();
  await expect(
    page.getByRole("heading", { name: "研究机会", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("21 个机会", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "添加机会", exact: true }).click();
  const form = page.getByRole("dialog");
  await form.getByLabel("Opportunity Name *").fill("E2E Agent Research");
  await form.getByLabel("Organization / Lab *").fill("Test Research Lab");
  await form.getByLabel("研究方向").fill("AI Agent, RAG");
  await form.getByLabel("Contact Email").fill("test@example.com");
  await form.getByLabel("个人目标日期", { exact: true }).fill("2027-01-15");
  await form
    .getByLabel("Source / Official URL")
    .fill("https://example.com/research");
  await form.getByRole("button", { name: "保存机会" }).click();
  await expect(form).not.toBeVisible();
  await page.getByLabel("搜索机会、导师、关键词…").fill("E2E Agent");
  await page
    .getByRole("link", { name: "E2E Agent Research", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "E2E Agent Research", exact: true }),
  ).toBeVisible();
  await page.getByLabel("申请阶段 E2E Agent Research").selectOption("Applied");
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.getByLabel("完成 Prepare CV", { exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "完成 Prepare CV", exact: true }),
  ).toBeChecked();
  await page.getByLabel("个人笔记").fill("Persistent research notes");
  await page.getByRole("heading", { name: "基本信息", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.getByRole("button", { name: "记录沟通" }).click();
  await page.getByLabel("沟通摘要 *").fill("Asked about research fit");
  await page.getByLabel("对方回复", { exact: true }).fill("Please send a CV");
  await page.getByRole("button", { name: "保存记录" }).click();
  await expect(
    page.getByText("Asked about research fit", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "添加关联任务" }).click();
  await page.getByLabel("任务名称 *").fill("Prepare agent demo");
  await page.getByLabel("日期 *", { exact: true }).fill("2027-01-10");
  await page.getByRole("button", { name: "保存任务" }).click();
  await page.getByRole("checkbox", { name: "Prepare agent demo" }).click();
  await expect(page.getByRole("checkbox", { name: "Prepare agent demo" })).toBeChecked();
  await page.reload();
  await expect(page.getByLabel("个人笔记")).toHaveValue(
    "Persistent research notes",
  );
  await expect(page.getByLabel("申请阶段 E2E Agent Research")).toHaveValue(
    "Applied",
  );
  await expect(
    page.getByRole("checkbox", { name: "完成 Prepare CV", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Prepare agent demo" }),
  ).toBeChecked();
  await expect(
    page.getByText("Asked about research fit", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "编辑机会", exact: true }).click();
  await page
    .getByLabel("Opportunity Name *")
    .fill("E2E Agent Research Updated");
  await page.getByRole("button", { name: "保存机会" }).click();
  await expect(
    page.getByRole("heading", { name: "E2E Agent Research Updated" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "设置与数据", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON", exact: true }).click();
  const backup = await download;
  const path = await backup.path();
  expect(path).toBeTruthy();
  await page.getByLabel("导入 JSON 文件").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"bad":true}'),
  });
  await expect(page.getByRole("alert")).toContainText("未导入");
  await page.getByLabel("导入 JSON 文件").setInputFiles(path!);
  await expect(page.getByRole("dialog")).toContainText("22 个机会");
  await page.getByRole("button", { name: "确认替换并恢复" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/#/opportunities");
  await page.getByLabel("搜索机会、导师、关键词…").fill("E2E Agent");
  page.once("dialog", (d) => void d.accept());
  await page
    .getByRole("button", {
      name: "删除 E2E Agent Research Updated",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "没有匹配的研究机会" }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("搜索机会、导师、关键词…").fill("E2E Agent");
  await expect(
    page.getByRole("heading", { name: "没有匹配的研究机会" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("CRM links one professor to multiple opportunities and creates editable email drafts", async ({
  page,
}) => {
  await page.goto("/#/crm");
  await expect(
    page.getByRole("heading", { name: "研究人脉", exact: true }),
  ).toBeVisible();
  const card = page.locator(".contact-card").filter({
    has: page.getByRole("heading", {
      name: "Professor Penkova",
      exact: true,
    }),
  });
  await expect(card.locator(".linked-opportunities a")).toHaveCount(2);
  await card.getByRole("button", { name: "邮件草稿" }).click();
  await expect(page.getByRole("dialog")).toContainText("不发送邮件");
  await page
    .getByRole("button", { name: "Follow-up Email", exact: true })
    .click();
  await expect(page.getByLabel("英文邮件模板")).toContainText("following up");
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "添加联系人", exact: true }).click();
  await page.getByLabel("姓名 *").fill("Test Professor");
  await page.getByLabel("所属实验室", { exact: true }).fill("AI Lab");
  await page.getByLabel("邮箱", { exact: true }).fill("prof@example.com");
  await page.getByRole("button", { name: "保存联系人" }).click();
  await expect(
    page.getByRole("heading", { name: "Test Professor", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Test Professor", exact: true }),
  ).toBeVisible();
});
test("mobile navigation, theme and month/task views work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "打开导航" }).click();
  await page.getByRole("link", { name: "计划与任务 Timeline & Tasks" }).click();
  await expect(
    page.getByRole("heading", { name: "计划与任务", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "添加任务", exact: true }).click();
  await page.getByLabel("任务名称 *").fill("Mobile preparation");
  await page.getByLabel("日期 *", { exact: true }).fill("2027-01-20");
  await page.getByRole("button", { name: "保存任务" }).click();
  await page.getByRole("button", { name: "待办列表视图" }).click();
  await expect(
    page.getByText("Mobile preparation", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "完成任务 Mobile preparation", exact: true })
    .click();
  await expect(
    page.getByText("Mobile preparation", { exact: true }),
  ).not.toBeVisible();
  await page.getByLabel("任务完成筛选").selectOption("done");
  await expect(
    page.getByText("Mobile preparation", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const width = await page.evaluate(() => ({
    body: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(width.body).toBeLessThanOrEqual(width.viewport);
});

test("kanban menu updates dashboard and archived records stay searchable", async ({
  page,
}) => {
  await page.goto("/#/pipeline");
  await expect(
    page.getByRole("heading", { name: "申请看板", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("申请阶段 AI-Powered Agent for Engineering Education")
    .selectOption("Applied");
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.getByRole("link", { name: "总览 Overview" }).click();
  await expect(page.locator(".stat-2 > strong")).toHaveText("01");
  await page.goto("/#/opportunities");
  await expect(
    page.getByRole("heading", { name: "研究机会", exact: true }),
  ).toBeVisible();
  await page.getByLabel("搜索机会、导师、关键词…").fill("AI-Powered Agent");
  await page
    .getByRole("button", {
      name: "归档 AI-Powered Agent for Engineering Education",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "没有匹配的研究机会" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "已归档 1" }).click();
  await expect(
    page.getByRole("link", {
      name: "AI-Powered Agent for Engineering Education",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "已归档 1" }).click();
  await expect(
    page.getByRole("link", {
      name: "AI-Powered Agent for Engineering Education",
      exact: true,
    }),
  ).toBeVisible();
});
test("a second tab cannot overwrite the first tab snapshot", async ({
  page,
  context,
}) => {
  await page.goto("/#/settings");
  await expect(
    page.getByRole("heading", { name: "设置与数据", exact: true }),
  ).toBeVisible();
  const second = await context.newPage();
  await second.goto("/#/settings");
  await expect(second.getByRole("alert")).toContainText("只读");
  await second
    .getByRole("button", { name: "Light Mode", exact: false })
    .click();
  await expect(second.getByRole("status")).toContainText("关闭其他标签页");
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark");
  await second.close();
});
