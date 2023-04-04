import _ from "lodash";
import path from "path";
import shell from "shelljs";
import koa from "koa";
import koaStatic from "koa-static";

import { PluginError, sleep } from "./helpers";
import "./type-extensions";

export async function launchBrowserSigner(unsignedTx: any): Promise<string> {
  const wwwDir = path.resolve(__dirname, "../fixtures/extsigner");

  const app = new koa();
  app.use(koaStatic(wwwDir));

  app.listen(3000);

  console.log("Started temporary webserver at http://localhost:3000");

  await sleep(1000000);
  return "";
}
