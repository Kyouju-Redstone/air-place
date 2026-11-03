import { config } from "./config.js";

// バニラのブロック・アイテムIDの先頭につく文字列
export const NAMESPACE_PREFIX = "minecraft:";

// デバッグ出力関数
// message は文字列、または文字列を返す関数
// 重い整形(JSON.stringify など)は関数で渡すと、デバッグ無効時に実行されない
export function debug(player, message) {
    // デバッグ無効時は終了させる
    if (!config.debug) {
        return;
    }

    // メッセージを作成する
    let body = message;
    if (typeof message === "function") {
        body = message();
    }

    // メッセージを送信する
    const text = `[AirPlace] ${body}`;
    console.log(text);
    if (player) {
        player.sendMessage(text);
    }
}

// ID抽出関数
export function stripNamespace(typeId) {
    if (typeId.startsWith(NAMESPACE_PREFIX)) {
        // 例: "minecraft:piston" -> "piston"
        return typeId.slice(NAMESPACE_PREFIX.length);
    }
    else {
        return typeId;
    }
}

// 小数座標 location が、ブロック座標 target と同じブロックに含まれるか
export function isInsideBlock(location, target) {
    return (
        Math.floor(location.x) === target.x &&
        Math.floor(location.y) === target.y &&
        Math.floor(location.z) === target.z
    );
}

// 視線に最も近い6方向("up" / "down" / "north" / "south" / "east" / "west")を返す
export function getNearestLookingDirection(dir) {
    const ax = Math.abs(dir.x);
    const ay = Math.abs(dir.y);
    const az = Math.abs(dir.z);

    // 上下方向の成分が最も大きい場合
    if (ay >= ax && ay >= az) {
        if (dir.y > 0) {
            return "up";
        }
        return "down";
    }

    // 東西方向の成分が最も大きい場合
    if (ax >= az) {
        if (dir.x > 0) {
            return "east";
        }
        return "west";
    }

    // 南北方向の成分が最も大きい場合
    if (dir.z > 0) {
        return "south";
    }
    return "north";
}

// 視線に最も近い水平4方向("north" / "south" / "east" / "west")を返す
export function getNearestHorizontalDirection(dir) {
    if (Math.abs(dir.x) >= Math.abs(dir.z)) {
        if (dir.x > 0) {
            return "east";
        }
        return "west";
    }

    if (dir.z > 0) {
        return "south";
    }
    return "north";
}

// 必要な設定値が数値で入っているか確認する(足りない場合はコンテンツログに警告を出す)
export function checkConfig() {
    const requiredNumbers = [
        "normalReach",
        "placeDistance",
        "holdReleaseTicks",
        "breakProtectTicks",
    ];

    for (const key of requiredNumbers) {
        if (typeof config[key] !== "number") {
            console.warn(`[AirPlace] config.js の ${key} が数値で設定されていません`);
        }
    }
}
