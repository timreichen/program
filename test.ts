Deno.test("example", async () => {
  let p = Deno.run({ cmd: ["deno", "run", "example.ts"] });
  const status = await p.status();
  p.close();
});
