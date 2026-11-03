import { world, system } from "@minecraft/server";
import { loadPlacementState } from "./state.js";
import { onItemUse, onPlayerBreakBlock, onEntityHitBlock } from "./place.js";
import { onScriptEvent } from "./command.js";
import { checkConfig } from "./util.js";

// 設定値に抜けがないか確認する
checkConfig();

// 保存済みの有効/無効設定を読み込む
system.run(() => loadPlacementState());

// 空中設置処理を登録
world.afterEvents.itemUse.subscribe(onItemUse);

// ブロック破壊イベント(空中設置直後のブロックの保護)を登録
world.beforeEvents.playerBreakBlock.subscribe(onPlayerBreakBlock);

// ブロックを叩いたイベント(スマホで、ブロックを狙った長押しの判別)を登録
world.afterEvents.entityHitBlock.subscribe(onEntityHitBlock);

// コマンド(/scriptevent)を登録
system.afterEvents.scriptEventReceive.subscribe(onScriptEvent);
