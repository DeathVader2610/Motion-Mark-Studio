import { test } from "node:test";
import assert from "node:assert/strict";
import { bridgeAuthorized, bridgeMutation } from "../lib/studio-bridge";
test("studio bridge denies missing, short and incorrect keys",()=>{
  const key="a".repeat(64);
  assert.equal(bridgeAuthorized(null,key),false);
  assert.equal(bridgeAuthorized("Bearer short","short"),false);
  assert.equal(bridgeAuthorized(`Bearer ${"b".repeat(64)}`,key),false);
  assert.equal(bridgeAuthorized(`Bearer ${key}`,key),true);
});
test("studio bridge requires concurrency versions and rejects unsupported mutations",()=>{
  assert.equal(bridgeMutation.safeParse({action:"user.promote",role:"owner"}).success,false);
  assert.equal(bridgeMutation.safeParse({action:"enquiry.status",id:"10000000-0000-4000-8000-000000000001",status:"closed"}).success,false);
});
