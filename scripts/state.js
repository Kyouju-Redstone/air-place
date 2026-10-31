// 状態管理: 空中設置の有効/無効(コマンドで切り替え、ワールドに保存される)
import { world } from "@minecraft/server";
import { config } from "./config.js";

// 有効/無効をワールドに保存する際のキー
const PROPERTY_ENABLED = `${config.commandNamespace}:enabled`;

// 空中設置の有効無効値(初期値: config.jsのenabledDefault)
let placementState = config.enabledPlacementDefault;

// 空中設置の有効無効値返却関数
export function isEnabledPlacement() {
    return placementState;
}

// 有効/無効を切り替えて、ワールドに保存する
export function savePlacementState(value) {
    placementState = value;
    world.setDynamicProperty(PROPERTY_ENABLED, value);
}

// 保存済みの設定があれば読み込む
// 起動直後はワールドにアクセスできないため、system.run で遅延して実行する
export function loadPlacementState() {
    const savedState = world.getDynamicProperty(PROPERTY_ENABLED);
    if (typeof savedState === "boolean") {
        placementState = savedState;
    }
}
