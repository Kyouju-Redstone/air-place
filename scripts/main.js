import { loadPlacementState } from "./state.js";
import { onItemUse } from "./place.js";
import { onScriptEvent } from "./command.js";
import { world, system } from "@minecraft/server";

// 保存済みの有効/無効設定を読み込む
system.run(() => loadPlacementState());

// 空中設置(ブロック設置処理)を登録
world.afterEvents.itemUse.subscribe(onItemUse);

// コマンド(/scriptevent)を登録
system.afterEvents.scriptEventReceive.subscribe(onScriptEvent);
